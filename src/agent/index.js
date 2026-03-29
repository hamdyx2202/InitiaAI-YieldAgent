/**
 * InitiaAI Yield Agent - Main AI Agent
 *
 * Autonomous AI agent powered by Claude that:
 * 1. Analyzes DeFi yield opportunities on Initia
 * 2. Recommends optimal allocation strategies
 * 3. Executes deposits/withdrawals via on-chain transactions
 * 4. Monitors portfolio health and suggests rebalancing
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, createWallet, getBalance, sendTokens, requestFaucet } from './initia-client.js';
import { getPools, filterPools, calculateOptimalAllocation, checkPortfolioHealth } from './yield-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, '..', '..', 'agent-state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  return { wallets: {}, positions: [], transactions: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const TOOLS = [
  {
    name: "create_initia_wallet",
    description: "Create a new Initia wallet and optionally fund it from testnet faucet",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Wallet name (e.g. 'main', 'yield-wallet')" },
        fund: { type: "boolean", description: "Request testnet faucet funds (default: true)" }
      },
      required: ["name"]
    }
  },
  {
    name: "check_balance",
    description: "Check INIT and token balances of a wallet",
    input_schema: {
      type: "object",
      properties: {
        wallet_name: { type: "string", description: "Wallet name to check" }
      },
      required: ["wallet_name"]
    }
  },
  {
    name: "get_yield_pools",
    description: "Get available DeFi yield pools on Initia with APY, TVL, and risk info",
    input_schema: {
      type: "object",
      properties: {
        max_risk: { type: "string", enum: ["very-low", "low", "medium", "high"], description: "Maximum risk level" },
        min_apy: { type: "number", description: "Minimum APY percentage" },
        type: { type: "string", enum: ["staking", "lending", "liquidity-pool", "vault"], description: "Pool type filter" },
        token: { type: "string", description: "Filter by token (e.g. INIT, USDC)" }
      }
    }
  },
  {
    name: "calculate_strategy",
    description: "Calculate optimal yield allocation strategy based on amount and risk profile",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Total amount to invest (in INIT)" },
        risk_profile: { type: "string", enum: ["conservative", "balanced", "aggressive"], description: "Risk tolerance" }
      },
      required: ["amount"]
    }
  },
  {
    name: "deposit_to_pool",
    description: "Deposit funds into a yield pool (executes on-chain transaction on Initia)",
    input_schema: {
      type: "object",
      properties: {
        wallet_name: { type: "string", description: "Wallet to deposit from" },
        pool_id: { type: "string", description: "Pool ID to deposit into" },
        amount: { type: "number", description: "Amount to deposit" }
      },
      required: ["wallet_name", "pool_id", "amount"]
    }
  },
  {
    name: "send_tokens",
    description: "Send INIT tokens from one wallet to another address on Initia",
    input_schema: {
      type: "object",
      properties: {
        from_wallet: { type: "string", description: "Sender wallet name" },
        to_address: { type: "string", description: "Recipient Initia address" },
        amount: { type: "string", description: "Amount in uinit (1 INIT = 1000000 uinit)" }
      },
      required: ["from_wallet", "to_address", "amount"]
    }
  },
  {
    name: "portfolio_health",
    description: "Check portfolio health, alerts, and rebalancing suggestions",
    input_schema: {
      type: "object",
      properties: {},
    }
  },
  {
    name: "list_wallets",
    description: "List all created wallets with addresses",
    input_schema: {
      type: "object",
      properties: {},
    }
  }
];

async function executeTool(toolName, toolInput) {
  const state = loadState();
  const client = createClient();

  switch (toolName) {
    case 'create_initia_wallet': {
      const { name, fund } = toolInput;
      if (state.wallets[name]) {
        return { success: false, message: `Wallet '${name}' already exists`, address: state.wallets[name].address };
      }

      const walletData = createWallet(client);
      state.wallets[name] = {
        address: walletData.address,
        mnemonic: walletData.mnemonic,
        createdAt: new Date().toISOString()
      };
      saveState(state);

      let faucetResult = null;
      if (fund !== false) {
        faucetResult = await requestFaucet(walletData.address);
      }

      return {
        success: true,
        wallet: name,
        address: walletData.address,
        faucet: faucetResult,
        explorer: `https://scan.testnet.initia.xyz/initiation-2/accounts/${walletData.address}`
      };
    }

    case 'check_balance': {
      const { wallet_name } = toolInput;
      const walletInfo = state.wallets[wallet_name];
      if (!walletInfo) return { success: false, message: `Wallet '${wallet_name}' not found` };

      const balances = await getBalance(client, walletInfo.address);
      return { wallet: wallet_name, address: walletInfo.address, balances };
    }

    case 'get_yield_pools': {
      const pools = filterPools(toolInput);
      return {
        pools: pools.map(p => ({
          id: p.id,
          name: p.name,
          protocol: p.protocol,
          apy: `${p.apy}%`,
          tvl: `$${(p.tvl / 1e6).toFixed(1)}M`,
          risk: p.risk,
          type: p.type,
          tokens: p.tokens.join('/'),
          minDeposit: `${p.minDeposit} INIT`,
          chain: p.chain
        })),
        count: pools.length
      };
    }

    case 'calculate_strategy': {
      const { amount, risk_profile } = toolInput;
      return calculateOptimalAllocation(amount, risk_profile || 'balanced');
    }

    case 'deposit_to_pool': {
      const { wallet_name, pool_id, amount } = toolInput;
      const walletInfo = state.wallets[wallet_name];
      if (!walletInfo) return { success: false, message: `Wallet '${wallet_name}' not found` };

      const pool = getPools().find(p => p.id === pool_id);
      if (!pool) return { success: false, message: `Pool '${pool_id}' not found` };
      if (amount < pool.minDeposit) return { success: false, message: `Minimum deposit is ${pool.minDeposit} INIT` };

      // Execute on-chain deposit - send to vault contract address
      // In production: calls YieldVault.deposit(poolId). On testnet: sends to vault address as proof-of-concept
      const VAULT_ADDRESS = process.env.VAULT_ADDRESS || 'init1yp3a7e0rx72uf8v56dxdhxqllhz09kryy69t2p';
      const walletData = createWallet(client, walletInfo.mnemonic);
      const uinitAmount = String(Math.round(amount * 1e6));

      try {
        const result = await sendTokens(walletData.wallet, VAULT_ADDRESS, uinitAmount);

        // Record position
        state.positions.push({
          poolId: pool_id,
          poolName: pool.name,
          value: amount,
          apy: pool.apy,
          depositedAt: new Date().toISOString(),
          txHash: result.txHash
        });
        state.transactions.push({
          type: 'deposit',
          pool: pool.name,
          amount,
          txHash: result.txHash,
          timestamp: new Date().toISOString()
        });
        saveState(state);

        return {
          success: true,
          action: 'deposit',
          pool: pool.name,
          amount: `${amount} INIT`,
          apy: `${pool.apy}%`,
          expectedMonthlyReturn: `${(amount * pool.apy / 100 / 12).toFixed(2)} INIT`,
          txHash: result.txHash,
          explorer: result.explorerUrl
        };
      } catch (e) {
        return { success: false, message: `Transaction failed: ${e.message}` };
      }
    }

    case 'send_tokens': {
      const { from_wallet, to_address, amount } = toolInput;
      const walletInfo = state.wallets[from_wallet];
      if (!walletInfo) return { success: false, message: `Wallet '${from_wallet}' not found` };

      const parsedAmount = String(parseInt(amount) || 0);
      if (parsedAmount === '0') return { success: false, message: 'Invalid amount' };

      const walletData = createWallet(client, walletInfo.mnemonic);
      try {
        const result = await sendTokens(walletData.wallet, to_address, parsedAmount);
        state.transactions.push({
          type: 'send',
          to: to_address,
          amount,
          txHash: result.txHash,
          timestamp: new Date().toISOString()
        });
        saveState(state);
        return result;
      } catch (e) {
        return { success: false, message: `Send failed: ${e.message}` };
      }
    }

    case 'portfolio_health': {
      return checkPortfolioHealth(state.positions);
    }

    case 'list_wallets': {
      return {
        wallets: Object.entries(state.wallets).map(([name, w]) => ({
          name,
          address: w.address,
          explorer: `https://scan.testnet.initia.xyz/initiation-2/accounts/${w.address}`
        })),
        count: Object.keys(state.wallets).length
      };
    }

    default:
      return { success: false, message: `Unknown tool: ${toolName}` };
  }
}

/**
 * Run the AI Agent with Claude
 */
