import { useNavigate } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-slate-700 select-none leading-none">404</p>
        <h1 className="text-2xl font-bold text-white mt-4">Page Not Found</h1>
        <p className="text-slate-400 mt-3 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Maybe it was sold at auction? 🔨
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="mt-8 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <HomeIcon className="w-5 h-5" />
          Go to Shop
        </button>
      </div>
    </div>
  );
}
