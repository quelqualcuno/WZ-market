import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  CalendarIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import api from '../api/client';
import StarRating from '../components/StarRating';
import RarityBadge from '../components/RarityBadge';
import { useAuth } from '../context/AuthContext';

const TABS = ['Overview', 'Badges', 'Transactions', 'Ratings'];

function formatDate(d) {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : new Date(d), 'MMM d, yyyy'); } catch { return '—'; }
}

function SkeletonProfile() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-slate-700 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-slate-700 rounded w-40" />
            <div className="h-4 bg-slate-700 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const fetchProfile = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const endpoint = username ? `/users/${username}` : '/users/me';
      const res = await api.get(endpoint);
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const isOwnProfile = !username || username === me?.username;

  if (loading) return <SkeletonProfile />;
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
        <p className="text-slate-300">{error || 'Profile not found.'}</p>
      </div>
    );
  }

  const initials = profile.username?.slice(0, 2).toUpperCase() ?? '??';
  const stats = [
    { label: 'Balance', value: `🪙 ${(profile.balance ?? 0).toLocaleString()}` },
    { label: 'Total Trades', value: (profile.total_trades ?? 0).toLocaleString() },
    { label: 'Items Owned', value: (profile.items_owned ?? 0).toLocaleString() },
    { label: 'Reputation', value: (profile.reputation ?? 0).toFixed(1) },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                {profile.role === 'admin' && (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                <CalendarIcon className="w-4 h-4" />
                Joined {formatDate(profile.created_at)}
              </div>
              {profile.reputation != null && (
                <div className="mt-2">
                  <StarRating rating={profile.reputation} size="md" showCount count={profile.rating_count ?? 0} />
                </div>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <button className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors">
              <PencilIcon className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab} onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent activity */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
            {(profile.recent_activity?.length ?? 0) === 0 ? (
              <p className="text-slate-500 text-sm">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {profile.recent_activity.map((act, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">{act.type}</span>
                    <span className="text-slate-300">{act.description}</span>
                    <span className="ml-auto text-slate-500 text-xs">{formatDate(act.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Favorite categories */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Favorite Categories</h3>
            {(profile.favorite_categories?.length ?? 0) === 0 ? (
              <p className="text-slate-500 text-sm">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {profile.favorite_categories.map((cat, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{cat.name}</span>
                    <span className="text-slate-400 text-xs">{cat.count} trades</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-5">Badges</h3>
          {(profile.badges?.length ?? 0) === 0 ? (
            <p className="text-slate-500 text-sm">No badges earned yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profile.badges.map((badge, i) => (
                <div key={i} className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 text-center">
                  <p className="text-3xl mb-2">{badge.icon ?? '🏆'}</p>
                  <p className="text-white text-sm font-medium">{badge.name}</p>
                  <p className="text-slate-400 text-xs mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Transaction History</h3>
          </div>
          {(profile.transactions?.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-500">No transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    {['Item', 'Type', 'Qty', 'Price', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {profile.transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-slate-700/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 text-sm">{tx.item?.name ?? 'Unknown'}</span>
                          <RarityBadge rarity={tx.item?.rarity} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          tx.type === 'buy' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">{tx.quantity}</td>
                      <td className="px-5 py-3 text-amber-400 text-sm font-medium">🪙 {tx.total?.toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-500 text-sm">{formatDate(tx.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-5">Ratings Received</h3>
          {(profile.ratings?.length ?? 0) === 0 ? (
            <p className="text-slate-500 text-sm">No ratings yet.</p>
          ) : (
            <div className="space-y-4">
              {profile.ratings.map((r, i) => (
                <div key={i} className="bg-slate-700/30 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">{r.from_user?.username ?? 'Anonymous'}</span>
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                      {r.comment && <p className="text-slate-400 text-sm">{r.comment}</p>}
                    </div>
                    <span className="text-slate-500 text-xs flex-shrink-0">{formatDate(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
