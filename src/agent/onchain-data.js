/**
 * On-Chain Data Fetcher
 * Fetches REAL data from Initia Testnet blockchain
 * Used to enrich yield pool analysis with live metrics
 */

const INITIA_REST = 'https://rest.testnet.initia.xyz';

/**
 * Fetch real validator data from Initia testnet
 */
export async function fetchValidators(limit = 10) {
  try {
    const res = await fetch(`${INITIA_REST}/initia/mstaking/v1/validators?status=BOND_STATUS_BONDED&pagination.limit=${limit}`);
    const data = await res.json();

    return data.validators?.map(v => ({
      address: v.operator_address,
      moniker: v.description?.moniker || 'Unknown',
      jailed: v.jailed,
      status: v.status,
      commission: parseFloat(v.commission?.commission_rates?.rate || 0) * 100,
      tokens: v.tokens?.map(t => ({
        denom: t.denom === 'uinit' ? 'INIT' : t.denom.slice(0, 12) + '...',
        amount: t.denom === 'uinit' ? (parseInt(t.amount) / 1e6).toFixed(2) : t.amount
      }))
    })) || [];
  } catch (e) {
    return [{ error: e.message }];
  }
}

/**
 * Fetch staking parameters
 */
export async function fetchStakingParams() {
  try {
    const res = await fetch(`${INITIA_REST}/initia/mstaking/v1/params`);
    const data = await res.json();

    return {
      unbondingTime: `${parseInt(data.params?.unbonding_time) / 86400} days`,
      maxValidators: data.params?.max_validators,
      bondDenoms: data.params?.bond_denoms?.length || 0,
      minVotingPower: data.params?.min_voting_power
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Fetch account balance from Initia testnet
 */
export async function fetchOnChainBalance(address) {
  try {
    const res = await fetch(`${INITIA_REST}/cosmos/bank/v1beta1/balances/${address}`);
    const data = await res.json();

    return data.balances?.map(b => ({
      denom: b.denom === 'uinit' ? 'INIT' : b.denom.slice(0, 20),
      amount: b.denom === 'uinit' ? (parseInt(b.amount) / 1e6).toFixed(4) : b.amount
    })) || [];
  } catch (e) {
    return [{ error: e.message }];
  }
}

/**
 * Fetch network supply stats
 */
export async function fetchSupplyStats() {
  try {
    const res = await fetch(`${INITIA_REST}/cosmos/bank/v1beta1/supply?pagination.limit=5`);
    const data = await res.json();

    const initSupply = data.supply?.find(s => s.denom === 'uinit');
    return {
      totalDenoms: data.pagination?.total || data.supply?.length || 0,
      initSupply: initSupply ? (parseInt(initSupply.amount) / 1e6).toFixed(0) + ' INIT' : 'N/A'
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Fetch latest blocks info
 */
export async function fetchLatestBlock() {
  try {
    const res = await fetch(`${INITIA_REST}/cosmos/base/tendermint/v1beta1/blocks/latest`);
    const data = await res.json();

    return {
      height: data.block?.header?.height,
      time: data.block?.header?.time,
      chainId: data.block?.header?.chain_id,
      proposer: data.block?.header?.proposer_address?.slice(0, 16) + '...',
      txCount: data.block?.data?.txs?.length || 0
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Fetch DEX module info (proves on-chain DeFi exists)
 */
export async function fetchDexModule() {
  try {
    const res = await fetch(`${INITIA_REST}/initia/move/v1/accounts/0x1/modules/dex`);
    const data = await res.json();
    const abi = JSON.parse(data.module?.abi || '{}');

    return {
      address: data.module?.address,
      name: data.module?.module_name,
      functions: abi.exposed_functions?.map(f => f.name) || [],
      functionCount: abi.exposed_functions?.length || 0
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get comprehensive network health report
 */
export async function getNetworkHealth() {
  const [validators, params, supply, block, dex] = await Promise.all([
    fetchValidators(5),
    fetchStakingParams(),
    fetchSupplyStats(),
    fetchLatestBlock(),
    fetchDexModule()
  ]);

  return {
    timestamp: new Date().toISOString(),
    network: 'Initia Testnet (initiation-2)',
    latestBlock: block,
    staking: {
      params,
      topValidators: validators.slice(0, 3).map(v => ({
        moniker: v.moniker,
        commission: `${v.commission?.toFixed(1)}%`,
        stakedINIT: v.tokens?.find(t => t.denom === 'INIT')?.amount || 'N/A'
      })),
      validatorCount: validators.length
    },
    supply,
    dex: {
      available: !dex.error,
      functions: dex.functionCount,
      supportedOps: dex.functions?.slice(0, 5)
    }
  };
}
