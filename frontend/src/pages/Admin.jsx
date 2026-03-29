import { useState, useEffect, useCallback } from 'react';
import {
  UsersIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../api/client';
import RarityBadge from '../components/RarityBadge';

const TABS = ['Overview', 'Users', 'Items', 'Transactions'];
const TX_TYPES = ['All', 'shop', 'marketplace', 'auction'];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RestockModal({ item, onClose, onRestock }) {
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity < 1) { setError('Enter a valid quantity.'); return; }
    setLoading(true);
    try {
      await onRestock(item.id, quantity);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Restock failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Restock: {item.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Quantity to Add</label>
            <input
              type="number" min={1} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Restocking...' : 'Confirm Restock'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Items state
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [restockItem, setRestockItem] = useState(null);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('All');

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true); setStatsError('');
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      setStatsError(err.response?.data?.detail || 'Failed to load stats.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true); setUsersError('');
    try {
      const params = {};
      if (userSearch.trim()) params.search = userSearch.trim();
      const res = await api.get('/admin/users', { params });
      setUsers(res.data?.users ?? res.data ?? []);
    } catch (err) {
      setUsersError(err.response?.data?.detail || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  const fetchItems = useCallback(async () => {
    setItemsLoading(true); setItemsError('');
    try {
      const res = await api.get('/items', { params: { per_page: 50 } });
      setItems(res.data?.items ?? res.data ?? []);
    } catch (err) {
      setItemsError(err.response?.data?.detail || 'Failed to load items.');
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true); setTxError('');
    try {
      const params = {};
      if (txTypeFilter !== 'All') params.type = txTypeFilter;
      const res = await api.get('/admin/transactions', { params });
      setTransactions(res.data?.transactions ?? res.data ?? []);
    } catch (err) {
      setTxError(err.response?.data?.detail || 'Failed to load transactions.');
    } finally {
      setTxLoading(false);
    }
  }, [txTypeFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 1) fetchUsers();
    if (activeTab === 2) fetchItems();
    if (activeTab === 3) fetchTransactions();
  }, [activeTab, fetchUsers, fetchItems, fetchTransactions]);

  const handleBanToggle = async (userId, banned) => {
    try {
      await api.post(`/admin/users/${userId}/${banned ? 'unban' : 'ban'}`);
      showToast(`User ${banned ? 'unbanned' : 'banned'} successfully.`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Action failed.', 'error');
    }
  };

  const handleRestock = async (itemId, quantity) => {
    await api.post(`/admin/items/${itemId}/restock`, { quantity });
    showToast('Item restocked!');
    fetchItems();
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return format(typeof d === 'string' ? parseISO(d) : new Date(d), 'MMM d, yyyy'); } catch { return '—'; }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium border flex items-center gap-3
          ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-300' : 'bg-red-900/90 border-red-700 text-red-300'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {restockItem && (
        <RestockModal item={restockItem} onClose={() => setRestockItem(null)} onRestock={handleRestock} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((tab, i) => (
          <button
            key={tab} onClick={() => setActiveTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {statsError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <ExclamationTriangleIcon className="w-5 h-5" />
              {statsError}
            </div>
          ) : statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 animate-pulse">
                  <div className="h-11 w-11 bg-slate-700 rounded-xl mb-3" />
                  <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
                  <div className="h-7 bg-slate-700 rounded w-16" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UsersIcon} label="Total Users" value={(stats.total_users ?? 0).toLocaleString()} color="bg-blue-600" />
                <StatCard icon={CubeIcon} label="Total Items" value={(stats.total_items ?? 0).toLocaleString()} color="bg-purple-600" />
                <StatCard icon={ArrowTrendingUpIcon} label="Volume (24h)" value={`🪙 ${(stats.volume_24h ?? 0).toLocaleString()}`} color="bg-green-600" />
                <StatCard icon={WrenchScrewdriverIcon} label="Active Auctions" value={(stats.active_auctions ?? 0).toLocaleString()} color="bg-amber-600" />
              </div>

              {stats.daily_volume?.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">Daily Transaction Volume</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.daily_volume} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#94a3b8' }}
                        itemStyle={{ color: '#f59e0b' }}
                      />
                      <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {usersError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm"><ExclamationTriangleIcon className="w-5 h-5" />{usersError}</div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      {['ID', 'Username', 'Email', 'Role', 'Balance', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {usersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 7 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-16" /></td>
                          ))}
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No users found.</td>
                      </tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-slate-500 text-sm">{u.id}</td>
                        <td className="px-4 py-3 text-white font-medium text-sm">{u.username}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-slate-600 text-slate-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-amber-400 text-sm">🪙 {(u.balance ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {u.is_banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleBanToggle(u.id, u.is_banned)}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              u.is_banned
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                          >
                            {u.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 2 && (
        <div className="space-y-4">
          {itemsError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm"><ExclamationTriangleIcon className="w-5 h-5" />{itemsError}</div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      {['ID', 'Name', 'Category', 'Rarity', 'Stock', 'Price', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {itemsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 7 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-16" /></td>
                          ))}
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No items found.</td>
                      </tr>
                    ) : items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-slate-500 text-sm">{item.id}</td>
                        <td className="px-4 py-3 text-white font-medium text-sm">{item.name}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm">{item.category}</td>
                        <td className="px-4 py-3"><RarityBadge rarity={item.rarity} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${item.stock === 0 ? 'text-red-400' : item.stock < 10 ? 'text-amber-400' : 'text-green-400'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-amber-400 text-sm">🪙 {(item.shop_price ?? item.current_price ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setRestockItem(item)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 3 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {TX_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTxTypeFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  txTypeFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {txError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm"><ExclamationTriangleIcon className="w-5 h-5" />{txError}</div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      {['ID', 'Buyer', 'Seller', 'Item', 'Qty', 'Total', 'Type', 'Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {txLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-16" /></td>
                          ))}
                        </tr>
                      ))
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-slate-500">No transactions found.</td>
                      </tr>
                    ) : transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-slate-500 text-sm">{tx.id}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{tx.buyer?.username ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{tx.seller?.username ?? '—'}</td>
                        <td className="px-4 py-3 text-white text-sm">{tx.item?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{tx.quantity}</td>
                        <td className="px-4 py-3 text-amber-400 text-sm font-medium">🪙 {(tx.total ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.type === 'shop' ? 'bg-blue-500/20 text-blue-400' :
                            tx.type === 'marketplace' ? 'bg-green-500/20 text-green-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
