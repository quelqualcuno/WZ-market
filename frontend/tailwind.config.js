export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'rarity-common': '#9ca3af',
        'rarity-uncommon': '#22c55e',
        'rarity-rare': '#3b82f6',
        'rarity-epic': '#a855f7',
        'rarity-legendary': '#f59e0b',
      }
    }
  },
  plugins: []
};
