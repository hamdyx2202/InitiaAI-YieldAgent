/**
 * Initia Blockchain Client
 * Handles all on-chain operations: wallet management, transactions, queries
 */

import {
  RESTClient,
  Wallet,
  MnemonicKey,
  MsgSend,
  Coin,
} from '@initia/initia.js';

const TESTNET_REST = 'https://rest.testnet.initia.xyz';
const TESTNET_CHAIN_ID = 'initiation-2';

/**
 * Create a REST client for Initia testnet
 */
export function createClient() {
  return new RESTClient(TESTNET_REST, {
    chainId: TESTNET_CHAIN_ID,
    gasPrices: '0.15uinit',
    gasAdjustment: '1.75',
  });
}

/**
 * Create a new wallet with mnemonic
 */
export function createWallet(client, mnemonic = null) {
  const key = new MnemonicKey({
    mnemonic: mnemonic || undefined,
    coinType: 118,
  });

  const wallet = new Wallet(client, key);

  return {
    wallet,
    key,
    address: key.accAddress,
    mnemonic: key.mnemonic,
  };
}

/**
 * Get account balance
 */
export async function getBalance(client, address) {
  try {
    const [balances] = await client.bank.balance(address);
    return balances.map(b => ({
      denom: b.denom,
      amount: b.amount.toString(),
      display: b.denom === 'uinit' ? `${(parseInt(b.amount) / 1e6).toFixed(4)} INIT` : `${b.amount} ${b.denom}`
    }));
  } catch (e) {
    if (e.message?.includes('not found')) {
      return [{ denom: 'uinit', amount: '0', display: '0 INIT' }];
    }
    throw e;
  }
}

/**
 * Send INIT tokens
 */
export async function sendTokens(wallet, recipientAddress, amount, denom = 'uinit') {
  const msg = new MsgSend(
    wallet.key.accAddress,
    recipientAddress,
    [new Coin(denom, amount)]
  );

  const tx = await wallet.createAndSignTx({ msgs: [msg] });
  const result = await wallet.rest.tx.broadcast(tx);

  return {
    success: true,
    txHash: result.txhash,
    sender: wallet.key.accAddress,
    recipient: recipientAddress,
    amount: `${amount} ${denom}`,
    explorerUrl: `https://scan.testnet.initia.xyz/initiation-2/txs/${result.txhash}`
  };
}

/**
 * Request testnet faucet funds
 */
export async function requestFaucet(address) {
  try {
    // Try API faucet first
    const response = await fetch('https://faucet-api.testnet.initia.xyz/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });

    if (response.ok) {
      return { success: true, message: `Funded ${address} with testnet INIT` };
    }

    // If API requires CAPTCHA, provide manual instructions
    return {
      success: false,
      message: `Use browser faucet: https://faucet.testnet.initia.xyz — paste address: ${address}`
    };
  } catch (e) {
    return {
      success: false,
      message: `Use browser faucet: https://faucet.testnet.initia.xyz — paste address: ${address}`
    };
  }
}

/**
 * Query a Move view function on Initia
 */
export async function queryMoveView(client, moduleAddress, moduleName, functionName, typeArgs = [], args = []) {
  try {
    const result = await client.move.viewFunction(moduleAddress, moduleName, functionName, typeArgs, args);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get transaction details
 */
export async function getTxInfo(client, txHash) {
  try {
    const tx = await client.tx.txInfo(txHash);
    return {
      hash: tx.txhash,
      height: tx.height,
      success: tx.code === 0,
      gasUsed: tx.gas_used,
      gasWanted: tx.gas_wanted,
      timestamp: tx.timestamp,
    };
  } catch (e) {
    return { error: e.message };
  }
}

export {
  TESTNET_REST,
  TESTNET_CHAIN_ID,
  RESTClient,
  Wallet,
  MnemonicKey,
  MsgSend,
  Coin,
};
