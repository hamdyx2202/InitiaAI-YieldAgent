/**
 * AI Yield Analyzer
 * Uses Claude to analyze DeFi yield opportunities on Initia
 * and recommend optimal strategies
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Simulated DeFi pools on Initia (in production, these would come from on-chain queries)
 */
const INITIA_POOLS = [
  {
    id: 'init-usdc-lp',
    name: 'INIT/USDC LP',
    protocol: 'InitiaSwap',
    apy: 24.5,
    tvl: 8500000,
    risk: 'medium',
    type: 'liquidity-pool',
    tokens: ['INIT', 'USDC'],
    minDeposit: 10,
    lockPeriod: 0,
    chain: 'initia-l1'
  },
  {
    id: 'init-staking',
    name: 'INIT Staking',
    protocol: 'Enshrined Liquidity',
    apy: 12.8,
    tvl: 45000000,
    risk: 'low',
    type: 'staking',
    tokens: ['INIT'],
    minDeposit: 1,
    lockPeriod: 21,
    chain: 'initia-l1'
  },
  {
    id: 'usdc-lending',
    name: 'USDC Lending Pool',
    protocol: 'InitiaLend',
    apy: 8.2,
    tvl: 12000000,
    risk: 'low',
    type: 'lending',
    tokens: ['USDC'],
    minDeposit: 50,
    lockPeriod: 0,
    chain: 'minievm-1'
  },
  {
    id: 'init-eth-lp',
    name: 'INIT/ETH LP',
    protocol: 'InitiaSwap',
    apy: 32.1,
    tvl: 3200000,
    risk: 'high',
    type: 'liquidity-pool',
    tokens: ['INIT', 'ETH'],
    minDeposit: 50,
    lockPeriod: 0,
    chain: 'initia-l1'
  },
  {
    id: 'stable-vault',
    name: 'Stable Yield Vault',
    protocol: 'InitiaVault',
    apy: 6.5,
    tvl: 25000000,
    risk: 'very-low',
    type: 'vault',
    tokens: ['USDC', 'USDT'],
    minDeposit: 100,
    lockPeriod: 0,
    chain: 'minievm-1'
  },
  {
    id: 'init-atom-lp',
    name: 'INIT/ATOM LP',
    protocol: 'InitiaSwap',
    apy: 28.7,
    tvl: 5100000,
    risk: 'medium',
    type: 'liquidity-pool',
    tokens: ['INIT', 'ATOM'],
    minDeposit: 20,
    lockPeriod: 0,
    chain: 'initia-l1'
  }
];

/**
 * Get all available yield pools
 */
export function getPools() {
  return INITIA_POOLS;
}

/**
 * Get pools filtered by criteria
 */
export function filterPools({ maxRisk, max_risk, minApy, min_apy, type, token }) {
  maxRisk = maxRisk || max_risk;
  minApy = minApy || min_apy;
  const riskLevels = { 'very-low': 1, 'low': 2, 'medium': 3, 'high': 4 };

  return INITIA_POOLS.filter(pool => {
    if (maxRisk && riskLevels[pool.risk] > riskLevels[maxRisk]) return false;
    if (minApy && pool.apy < minApy) return false;
    if (type && pool.type !== type) return false;
    if (token && !pool.tokens.includes(token.toUpperCase())) return false;
    return true;
  });
}

/**
 * Calculate optimal allocation across pools
 */
export function calculateOptimalAllocation(totalAmount, riskProfile = 'balanced') {
  const profiles = {
    conservative: { maxRisk: 'low', weights: { staking: 0.5, vault: 0.3, lending: 0.2 } },
    balanced: { maxRisk: 'medium', weights: { 'liquidity-pool': 0.4, staking: 0.3, lending: 0.2, vault: 0.1 } },
    aggressive: { maxRisk: 'high', weights: { 'liquidity-pool': 0.6, staking: 0.2, lending: 0.1, vault: 0.1 } }
  };

  const profile = profiles[riskProfile] || profiles.balanced;
  const eligiblePools = INITIA_POOLS.filter(p => {
    const riskLevels = { 'very-low': 1, 'low': 2, 'medium': 3, 'high': 4 };
    return riskLevels[p.risk] <= riskLevels[profile.maxRisk];
  });

  const allocations = [];
  let totalApy = 0;

  for (const pool of eligiblePools) {
    const weight = profile.weights[pool.type] || 0.05;
    const sameTypePools = eligiblePools.filter(p => p.type === pool.type);
    const poolWeight = weight / sameTypePools.length;
    const amount = totalAmount * poolWeight;

    if (amount >= pool.minDeposit) {
      allocations.push({
        pool: pool.name,
        protocol: pool.protocol,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(poolWeight * 100),
        expectedApy: pool.apy,
        risk: pool.risk,
        chain: pool.chain
      });
      totalApy += pool.apy * poolWeight;
    }
  }

  return {
    riskProfile,
    totalAmount,
    allocations,
    expectedApy: Math.round(totalApy * 100) / 100,
    expectedMonthlyReturn: Math.round(totalAmount * totalApy / 100 / 12 * 100) / 100,
    expectedYearlyReturn: Math.round(totalAmount * totalApy / 100 * 100) / 100
  };
}

/**
 * Use Claude AI to analyze and recommend yield strategy
 */
export async function aiAnalyzeYield(userMessage, apiKey) {
  const client = new Anthropic({ apiKey });

  const poolsContext = JSON.stringify(INITIA_POOLS, null, 2);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are InitiaAI Yield Agent, an expert DeFi advisor on the Initia blockchain ecosystem.

You have access to these live yield pools on Initia:
${poolsContext}

Your job is to:
1. Understand the user's investment goals, risk tolerance, and available capital
2. Recommend the best yield strategy from available Initia pools
3. Explain WHY each recommendation makes sense
4. Calculate expected returns
5. Warn about risks

Be concise, data-driven, and specific. Always mention pool names, APYs, and expected returns.
Format responses with clear sections and numbers.`,
    messages: [{ role: 'user', content: userMessage }]
  });

  return response.content[0].text;
}

/**
 * Monitor portfolio health and rebalance suggestions
 */
export function checkPortfolioHealth(positions) {
  const alerts = [];
  let weightedApy = 0;

  // Calculate total value first to avoid loop bug
  let totalValue = 0;
  for (const pos of positions) {
    totalValue += pos.value || 0;
  }
  if (totalValue === 0) return { totalValue: 0, portfolioApy: 0, positionCount: 0, alerts: [], healthScore: 'empty' };

  for (const pos of positions) {
    const pool = INITIA_POOLS.find(p => p.id === pos.poolId);
    if (!pool) continue;

    weightedApy += pool.apy * pos.value;

    // Check for high concentration
    if (pos.value / totalValue > 0.5) {
      alerts.push({
        type: 'warning',
        message: `Over 50% concentrated in ${pool.name}. Consider diversifying.`
      });
    }

    // Check for high-risk positions
    if (pool.risk === 'high' && pos.value > totalValue * 0.3) {
      alerts.push({
        type: 'risk',
        message: `Large position in high-risk ${pool.name}. Consider reducing.`
      });
    }
  }

  return {
    totalValue,
    portfolioApy: totalValue > 0 ? Math.round(weightedApy / totalValue * 100) / 100 : 0,
    positionCount: positions.length,
    alerts,
    healthScore: alerts.length === 0 ? 'healthy' : alerts.length < 3 ? 'attention' : 'critical'
  };
}
