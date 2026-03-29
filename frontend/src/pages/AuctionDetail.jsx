import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import api from '../api/client';
import RarityBadge from '../components/RarityBadge';
import AuctionTimer from '../components/AuctionTimer';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

function formatDate(d) {
  try { return format(typeof d === 'string' ? parseISO(d) : new Date(d), 'MMM d, yyyy HH:mm'); } catch { return '—'; }
}

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [buyingOut, setBuyingOut] = useState(false);
  const [toast, setToast] = useState(null);
  const pollRef = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [auctionRes, bidsRes] = await Promise.all([
        api.get(`/auctions/${id}`),
        api.get(`/auctions/${id}/bids`),
      ]);
      setAuction(auctionRes.data);
      setBids(bidsRes.data?.bids ?? bidsRes.data ?? []);
    } catch (err) {
      if (!silent) setError(err.response?.data?.detail || 'Failed to load auction.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      showToast('Enter a valid bid amount.', 'error');
      return;
    }
    setBidding(true);
    try {
      await api.post(`/auctions/${id}/bids`, { amount: parseFloat(bidAmount) });
      showToast('Bid placed successfully!');
      setBidAmount('');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to place bid.', 'error');
    } finally {
      setBidding(false);
    }
  };

  const handleBuyout = async () => {
    if (!window.confirm(`Buy out for 🪙 ${auction.buyout_price?.toLocaleString()}?`)) return;
    setBuyingOut(true);
    try {
      const res = await api.post(`/auctions/${id}/buyout`);
      if (res.data?.new_balance !== undefined) updateBalance(res.data.new_balance);
      showToast('Item purchased!');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Buyout failed.', 'error');
    } finally {
      setBuyingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-4xl">
        <div className="h-6 bg-slate-700 rounded w-32" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-64 bg-slate-700 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-700 rounded w-1/2" />
            <div className="h-12 bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
        <p className="text-slate-300">{error || 'Auction not found.'}</p>
        <button onClick={() => navigate('/auctions')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm">
          Back to Auctions
        </button>
      </div>
    );
  }

  const currentBid = auction.current_bid ?? auction.starting_price ?? 0;
  const bidCount = bids.length;
  const isEnded = auction.status === 'ended' || auction.status === 'completed';
  const isSeller = user?.id === auction.seller?.id;
  const isHighestBidder = bids[0]?.bidder?.id === user?.id;
  const minBid = currentBid + (auction.min_increment ?? 1);

  return (
    <div className="max-w-4xl space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium border flex items-center gap-3
          ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-300' : 'bg-red-900/90 border-red-700 text-red-300'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Back button */}
      <button onClick={() => navigate('/auctions')} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Auctions
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Item card */}
        <div className="space-y-4">
          <div className="h-64 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl border border-slate-600 flex items-center justify-center overflow-hidden">
            {auction.item?.image_url ? (
              <img src={auction.item.image_url} alt={auction.item?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl opacity-30">⚔️</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{auction.item?.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <RarityBadge rarity={auction.item?.rarity} />
              <span className="text-slate-400 text-sm">{auction.item?.category}</span>
            </div>
            {auction.item?.description && (
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">{auction.item.description}</p>
            )}
          </div>
        </div>

        {/* Auction details */}
        <div className="space-y-5">
          {/* Seller info */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Seller</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {(auction.seller?.username ?? '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{auction.seller?.username ?? 'Unknown'}</p>
                {auction.seller?.reputation != null && (
                  <StarRating rating={auction.seller.reputation} size="sm" showCount count={auction.seller?.rating_count ?? 0} />
                )}
              </div>
            </div>
          </div>

          {/* Bid info */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Current Bid</p>
                <p className="text-amber-400 text-3xl font-bold mt-0.5">
                  🪙 {currentBid.toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{bidCount} bid{bidCount !== 1 ? 's' : ''}</p>
              </div>
              {auction.ends_at && !isEnded && (
                <div className="text-right">
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Ends In</p>
                  <span className="text-2xl font-mono">
                    <AuctionTimer endsAt={auction.ends_at} />
                  </span>
                </div>
              )}
              {isEnded && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-sm font-medium">
                  Ended
                </span>
              )}
            </div>

            {auction.buyout_price && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-slate-400 text-xs">Buyout Price</p>
                <p className="text-green-400 font-semibold">🪙 {auction.buyout_price.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Status messages */}
          {isHighestBidder && !isEnded && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm">
              ✓ You are the highest bidder!
            </div>
          )}
          {isSeller && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl px-4 py-3 text-sm">
              This is your auction.
            </div>
          )}

          {/* Bidding section */}
          {!isEnded && !isSeller && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Bid Amount <span className="text-slate-500">(min: 🪙 {minBid.toLocaleString()})</span>
                </label>
                <input
                  type="number"
                  min={minBid}
                  step="1"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={`Min. ${minBid}`}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBid}
                  disabled={bidding}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-xl transition-colors"
                >
                  {bidding ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>🔨</span>
                  )}
                  {bidding ? 'Placing...' : 'Place Bid'}
                </button>

                {auction.buyout_price && (
                  <button
                    onClick={handleBuyout}
                    disabled={buyingOut}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white font-medium py-2.5 rounded-xl transition-colors"
                  >
                    {buyingOut && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Buyout 🪙 {auction.buyout_price?.toLocaleString()}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bid history */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Bid History</h2>
        </div>
        {bids.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">No bids yet. Be the first!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  {['Bidder', 'Amount', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {bids.map((bid, i) => (
                  <tr key={bid.id ?? i} className={i === 0 ? 'bg-indigo-500/5' : ''}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-600/70 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {(bid.bidder?.username ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className={`text-sm ${i === 0 ? 'text-indigo-300 font-medium' : 'text-slate-300'}`}>
                          {bid.bidder?.username ?? 'Unknown'}
                          {i === 0 && <span className="ml-1 text-xs text-indigo-400">(Top)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-amber-400 font-medium">🪙 {bid.amount?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-500 text-sm">{formatDate(bid.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
