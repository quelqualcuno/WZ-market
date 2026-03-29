import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth endpoints
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  getCurrentUser: () =>
    api.get('/auth/me'),
}

// Items endpoints
export const itemsAPI = {
  list: (skip = 0, limit = 20, search = '', sort_by = 'name') =>
    api.get('/items', { params: { skip, limit, search, sort_by } }),
  get: (itemId) => api.get(`/items/${itemId}`),
  create: (itemData) => api.post('/items', itemData),
}

// Orders endpoints
export const ordersAPI = {
  create: (itemId, quantity) =>
    api.post('/orders', { item_id: itemId, quantity }),
  get: (orderId) => api.get(`/orders/${orderId}`),
}

// Inventory endpoints
export const inventoryAPI = {
  get: () => api.get('/inventory'),
  getListings: () => api.get('/inventory/listings'),
  getActiveAuctions: () => api.get('/inventory/auctions/active'),
  listForSale: (itemId, quantity, price) =>
    api.post('/inventory/list', {
      item_id: itemId,
      quantity,
      listing_type: 'sale',
      price,
    }),
  listForAuction: (itemId, quantity, price, auctionDurationHours) =>
    api.post('/inventory/list', {
      item_id: itemId,
      quantity,
      listing_type: 'auction',
      price,
      auction_duration_hours: auctionDurationHours,
    }),
  updateListingPrice: (listingId, price) =>
    api.patch(`/inventory/listings/${listingId}/price`, { price }),
}

export default api
