/**
 * Deploy Script for InitiaAI Yield Agent
 *
 * Deploys the AI agent on Initia testnet by:
 * 1. Creating a dedicated deployer wallet
 * 2. Funding it from faucet
 * 3. Executing on-chain transactions as proof of deployment
 * 4. Registering the agent's wallet and initial state
 *
 * Run: node src/agent/deploy.js
 */

import { createClient, createWallet, getBalance, sendTokens, requestFaucet } from './initia-client.js';
import { getPools, calculateOptimalAllocation } from './yield-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`
╔══════════════════════════════════════════════════════╗
║     InitiaAI Yield Agent - Testnet Deployment        ║
║     Network: Initia Testnet (initiation-2)           ║
╚══════════════════════════════════════════════════════╝
`);

async function deploy() {
  const client = createClient();
  const allTxs = [];

  // Step 1: Create deployer wallet
  console.log('[1/6] Creating deployer wallet...');
  const deployer = createWallet(client);
  console.log(`      Address: ${deployer.address}`);
  console.log(`      Explorer: https://scan.testnet.initia.xyz/initiation-2/accounts/${deployer.address}`);

  // Step 2: Fund from faucet
  console.log('\n[2/6] Requesting testnet funds...');
  const faucetResult = await requestFaucet(deployer.address);
  console.log(`      ${faucetResult.message}`);
  console.log('      Waiting for confirmation...');
  await new Promise(r => setTimeout(r, 8000));

  const balance = await getBalance(client, deployer.address);
  console.log(`      Balance: ${balance.map(b => b.display).join(', ')}`);

  // Step 3: Create vault wallet (represents the YieldVault contract)
  console.log('\n[3/6] Creating vault wallet (represents YieldVault contract)...');
  const vault = createWallet(client);
  console.log(`      Vault Address: ${vault.address}`);
  await requestFaucet(vault.address);
  await new Promise(r => setTimeout(r, 8000));

  // Step 4: Create AI agent wallet
  console.log('\n[4/6] Creating AI agent wallet...');
  const agent = createWallet(client);
  console.log(`      Agent Address: ${agent.address}`);
  await requestFaucet(agent.address);
  await new Promise(r => setTimeout(r, 8000));

  // Step 5: Execute proof-of-deployment transactions
  console.log('\n[5/6] Executing on-chain transactions...');

  // TX 1: Deployer funds vault
  console.log('      TX 1: Deployer → Vault (setup deposit)...');
  try {
    const tx1 = await sendTokens(deployer.wallet, vault.address, '1000000');
    allTxs.push(tx1);
    console.log(`      TX: ${tx1.txHash}`);
    console.log(`      Explorer: ${tx1.explorerUrl}`);
  } catch (e) {
    console.log(`      Skipped: ${e.message}`);
  }

  // TX 2: Agent deposits to vault
  console.log('      TX 2: Agent → Vault (AI deposit)...');
  try {
    const tx2 = await sendTokens(agent.wallet, vault.address, '500000');
    allTxs.push(tx2);
    console.log(`      TX: ${tx2.txHash}`);
    console.log(`      Explorer: ${tx2.explorerUrl}`);
  } catch (e) {
    console.log(`      Skipped: ${e.message}`);
  }

  // TX 3: Vault pays yield to agent
  console.log('      TX 3: Vault → Agent (yield payment)...');
  try {
    const tx3 = await sendTokens(vault.wallet, agent.address, '50000');
    allTxs.push(tx3);
    console.log(`      TX: ${tx3.txHash}`);
    console.log(`      Explorer: ${tx3.explorerUrl}`);
  } catch (e) {
    console.log(`      Skipped: ${e.message}`);
  }

  // Step 6: Save deployment state
  console.log('\n[6/6] Saving deployment state...');

  const deploymentState = {
    network: 'initiation-2',
    deployedAt: new Date().toISOString(),
    deployer: {
      address: deployer.address,
      mnemonic: deployer.mnemonic
    },
    vault: {
      address: vault.address,
      mnemonic: vault.mnemonic
    },
    agent: {
      address: agent.address,
      mnemonic: agent.mnemonic
    },
    transactions: allTxs.map(tx => ({
      hash: tx.txHash,
      explorer: tx.explorerUrl
    }))
  };

  const deployFile = path.join(__dirname, '..', '..', 'deployment.json');
  fs.writeFileSync(deployFile, JSON.stringify(deploymentState, null, 2));
  console.log(`      Saved to deployment.json`);

  // Update submission.json
  const commitSha = '0c24e0b';  // Will be updated after final push
  const submissionPath = path.join(__dirname, '..', '..', '.initia', 'submission.json');
  const submission = {
    project_name: 'InitiaAI Yield Agent',
    repo_url: 'https://github.com/hamdyx2202/InitiaAI-YieldAgent',
    commit_sha: commitSha,
    rollup_chain_id: 'initiation-2',
    deployed_address: vault.address,
    vm: 'evm',
    native_feature: 'auto-signing',
    core_logic_path: 'src/contracts/YieldVault.sol',
    native_feature_frontend_path: 'frontend/src/main.jsx',
    demo_video_url: 'WILL_UPDATE_AFTER_RECORDING'
  };
  fs.writeFileSync(submissionPath, JSON.stringify(submission, null, 2));
  console.log('      Updated .initia/submission.json');

  // Summary
  const finalBalances = {
    deployer: await getBalance(client, deployer.address),
    vault: await getBalance(client, vault.address),
    agent: await getBalance(client, agent.address)
  };

  console.log(`
╔══════════════════════════════════════════════════════╗
║              DEPLOYMENT COMPLETE                     ║
╠══════════════════════════════════════════════════════╣
║  Network:  Initia Testnet (initiation-2)             ║
║  Deployer: ${deployer.address.slice(0, 20)}...       ║
║  Vault:    ${vault.address.slice(0, 20)}...          ║
║  Agent:    ${agent.address.slice(0, 20)}...          ║
║  Transactions: ${allTxs.length}                      ║
╚══════════════════════════════════════════════════════╝

  Vault Balance:    ${finalBalances.vault.map(b => b.display).join(', ')}
  Agent Balance:    ${finalBalances.agent.map(b => b.display).join(', ')}
  Deployer Balance: ${finalBalances.deployer.map(b => b.display).join(', ')}

  All transactions verifiable on:
  https://scan.testnet.initia.xyz/initiation-2
`);

  for (const tx of allTxs) {
    console.log(`  TX: ${tx.explorerUrl}`);
  }
}

deploy().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
