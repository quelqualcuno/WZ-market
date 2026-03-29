import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import api from '../api/client';
import RarityBadge from '../components/RarityBadge';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

const TABS = ['Browse Listings', 'Create Listing'];
const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-pulse space-y-3">
      <div className="h-4 bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-700 rounded w-1/2" />
      <div className="h-4 bg-slate-700 rounded w-1/3" />
      <div className="h-8 bg-slate-700 rounded" />
    </div>
  );
}

function CreateListingTab({ onSuccess }) {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/users/me/inventory').then(res => {
      setInventory(res.data?.items ?? res.data ?? []);
    }).catch(() => {});
  }, []);

  const selected = inventory.find(inv => String(inv.item?.id) === String(selectedItem));
  const maxQty = selected?.quantity ?? 0;
  const fee = price ? (parseFloat(price) * quantity * 0.02).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!selectedItem) { setError('Select an item.'); return; }
    if (!price || parseFloat(price) <= 0) { setError('Enter a valid price.'); return; }
    if (quantity < 1 || quantity > maxQty) { setError('Invalid quantity.'); return; }
    setLoading(true);
    try {
      await api.post('/marketplace/listings', {
        item_id: Number(selectedItem),
        quantity: Number(quantity),
        price_per_unit: parseFloat(price),
      });
      setSuccess('Listing created successfully!');
      setSelectedItem(''); setQuantity(1); setPrice('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-white mb-5">Create Marketplace Listing</h2>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 mb-4 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Select Item from Inventory</label>
          <select
            value={selectedItem}
            onChange={e => { setSelectedItem(e.target.value); setQuantity(1); }}
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choose an item --</option>
            {inventory.map(inv => (
              <option key={inv.item?.id} value={inv.item?.id}>
                {inv.item?.name} (Own: {inv.quantity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Quantity {maxQty > 0 && `(max: ${maxQty})`}</label>
          <input
            type="number" min={1} max={maxQty} value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Price per Unit (🪙)</label>
          <input
            type="number" min={1} step="0.01" value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="Enter price..."
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-slate-700/50 rounded-xl p-4 text-sm text-slate-400 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-slate-200">🪙 {price ? (parseFloat(price) * quantity).toLocaleString() : '0'}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform fee (2%)</span>
            <span className="text-red-400">- 🪙 {fee}</span>
          </div>
          <hr className="border-slate-600" />
          <div className="flex justify-between font-semibold">
            <span className="text-slate-200">You receive</span>
            <span className="text-amber-400">
              🪙 {price ? ((parseFloat(price) * quantity) - parseFloat(fee)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
            </span>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusIcon className="w-4 h-4" />}
          {loading ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);

  const fetchListings = useCallback(async (page = 1) => {
    setLoading(true); setError('');
    try {
      const params = { page, per_page: 12, sort: sortBy };
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/marketplace/listings', { params });
      setListings(res.data?.listings ?? res.data ?? []);
      setTotalPages(res.data?.total_pages ?? 1);
      setCurrentPage(page);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy]);

  useEffect(() => {
    if (activeTab === 0) fetchListings(1);
  }, [fetchListings, activeTab]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBuy = async (listing) => {
    try {
      await api.post(`/marketplace/listings/${listing.id}/buy`);
      showToast(`Purchased ${listing.item?.name}!`);
      fetchListings(currentPage);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Purchase failed.', 'error');
    }
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

      <div>
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="text-slate-400 text-sm mt-1">Player-to-player trading</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 1 ? (
        <CreateListingTab onSuccess={() => setActiveTab(0)} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Listings */}
          {error ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
              <p className="text-slate-300">{error}</p>
              <button onClick={() => fetchListings(1)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm">Retry</button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="text-5xl">🏪</p>
              <p className="text-slate-300 text-lg font-medium">No listings found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => {
                const shopPrice = listing.item?.shop_price ?? 0;
                const listPrice = listing.price_per_unit ?? 0;
                const diff = shopPrice > 0 ? ((listPrice - shopPrice) / shopPrice * 100) : null;
                const isMine = user?.id === listing.seller?.id;

                return (
                  <div key={listing.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-semibold">{listing.item?.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-400 text-xs">{listing.item?.category}</span>
                          <RarityBadge rarity={listing.item?.rarity} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-amber-400 font-bold">🪙 {listPrice.toLocaleString()}</p>
                        {diff !== null && (
                          <p className={`text-xs ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs shop
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="space-y-0.5">
                        <p className="text-slate-500 text-xs">Seller</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">{listing.seller?.username ?? 'Unknown'}</span>
                          {listing.seller?.reputation != null && (
                            <StarRating rating={listing.seller.reputation} size="sm" />
                          )}
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs">Qty: {listing.quantity}</span>
                    </div>

                    <button
                      onClick={() => handleBuy(listing)}
                      disabled={isMine}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
                    >
                      {isMine ? 'Your Listing' : 'Buy'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => fetchListings(currentPage - 1)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => fetchListings(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${
                    p === currentPage ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => fetchListings(currentPage + 1)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
