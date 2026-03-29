import { useNavigate } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import RarityBadge from './RarityBadge';

const RARITY_GRADIENT = {
  common: 'from-gray-700 to-gray-600',
  uncommon: 'from-green-900 to-green-700',
  rare: 'from-blue-900 to-blue-700',
  epic: 'from-purple-900 to-purple-700',
  legendary: 'from-amber-900 to-amber-700',
};

export default function ItemCard({ item, onClick }) {
  const navigate = useNavigate();
  const rarity = (item.rarity || 'common').toLowerCase();
  const gradient = RARITY_GRADIENT[rarity] || RARITY_GRADIENT.common;
  const inStock = item.stock > 0;
  const pct = item.price_change_pct;
  const hasTrend = typeof pct === 'number' && pct !== 0;

  const handleCardClick = () => navigate(`/shop/${item.id}`);

  const handleBuy = (e) => {
    e.stopPropagation();
    if (onClick) onClick(item);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
    >
      {/* Image / gradient placeholder */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span className="text-4xl opacity-50">⚔️</span>
        )}
        <div className="absolute top-2 right-2">
          <RarityBadge rarity={item.rarity} />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="text-white font-semibold text-sm truncate group-hover:text-indigo-300 transition-colors">
          {item.name}
        </h3>

        <p className="text-slate-500 text-xs uppercase tracking-wide">{item.category}</p>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm font-bold">
              🪙 {(item.current_price ?? item.shop_price ?? 0).toLocaleString()}
            </span>
            {hasTrend && (
              <span className={`flex items-center text-xs font-medium ${pct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pct > 0 ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 mr-0.5" />
                )}
                {Math.abs(pct).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${inStock ? 'text-slate-400' : 'text-red-400 font-medium'}`}>
            {inStock ? `In Stock: ${item.stock}` : 'Out of Stock'}
          </span>
        </div>

        {/* Buy button */}
        <button
          onClick={handleBuy}
          disabled={!inStock}
          className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
        >
          <ShoppingCartIcon className="w-4 h-4" />
          {inStock ? 'Buy' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}
