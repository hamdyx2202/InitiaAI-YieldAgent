/**
 * InitiaAI Yield Agent - Demo
 *
 * Demonstrates the full AI yield agent workflow:
 * 1. Create wallets on Initia testnet
 * 2. Analyze available yield pools
 * 3. Calculate optimal strategies for different risk profiles
 * 4. Show portfolio monitoring
 *
 * Run: node src/agent/demo.js
 */

import { createClient, createWallet, getBalance, requestFaucet } from './initia-client.js';
import { getPools, filterPools, calculateOptimalAllocation, checkPortfolioHealth } from './yield-analyzer.js';

const DIVIDER = '━'.repeat(60);

console.log(`
██╗███╗   ██╗██╗████████╗██╗ █████╗  █████╗ ██╗
██║████╗  ██║██║╚══██╔══╝██║██╔══██╗██╔══██╗██║
██║██╔██╗ ██║██║   ██║   ██║███████║███████║██║
██║██║╚██╗██║██║   ██║   ██║██╔══██║██╔══██║██║
██║██║ ╚████║██║   ██║   ██║██║  ██║██║  ██║██║
╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
     ██╗   ██╗██╗███████╗██╗     ██████╗
     ╚██╗ ██╔╝██║██╔════╝██║     ██╔══██╗
      ╚████╔╝ ██║█████╗  ██║     ██║  ██║
       ╚██╔╝  ██║██╔══╝  ██║     ██║  ██║
        ██║   ██║███████╗███████╗██████╔╝
        ╚═╝   ╚═╝╚══════╝╚══════╝╚═════╝
     █████╗  ██████╗ ███████╗███╗   ██╗████████╗
    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝

    AI-Powered DeFi Yield Agent on Initia
    Network: Initia Testnet | AI: Claude
`);

