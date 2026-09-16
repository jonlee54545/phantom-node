// ==========================================
// 🟢 HISTORY PAGE — ETH主軸＋通貨＋設定記憶
// ==========================================
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const USD_TO_JPY = 150;
const FALLBACK_ETH_USD = 2400;

type Transaction = {
  id: number;
  type: string;
  amount: number;
  status: string;
  tx_hash: string;
  created_at: string;
};

type UserConfig = {
  eth_balance: number;
  target_roi: number;
  user_name: string;
};

const T = {
  EN: {
    title: 'TRANSACTION HISTORY',
    balance: 'WALLET BALANCE',
    totalProfit: 'TRADING PROFIT',
    combined: 'TOTAL ASSETS',
    filter: 'FILTER',
    today: 'Today',
    yesterday: 'Yesterday',
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    all: 'All Time',
    custom: 'Custom Range',
    from: 'From',
    to: 'To',
    date: 'DATE & TIME',
    type: 'TYPE',
    amount: 'AMOUNT',
    status: 'STATUS',
    hash: 'TX HASH',
    noData: 'No transactions found.',
    back: '← BACK TO DASHBOARD',
    pending: 'PENDING',
    completed: 'COMPLETED',
    filterSummary: 'records',
    ethPrice: 'ETH PRICE',
  },
  JA: {
    title: '取引履歴',
    balance: '口座残高',
    totalProfit: '運用利益',
    combined: '合計資産',
    filter: '期間指定',
    today: '今日',
    yesterday: '昨日',
    last7: '過去7日間',
    last30: '過去30日間',
    all: '全期間',
    custom: '日付を指定',
    from: '開始日',
    to: '終了日',
    date: '日時',
    type: '種別',
    amount: '数量',
    status: '状態',
    hash: '取引ハッシュ',
    noData: '取引履歴がありません。',
    back: '← ダッシュボードに戻る',
    pending: '承認待ち',
    completed: '完了',
    filterSummary: '件ヒット',
    ethPrice: 'ETHレート',
  }
};

const getStored = (key: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) || fallback;
};

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  if (loading) return <div className="min-h-screen bg-black text-[#00ff00] font-mono flex items-center justify-center">LOADING...</div>;
  if (!session) { router.replace('/'); return null; }
  return <>{children}</>;
};

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function HistoryPage() {
  return <AuthGuard><HistoryView /></AuthGuard>;
}

