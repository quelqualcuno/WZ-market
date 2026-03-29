import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <header className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700 flex items-center gap-3 px-4 py-3">
      {/* Mobile menu toggle */}
      <button
        className="text-slate-400 hover:text-white lg:hidden"
        onClick={onMenuClick}
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Brand (visible on mobile) */}
      <span className="text-white font-bold text-lg lg:hidden flex-shrink-0">
        ⚔️ ZeroMarket
      </span>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-auto hidden sm:flex">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        {/* Balance */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-700 px-3 py-1.5 rounded-lg">
            <span className="text-amber-400 text-sm">🪙</span>
            <span className="text-amber-300 font-semibold text-sm">
              {typeof user.balance === 'number' ? user.balance.toLocaleString() : '0'}
            </span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>

        {/* User dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <span className="text-slate-200 text-sm hidden md:block">{user.username}</span>
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-1">
                <button
                  onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors"
                >
                  <UserCircleIcon className="w-4 h-4" />
                  Profile
                </button>
                <hr className="border-slate-700 my-1" />
                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-slate-700 text-sm transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
