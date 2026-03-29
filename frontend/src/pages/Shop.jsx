import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import api from '../api/client';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Weapons', 'Armor', 'Consumables', 'Mounts', 'Cosmetics', 'Materials'];
const RARITIES = ['All', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'newest', label: 'Newest' },
];

function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden animate-pulse">
      <div className="h-36 bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="h-4 bg-slate-700 rounded w-1/3" />
        <div className="h-8 bg-slate-700 rounded" />
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium border
      ${type === 'success'
        ? 'bg-green-900/90 border-green-700 text-green-300'
        : 'bg-red-900/90 border-red-700 text-red-300'
      }`}
    >
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateBalance } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRarity, setSelectedRarity] = useState('All');
  const [sortBy, setSortBy] = useState('price_asc');

  const debounceRef = useRef(null);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        per_page: 12,
        sort: sortBy,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedRarity !== 'All') params.rarity = selectedRarity.toLowerCase();

      const res = await api.get('/items', { params });
      const data = res.data;
      setItems(data.items ?? data);
      setTotalPages(data.total_pages ?? data.pages ?? 1);
      setCurrentPage(page);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedRarity, sortBy]);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchItems]);

  const handleBuy = async (item) => {
    try {
      const res = await api.post(`/items/${item.id}/buy`, { quantity: 1 });
      if (res.data?.new_balance !== undefined) updateBalance(res.data.new_balance);
      setToast({ message: `Purchased ${item.name}!`, type: 'success' });
      fetchItems(currentPage);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Purchase failed.';
      setToast({ message: msg, type: 'error' });
    }
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Shop</h1>
        <p className="text-slate-400 text-sm mt-1">Browse and buy virtual items</p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <FunnelIcon className="w-4 h-4 text-slate-400" />
        <select
          value={selectedRarity}
          onChange={e => setSelectedRarity(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <span className="text-slate-500 text-sm ml-auto">
          {!loading && `${items.length} items`}
        </span>
      </div>

      {/* Grid */}
      {error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
          <p className="text-slate-300">{error}</p>
          <button
            onClick={() => fetchItems(currentPage)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-5xl">🔍</p>
          <p className="text-slate-300 text-lg font-medium">No items found</p>
          <p className="text-slate-500 text-sm">Try adjusting your filters or search query.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedRarity('All'); }}
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onClick={handleBuy} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => fetchItems(currentPage - 1)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>

          {visiblePages.map((p, idx) => {
            const prev = visiblePages[idx - 1];
            const showEllipsis = prev && p - prev > 1;
            return (
              <span key={p} className="flex items-center gap-2">
                {showEllipsis && <span className="text-slate-600">…</span>}
                <button
                  onClick={() => fetchItems(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              </span>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => fetchItems(currentPage + 1)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