const HistoryView = () => {
  const router = useRouter();

  const [lang, setLang] = useState<'EN' | 'JA'>(() => getStored('phantom_lang', 'EN') as 'EN' | 'JA');
  const [currency, setCurrency] = useState<'JPY' | 'USD'>(() => getStored('phantom_currency', 'JPY') as 'JPY' | 'USD');
  useEffect(() => { localStorage.setItem('phantom_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('phantom_currency', currency); }, [currency]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [config, setConfig] = useState<UserConfig>({ eth_balance: 0, target_roi: 0, user_name: '' });
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customFrom, setCustomFrom] = useState<string>(todayStr());
  const [customTo, setCustomTo] = useState<string>(todayStr());
  const [rangeError, setRangeError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [ethPriceUsd, setEthPriceUsd] = useState<number>(FALLBACK_ETH_USD);
  const t = T[lang];

  useEffect(() => {
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
      .then(res => res.json())
      .then(data => {
        const price = parseFloat(data.price);
        if (price > 0) setEthPriceUsd(price);
      })
      .catch(() => {});
    const interval = setInterval(() => {
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
        .then(res => res.json())
        .then(data => {
          const price = parseFloat(data.price);
          if (price > 0) setEthPriceUsd(price);
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { fetchData(); }, [dateFilter, customFrom, customTo]);

  const handleFromChange = (newFrom: string) => {
    setCustomFrom(newFrom);
    if (newFrom > customTo) setCustomTo(newFrom);
    setRangeError('');
  };

  const handleToChange = (newTo: string) => {
    setCustomTo(newTo);
    if (newTo < customFrom) setCustomFrom(newTo);
    setRangeError('');
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) { setLoading(false); return; }

    const { data: configData } = await supabase
      .from('bot_configs')
      .select('eth_balance, target_roi, user_name')
      .eq('user_id', userId)
      .maybeSingle();
    if (configData) {
      setConfig({
        eth_balance: Number(configData.eth_balance),
        target_roi: Number(configData.target_roi),
        user_name: configData.user_name || '',
      });
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dateFilter === 'custom') {
      const fromDate = new Date(customFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(customTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.gte('created_at', fromDate.toISOString()).lte('created_at', toDate.toISOString());
    } else if (dateFilter !== 'all') {
      const now = new Date();
      let since: Date;
      switch (dateFilter) {
        case 'today':
          since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case 'last7':
          since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30':
          since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(0);
      }
      query = query.gte('created_at', since.toISOString());
    }

    const { data: txData } = await query;
    if (txData) setTransactions(txData as Transaction[]);
    setLoading(false);
  };

  const profitLoss = transactions.filter(tx => tx.type === 'PROFIT' || tx.type === 'LOSS');
  const totalProfitUsd = profitLoss.reduce((s, tx) => s + Number(tx.amount), 0);
  const balanceUsd = config.eth_balance * ethPriceUsd;
  const combinedUsd = balanceUsd + totalProfitUsd;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayProfitUsd = transactions
    .filter(tx => (tx.type === 'PROFIT' || tx.type === 'LOSS') && new Date(tx.created_at) >= todayStart)
    .reduce((s, tx) => s + Number(tx.amount), 0);

  const toDisplay = (usd: number): string => {
    if (currency === 'JPY') return `¥${Math.floor(usd * USD_TO_JPY).toLocaleString()}`;
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toEth = (usd: number): string => {
    return (usd / (ethPriceUsd || FALLBACK_ETH_USD)).toFixed(6);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-blue-400 bg-blue-900/20';
      case 'PROFIT': return 'text-[#00ff00] bg-green-900/20';
      case 'LOSS': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const isPositiveAmount = (tx: Transaction) => tx.type === 'DEPOSIT' || tx.type === 'PROFIT';
  const today = todayStr();

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ff00] font-mono p-4 flex flex-col">

      {/* ヘッダー */}
      <header className="border-b border-[#00ff00]/30 pb-3 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]">
            PHANTOM-NODE // {t.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-black border border-gray-800 rounded p-1 text-[10px]">
            <button
              onClick={() => setLang(lang === 'EN' ? 'JA' : 'EN')}
              className="px-2 py-1 hover:text-white transition-colors border-r border-gray-800"
            >
              {lang === 'EN' ? '🇺🇸 EN' : '🇯🇵 JA'}
            </button>
            <button
              onClick={() => setCurrency(currency === 'JPY' ? 'USD' : 'JPY')}
              className="px-2 py-1 hover:text-white transition-colors"
            >
              {currency === 'JPY' ? '💴 JPY' : '💵 USD'}
            </button>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs border border-[#00ff00]/50 text-[#00ff00] px-4 py-1.5 hover:bg-[#00ff00]/10 transition-colors"
          >
            {t.back}
          </button>
        </div>
      </header>

      {/* ETHレート表示 */}
      <div className="mb-4 text-[10px] text-gray-500 flex items-center gap-2">
        <span>📡 {t.ethPrice}:</span>
        <span className="text-[#00ff00] font-mono">1 ETH = {toDisplay(ethPriceUsd)}</span>
        <span className="text-gray-700">| Binance</span>
      </div>

      {/* ===== 資産サマリー（2カード） ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* ① 口座残高 = 合計資産 */}
        <div className="bg-[#0a0a0a] border border-cyan-500/30 p-4 rounded shadow-[0_0_10px_rgba(0,243,255,0.1)]">
          <p className="text-[10px] text-gray-400 mb-1">{t.balance}</p>
          <p className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
            {toEth(combinedUsd)} <span className="text-lg text-cyan-400/60">ETH</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-1">= {toDisplay(combinedUsd)}</p>
          {(() => {
            const profitEth = totalProfitUsd / (ethPriceUsd || FALLBACK_ETH_USD);
            const gainPercent = config.eth_balance > 0 ? Math.abs((profitEth / config.eth_balance) * 100) : 0;
            const isGain = totalProfitUsd >= 0;
            return (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-[9px] text-gray-500">
                  {lang === 'EN' ? 'Deposit' : '入金元本'} {config.eth_balance.toFixed(4)} ETH {lang === 'EN' ? '→' : 'から'}
                </p>
                <p className={`text-sm font-bold ${isGain ? 'text-[#00ff00]' : 'text-red-500'}`}>
                  {isGain ? '▲' : '▼'} {isGain ? '+' : ''}{Math.abs(profitEth).toFixed(6)} ETH
                  <span className="ml-2">({isGain ? '+' : '-'}{gainPercent.toFixed(1)}%)</span>
                </p>
              </div>
            );
          })()}
        </div>

        {/* ② 運用利益 */}
        <div className="bg-[#0a0a0a] border border-[#00ff00]/20 p-4 rounded">
          <p className="text-[10px] text-gray-400 mb-1">{t.totalProfit}</p>
          <p className={`text-3xl font-bold ${totalProfitUsd >= 0 ? 'text-[#00ff00]' : 'text-red-500'}`}>
            {totalProfitUsd >= 0 ? '+' : ''}{toEth(totalProfitUsd)} <span className="text-lg text-gray-400">ETH</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-1">= {totalProfitUsd >= 0 ? '+' : ''}{toDisplay(totalProfitUsd)}</p>
          {(() => {
            const todayEth = todayProfitUsd / (ethPriceUsd || FALLBACK_ETH_USD);
            const isPositiveDay = todayProfitUsd >= 0;
            return (
              <div className="mt-3 pt-3 border-t border-gray-800 space-y-1">
                <p className="text-[9px] text-gray-500">{lang === 'EN' ? "Today's Profit" : '本日の利益'}</p>
                <p className={`text-sm font-bold ${isPositiveDay ? 'text-[#00ff00]' : 'text-red-500'}`}>
                  {isPositiveDay ? '+' : ''}{todayEth.toFixed(6)} ETH
                </p>
                <p className="text-[10px] text-gray-500">= {isPositiveDay ? '+' : ''}{toDisplay(todayProfitUsd)}</p>
              </div>
            );
          })()}
        </div>

      </div>

      {/* 日付フィルター */}
      <div className="bg-[#0a0a0a] border border-[#00ff00]/20 p-3 mb-4 rounded space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-gray-400 mr-1">{t.filter}:</span>
          {[
            { value: 'today', label: t.today },
            { value: 'yesterday', label: t.yesterday },
            { value: 'last7', label: t.last7 },
            { value: 'last30', label: t.last30 },
            { value: 'all', label: t.all },
            { value: 'custom', label: t.custom },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setDateFilter(opt.value); setRangeError(''); }}
              className={`px-3 py-1 text-[10px] font-bold transition-colors ${
                dateFilter === opt.value
                  ? 'bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]'
                  : 'text-gray-500 hover:text-white border border-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="text-[10px] text-gray-500 ml-auto">
            {transactions.length} {t.filterSummary}
          </span>
        </div>
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-gray-800 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-400">{t.from}:</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="bg-black border border-gray-700 text-[#00ff00] text-xs p-1.5 rounded outline-none focus:border-[#00ff00] [color-scheme:dark]"
                />
              </div>
              <span className="text-gray-600 text-xs">〜</span>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-400">{t.to}:</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={today}
                  onChange={(e) => handleToChange(e.target.value)}
                  className="bg-black border border-gray-700 text-[#00ff00] text-xs p-1.5 rounded outline-none focus:border-[#00ff00] [color-scheme:dark]"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-500">
              📅 {customFrom} 〜 {customTo}
              {customFrom === customTo && (
                <span className="text-cyan-400 ml-1">
                  （{new Date(customFrom).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' })}のみ）
                </span>
              )}
            </p>
            {rangeError && <p className="text-[10px] text-red-400 font-bold">{rangeError}</p>}
          </div>
        )}
      </div>

      {/* 取引一覧 */}
      <div className="flex-1 bg-[#0a0a0a] border border-[#00ff00]/20 rounded-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          {loading ? (
            <p className="text-gray-500 text-xs p-4 animate-pulse">LOADING...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 text-xs p-4">{t.noData}</p>
          ) : (
            <>

              {/* ★ PC：テーブル表示 */}
              <table className="w-full text-left text-xs hidden md:table min-w-[750px]">
                <thead className="bg-black text-gray-500 sticky top-0">
                  <tr>
                    <th className="p-3 border-b border-gray-800">{t.date}</th>
                    <th className="p-3 border-b border-gray-800">{t.type}</th>
                    <th className="p-3 border-b border-gray-800 text-right">数量 <span className="text-[9px] text-cyan-400">ETH</span></th>
                    <th className="p-3 border-b border-gray-800 text-right">USD</th>
                    <th className="p-3 border-b border-gray-800 text-right">JPY</th>
                    <th className="p-3 border-b border-gray-800">{t.status}</th>
                    <th className="p-3 border-b border-gray-800">{t.hash}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {transactions.map((tx) => {
                    const isPositive = isPositiveAmount(tx);
                    const isETH = tx.type === 'DEPOSIT';
                    const ethValue = isETH ? Number(tx.amount) : Number(tx.amount) / ethPriceUsd;
                    const usdValue = isETH ? Number(tx.amount) * ethPriceUsd : Number(tx.amount);
                    const jpyValue = usdValue * USD_TO_JPY;
                    const hashDisplay = tx.tx_hash
                      ? (tx.tx_hash.length > 14 ? tx.tx_hash.substring(0, 14) + '...' : tx.tx_hash)
                      : '0x' + Math.random().toString(16).substring(2, 10).toLowerCase() + '...';
                    return (
                      <tr key={tx.id} className="hover:bg-[#00ff00]/5 transition-colors">
                        <td className="p-3 text-gray-400 font-mono text-[10px]">{formatDate(tx.created_at)}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getTypeBadge(tx.type)}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-bold font-mono text-sm ${isPositive ? 'text-[#00ff00]' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{ethValue.toFixed(6)} ETH
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-gray-300">
                          {isPositive ? '+' : ''}${Math.abs(usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-cyan-400">
                          {isPositive ? '+' : ''}¥{Math.abs(Math.floor(jpyValue)).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold ${tx.status === 'COMPLETED' ? 'text-green-400' : tx.status === 'PENDING' ? 'text-yellow-400 animate-pulse' : 'text-gray-500'}`}>
                            {tx.status === 'COMPLETED' ? t.completed : tx.status === 'PENDING' ? t.pending : tx.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[9px] text-gray-500 max-w-[140px] truncate" title={tx.tx_hash || ''}>
                          {hashDisplay}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

                            {/* ★ スマホ：証券アプリ風コンパクト表示 */}
                            <div className="md:hidden space-y-1.5">
                {transactions.map((tx) => {
                  const isPositive = isPositiveAmount(tx);
                  const isETH = tx.type === 'DEPOSIT';
                  const ethValue = isETH ? Number(tx.amount) : Number(tx.amount) / ethPriceUsd;
                  const usdValue = isETH ? Number(tx.amount) * ethPriceUsd : Number(tx.amount);
                  const jpyValue = usdValue * USD_TO_JPY;
                  const hashDisplay = tx.tx_hash
                    ? (tx.tx_hash.length > 10 ? tx.tx_hash.substring(0, 10) + '..' : tx.tx_hash)
                    : '0x' + Math.random().toString(16).substring(2, 6).toLowerCase() + '..';
                  const typeLabel =
                    tx.type === 'PROFIT' ? '利益' :
                    tx.type === 'LOSS' ? '損失' :
                    tx.type === 'DEPOSIT' ? '入金' : tx.type;
                  return (
                    <div key={tx.id} className="bg-black border border-gray-800 rounded px-3 py-2">

                      {/* 上段：種別 | 金額 | 状態 */}
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[11px] font-bold ${getTypeBadge(tx.type)}`}>
                          {typeLabel}
                        </span>
                        <span className={`text-[15px] font-bold font-mono tracking-tight ${isPositive ? 'text-[#00ff00]' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{ethValue.toFixed(4)}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tx.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                          {tx.status === 'COMPLETED' ? '完了' : '承認待'}
                        </span>
                      </div>

                      {/* 下段：日時 | USD | JPY | TX */}
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span className="font-mono">
                          {new Date(tx.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })}
                        </span>
                        <span className="text-gray-400">
                          {isPositive ? '+' : ''}${Math.abs(usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-cyan-400">
                          ¥{Math.abs(Math.floor(jpyValue)).toLocaleString()}
                        </span>
                        <span className="text-gray-600 text-[9px] font-mono">
                          {hashDisplay}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>



            </>
          )}
        </div>
      </div>

    </div>
  );
};
