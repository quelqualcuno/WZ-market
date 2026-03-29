import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/Shop';
import ItemDetail from './pages/ItemDetail';
import Inventory from './pages/Inventory';
import Marketplace from './pages/Marketplace';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes inside Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ItemDetail />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin-only protected route */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
