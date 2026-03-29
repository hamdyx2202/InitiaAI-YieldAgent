/**
 * InitiaAI Yield Agent - API Server
 *
 * REST API for the AI yield agent with web dashboard
 */

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { runAgent, executeTool } from './index.js';
import { getPools, calculateOptimalAllocation, checkPortfolioHealth } from './yield-analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

// ==================== YIELD POOLS API ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'InitiaAI Yield Agent', version: '1.0.0', network: 'initia:testnet' });
});

app.get('/api/pools', (req, res) => {
  const pools = getPools();
  res.json({ pools, count: pools.length });
});

app.post('/api/strategy', (req, res) => {
  const { amount, risk_profile } = req.body;
  const strategy = calculateOptimalAllocation(amount || 1000, risk_profile || 'balanced');
  res.json(strategy);
});

app.post('/api/portfolio/health', (req, res) => {
  const { positions } = req.body;
  res.json(checkPortfolioHealth(positions || []));
});

// ==================== WALLET API ====================

app.post('/api/wallet/create', async (req, res) => {
  try {
    const result = await executeTool('create_initia_wallet', { name: req.body.name || 'default', fund: true });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/wallet/balance/:name', async (req, res) => {
  try {
    const result = await executeTool('check_balance', { wallet_name: req.params.name });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/wallet/list', async (req, res) => {
  try {
    const result = await executeTool('list_wallets', {});
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== AI AGENT ====================

app.post('/api/agent/chat', async (req, res) => {
  try {
    const { message, api_key } = req.body;
    const apiKey = api_key || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'ANTHROPIC_API_KEY required' });
    const results = await runAgent(message, apiKey);
    res.json({ results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== DEPOSIT ====================

app.post('/api/deposit', async (req, res) => {
  try {
    const { wallet_name, pool_id, amount } = req.body;
    const result = await executeTool('deposit_to_pool', { wallet_name, pool_id, amount });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== START ====================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
  ╦┌┐┌┬┌┬┐┬┌─┐╔═╗╦  ╦╦┌─┐┬  ┌┬┐
  ║││││ │ │├─┤╠═╣║  ╚╦╝│├┤ │   ││
  ╩┘└┘┴ ┴ ┴┴ ┴╩ ╩╩   ╩ ┴└─┘┴─┘─┴┘
         ╔═╗┌─┐┌─┐┌┐┌┌┬┐
         ╠═╣│ ┬├┤ │││ │
         ╩ ╩└─┘└─┘┘└┘ ┴

  Dashboard: http://localhost:${PORT}
  API:       http://localhost:${PORT}/api/health
  Pools:     http://localhost:${PORT}/api/pools
  Agent:     POST http://localhost:${PORT}/api/agent/chat

  Network: Initia Testnet (initiation-2)
  `);
});
