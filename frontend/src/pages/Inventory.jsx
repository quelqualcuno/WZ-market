import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../api/client';
import RarityBadge from '../components/RarityBadge';

const RARITIES = ['All', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const CATEGORIES = ['All', 'Weapons', 'Armor', 'Consumables', 'Mounts', 'Cosmetics', 'Materials'];

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-32" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-12" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-700 rounded w-24" /></td>
    </tr>
  );
}

function SellModal({ item, onClose, onSell }) {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalFee = price ? (parseFloat(price) * quantity * 0.02).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!price || parseFloat(price) <= 0) { setError('Enter a valid price.'); return; }
    if (quantity < 1 || quantity > item.quantity) { setError('Invalid quantity.'); return; }
    setLoading(true);
    try {
      await onSell({ item_id: item.id, quantity: Number(quantity), price_per_unit: parseFloat(price) });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Sell: {item.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Quantity (max: {item.quantity})</label>
            <input
              type="number"
              min={1}
              max={item.quantity}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Price per unit (🪙)</label>
            <input
              type="number"
              min={1}
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Enter price..."
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-200">🪙 {price ? (parseFloat(price) * quantity).toLocaleString() : '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee (2%)</span>
              <span className="text-red-400">- 🪙 {totalFee}</span>
            </div>
            <hr className="border-slate-600 my-1" />
            <div className="flex justify-between font-semibold">
              <span className="text-slate-200">You receive</span>
              <span className="text-amber-400">
                🪙 {price ? ((parseFloat(price) * quantity) - parseFloat(totalFee)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRarity, setFilterRarity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sellItem, setSellItem] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/me/inventory');
      setInventory(res.data?.items ?? res.data ?? []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSell = async (data) => {
    await api.post('/marketplace/listings', data);
    showToast('Listing created!');
    fetchInventory();
  };

  const filtered = inventory.filter(inv => {
    const nameMatch = inv.item?.name?.toLowerCase().includes(search.toLowerCase()) || !search;
    const rarityMatch = filterRarity === 'All' || (inv.item?.rarity || '').toLowerCase() === filterRarity.toLowerCase();
    const catMatch = filterCategory === 'All' || (inv.item?.category || '') === filterCategory;
    return nameMatch && rarityMatch && catMatch;
  });

  const portfolioValue = inventory.reduce((sum, inv) => sum + ((inv.item?.current_price ?? 0) * (inv.quantity ?? 0)), 0);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium border flex items-center gap-3
          ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-300' : 'bg-red-900/90 border-red-700 text-red-300'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {sellItem && (
        <SellModal item={sellItem} onClose={() => setSellItem(null)} onSell={handleSell} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-slate-400 text-sm mt-1">Items you own</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-right">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Portfolio Value</p>
          <p className="text-amber-400 font-bold text-xl">🪙 {portfolioValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterRarity}
          onChange={e => setFilterRarity(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {RARITIES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Content */}
      {error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
          <p className="text-slate-300">{error}</p>
          <button onClick={fetchInventory} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm">Retry</button>
        </div>
      ) : loading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                {['Item', 'Rarity', 'Qty', 'Acquired', 'Current', 'P&L', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-5xl">🎒</p>
          <p className="text-slate-300 text-lg font-medium">
            {inventory.length === 0 ? 'Your inventory is empty.' : 'No items match your filters.'}
          </p>
          {inventory.length === 0 && (
            <a href="/shop" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium">
              Visit the Shop
            </a>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  {['Item', 'Rarity', 'Qty', 'Acquired Price', 'Current Price', 'P&L', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filtered.map((inv, idx) => {
                  const current = inv.item?.current_price ?? 0;
                  const acquired = inv.acquired_price ?? inv.item?.shop_price ?? 0;
                  const qty = inv.quantity ?? 1;
                  const pnl = (current - acquired) * qty;
                  const pnlPct = acquired > 0 ? ((current - acquired) / acquired * 100) : 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <a href={`/shop/${inv.item?.id}`} className="text-white font-medium hover:text-indigo-300 transition-colors">
                          {inv.item?.name ?? 'Unknown'}
                        </a>
                        <p className="text-slate-500 text-xs">{inv.item?.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <RarityBadge rarity={inv.item?.rarity} />
                      </td>
                      <td className="px-4 py-3 text-slate-300">{qty}</td>
                      <td className="px-4 py-3 text-slate-400">🪙 {acquired.toLocaleString()}</td>
                      <td className="px-4 py-3 text-amber-400 font-medium">🪙 {current.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 text-sm font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                          {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()}
                          <span className="text-xs opacity-70">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSellItem({ ...inv.item, quantity: qty })}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
