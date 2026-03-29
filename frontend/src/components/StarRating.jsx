import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

const SIZE_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

export default function StarRating({ rating = 0, size = 'md', showCount = false, count = 0 }) {
  const starClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const clampedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = clampedRating >= star;
          const half = !filled && clampedRating >= star - 0.5;
          return (
            <span key={star} className="relative inline-block">
              {filled ? (
                <StarIcon className={`${starClass} text-amber-400`} />
              ) : half ? (
                <span className="relative inline-block">
                  <StarOutlineIcon className={`${starClass} text-slate-600`} />
                  <span
                    className="absolute inset-0 overflow-hidden w-1/2"
                    style={{ display: 'inline-block' }}
                  >
                    <StarIcon className={`${starClass} text-amber-400`} />
                  </span>
                </span>
              ) : (
                <StarOutlineIcon className={`${starClass} text-slate-600`} />
              )}
            </span>
          );
        })}
      </div>
      <span className="text-amber-400 font-semibold text-sm">{clampedRating.toFixed(1)}</span>
      {showCount && count > 0 && (
        <span className="text-slate-500 text-xs">({count})</span>
      )}
    </div>
  );
}
