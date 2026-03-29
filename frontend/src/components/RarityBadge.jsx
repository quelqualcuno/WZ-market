const RARITY_STYLES = {
  common: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  legendary: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
};

export default function RarityBadge({ rarity }) {
  const key = (rarity || 'common').toLowerCase();
  const style = RARITY_STYLES[key] || RARITY_STYLES.common;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${style}`}>
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
}