async function runDemo() {
  try {
    // ========== PHASE 1: Create Wallet ==========
    console.log(`${DIVIDER}`);
    console.log('  PHASE 1: Creating AI Agent Wallet on Initia');
    console.log(`${DIVIDER}\n`);

    const client = createClient();
    const walletData = createWallet(client);
    console.log(`[+] Wallet created on Initia Testnet`);
    console.log(`    Address: ${walletData.address}`);
    console.log(`    Explorer: https://scan.testnet.initia.xyz/initiation-2/accounts/${walletData.address}`);

    console.log('\n[+] Requesting testnet funds from faucet...');
    const faucetResult = await requestFaucet(walletData.address);
    console.log(`    ${faucetResult.message}`);

    // Wait for faucet tx to confirm
    console.log('    Waiting for confirmation...');
    await new Promise(r => setTimeout(r, 5000));

    const balances = await getBalance(client, walletData.address);
    console.log(`    Balance: ${balances.map(b => b.display).join(', ') || 'pending...'}`);

    // ========== PHASE 2: Analyze Yield Pools ==========
    console.log(`\n${DIVIDER}`);
    console.log('  PHASE 2: Analyzing DeFi Yield Pools');
    console.log(`${DIVIDER}\n`);

    const allPools = getPools();
    console.log(`[+] Found ${allPools.length} yield pools on Initia:\n`);

    console.log('    ┌──────────────────────┬───────────┬───────────┬──────────┬─────────────┐');
    console.log('    │ Pool                 │ APY       │ TVL       │ Risk     │ Type        │');
    console.log('    ├──────────────────────┼───────────┼───────────┼──────────┼─────────────┤');
    for (const p of allPools) {
      const name = p.name.padEnd(20);
      const apy = `${p.apy}%`.padEnd(9);
      const tvl = `$${(p.tvl / 1e6).toFixed(1)}M`.padEnd(9);
      const risk = p.risk.padEnd(8);
      const type = p.type.padEnd(11);
      console.log(`    │ ${name} │ ${apy} │ ${tvl} │ ${risk} │ ${type} │`);
    }
    console.log('    └──────────────────────┴───────────┴───────────┴──────────┴─────────────┘');

    // ========== PHASE 3: AI Strategy Calculation ==========
    console.log(`\n${DIVIDER}`);
    console.log('  PHASE 3: AI Strategy Recommendations');
    console.log(`${DIVIDER}\n`);

    const investAmount = 10000;

    for (const profile of ['conservative', 'balanced', 'aggressive']) {
      const strategy = calculateOptimalAllocation(investAmount, profile);
      console.log(`[${profile.toUpperCase()}] Strategy for ${investAmount} INIT:`);
      console.log(`    Expected APY: ${strategy.expectedApy}%`);
      console.log(`    Monthly Return: ~${strategy.expectedMonthlyReturn} INIT`);
      console.log(`    Yearly Return: ~${strategy.expectedYearlyReturn} INIT`);
      console.log(`    Allocations:`);
      for (const a of strategy.allocations) {
        console.log(`      - ${a.pool} (${a.protocol}): ${a.amount} INIT (${a.percentage}%) → ${a.expectedApy}% APY [${a.risk} risk]`);
      }
      console.log('');
    }

    // ========== PHASE 4: Portfolio Monitoring ==========
    console.log(`${DIVIDER}`);
    console.log('  PHASE 4: Portfolio Health Monitoring');
    console.log(`${DIVIDER}\n`);

    const samplePositions = [
      { poolId: 'init-usdc-lp', value: 4000 },
      { poolId: 'init-staking', value: 3000 },
      { poolId: 'usdc-lending', value: 2000 },
      { poolId: 'stable-vault', value: 1000 }
    ];

    const health = checkPortfolioHealth(samplePositions);
    console.log(`[+] Portfolio Health Check:`);
    console.log(`    Total Value: ${health.totalValue} INIT`);
    console.log(`    Portfolio APY: ${health.portfolioApy}%`);
    console.log(`    Positions: ${health.positionCount}`);
    console.log(`    Health: ${health.healthScore.toUpperCase()}`);
    if (health.alerts.length > 0) {
      console.log(`    Alerts:`);
      for (const a of health.alerts) {
        console.log(`      [${a.type}] ${a.message}`);
      }
    }

    // ========== PHASE 5: Pool Filtering ==========
    console.log(`\n${DIVIDER}`);
    console.log('  PHASE 5: Smart Pool Discovery');
    console.log(`${DIVIDER}\n`);

    console.log('[+] Low-risk pools (max risk: low):');
    const lowRisk = filterPools({ maxRisk: 'low' });
    for (const p of lowRisk) {
      console.log(`    - ${p.name}: ${p.apy}% APY, $${(p.tvl/1e6).toFixed(1)}M TVL`);
    }

    console.log('\n[+] High-APY pools (min 20% APY):');
    const highApy = filterPools({ minApy: 20 });
    for (const p of highApy) {
      console.log(`    - ${p.name}: ${p.apy}% APY, ${p.risk} risk`);
    }

    console.log('\n[+] INIT token pools:');
    const initPools = filterPools({ token: 'INIT' });
    for (const p of initPools) {
      console.log(`    - ${p.name}: ${p.apy}% APY, ${p.type}`);
    }

    // ========== SUMMARY ==========
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     DEMO COMPLETE                            ║
╠══════════════════════════════════════════════════════════════╣
║  [OK] Initia wallet created on testnet                       ║
║  [OK] 6 yield pools analyzed with APY/TVL/risk               ║
║  [OK] 3 strategy profiles calculated (conservative/          ║
║       balanced/aggressive)                                    ║
║  [OK] Portfolio health monitoring active                     ║
║  [OK] Smart pool filtering by risk/APY/token                 ║
║  [OK] AI-powered yield recommendations ready                 ║
╚══════════════════════════════════════════════════════════════╝
`);

  } catch (error) {
    console.error('\n[ERROR]', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runDemo();