export async function runAgent(userMessage, apiKey) {
  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are InitiaAI Yield Agent, an autonomous AI agent that manages DeFi yield strategies on the Initia blockchain.

Your capabilities:
- Create and manage Initia wallets
- Analyze yield pools (APY, TVL, risk levels)
- Calculate optimal allocation strategies (conservative/balanced/aggressive)
- Execute deposits into yield pools via on-chain Initia transactions
- Monitor portfolio health and suggest rebalancing
- Send INIT tokens between addresses

When a user asks for yield advice:
1. First understand their risk tolerance and capital
2. Show available pools matching their criteria
3. Calculate an optimal strategy
4. If they approve, execute the deposits

Always show: pool names, APY rates, expected returns, and transaction hashes with explorer links.
Be concise and action-oriented. You are a financial AI assistant, not a chatbot.`;

  const messages = [{ role: 'user', content: userMessage }];
  const results = [];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools: TOOLS,
      messages
    });

    for (const block of response.content) {
      if (block.type === 'text') results.push({ type: 'text', content: block.text });
    }

    if (response.stop_reason === 'end_turn') break;

    if (response.stop_reason === 'tool_use') {
      const assistantContent = response.content;
      const toolResults = [];

      for (const block of assistantContent) {
        if (block.type === 'tool_use') {
          console.log(`[Agent] ${block.name}(${JSON.stringify(block.input)})`);
          const result = await executeTool(block.name, block.input);
          console.log(`[Agent] →`, JSON.stringify(result, null, 2));
          results.push({ type: 'tool_call', tool: block.name, input: block.input, result });
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
        }
      }

      messages.push({ role: 'assistant', content: assistantContent });
      messages.push({ role: 'user', content: toolResults });
    }
  }

  return results;
}

export { executeTool, TOOLS };
