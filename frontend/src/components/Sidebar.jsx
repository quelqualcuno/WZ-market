import { NavLink } from 'react-router-dom';
import {
  ShoppingBagIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  GiftIcon,
  UserIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/shop', label: 'Shop', icon: ShoppingBagIcon },
  { to: '/inventory', label: 'Inventory', icon: ArchiveBoxIcon },
  { to: '/marketplace', label: 'Marketplace', icon: BuildingStorefrontIcon },
  { to: '/auctions', label: 'Auctions', icon: GiftIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export default function Sidebar({ onClose }) {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    }`;

  return (
    <div className="flex flex-col h-full py-5 px-3">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-8">
        <span className="text-2xl">⚔️</span>
        <div>
          <p className="text-white font-bold text-lg leading-tight">ZeroMarket</p>
          <p className="text-slate-500 text-xs">Virtual Economy</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={onClose} end={to === '/'}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <hr className="border-slate-700 my-2" />
            <NavLink to="/admin" className={linkClass} onClick={onClose}>
              <CogIcon className="w-5 h-5 flex-shrink-0" />
              Admin
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pt-4 border-t border-slate-700">
        <p className="text-slate-600 text-xs text-center">ZeroMarket v1.0.0</p>
      </div>
    </div>
  );
}
