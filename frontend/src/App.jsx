import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Shop from './pages/Shop'
import Categories from './pages/Categories'
import CategoryDetail from './pages/CategoryDetail'
import Inventory from './pages/Inventory'
import Auctions from './pages/Auctions'
import Login from './pages/Login'
import Register from './pages/Register'
import { authAPI } from './services/api'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (token) {
      // Try to validate token and restore session
      validateSession()
    } else {
      setLoading(false)
    }
  }, [])

  const validateSession = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      setIsAuthenticated(true)
      setUser(response.data)
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (err) {
      // Token is invalid or expired
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', fontSize: '18px' }}>
        Caricamento...
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login onLogin={(userData) => {
              setIsAuthenticated(true)
              setUser(userData)
            }} />} />
            <Route path="/register" element={<Register onRegister={(userData) => {
              setIsAuthenticated(true)
              setUser(userData)
            }} />} />
            <Route path="*" element={<Login onLogin={(userData) => {
              setIsAuthenticated(true)
              setUser(userData)
            }} />} />
          </>
        ) : (
          <Route element={<Layout user={user} onLogout={handleLogout} />}>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/shop" element={<Shop onUserUpdate={setUser} />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:categoryName" element={<CategoryDetail />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/auctions" element={<Auctions />} />
          </Route>
        )}
      </Routes>
    </Router>
  )
}

export default App
