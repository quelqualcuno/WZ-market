import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRightIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../api/client';
import RarityBadge from '../components/RarityBadge';
import PriceChart from '../components/PriceChart';
import { useAuth } from '../context/AuthContext';

const RARITY_BORDER = {
  common: 'border-gray-500/50',
  uncommon: 'border-green-500/50',
  rare: 'border-blue-500/50',
  epic: 'border-purple-500/50',
  legendary: 'border-amber-500/50',
};

const RARITY_GRADIENT = {
  common: 'from-gray-700 to-gray-600',
  uncommon: 'from-green-900 to-green-700',
  rare: 'from-blue-900 to-blue-700',
  epic: 'from-purple-900 to-purple-700',
  legendary: 'from-amber-900 to-amber-700',
};

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateBalance } = useAuth();

  const [item, setItem] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [toast, setToast] = useState(null);
  const [historyDays, setHistoryDays] = useState(7);

  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [itemRes, historyRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/items/${id}/price-history`, { params: { days: historyDays } }),
        ]);
        setItem(itemRes.data);
        setPriceHistory(historyRes.data?.history ?? historyRes.data ?? []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load item.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, historyDays]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBuy = async () => {
    setBuying(true);
    try {
      const res = await api.post(`/items/${id}/buy`, { quantity });
      if (res.data?.new_balance !== undefined) updateBalance(res.data.new_balance);
      setItem(prev => prev ? { ...prev, stock: prev.stock - quantity } : prev);
      showToast(`Purchased ${quantity}x ${item.name}!`);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Purchase failed.', 'error');
    } finally {
      setBuying(false);
    }
  };

  const toggleWishlist = () => {
    setWishlist(prev => {
      const next = prev.includes(Number(id))
        ? prev.filter(x => x !== Number(id))
        : [...prev, Number(id)];
      localStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-slate-700 rounded w-64" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-72 bg-slate-700 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-700 rounded w-1/2" />
            <div className="h-6 bg-slate-700 rounded w-1/3" />
            <div className="h-12 bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
        <p className="text-slate-300">{error || 'Item not found.'}</p>
        <button onClick={() => navigate('/shop')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm">
          Back to Shop
        </button>
      </div>
    );
  }

  const rarity = (item.rarity || 'common').toLowerCase();
  const borderClass = RARITY_BORDER[rarity] || RARITY_BORDER.common;
  const gradientClass = RARITY_GRADIENT[rarity] || RARITY_GRADIENT.common;
  const price = item.current_price ?? item.shop_price ?? 0;
  const pct = item.price_change_pct;
  const maxQty = Math.min(item.stock, 10);
  const isWishlisted = wishlist.includes(Number(id));

  return (
    <div className="space-y-8 max-w-5xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium border flex items-center gap-3
          ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-300' : 'bg-red-900/90 border-red-700 text-red-300'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link to="/shop" className="hover:text-slate-300 transition-colors">Shop</Link>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-slate-500">{item.category}</span>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-slate-300">{item.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className={`relative h-72 bg-gradient-to-br ${gradientClass} rounded-2xl border-2 ${borderClass} flex items-center justify-center overflow-hidden`}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl opacity-40">⚔️</span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold text-white">{item.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-slate-400 text-sm">{item.category}</span>
              <RarityBadge rarity={item.rarity} />
            </div>
          </div>

          {item.description && (
            <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
          )}

          {/* Price */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Price</p>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 text-3xl font-bold">🪙 {price.toLocaleString()}</span>
              {typeof pct === 'number' && pct !== 0 && (
                <span className={`flex items-center text-sm font-medium ${pct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pct > 0 ? <ArrowTrendingUpIcon className="w-4 h-4 mr-0.5" /> : <ArrowTrendingDownIcon className="w-4 h-4 mr-0.5" />}
                  {Math.abs(pct).toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Stock</span>
              <span className={item.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                {item.stock > 0 ? `${item.stock} available` : 'Out of Stock'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${item.stock > 20 ? 'bg-green-500' : item.stock > 5 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((item.stock / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Quantity selector */}
          {item.stock > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="text-white font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <span className="text-slate-500 text-sm">
                  Total: <span className="text-amber-400 font-semibold">🪙 {(price * quantity).toLocaleString()}</span>
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleBuy}
              disabled={item.stock === 0 || buying}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {buying ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCartIcon className="w-5 h-5" />
              )}
              {item.stock === 0 ? 'Out of Stock' : buying ? 'Buying...' : 'Buy Now'}
            </button>

            <button
              onClick={toggleWishlist}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
                isWishlisted
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/50'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              {isWishlisted ? <HeartSolidIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <PriceChart
          data={priceHistory}
          onRangeChange={days => setHistoryDays(days)}
        />
      </div>
    </div>
  );
}
