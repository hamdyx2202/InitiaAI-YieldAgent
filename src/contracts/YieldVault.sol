// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title YieldVault
 * @notice AI-managed yield vault on Initia EVM rollup
 * @dev Users deposit tokens, AI agent manages allocation to maximize yield
 */
contract YieldVault {
    struct Pool {
        string name;
        uint256 apy;        // basis points (2450 = 24.50%)
        uint256 tvl;
        uint256 riskLevel;  // 1=very-low, 2=low, 3=medium, 4=high
        bool active;
    }

    struct Position {
        address user;
        uint256 poolId;
        uint256 amount;
        uint256 depositTime;
        bool active;
    }

    struct Strategy {
        string name;           // conservative, balanced, aggressive
        uint256 maxRiskLevel;
        uint256 createdAt;
    }

    address public owner;
    address public aiAgent;

    Pool[] public pools;
    Position[] public positions;
    mapping(address => uint256[]) public userPositions;
    mapping(address => Strategy) public userStrategies;
    mapping(address => uint256) public userDeposits;

    uint256 public totalDeposits;
    uint256 public totalPositions;

    event PoolAdded(uint256 indexed poolId, string name, uint256 apy);
    event Deposited(address indexed user, uint256 indexed poolId, uint256 amount);
    event Withdrawn(address indexed user, uint256 indexed poolId, uint256 amount);
    event StrategySet(address indexed user, string strategy);
    event AgentAction(address indexed agent, string action, bytes data);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == aiAgent || msg.sender == owner, "Not agent");
        _;
    }

    constructor() {
        owner = msg.sender;
        aiAgent = msg.sender;

        // Initialize default pools
        _addPool("INIT/USDC LP", 2450, 8500000e18, 3);
        _addPool("INIT Staking", 1280, 45000000e18, 2);
        _addPool("USDC Lending", 820, 12000000e18, 2);
        _addPool("INIT/ETH LP", 3210, 3200000e18, 4);
        _addPool("Stable Vault", 650, 25000000e18, 1);
        _addPool("INIT/ATOM LP", 2870, 5100000e18, 3);
    }

    function _addPool(string memory name, uint256 apy, uint256 tvl, uint256 risk) internal {
        pools.push(Pool(name, apy, tvl, risk, true));
        emit PoolAdded(pools.length - 1, name, apy);
    }

    /**
     * @notice Set AI agent address
     */
    function setAgent(address _agent) external onlyOwner {
        aiAgent = _agent;
    }

    /**
     * @notice Set user's yield strategy
     */
    function setStrategy(string calldata strategyName, uint256 maxRisk) external {
        userStrategies[msg.sender] = Strategy(strategyName, maxRisk, block.timestamp);
        emit StrategySet(msg.sender, strategyName);
    }

    /**
     * @notice Deposit into a specific pool
     */
    function deposit(uint256 poolId) external payable {
        require(poolId < pools.length, "Invalid pool");
        require(pools[poolId].active, "Pool inactive");
        require(msg.value > 0, "Zero deposit");

        positions.push(Position(msg.sender, poolId, msg.value, block.timestamp, true));
        uint256 posId = positions.length - 1;
        userPositions[msg.sender].push(posId);

        pools[poolId].tvl += msg.value;
        userDeposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        totalPositions++;

        emit Deposited(msg.sender, poolId, msg.value);
    }

    /**
     * @notice AI agent deposits on behalf of user (auto-sign enabled)
     */
    function agentDeposit(address user, uint256 poolId) external payable onlyAgent {
        require(poolId < pools.length, "Invalid pool");
        require(pools[poolId].active, "Pool inactive");

        Strategy memory strat = userStrategies[user];
        require(pools[poolId].riskLevel <= strat.maxRiskLevel, "Exceeds risk tolerance");

        positions.push(Position(user, poolId, msg.value, block.timestamp, true));
        uint256 posId = positions.length - 1;
        userPositions[user].push(posId);

        pools[poolId].tvl += msg.value;
        userDeposits[user] += msg.value;
        totalDeposits += msg.value;
        totalPositions++;

        emit AgentAction(msg.sender, "deposit", abi.encode(user, poolId, msg.value));
        emit Deposited(user, poolId, msg.value);
    }

    /**
     * @notice Withdraw from a position
     */
    function withdraw(uint256 positionId) external {
        require(positionId < positions.length, "Invalid position");
        Position storage pos = positions[positionId];
        require(pos.user == msg.sender, "Not your position");
        require(pos.active, "Already withdrawn");

        uint256 elapsed = block.timestamp - pos.depositTime;
        uint256 apy = pools[pos.poolId].apy;
        uint256 reward = (pos.amount * apy * elapsed) / (365 days * 10000);
        uint256 total = pos.amount + reward;

        pos.active = false;
        pools[pos.poolId].tvl -= pos.amount;
        userDeposits[msg.sender] -= pos.amount;
        totalDeposits -= pos.amount;

        (bool sent, ) = msg.sender.call{value: total > address(this).balance ? address(this).balance : total}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, pos.poolId, total);
    }

    /**
     * @notice Get pool count
     */
    function getPoolCount() external view returns (uint256) {
        return pools.length;
    }

    /**
     * @notice Get pool details
     */
    function getPool(uint256 poolId) external view returns (string memory name, uint256 apy, uint256 tvl, uint256 risk, bool active) {
        Pool memory p = pools[poolId];
        return (p.name, p.apy, p.tvl, p.riskLevel, p.active);
    }

    /**
     * @notice Get user's position IDs
     */
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    /**
     * @notice Get position details
     */
    function getPosition(uint256 posId) external view returns (address user, uint256 poolId, uint256 amount, uint256 depositTime, bool active) {
        Position memory p = positions[posId];
        return (p.user, p.poolId, p.amount, p.depositTime, p.active);
    }

    /**
     * @notice Calculate pending rewards for a position
     */
    function pendingRewards(uint256 posId) external view returns (uint256) {
        Position memory pos = positions[posId];
        if (!pos.active) return 0;
        uint256 elapsed = block.timestamp - pos.depositTime;
        return (pos.amount * pools[pos.poolId].apy * elapsed) / (365 days * 10000);
    }

    /**
     * @notice Get vault stats
     */
    function getVaultStats() external view returns (uint256 _totalDeposits, uint256 _totalPositions, uint256 _poolCount) {
        return (totalDeposits, totalPositions, pools.length);
    }

    receive() external payable {}
}
