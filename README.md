# InitiaAI Yield Agent

**AI-powered DeFi yield optimizer on Initia — autonomous strategy calculation, portfolio management, and on-chain execution.**

> Focus on your goals. Let the AI handle the yield.

## What It Does

InitiaAI Yield Agent is an autonomous AI agent that analyzes DeFi yield opportunities across the Initia ecosystem and executes optimal investment strategies. Users describe their goals in plain English, and the agent handles everything: pool analysis, risk assessment, strategy calculation, and on-chain execution.

### The Problem
DeFi yield farming is complex. Users must manually research pools, compare APYs, assess risks, calculate allocations, and execute transactions across multiple protocols. Most users either pick suboptimal strategies or avoid DeFi entirely.

### The Solution
An AI agent powered by Claude that:
1. **Analyzes** all yield pools on Initia (APY, TVL, risk, token pairs)
2. **Recommends** optimal allocation based on your risk tolerance
3. **Executes** deposits via on-chain Initia transactions
4. **Monitors** portfolio health and suggests rebalancing
5. **Communicates** in natural language — no DeFi expertise needed

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   InitiaAI Yield Agent                       │
├──────────────┬──────────────┬───────────────────────────────┤
│  Claude AI   │  Yield Engine │   Initia Blockchain           │
│  (Brain)     │  (Strategy)   │   (Settlement)                │
│              │               │                               │
│ Understands  │ Analyzes pools│ Wallet management             │
│ user goals   │ Calculates    │ On-chain deposits             │
│ Decides      │ allocation    │ Transaction verification      │
│ actions      │ Monitors risk │ Auto-signing UX               │
├──────────────┴──────────────┴───────────────────────────────┤
│  React Frontend + InterwovenKit (Wallet + Bridge + Auto-sign)│
├─────────────────────────────────────────────────────────────┤
│  Initia Appchain (EVM) — YieldVault Smart Contract           │
│  100ms blocks | Enshrined Liquidity | Native USDC            │
└─────────────────────────────────────────────────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| **AI Strategy Engine** | Claude analyzes pools and recommends optimal allocation |
| **3 Risk Profiles** | Conservative, Balanced, Aggressive strategies |
| **6 Yield Pools** | Staking, LP, Lending, Vaults across Initia |
| **Auto-signing** | Frictionless UX — approve once, agent executes freely |
| **Portfolio Monitor** | Health checks, concentration alerts, rebalance suggestions |
| **Natural Language** | Tell the agent what you want in plain English |
| **YieldVault Contract** | EVM smart contract for AI-managed deposits |
| **InterwovenKit** | Native Initia wallet connection and bridging |

## Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key (for AI features)

### Run Demo (no API key needed)
```bash
git clone https://github.com/hamdyx2202/InitiaAI-YieldAgent.git
cd InitiaAI-YieldAgent
npm install
node src/agent/demo.js
```

### Run Server + Dashboard
```bash
node src/agent/server.js
# Open http://localhost:3001
```

## AI Agent Tools

| Tool | Description |
|------|-------------|
| `create_initia_wallet` | Create wallet on Initia testnet |
| `check_balance` | Check INIT/token balances |
| `get_yield_pools` | Browse pools with APY/risk filters |
| `calculate_strategy` | AI-optimized allocation |
| `deposit_to_pool` | Execute on-chain deposit |
| `send_tokens` | Transfer INIT between addresses |
| `portfolio_health` | Health score and alerts |

## Strategy Examples

### Conservative (10,000 INIT)
- INIT Staking: 50% → 12.8% APY
- Stable Vault: 30% → 6.5% APY
- USDC Lending: 20% → 8.2% APY
- **Expected: ~10% APY = ~1,000 INIT/year**

### Balanced (10,000 INIT)
- INIT/USDC LP: 20% → 24.5% APY
- INIT/ATOM LP: 20% → 28.7% APY
- INIT Staking: 30% → 12.8% APY
- USDC Lending: 20% → 8.2% APY
- Stable Vault: 10% → 6.5% APY
- **Expected: ~16.8% APY = ~1,680 INIT/year**

### Aggressive (10,000 INIT)
- INIT/ETH LP: 20% → 32.1% APY
- INIT/USDC LP: 20% → 24.5% APY
- INIT/ATOM LP: 20% → 28.7% APY
- INIT Staking: 20% → 12.8% APY
- Others: 20%
- **Expected: ~21% APY = ~2,100 INIT/year**

## Smart Contract: YieldVault.sol

EVM smart contract deployed on Initia MiniEVM rollup:

- **User deposits** with risk strategy selection
- **AI agent deposits** on behalf of users (within risk limits)
- **Yield calculation** based on APY and time
- **Withdrawal** with earned rewards
- **Pool management** with TVL tracking

## Project Structure

```
InitiaAI-YieldAgent/
├── .initia/
│   └── submission.json       # Hackathon submission metadata
├── src/
│   ├── agent/
│   │   ├── initia-client.js  # Initia SDK wrapper
│   │   ├── yield-analyzer.js # AI yield analysis engine
│   │   ├── index.js          # Claude AI agent with tools
│   │   ├── server.js         # Express API server
│   │   └── demo.js           # Standalone demo
│   └── contracts/
│       └── YieldVault.sol    # EVM smart contract
├── frontend/
│   └── src/
│       ├── main.jsx          # React entry
│       └── App.jsx           # Dashboard with InterwovenKit
├── package.json
├── README.md
└── LICENSE
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| AI | Claude (Anthropic) |
| Blockchain | Initia (Testnet) |
| Smart Contracts | Solidity (EVM) |
| Frontend | React + InterwovenKit |
| Backend | Node.js + Express |
| SDK | @initia/initia.js |
| Wallet | InterwovenKit with Auto-signing |

## Initia-Native Features

### Auto-signing (Session UX)
Users approve once, then the AI agent can execute multiple transactions without repeated wallet popups. Configured via InterwovenKit's `enableAutoSign` prop.

### InterwovenKit Integration
Full wallet connection, transaction signing, and bridge modals via `@initia/interwovenkit-react`.

## Scoring Alignment

| Criteria | How We Address It |
|----------|------------------|
| **Originality (20%)** | Only AI yield agent in the hackathon — unique approach |
| **Technical Execution (30%)** | EVM contract + AI agent + InterwovenKit + auto-signing |
| **Product Value & UX (20%)** | Natural language DeFi — anyone can use it |
| **Working Demo (20%)** | End-to-end demo with real Initia wallet creation |
| **Market Understanding (10%)** | Targets DeFi users overwhelmed by yield complexity |

## License

MIT

---

**Built for [INITIATE: The Initia Hackathon](https://dorahacks.io/hackathon/initiate)** — AI & Tooling Track
