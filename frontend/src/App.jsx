import React, { useState, useEffect, useCallback } from 'react';
import { useInterwovenKit, useUsernameQuery } from '@initia/interwovenkit-react';

const POOL_COLORS = { 'very-low': '#22c55e', 'low': '#4ade80', 'medium': '#f59e0b', 'high': '#ef4444' };
const API = '';

export default function App() {
  // InterwovenKit wallet hooks
  const {
    address,
    username,
    isConnected,
    openConnect,
    openWallet,
    openDeposit,
    autoSign,
  } = useInterwovenKit();

  const [pools, setPools] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [amount, setAmount] = useState(1000);
  const [risk, setRisk] = useState('balanced');
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSignEnabled, setAutoSignEnabled] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/pools`).then(r => r.json()).then(d => setPools(d.pools || [])).catch(() => {});
  }, []);

  // Track auto-sign status
  useEffect(() => {
    if (autoSign?.isEnabledByChain) {
      setAutoSignEnabled(!!autoSign.isEnabledByChain['initiation-2']);
    }
  }, [autoSign]);

  const calcStrategy = async () => {
    const res = await fetch(`${API}/api/strategy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, risk_profile: risk })
    });
    setStrategy(await res.json());
  };

  const toggleAutoSign = async () => {
    if (!isConnected) { openConnect(); return; }
    try {
      if (autoSignEnabled) {
        await autoSign.disable('initiation-2');
        setAutoSignEnabled(false);
      } else {
        await autoSign.enable('initiation-2');
        setAutoSignEnabled(true);
      }
    } catch (e) { console.error('AutoSign error:', e); }
  };

  const handleBridge = () => {
    if (!isConnected) { openConnect(); return; }
    openDeposit({ denoms: ['uinit'], chainId: 'initiation-2' });
  };

  const sendChat = async () => {
    if (!chatMsg.trim() || !apiKey) return;
    const msg = chatMsg;
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agent/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, api_key: apiKey, wallet_address: address })
      });
      const data = await res.json();
      for (const r of (data.results || [])) {
        if (r.type === 'text') setChatHistory(h => [...h, { role: 'agent', text: r.content }]);
        if (r.type === 'tool_call') setChatHistory(h => [...h, { role: 'tool', text: `${r.tool}: ${JSON.stringify(r.result, null, 2)}` }]);
      }
    } catch (e) {
      setChatHistory(h => [...h, { role: 'agent', text: `Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  const shortAddr = (addr) => addr ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : '';

  return (
    <div style={{ background: '#0a0e27', color: '#e0e0e0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1f4e, #0d1033)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2f5e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>&#9889;</div>
          <h1 style={{ fontSize: 22, color: '#fff', margin: 0 }}>Initia<span style={{ color: '#8b5cf6' }}>AI</span> Yield Agent</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: '#1a3a2a', color: '#4ade80', padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '1px solid #2a5a3a' }}>Initia Testnet</div>
          {isConnected ? (
            <button onClick={openWallet} style={{ background: '#1a1f4e', color: '#c8caff', border: '1px solid #2a2f5e', borderRadius: 20, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>
              {username || shortAddr(address)}
            </button>
          ) : (
            <button onClick={openConnect} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 30 }}>
        {/* Wallet + Auto-sign + Bridge Bar */}
        {isConnected && (
          <div style={{ background: '#111538', border: '1px solid #1e2352', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#888', fontSize: 13 }}>Connected: </span>
              <span style={{ color: '#8b5cf6', fontFamily: 'monospace', fontSize: 13 }}>{shortAddr(address)}</span>
              {username && <span style={{ color: '#4ade80', marginLeft: 8 }}>{username}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={toggleAutoSign} style={{ background: autoSignEnabled ? '#22c55e' : '#333', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {autoSignEnabled ? 'Auto-Sign ON' : 'Enable Auto-Sign'}
              </button>
              <button onClick={handleBridge} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Bridge Assets
              </button>
              <button onClick={openWallet} style={{ background: '#1a1f4e', color: '#c8caff', border: '1px solid #2a2f5e', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}>
                Wallet Details
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Yield Pools', value: pools.length, color: '#8b5cf6' },
            { label: 'Best APY', value: pools.length ? `${Math.max(...pools.map(p => p.apy))}%` : '0%', color: '#4ade80' },
            { label: 'Auto-Sign', value: autoSignEnabled ? 'Active' : 'Inactive', color: autoSignEnabled ? '#22c55e' : '#666' },
            { label: 'Wallet', value: isConnected ? 'Connected' : 'Not Connected', color: isConnected ? '#4ade80' : '#ef4444' }
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: '#111538', border: '1px solid #1e2352', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Yield Pools */}
          <div style={{ background: '#111538', border: '1px solid #1e2352', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, color: '#a0a3d0', marginBottom: 16 }}>Yield Pools on Initia</h2>
            {pools.map((p, i) => (
              <div key={i} style={{ background: '#0a0d24', border: '1px solid #1e2352', borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{p.name}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{p.protocol} | TVL: ${(p.tvl / 1e6).toFixed(1)}M | {p.tokens.join('/')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 18 }}>{p.apy}%</div>
                  <div style={{ color: POOL_COLORS[p.risk] || '#888', fontSize: 12 }}>{p.risk} risk</div>
                </div>
              </div>
            ))}
          </div>

          {/* Strategy Calculator */}
          <div style={{ background: '#111538', border: '1px solid #1e2352', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, color: '#a0a3d0', marginBottom: 16 }}>AI Strategy Calculator</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#888', fontSize: 13 }}>Investment Amount (INIT)</label>
              <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} style={{ width: '100%', background: '#0a0d24', border: '1px solid #2a2f5e', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, marginTop: 4 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#888', fontSize: 13 }}>Risk Profile</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {['conservative', 'balanced', 'aggressive'].map(r => (
                  <button key={r} onClick={() => setRisk(r)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: risk === r ? '2px solid #8b5cf6' : '1px solid #2a2f5e', background: risk === r ? '#1a1f4e' : '#0a0d24', color: risk === r ? '#fff' : '#888', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{r}</button>
                ))}
              </div>
            </div>
            <button onClick={calcStrategy} style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Calculate Optimal Strategy</button>

            {strategy && (
              <div style={{ marginTop: 16, background: '#0a0d24', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#888' }}>Expected APY:</span>
                  <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 18 }}>{strategy.expectedApy}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#888' }}>Monthly Return:</span>
                  <span style={{ color: '#fff' }}>~{strategy.expectedMonthlyReturn} INIT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: '#888' }}>Yearly Return:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>~{strategy.expectedYearlyReturn} INIT</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Allocation:</div>
                {strategy.allocations?.map((a, i) => (
                  <div key={i} style={{ background: '#111538', borderRadius: 8, padding: '8px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#c8caff' }}>{a.pool} ({a.percentage}%)</span>
                    <span style={{ color: POOL_COLORS[a.risk] || '#4ade80' }}>{a.expectedApy}% APY</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Agent Chat */}
        <div style={{ background: '#111538', border: '1px solid #1e2352', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, color: '#a0a3d0', marginBottom: 12 }}>AI Yield Agent (powered by Claude)</h2>
          <div style={{ background: '#1a1040', border: '1px solid #2a2f6e', borderRadius: 12, padding: 12, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: '#a0a3d0', fontSize: 13, whiteSpace: 'nowrap' }}>API Key:</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." style={{ flex: 1, background: '#0a0d24', border: '1px solid #2a2f5e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13 }} />
          </div>
          <div style={{ background: '#0a0d24', border: '1px solid #1e2352', borderRadius: 12, height: 300, overflowY: 'auto', padding: 16, marginBottom: 12 }}>
            {chatHistory.length === 0 && (
              <div style={{ color: '#666' }}>
                Ask the agent: "What's the best yield strategy for 5000 INIT with low risk?"
                <br /><br />
                {isConnected && 'Wallet connected - agent can execute transactions with auto-signing.'}
                {!isConnected && 'Connect your wallet to enable on-chain execution.'}
              </div>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, maxWidth: '85%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                ...(m.role === 'user' ? { background: '#2a2f6e', marginLeft: 'auto', color: '#c8caff' }
                  : m.role === 'tool' ? { background: '#0d2a1a', border: '1px solid #1a4a2a', color: '#4ade80', fontFamily: 'monospace', fontSize: 11 }
                  : { background: '#1a2040', border: '1px solid #2a2f5e' })
              }}>{m.text}</div>
            ))}
            {loading && <div style={{ color: '#8b5cf6', padding: 8 }}>Thinking...</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ask the yield agent..." style={{ flex: 1, background: '#0a0d24', border: '1px solid #2a2f5e', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }} />
            <button onClick={sendChat} disabled={loading || !apiKey} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: (loading || !apiKey) ? 0.5 : 1 }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
