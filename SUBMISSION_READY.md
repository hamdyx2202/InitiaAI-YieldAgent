# DoraHacks Submission - INITIATE: The Initia Hackathon

## Project Name
InitiaAI Yield Agent

## Track
AI & Tooling

## GitHub Link
https://github.com/hamdyx2202/InitiaAI-YieldAgent

## Demo Video
https://www.youtube.com/watch?v=mvI2XLNAjGE

## Short Description
AI-powered DeFi yield optimizer on Initia — an autonomous Claude-powered agent that analyzes yield pools, calculates risk-adjusted strategies, and executes on-chain deposits with auto-signing for frictionless UX.

## Full Description (paste in BUIDL description)

### The Problem
DeFi yield farming is overwhelming. Users face dozens of pools with varying APYs, risk levels, and lock periods. They must manually research, compare, calculate allocations, and execute multiple transactions. Most users either choose suboptimal strategies or avoid DeFi entirely.

### The Solution
InitiaAI Yield Agent is an autonomous AI agent that turns natural language into optimized DeFi positions on Initia. Tell it "I have 10,000 INIT and want balanced risk" — it analyzes 6 yield pools, calculates the optimal allocation, and executes deposits on-chain. All with auto-signing so there are no wallet popups interrupting the flow.

### What Makes This Unique (vs Smart Yield, YieldMind)
While other AI yield projects recommend strategies for users to execute manually, InitiaAI is a **fully autonomous agent** with Claude's tool-use capability. It doesn't just recommend — it **reasons, decides, and acts** in a multi-step loop:

1. Agent receives goal → 2. Calls `get_yield_pools` to analyze options → 3. Calls `calculate_strategy` to optimize → 4. Calls `deposit_to_pool` to execute on-chain → 5. Calls `portfolio_health` to monitor

This agentic loop runs without human intervention. The AI makes autonomous financial decisions within user-defined risk parameters — the first true "set and forget" DeFi agent on Initia.

### Architecture
- **AI Brain**: Claude (Anthropic) with 8 specialized DeFi tools
- **Blockchain**: Initia Testnet with YieldVault smart contract (Solidity/EVM)
- **Frontend**: React + InterwovenKit with auto-signing and bridge integration
- **Strategy Engine**: 3 risk profiles, 6 yield pools, portfolio health monitoring

### Initia-Native Features
1. **Auto-signing**: Users approve once via InterwovenKit, then the AI agent executes unlimited transactions without wallet popups. Essential for autonomous agent workflows.
2. **InterwovenKit**: Full wallet connection, transaction handling, and bridge UI via @initia/interwovenkit-react.
3. **Interwoven Bridge**: Users can bridge assets from L1 to the rollup directly from the dashboard.

### Demo Results
- Initia wallet created on testnet
- 6 yield pools analyzed with real APY/TVL/risk data
- 3 strategy profiles calculated (conservative: ~10% APY, balanced: ~17% APY, aggressive: ~21% APY)
- Portfolio health monitoring with concentration alerts
- Smart pool filtering by risk, APY, token, and type
- AI agent chat with natural language execution

### Tech Stack
Initia (initia.js SDK) | Claude AI (Anthropic) | Solidity (YieldVault) | React | InterwovenKit | Node.js/Express

## Tags
AI, DeFi, Yield, Initia, Claude, Agents, Blockchain, Web3
