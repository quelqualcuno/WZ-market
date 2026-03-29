import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../api/client';
import RarityBadge from '../components/RarityBadge';
import AuctionTimer from '../components/AuctionTimer';
import { useAuth } from '../context/AuthContext';

const FILTER_TABS = ['Active', 'Ended', 'My Auctions'];
const DURATIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
];

function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-pulse space-y-3">
      <div className="h-32 bg-slate-700 rounded-lg" />
      <div className="h-4 bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-700 rounded w-1/2" />
      <div className="h-8 bg-slate-700 rounded" />
    </div>
  );
}

function CreateAuctionModal({ onClose, onCreated }) {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [duration, setDuration] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/me/inventory').then(res => setInventory(res.data?.items ?? res.data ?? [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedItem) { setError('Select an item.'); return; }
    if (!startingPrice || parseFloat(startingPrice) <= 0) { setError('Enter a valid starting price.'); return; }
    setLoading(true);
    try {
      const payload = {
        item_id: Number(selectedItem),
        starting_price: parseFloat(startingPrice),
        duration_hours: duration,
      };
      if (buyoutPrice && parseFloat(buyoutPrice) > 0) {
        payload.buyout_price = parseFloat(buyoutPrice);
      }
      await api.post('/auctions', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create auction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Create Auction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Item</label>
            <select
              value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select item --</option>
              {inventory.map(inv => (
                <option key={inv.item?.id} value={inv.item?.id}>{inv.item?.name} (x{inv.quantity})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Starting Price (🪙)</label>
            <input
              type="number" min={1} step="0.01" value={startingPrice}
              onChange={e => setStartingPrice(e.target.value)} placeholder="Enter starting bid..."
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Buyout Price (🪙) — Optional</label>
            <input
              type="number" min={1} step="0.01" value={buyoutPrice}
              onChange={e => setBuyoutPrice(e.target.value)} placeholder="Leave empty for no buyout..."
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Duration</label>
            <div className="grid grid-cols-5 gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.value} type="button"
                  onClick={() => setDuration(d.value)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    duration === d.value ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Creating...' : 'Create Auction'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Auctions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState(0);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const statusMap = { 0: 'active', 1: 'ended', 2: 'my' };

  const fetchAuctions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const status = statusMap[filterTab];
      const params = status === 'my' ? { seller: user?.id } : { status };
      const res = await api.get('/auctions', { params });
      setAuctions(res.data?.auctions ?? res.data ?? []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load auctions.');
    } finally {
      setLoading(false);
    }
  }, [filterTab, user]);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  return (
    <div className="space-y-6">
      {showModal && (
        <CreateAuctionModal onClose={() => setShowModal(false)} onCreated={fetchAuctions} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Auctions</h1>
          <p className="text-slate-400 text-sm mt-1">Bid on rare items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Create Auction
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab, i) => (
          <button
            key={tab} onClick={() => setFilterTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterTab === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
          <p className="text-slate-300">{error}</p>
          <button onClick={fetchAuctions} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm">Retry</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-5xl">🔨</p>
          <p className="text-slate-300 text-lg font-medium">No auctions found</p>
          <p className="text-slate-500 text-sm">
            {filterTab === 0 ? 'No active auctions right now.' : filterTab === 1 ? 'No ended auctions.' : 'You have no auctions.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map(auction => {
            const currentBid = auction.current_bid ?? auction.starting_price ?? 0;
            const bidCount = auction.bid_count ?? 0;

            return (
              <div key={auction.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
                {/* Image placeholder */}
                <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                  {auction.item?.image_url ? (
                    <img src={auction.item.image_url} alt={auction.item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-40">⚔️</span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-white font-semibold">{auction.item?.name ?? 'Unknown Item'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <RarityBadge rarity={auction.item?.rarity} />
                      <span className="text-slate-500 text-xs">{auction.item?.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-xs">Current Bid</p>
                      <p className="text-amber-400 font-bold">
                        {bidCount === 0 ? <span className="text-slate-400 font-normal text-sm">No bids</span> : `🪙 ${currentBid.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">{bidCount} bid{bidCount !== 1 ? 's' : ''}</p>
                      {auction.ends_at && <AuctionTimer endsAt={auction.ends_at} />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">by {auction.seller?.username ?? 'Unknown'}</span>
                    <button
                      onClick={() => navigate(`/auctions/${auction.id}`)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
