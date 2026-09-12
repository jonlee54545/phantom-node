// ==========================================
// 🔴 1. IMPORTS
// ==========================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';

import { supabase } from '../lib/supabase';

// ==========================================
// 🔐 2. AUTHENTICATION COMPONENT (自動ログイン対応)
// ==========================================
const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName, phone_number: phoneNumber } }
        });
        if (error) throw error;
        
        if (data.session) {
          onLogin();
        } else {
          setErrorMsg('[SYSTEM]: 登録完了。既存のノードから接続してください。');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(); 
      }
    } catch (error: any) {
      setErrorMsg(`[ERROR]: ${error.message || '認証エラーが発生しました'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="z-10 w-full max-w-md bg-black border border-[#00ff00]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(0,255,0,0.2)] rounded-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]">PHANTOM-NODE</h1>
          <p className="text-[10px] text-gray-500 mt-2">SECURE TERMINAL ACCESS</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4 md:space-y-5">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[10px] text-cyan-400 mb-1">_OPERATOR NAME (お名前)</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 focus:border-[#00ff00] text-[#00ff00] p-2 text-xs outline-none transition-colors" placeholder="山田 太郎" />
              </div>
              <div>
                <label className="block text-[10px] text-cyan-400 mb-1">_TELEPHONE (電話番号)</label>
                <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 focus:border-[#00ff00] text-[#00ff00] p-2 text-xs outline-none transition-colors" placeholder="090-1234-5678" />
              </div>
            </>
          )}
          <div>
            <label className="block text-[10px] text-cyan-400 mb-1">_IDENTIFIER (Email)</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 focus:border-[#00ff00] text-[#00ff00] p-2 text-xs outline-none transition-colors" placeholder="operator@node.local" />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-400 mb-1">_ACCESS KEY (Password)</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 focus:border-[#00ff00] text-[#00ff00] p-2 text-xs outline-none transition-colors" placeholder="••••••••" />
          </div>
          {errorMsg && <div className={`text-[10px] p-2 border ${errorMsg.includes('ERROR') ? 'text-red-400 border-red-900 bg-red-900/20' : 'text-green-400 border-green-900 bg-green-900/20'}`}>{errorMsg}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#00ff00]/10 hover:bg-[#00ff00]/30 text-[#00ff00] border border-[#00ff00] p-3 text-xs font-bold tracking-wider transition-all disabled:opacity-50">
            {loading ? 'PROCESSING...' : isSignUp ? 'INITIALIZE NODE (新規登録)' : 'ESTABLISH CONNECTION (ログイン)'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }} className="text-xs text-gray-500 hover:text-white transition-colors">
            {isSignUp ? '← 既存のノードに接続 (Login)' : '新しいノードを構築 (Sign Up) →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🟡 3. BOT CONFIGURATION
// ==========================================
const BOT_CONFIG = {
  logSpeedMin: 2000, logSpeedMax: 8000, profitMinUsd: 1.5, profitMaxUsd: 18.5,
};
type LogEntry = { id: number; textEN: string; textJA: string; type: 'info' | 'scan' | 'exec' | 'profit' | 'warn'; };
type TxHistory = { id: string; type: string; amount: number; status: string; created_at: string; };

const T = {
  EN: { subtitle: 'MEV Control Center v2.4', liq: 'Liq-Proof: Verified', conn: 'NETWORK & NODES', engine: 'CORE ENGINES', profit: "TODAY'S PROFIT", bribe: 'Bribe Pool', martin: 'Martingale Margin', safe: 'SAFE', scan: 'MARKET SCANNER', target: 'TARGET', price: 'PRICE', spread: 'SPREAD', logs: 'ACTION LOGS', m_title: 'CONTROL PANEL', m_profile: 'PROFILE SETTINGS', m_wallet: 'WALLET & FUNDS', m_strategy: 'STRATEGY MODE', m_history: 'HISTORY', btn_deposit: 'Deposit', btn_withdraw: 'Withdraw', mode_auto: 'AUTO (Rec)', mode_turbo: 'TURBO (High-Freq)', mode_off: 'OFF' },
  JA: { subtitle: '自律型MEVコントロールセンター', liq: '流動性証明: 認証済', conn: '接続ノード＆ネットワーク', engine: 'コア・エンジン稼働状況', profit: "本日の累計利益", bribe: '賄賂(ガス)プール', martin: 'マーチンゲール証拠金', safe: '安全 (SAFE)', scan: '市場監視スキャナー', target: '監視ペア', price: '現在価格', spread: '価格差 (見込利益)', logs: '自動取引ログ', m_title: 'コントロールパネル', m_profile: 'プロフィール設定', m_wallet: '資金管理 (ウォレット)', m_strategy: '稼働モード設定', m_history: '取引・入出金履歴', btn_deposit: '入金する', btn_withdraw: '利益を出金', mode_auto: 'AUTO (推奨)', mode_turbo: 'TURBO (高頻度)', mode_off: '停止 (OFF)' }
};
const USD_TO_JPY = 150;

// ==========================================
// 🔵 4. CHART COMPONENT（マルチ取引所＋HTMLマーカー）
// ==========================================
const TradingChart = ({ onPriceUpdate, txHistory }: { onPriceUpdate: (price: number) => void; txHistory: TxHistory[] }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const onPriceUpdateRef = useRef(onPriceUpdate);
  const chartRef = useRef<any>(null);
  const txHistoryRef = useRef(txHistory);
  const [markerDots, setMarkerDots] = useState<Array<{ x: number; isProfit: boolean; text: string }>>([]);

  useEffect(() => { onPriceUpdateRef.current = onPriceUpdate; }, [onPriceUpdate]);
  useEffect(() => { txHistoryRef.current = txHistory; }, [txHistory]);

  // ★ マーカー座標計算（txHistory またはチャート表示範囲が変わったとき）
  const recalcMarkers = useCallback(() => {
    if (!chartRef.current || !chartContainerRef.current) return;
    const chart = chartRef.current;
    const timeScale = chart.timeScale();
    const containerWidth = chartContainerRef.current.clientWidth;

    const dots = txHistoryRef.current
      .filter((tx: TxHistory) => tx.type === 'PROFIT' || tx.type === 'LOSS')
      .map((tx: TxHistory) => {
        const ts = Math.floor(new Date(tx.created_at).getTime() / 1000);
        const alignedTime = Math.floor(ts / 60) * 60;
        const x = timeScale.timeToCoordinate(alignedTime as any);
        if (x === null || x === undefined || x < 0 || x > containerWidth) return null;
        return {
          x,
          isProfit: tx.type === 'PROFIT',
          text: `${tx.type === 'PROFIT' ? '+' : '-'}$${Math.abs(Number(tx.amount)).toFixed(1)}`,
        };
      })
      .filter(Boolean) as Array<{ x: number; isProfit: boolean; text: string }>;

    setMarkerDots(dots);
  }, []);

  // txHistory が変わったら再計算
  useEffect(() => { recalcMarkers(); }, [txHistory, recalcMarkers]);

  // ★ メイン：チャート初期化
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#000000' }, textColor: '#888888' },
      grid: { vertLines: { color: '#111111' }, horzLines: { color: '#111111' } },
      crosshair: { mode: 1, vertLine: { color: '#00f3ff' }, horzLine: { color: '#00f3ff' } },
      timeScale: { borderColor: '#333333', timeVisible: true },
      rightPriceScale: { borderColor: '#333333' },
    });
    chartRef.current = chart;

    // Binance 本物のローソク足
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff00', downColor: '#ff0033', borderDownColor: '#ff0033',
      borderUpColor: '#00ff00', wickDownColor: '#ff0033', wickUpColor: '#00ff00',
    });

    // ★ チャートの表示範囲が変わったらマーカー位置を再計算
    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(recalcMarkers);

    // アービトラージ可視化：他取引所の価格ライン
    const bybitLine = chart.addSeries(LineSeries, {
      color: '#ff9900', lineWidth: 1, crosshairMarkerVisible: false,
      lastValueVisible: false, priceLineVisible: false,
    });
    const uniswapLine = chart.addSeries(LineSeries, {
      color: '#ff007a', lineWidth: 1, crosshairMarkerVisible: false,
      lastValueVisible: false, priceLineVisible: false,
    });
    const krakenLine = chart.addSeries(LineSeries, {
      color: '#7b61ff', lineWidth: 1, crosshairMarkerVisible: false,
      lastValueVisible: false, priceLineVisible: false,
    });
    const coinbaseLine = chart.addSeries(LineSeries, {
      color: '#0095ff', lineWidth: 1, crosshairMarkerVisible: false,
      lastValueVisible: false, priceLineVisible: false,
    });

    let bybitOff = 0.3, uniswapOff = -0.2, krakenOff = 0.5, coinbaseOff = -0.1;
    let ws: WebSocket;
    let bybitData: any[] = [], uniswapData: any[] = [], krakenData: any[] = [], coinbaseData: any[] = [];

    fetch('https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1m&limit=100')
      .then(res => res.json())
      .then(data => {
        const formattedData = data.map((d: any) => ({
          time: (d[0] / 1000) as any, open: parseFloat(d[1]), high: parseFloat(d[2]),
          low: parseFloat(d[3]), close: parseFloat(d[4]),
        }));
        candleSeries.setData(formattedData);

        formattedData.forEach((candle: any) => {
          bybitOff += (Math.random() - 0.5) * 0.3;
          uniswapOff += (Math.random() - 0.5) * 0.25;
          krakenOff += (Math.random() - 0.5) * 0.35;
          coinbaseOff += (Math.random() - 0.5) * 0.2;
          bybitOff = Math.max(-2, Math.min(4, bybitOff));
          uniswapOff = Math.max(-3, Math.min(2, uniswapOff));
          krakenOff = Math.max(-1, Math.min(5, krakenOff));
          coinbaseOff = Math.max(-2.5, Math.min(2, coinbaseOff));
          bybitData.push({ time: candle.time, value: candle.close + bybitOff });
          uniswapData.push({ time: candle.time, value: candle.close + uniswapOff });
          krakenData.push({ time: candle.time, value: candle.close + krakenOff });
          coinbaseData.push({ time: candle.time, value: candle.close + coinbaseOff });
        });
        bybitLine.setData(bybitData);
        uniswapLine.setData(uniswapData);
        krakenLine.setData(krakenData);
        coinbaseLine.setData(coinbaseData);

        if (formattedData.length > 0) onPriceUpdateRef.current(formattedData[formattedData.length - 1].close);

        // 初期マーカー計算
        recalcMarkers();

        ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@kline_1m');
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          const kline = message.k;
          const currentPrice = parseFloat(kline.c);
          const time = (kline.t / 1000) as any;

          candleSeries.update({
            time, open: parseFloat(kline.o), high: parseFloat(kline.h),
            low: parseFloat(kline.l), close: currentPrice,
          });

          bybitOff += (Math.random() - 0.5) * 0.3;
          uniswapOff += (Math.random() - 0.5) * 0.25;
          krakenOff += (Math.random() - 0.5) * 0.35;
          coinbaseOff += (Math.random() - 0.5) * 0.2;
          bybitOff = Math.max(-2, Math.min(4, bybitOff));
          uniswapOff = Math.max(-3, Math.min(2, uniswapOff));
          krakenOff = Math.max(-1, Math.min(5, krakenOff));
          coinbaseOff = Math.max(-2.5, Math.min(2, coinbaseOff));

          bybitLine.update({ time, value: currentPrice + bybitOff });
          uniswapLine.update({ time, value: currentPrice + uniswapOff });
          krakenLine.update({ time, value: currentPrice + krakenOff });
          coinbaseLine.update({ time, value: currentPrice + coinbaseOff });

          onPriceUpdateRef.current(currentPrice);
        };
      })
      .catch(err => console.error('Binance API Error:', err));

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      recalcMarkers();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      timeScale.unsubscribeVisibleLogicalRangeChange(recalcMarkers);
      if (ws) ws.close();
      chart.remove();
    };
  }, [recalcMarkers]);

  return (
    <div ref={chartContainerRef} className="w-full h-full absolute inset-0">
      {/* ★ HTMLマーカーオーバーレイ（チャート上に緑●／赤●を表示） */}
      {markerDots.map((dot, i) => (
        <div
          key={i}
          className="absolute pointer-events-none z-10"
          style={{
            left: dot.x,
            top: dot.isProfit ? '10%' : undefined,
            bottom: dot.isProfit ? undefined : '10%',
            transform: 'translateX(-50%)',
          }}
          title={dot.text}
        >

          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: dot.isProfit ? '#00ff00' : '#ff0033',
              boxShadow: `0 0 6px ${dot.isProfit ? '#00ff00' : '#ff0033'}`,
            }}
          />
        </div>
      ))}
    </div>
  );
};





// ==========================================
// 🟢 5. DASHBOARD COMPONENT (pg_cron版)
// ==========================================
const DashboardView = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const router = useRouter();
  const [lang, setLang] = useState<'EN' | 'JA'>('EN');
  const [currency, setCurrency] = useState<'USD' | 'JPY'>('JPY');
  const [pings, setPings] = useState({
    // CEX
    binance: 12, bybit: 15, coinbase: 18, kraken: 22, okx: 28, kucoin: 32, bitget: 26,
    // DEX
    uniswap: 45, pancake: 38, oneinch: 42, curve: 48, sushi: 52,
    // L2 / Chain
    arbitrum: 30, optimism: 28, polygon: 35, base: 20, avalanche: 42,
    // MEV / Data
    flashbots: 5, mevboost: 4, chainlink: 8, mempool: 2
  });
  
  
  const [ethPriceUsd, setEthPriceUsd] = useState(0);
  const [spreadUsd, setSpreadUsd] = useState(4.50); 
  const [totalProfitUsd, setTotalProfitUsd] = useState(1245.50);
const [todayProfitUsd, setTodayProfitUsd] = useState(0);
const [yesterdayProfitUsd, setYesterdayProfitUsd] = useState(0);

  const [dbLoaded, setDbLoaded] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([{ id: 1, textEN: '[System] WebSocket connected to Binance', textJA: '[システム] Binance WebSocket 直結完了', type: 'info' }]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false); 
  const [depositAmount, setDepositAmount] = useState('0.5'); 
  const [isDepositing, setIsDepositLoading] = useState(false);

  const [botMode, setBotMode] = useState<'AUTO' | 'TURBO' | 'OFF'>('AUTO');
  
  const [targetRoi, setTargetRoi] = useState(1.5);
  const [errorRate, setErrorRate] = useState(0.2);
  const [ethBalance, setEthBalance] = useState(2.145);
  const [depositAddress, setDepositAddress] = useState('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  const [txHistory, setTxHistory] = useState<TxHistory[]>([]);
  const [userDispName, setUserDispName] = useState('GUEST-492');

  const logsEndRef = useRef<HTMLDivElement>(null);
  const t = T[lang];
  const userName = user?.email?.split('@')[0].toUpperCase() || 'GUEST-492';

  // 💾 起動時に DB から累計残高を復元
  useEffect(() => {
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const dbTotal = data
            .filter((r: any) => r.type === 'PROFIT' || r.type === 'LOSS')
            .reduce((s: number, r: any) => s + Number(r.amount), 0);
          if (dbTotal !== 0) setTotalProfitUsd(dbTotal);
        }
        setDbLoaded(true);
      });
  }, [user.id]);

  // 💾 botMode変更時にDBに同期（pg_cron用）
  useEffect(() => {
    supabase.from('bot_configs').update({ bot_mode: botMode }).eq('user_id', user.id);
  }, [botMode, user.id]);

  // 💡 Realtime購読（取引＋ログ＋利益更新）
  useEffect(() => {
    const fetchAll = async () => {
      const { data: configData } = await supabase.from('bot_configs').select('*').eq('user_id', user.id).maybeSingle();
      if (configData) {
        setTargetRoi(Number(configData.target_roi));
        setErrorRate(Number(configData.error_rate));
        setEthBalance(Number(configData.eth_balance));
        setDepositAddress(configData.deposit_address);
        setUserDispName(configData.user_name || userName);
        setBotMode(configData.bot_mode || 'AUTO');
      }
      fetchTransactions();
      fetchTotalProfit();
      fetchLogs();
    };
    fetchAll();

    const fetchTotalProfit = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('amount, type, created_at')
        .eq('user_id', user.id);
      if (data) {
        // 全期間の利益合計
        const total = data
          .filter((r: any) => r.type === 'PROFIT' || r.type === 'LOSS')
          .reduce((s: number, r: any) => s + Number(r.amount), 0);
        setTotalProfitUsd(total);

        // ★ 今日の利益（日本時間0:00以降）
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayData = data.filter((r: any) => {
          const d = new Date(r.created_at);
          return (r.type === 'PROFIT' || r.type === 'LOSS') && d >= todayStart;
        });
        const todaySum = todayData.reduce((s: number, r: any) => s + Number(r.amount), 0);
        setTodayProfitUsd(todaySum);

        // ★ 昨日の利益
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayData = data.filter((r: any) => {
          const d = new Date(r.created_at);
          return (r.type === 'PROFIT' || r.type === 'LOSS') && d >= yesterdayStart && d < yesterdayEnd;
        });
        const yesterdaySum = yesterdayData.reduce((s: number, r: any) => s + Number(r.amount), 0);
        setYesterdayProfitUsd(yesterdaySum);
      }
    };

    const fetchLogs = async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('action_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: true });
      if (data && data.length > 0) {
        const loadedLogs: LogEntry[] = data
          .map((r: any) => ({ id: r.id, textEN: r.text_en, textJA: r.text_ja, type: r.type }));
        setLogs(loadedLogs);
      } else {
        setLogs([{ id: 0, textEN: '[System] No logs in last 24 hours', textJA: '[システム] 過去24時間のログはありません', type: 'info' }]);
      }
    };



    const channelConfig = supabase
      .channel('realtime_config')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bot_configs', filter: `user_id=eq.${user.id}` }, (payload) => {
        const newConfig = payload.new as any;
        setTargetRoi(Number(newConfig.target_roi));
        setErrorRate(Number(newConfig.error_rate));
        setEthBalance(Number(newConfig.eth_balance));
        setDepositAddress(newConfig.deposit_address);
        setUserDispName(newConfig.user_name || userName);
        if (newConfig.bot_mode) setBotMode(newConfig.bot_mode);
      })
      .subscribe();

    const channelTx = supabase
      .channel('realtime_transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => {
        fetchTransactions();
        fetchTotalProfit();
      })
      .subscribe();

    const channelLogs = supabase
      .channel('realtime_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'action_logs', filter: `user_id=eq.${user.id}` }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channelConfig); 
      supabase.removeChannel(channelTx); 
      supabase.removeChannel(channelLogs); 
    };
  }, [user.id, user.email, userName]);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setTxHistory(data as TxHistory[]);
  };

  const handleDepositSubmit = async () => {
    setIsDepositLoading(true);
    try {
      const response = await fetch(`https://eth.blockscout.com/api/v2/addresses/${depositAddress}/transactions`);
      if (!response.ok) throw new Error('Public Node Connection Error');
      const data = await response.json();
      const txs = data.items || [];
      const incomingTx = txs.find((tx: any) => tx.to?.hash?.toLowerCase() === depositAddress.toLowerCase() && tx.result === 'success');

      if (incomingTx) {
        const txHash = incomingTx.hash;
        const weiValue = incomingTx.value;
        const actualEthAmount = parseFloat(weiValue) / 1e18;
        const { data: existingTx } = await supabase.from('transactions').select('id').eq('tx_hash', txHash).maybeSingle();

        if (existingTx) {
          createPendingTransaction();
        } else {
          const newBalance = ethBalance + actualEthAmount;
          await supabase.from('bot_configs').update({ eth_balance: newBalance }).eq('user_id', user.id);
          await supabase.from('transactions').insert({ user_id: user.id, type: 'DEPOSIT', amount: actualEthAmount, status: 'COMPLETED', tx_hash: txHash });
          alert(`[NODE SYNC SUCCESS]: On-chain deposit of ${actualEthAmount} ETH detected!`);
          setIsDepositOpen(false); fetchTransactions();
        }
      } else {
        createPendingTransaction();
      }
    } catch (err) {
      createPendingTransaction();
    } finally {
      setIsDepositLoading(false);
    }
  };

  const createPendingTransaction = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return;
    await supabase.from('transactions').insert({ user_id: user.id, type: 'DEPOSIT', amount: Number(depositAmount), status: 'PENDING', tx_hash: '0x_pending_' + Math.random().toString(36).substring(2, 15) });
    alert(`[ESTABLISHING]: Access request sent. Pending admin verification.`);
    setIsDepositOpen(false); fetchTransactions();
  };

  
    // ==========================================
  // 🟢 5a. PING & SPREAD ANIMATION（利益生成はpg_cronが担当）
  // ==========================================
  useEffect(() => {
    const pingTimer = setInterval(() => {
      setPings({
        // CEX（高速・安定）
        binance: Math.floor(Math.random() * 8) + 8,
        bybit: Math.floor(Math.random() * 10) + 12,
        coinbase: Math.floor(Math.random() * 8) + 14,
        kraken: Math.floor(Math.random() * 12) + 18,
        okx: Math.floor(Math.random() * 15) + 22,
        kucoin: Math.floor(Math.random() * 12) + 28,
        bitget: Math.floor(Math.random() * 14) + 20,
        // DEX（やや遅め・変動大）
        uniswap: Math.floor(Math.random() * 30) + 30,
        pancake: Math.floor(Math.random() * 25) + 30,
        oneinch: Math.floor(Math.random() * 22) + 35,
        curve: Math.floor(Math.random() * 28) + 38,
        sushi: Math.floor(Math.random() * 30) + 40,
        // L2（中速）
        arbitrum: Math.floor(Math.random() * 15) + 25,
        optimism: Math.floor(Math.random() * 12) + 24,
        polygon: Math.floor(Math.random() * 18) + 28,
        base: Math.floor(Math.random() * 10) + 18,
        avalanche: Math.floor(Math.random() * 20) + 35,
        // MEV（超高速）
        flashbots: Math.floor(Math.random() * 4) + 3,
        mevboost: Math.floor(Math.random() * 3) + 2,
        chainlink: Math.floor(Math.random() * 6) + 5,
        mempool: Math.floor(Math.random() * 3) + 1,
      });
      setSpreadUsd((Math.random() * 3 + 2)); 
    }, 2000);
    return () => clearInterval(pingTimer);
  }, []);



  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);







  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const formatPrice = (usdValue: number) => {
    if (currency === 'USD') return `$${usdValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    return `¥${Math.floor(usdValue * USD_TO_JPY).toLocaleString()}`;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=00ff00&bgcolor=000000&data=${depositAddress}`;

  return (
    <div className="min-h-screen md:h-screen bg-[#050505] text-[#00ff00] font-mono p-2 md:p-4 flex flex-col overflow-auto md:overflow-hidden relative">
      
      {/* メニューパネル */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full w-[85%] md:w-96 bg-[#0a0a0a] border-l border-[#00ff00]/30 z-50 transform transition-transform duration-300 ease-in-out p-5 overflow-y-auto ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
          <h2 className="text-lg font-bold text-white tracking-widest">{t.m_title}</h2>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="mb-6">
          <h3 className="text-xs text-gray-500 mb-2">{t.m_profile}</h3>
          <div className="flex items-center gap-4 bg-black border border-gray-800 p-3 rounded">
            <div className="w-12 h-12 rounded-full bg-gray-800 border border-[#00ff00] flex items-center justify-center text-xl">👤</div>
            <div>
              <p className="text-white font-bold">{userDispName}</p>
              <p className="text-[10px] text-gray-400 truncate w-32">{user?.email}</p>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-xs text-gray-500 mb-2">{t.m_wallet}</h3>
          <div className="bg-black border border-gray-800 p-3 rounded space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Balance</span>
              <span className="text-[#00ff00] font-bold text-lg">{ethBalance.toFixed(3)} ETH</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setIsDepositOpen(!isDepositOpen)} className="bg-[#00ff00]/20 hover:bg-[#00ff00]/40 text-[#00ff00] border border-[#00ff00] py-2 rounded text-xs font-bold transition-colors">⬇ {lang === 'EN' ? 'Deposit' : '入金する'}</button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 py-2 rounded text-xs transition-colors">⬆ {lang === 'EN' ? 'Withdraw' : '出金する'}</button>
            </div>
            {isDepositOpen && (
              <div className="border-t border-gray-800 pt-3 mt-3 space-y-3 animate-fadeIn">
                <div className="flex justify-center bg-black p-2 border border-gray-800">
                  <img src={qrCodeUrl} alt="Deposit QR" className="w-32 h-32" />
                </div>
                <div className="bg-[#050505] p-2 border border-gray-800 rounded">
                  <p className="text-[9px] text-gray-500 mb-1">ETH DEPOSIT ADDRESS (ETH専用):</p>
                  <p className="text-[10px] text-cyan-400 font-mono break-all select-all">{depositAddress}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] text-gray-400">送金した数量を入力して申請してください：</p>
                  <div className="flex gap-2">
                    <input type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-20 bg-[#0a0a0a] border border-gray-700 text-[#00ff00] p-1 text-xs outline-none focus:border-[#00ff00]" />
                    <button onClick={handleDepositSubmit} disabled={isDepositing} className="flex-1 bg-cyan-900/40 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50">
                      {isDepositing ? 'SCANNING...' : 'I HAVE SENT ETH (送金完了)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-xs text-gray-500 mb-2">{t.m_strategy}</h3>
          <div className="bg-black border border-gray-800 p-1 rounded flex flex-col gap-1">
            <button onClick={() => setBotMode('AUTO')} className={`p-2 text-xs text-left rounded transition-colors ${botMode === 'AUTO' ? 'bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]' : 'text-gray-400 hover:bg-gray-900'}`}>🟢 {t.mode_auto}</button>
            <button onClick={() => setBotMode('TURBO')} className={`p-2 text-xs text-left rounded transition-colors ${botMode === 'TURBO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500' : 'text-gray-400 hover:bg-gray-900'}`}>🔥 {t.mode_turbo}</button>
            <button onClick={() => setBotMode('OFF')} className={`p-2 text-xs text-left rounded transition-colors ${botMode === 'OFF' ? 'bg-red-500/20 text-red-500 border border-red-500' : 'text-gray-400 hover:bg-gray-900'}`}>🛑 {t.mode_off}</button>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-4">
          <h3 className="text-xs text-gray-500 mb-3">{t.m_history}</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {txHistory.length === 0 ? (
              <p className="text-[10px] text-gray-600 text-center py-4">[ NO HISTORY RECORD ]</p>
            ) : (
              txHistory.map((tx) => (
                <div key={tx.id} className="bg-black border border-gray-800 p-2 rounded text-[10px] flex justify-between items-center">
                  <div>
                    <span className={`font-bold ${tx.type === 'DEPOSIT' || tx.type === 'PROFIT' ? 'text-green-400' : 'text-red-400'}`}>{tx.type}</span>
                    <p className="text-[8px] text-gray-500">{new Date(tx.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Tokyo' })}</p>

                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">{tx.amount}</span>
                    <span className={`block text-[8px] font-bold ${tx.status === 'PENDING' ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}>{tx.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-800">
          <button onClick={onLogout} className="w-full bg-red-900/20 hover:bg-red-900/50 text-red-500 border border-red-900 py-2.5 rounded text-xs transition-colors tracking-widest font-bold">DISCONNECT NODE (ログアウト)</button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🟢 5b. メインダッシュボード UI */}
      {/* ========================================== */}
      <header className="border-b border-[#00ff00]/30 pb-3 mb-3 flex justify-between items-end">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]">PHANTOM-NODE</h1>
          <p className="text-[10px] md:text-xs text-gray-400 mt-1">{t.subtitle} <span className={`ml-2 px-1 rounded text-[8px] ${botMode==='AUTO'?'bg-green-900 text-green-400':botMode==='TURBO'?'bg-orange-900 text-orange-400':'bg-red-900 text-red-400'}`}>MODE: {botMode}</span> <span className="ml-2 px-1 rounded text-[8px] bg-cyan-900 text-cyan-400">TARGET ROI: {targetRoi >= 0 ? `+${targetRoi}%` : `${targetRoi}%`}</span></p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex bg-black border border-gray-800 rounded p-1 text-[10px]">
              <button onClick={() => setLang(lang === 'EN' ? 'JA' : 'EN')} className="px-2 py-1 hover:text-white transition-colors border-r border-gray-800">{lang === 'EN' ? '🇺🇸 EN' : '🇯🇵 JA'}</button>
              <button onClick={() => setCurrency(currency === 'USD' ? 'JPY' : 'USD')} className="px-2 py-1 hover:text-white transition-colors">{currency === 'USD' ? '💵 USD' : '💴 JPY'}</button>
            </div>
            {/* 📋 履歴画面へのリンクボタン */}
            <button onClick={() => router.push('/history')} className="text-[10px] text-gray-500 hover:text-[#00ff00] border border-gray-800 px-2 py-1 transition-colors">
              📋 HISTORY
            </button>
            <div onClick={() => setIsMenuOpen(true)} className="flex items-center gap-2 bg-[#111] p-1.5 md:p-2 rounded border border-gray-800 cursor-pointer hover:border-[#00ff00]/80 hover:shadow-[0_0_8px_rgba(0,255,0,0.5)] transition-all">
              <div className="text-right hidden md:block">
                <p className="text-xs text-white font-bold">{userDispName}</p>
                <p className="text-[10px] text-gray-500">Tier: VIP Access</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-[#00ff00] flex items-center justify-center overflow-hidden"><span className="text-xs">👤</span></div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] md:text-xs text-cyan-400"><span className="animate-pulse w-2 h-2 bg-cyan-400 rounded-full"></span>{t.liq}</div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 md:overflow-hidden pb-4 md:pb-0">
        <div className="md:col-span-3 border border-[#00ff00]/20 bg-[#0a0a0a] p-3 md:p-4 flex flex-col gap-4 md:gap-6 rounded-sm md:overflow-y-auto">
          
          









                         {/* 🏦 口座残高カード（主軸通貨で統一） */}
                  {/* ① 口座残高 = 合計資産（入金＋利益） */}
                  <section className="bg-[#111] border border-cyan-500/30 p-3 rounded shadow-[0_0_10px_rgba(0,243,255,0.1)]">
            <h2 className="text-[10px] md:text-xs text-cyan-400 mb-1">{lang === 'EN' ? 'WALLET BALANCE' : '口座残高'}</h2>
            {(() => {
              const combinedEth = ethBalance + totalProfitUsd / (ethPriceUsd > 0 ? ethPriceUsd : 2400);
              return (
                <div className="text-2xl md:text-3xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
                  {combinedEth.toFixed(6)} <span className="text-lg text-cyan-400/60">ETH</span>
                </div>
              );
            })()}
            <p className="text-[10px] text-gray-500 mt-0.5">
              = {formatPrice(ethBalance * (ethPriceUsd > 0 ? ethPriceUsd : 2400) + totalProfitUsd)}
            </p>
            {/* 入金元本からの増加分 */}
            {(() => {
              const profitEth = totalProfitUsd / (ethPriceUsd > 0 ? ethPriceUsd : 2400);
              const gainPercent = ethBalance > 0 ? Math.abs((profitEth / ethBalance) * 100) : 0;
              const isGain = totalProfitUsd >= 0;
              return (
                <div className="mt-2 pt-2 border-t border-gray-800">
                  <p className="text-[8px] text-gray-500">
                    {lang === 'EN' ? 'Deposit' : '入金元本'} {ethBalance.toFixed(4)} ETH {lang === 'EN' ? '→' : 'から'}
                  </p>
                  <p className={`text-xs font-bold ${isGain ? 'text-[#00ff00]' : 'text-red-500'}`}>
                    {isGain ? '▲' : '▼'} {isGain ? '+' : ''}{Math.abs(profitEth).toFixed(6)} ETH
                    <span className="ml-1">({isGain ? '+' : '-'}{gainPercent.toFixed(1)}%)</span>
                  </p>
                </div>
              );
            })()}
          </section>

          {/* ② 運用利益 = 利益の詳細 */}
          <section className="bg-[#111] border border-[#00ff00]/40 p-3 rounded shadow-[0_0_15px_rgba(0,255,0,0.1)]">
            <h2 className="text-[10px] md:text-xs text-gray-400 mb-1">{lang === 'EN' ? 'TRADING PROFIT' : '運用利益'}</h2>
            {(() => {
              const profitEth = totalProfitUsd / (ethPriceUsd > 0 ? ethPriceUsd : 2400);
              const isGain = totalProfitUsd >= 0;
              return (
                <div className={`text-2xl md:text-3xl font-bold ${isGain ? 'text-[#00ff00]' : 'text-red-500'}`}>
                  {isGain ? '+' : ''}{profitEth.toFixed(6)} <span className="text-lg text-gray-400">ETH</span>
                </div>
              );
            })()}
            <p className="text-[10px] text-gray-500 mt-0.5">
              = {totalProfitUsd >= 0 ? '+' : ''}{formatPrice(totalProfitUsd)}
            </p>
            {/* 本日の利益 */}
            {(() => {
              const todayEth = todayProfitUsd / (ethPriceUsd > 0 ? ethPriceUsd : 2400);
              const isPositiveDay = todayProfitUsd >= 0;
              return (
                <div className="mt-2 pt-2 border-t border-gray-800">
                  <p className="text-[8px] text-gray-500">{lang === 'EN' ? 'Today\'s Profit' : '本日の利益'}</p>
                  <p className={`text-xs font-bold ${isPositiveDay ? 'text-[#00ff00]' : 'text-red-500'}`}>
                    {isPositiveDay ? '+' : ''}{todayEth.toFixed(6)} ETH
                  </p>
                  <p className="text-[9px] text-gray-500">= {isPositiveDay ? '+' : ''}{formatPrice(todayProfitUsd)}</p>
                </div>
              );
            })()}
          </section>

          
          {/* ③ 本日の成果 */}
          <section className="bg-[#111] border border-cyan-500/20 p-3 rounded">
            <h2 className="text-[10px] md:text-xs text-cyan-400 mb-2">{lang === 'EN' ? "TODAY'S RESULTS" : '本日の成果'}</h2>
            {(() => {
              const todayTx = txHistory.filter(tx => {
                const d = new Date(tx.created_at);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                return (tx.type === 'PROFIT' || tx.type === 'LOSS') && d >= today;
              });
              const winCount = todayTx.filter(tx => tx.type === 'PROFIT').length;
              const lossCount = todayTx.filter(tx => tx.type === 'LOSS').length;
              const totalCount = winCount + lossCount;
              const winRate = totalCount > 0 ? (winCount / totalCount) * 100 : 0;
              const todayEth = todayProfitUsd / (ethPriceUsd > 0 ? ethPriceUsd : 2400);
              const bestTrade = todayTx.length > 0
                ? todayTx.reduce((best, tx) => Number(tx.amount) > Number(best.amount) ? tx : best, todayTx[0])
                : null;
              const bestEth = bestTrade ? Number(bestTrade.amount) / (ethPriceUsd > 0 ? ethPriceUsd : 2400) : 0;
              return (
                <div className="space-y-2">
                  {/* 本日の損益 */}
                  <div className="flex justify-between items-center bg-black p-2 rounded">
                    <span className="text-[9px] text-gray-400">{lang === 'EN' ? 'P&L' : '損益'}</span>
                    <span className={`text-xs font-bold ${todayProfitUsd >= 0 ? 'text-[#00ff00]' : 'text-red-500'}`}>
                      {todayProfitUsd >= 0 ? '+' : ''}{todayEth.toFixed(6)} ETH
                    </span>
                  </div>
                  {/* 取引回数 / 勝率 */}
                  <div className="flex justify-between text-[9px]">
                    <span className="text-gray-400">{lang === 'EN' ? 'Total Trades' : '取引回数'}</span>
                    <span className="text-white font-mono">
                      {totalCount} <span className="text-gray-500">({lang === 'EN' ? 'W' : '勝'}:{winCount} / {lang === 'EN' ? 'L' : '負'}:{lossCount})</span>
                    </span>
                  </div>
                  {/* 勝率バー */}
                  <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#00ff00] h-full transition-all" style={{ width: `${winRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-600">
                    <span>{lang === 'EN' ? 'Win Rate' : '勝率'} {winRate.toFixed(0)}%</span>
                  </div>
                  {/* ベストトレード */}
                  {bestTrade && (
                    <div className="flex justify-between items-center bg-black p-2 rounded border border-gray-800">
                      <span className="text-[9px] text-gray-400">{lang === 'EN' ? 'Best Trade' : 'ベスト取引'}</span>
                      <span className="text-[10px] font-bold text-[#00ff00] font-mono">
                        +{bestEth.toFixed(6)} ETH
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>







          <section>
            <h2 className="text-xs md:text-sm font-bold border-b border-[#00ff00]/30 pb-2 mb-2">{t.conn}</h2>

            {/* 📊 チャート凡例 */}
            <div className="mb-3 bg-black border border-gray-800 p-2 rounded text-[9px]">
              <p className="text-gray-500 mb-1">📊 ARBITRAGE SPREAD MONITOR</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-[#00ff00]">▬ Binance</span>
                <span className="text-[#ff9900]">▬ Bybit</span>
                <span className="text-[#ff007a]">▬ Uniswap</span>
                <span className="text-[#7b61ff]">▬ Kraken</span>
                <span className="text-[#0095ff]">▬ Coinbase</span>
              </div>
            </div>

            {/* 🏦 CEX */}
            <p className="text-[9px] text-gray-600 mb-1.5 mt-2">🏦 CEX — CENTRALIZED EXCHANGES</p>
            <ul className="text-[11px] space-y-1.5 mb-3">
              <li className="flex justify-between items-center"><span className="text-gray-400">Binance VIP</span> <span className="text-green-400 w-12 text-right">🟢 {pings.binance}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Bybit Pro</span> <span className="text-green-400 w-12 text-right">🟢 {pings.bybit}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Coinbase Prime</span> <span className="text-green-400 w-12 text-right">🟢 {pings.coinbase}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Kraken Pro</span> <span className="text-green-400 w-12 text-right">🟢 {pings.kraken}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">OKX Professional</span> <span className="text-green-400 w-12 text-right">🟢 {pings.okx}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">KuCoin Elite</span> <span className="text-green-400 w-12 text-right">🟢 {pings.kucoin}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Bitget Institutional</span> <span className="text-green-400 w-12 text-right">🟢 {pings.bitget}ms</span></li>
            </ul>

            {/* 🔄 DEX */}
            <p className="text-[9px] text-gray-600 mb-1.5 border-t border-gray-800 pt-2">🔄 DEX — DECENTRALIZED EXCHANGES</p>
            <ul className="text-[11px] space-y-1.5 mb-3">
              <li className="flex justify-between items-center"><span className="text-gray-400">Uniswap V3 (ETH)</span> <span className="text-yellow-400 w-12 text-right">🟡 {pings.uniswap}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">PancakeSwap (BSC)</span> <span className="text-yellow-400 w-12 text-right">🟡 {pings.pancake}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">1inch Router</span> <span className="text-yellow-400 w-12 text-right">🟡 {pings.oneinch}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Curve Finance</span> <span className="text-yellow-400 w-12 text-right">🟡 {pings.curve}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">SushiSwap</span> <span className="text-yellow-400 w-12 text-right">🟡 {pings.sushi}ms</span></li>
            </ul>

            {/* ⛓️ L2 */}
            <p className="text-[9px] text-gray-600 mb-1.5 border-t border-gray-800 pt-2">⛓️ L2 / CHAIN — ROLLUPS & SIDECHAINS</p>
            <ul className="text-[11px] space-y-1.5 mb-3">
              <li className="flex justify-between items-center"><span className="text-gray-400">Arbitrum One</span> <span className="text-green-400 w-12 text-right">🟢 {pings.arbitrum}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Optimism</span> <span className="text-green-400 w-12 text-right">🟢 {pings.optimism}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Polygon zkEVM</span> <span className="text-green-400 w-12 text-right">🟢 {pings.polygon}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Base (Coinbase L2)</span> <span className="text-green-400 w-12 text-right">🟢 {pings.base}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-gray-400">Avalanche C-Chain</span> <span className="text-yellow-400 w-12 text-right">🟡 {pings.avalanche}ms</span></li>
            </ul>

            {/* ⚡ MEV */}
            <p className="text-[9px] text-gray-600 mb-1.5 border-t border-gray-800 pt-2">⚡ MEV / DATA — RELAYS & ORACLES</p>
            <ul className="text-[11px] space-y-1.5">
              <li className="flex justify-between items-center"><span className="text-cyan-400">Flashbots Relay</span> <span className="text-cyan-400 w-12 text-right font-bold">⚡ {pings.flashbots}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-cyan-400">MEV-Boost Relay</span> <span className="text-cyan-400 w-12 text-right font-bold">⚡ {pings.mevboost}ms</span></li>
              <li className="flex justify-between items-center"><span className="text-purple-400">Chainlink Oracle</span> <span className="text-purple-400 w-12 text-right">🔮 {pings.chainlink}ms</span></li>
              <li className="flex justify-between items-center border-t border-gray-800 pt-1.5 mt-1.5"><span className="text-[#00ff00] font-bold">Mempool Node (Private)</span> <span className="text-[#00ff00] w-12 text-right font-bold drop-shadow-[0_0_4px_rgba(0,255,0,0.6)]">⚡ {pings.mempool}ms</span></li>
            </ul>
          </section>



          <section>
            <h2 className="text-xs md:text-sm font-bold border-b border-[#00ff00]/30 pb-2 mb-2">{t.engine}</h2>
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1"><span className="text-cyan-400">{t.bribe}</span><span>{formatPrice(4500)}</span></div>
              <div className="w-full bg-gray-900 h-1.5 md:h-2 rounded-full overflow-hidden"><div className="bg-cyan-400 h-full w-[80%]"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-orange-400">{t.martin}</span><span>{t.safe}</span></div>
              <div className="w-full bg-gray-900 h-1.5 md:h-2 rounded-full overflow-hidden"><div className="bg-orange-400 h-full w-[95%]"></div></div>
            </div>
          </section>
        </div>
        <div className="md:col-span-6 border border-[#00ff00]/20 bg-[#0a0a0a] p-3 md:p-4 flex flex-col rounded-sm h-[300px] md:h-auto md:min-h-0">
          <h2 className="text-xs md:text-sm font-bold border-b border-[#00ff00]/30 pb-2 mb-2 flex justify-between z-10">
            <span>{t.scan}</span><span className="text-red-500 animate-pulse">● LIVE (BINANCE WS)</span>
          </h2>
          <div className="flex-1 relative border border-gray-800 overflow-hidden my-2"><TradingChart onPriceUpdate={(price) => setEthPriceUsd(price)} txHistory={txHistory} /></div>

          <div className="mt-1 border border-gray-800 p-2 bg-black text-[10px] md:text-xs z-10">
            <div className="flex justify-between text-gray-400 mb-1"><span>{t.target}</span><span>{t.price}</span><span>{t.spread}</span></div>
            <div className="flex justify-between font-bold"><span className="text-white">ETH/USDT</span><span className="text-gray-300">{ethPriceUsd === 0 ? 'LOADING...' : formatPrice(ethPriceUsd)}</span><span className="text-cyan-400">+{formatPrice(spreadUsd)}</span></div>
          </div>
        </div>


        <div className="md:col-span-3 border border-[#00ff00]/20 bg-[#0a0a0a] p-3 md:p-4 flex flex-col rounded-sm h-[250px] md:h-auto md:min-h-0">
          <h2 className="text-xs md:text-sm font-bold border-b border-[#00ff00]/30 pb-2 mb-2 flex justify-between"><span>{t.logs}</span><span className="text-[8px] text-gray-500 font-normal">PAST 24H</span></h2>
          <div className="flex-1 bg-black border border-gray-800 p-2 text-[10px] space-y-1.5 overflow-y-auto">
            {logs.map((log) => (
              <p key={log.id} className={`${log.type === 'info' ? 'text-gray-500' : ''} ${log.type === 'scan' ? 'text-cyan-400' : ''} ${log.type === 'exec' ? 'text-green-500' : ''} ${log.type === 'profit' ? 'text-[#00ff00] font-bold' : ''} ${log.type === 'warn' ? 'text-orange-400' : ''}`}>{lang === 'EN' ? log.textEN : log.textJA}</p>
            ))}
            <div ref={logsEndRef} />
          </div>
          <button onClick={() => router.push('/history')} className="mt-2 w-full text-[10px] text-gray-400 hover:text-[#00ff00] border border-gray-800 hover:border-[#00ff00] py-1.5 transition-colors font-bold tracking-wider">
            {lang === 'EN' ? '📋 MORE HISTORY...' : '📋 もっと見る...'}
          </button>
        </div>




      </div>
    </div>
  );
};

// ==========================================
// 🚀 6. APP ENTRY POINT
// ==========================================
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-black text-[#00ff00] font-mono flex items-center justify-center">INITIALIZING NODE...</div>;
  if (!session) return <AuthScreen onLogin={() => {}} />;
  return <DashboardView user={session.user} onLogout={() => supabase.auth.signOut()} />;
}
