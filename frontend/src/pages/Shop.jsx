import { useState, useEffect } from 'react'
import { itemsAPI, ordersAPI } from '../services/api'
import { authAPI } from '../services/api'
import ItemDetail from '../components/ItemDetail'
import './Shop.css'

function Shop({ onUserUpdate }) {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minQuantity, setMinQuantity] = useState('')
  const [minStars, setMinStars] = useState('0')
  const [purchasingItemId, setPurchasingItemId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchCategoriesAndItems()
  }, [searchTerm, sortBy, selectedCategory, minPrice, maxPrice, minQuantity, minStars])

  const fetchCategoriesAndItems = async () => {
    setLoading(true)
    try {
      const response = await itemsAPI.list(0, 100, searchTerm, sortBy)
      let allItems = response.data.items || []
      
      // Extract unique categories
      const uniqueCategories = {}
      allItems.forEach(item => {
        if (item.categories && Array.isArray(item.categories)) {
          item.categories.forEach(cat => {
            if (!uniqueCategories[cat.name]) {
              uniqueCategories[cat.name] = cat
            }
          })
        }
      })
      
      setCategories(Object.values(uniqueCategories).sort((a, b) => a.name.localeCompare(b.name)))
      
      // Filter by selected category
      if (selectedCategory) {
        allItems = allItems.filter(item => 
          item.categories && item.categories.some(cat => cat.name === selectedCategory)
        )
      }

      const parsedMinPrice = minPrice === '' ? null : Number(minPrice)
      const parsedMaxPrice = maxPrice === '' ? null : Number(maxPrice)
      const parsedMinQty = minQuantity === '' ? null : Number(minQuantity)
      const parsedMinStars = Number(minStars)

      allItems = allItems.filter((item) => {
        const stars = Math.min(Math.round(item.rarity_index), 5)
        const priceOk = (parsedMinPrice === null || item.current_price >= parsedMinPrice)
          && (parsedMaxPrice === null || item.current_price <= parsedMaxPrice)
        const qtyOk = parsedMinQty === null || item.available_copies >= parsedMinQty
        const starsOk = stars >= parsedMinStars
        return priceOk && qtyOk && starsOk
      })
      
      setItems(allItems)
      setError('')
    } catch (err) {
      setError('Errore nel caricamento degli item')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (itemId, e) => {
    e.stopPropagation()
    if (!window.confirm('Confermi l\'acquisto?')) return

    const item = items.find((entry) => entry.id === itemId)
    if (!item) {
      alert('Item non trovato')
      return
    }

    try {
      const meResponse = await authAPI.getCurrentUser()
      const currentBalance = Number(meResponse.data?.balance ?? 0)
      if (!Number.isFinite(currentBalance) || currentBalance < item.current_price) {
        alert(`Credito insufficiente. Saldo: ${currentBalance.toFixed(2)} | Prezzo item: ${item.current_price.toFixed(2)}`)
        return
      }
    } catch (err) {
      alert('Impossibile verificare il saldo attuale, riprova')
      console.error('Balance check error:', err)
      return
    }

    setPurchasingItemId(itemId)
    try {
      await ordersAPI.create(itemId, 1)

      // Sync fresh user balance in navbar and local storage after purchase.
      const meResponse = await authAPI.getCurrentUser()
      localStorage.setItem('user', JSON.stringify(meResponse.data))
      if (typeof onUserUpdate === 'function') {
        onUserUpdate(meResponse.data)
      }

      alert('Acquisto completato!')
      fetchCategoriesAndItems()
    } catch (err) {
      alert('Errore nell\'acquisto: ' + (err.response?.data?.detail || err.message))
      console.error('Purchase error:', err)
    } finally {
      setPurchasingItemId(null)
    }
  }

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName)
  }

  const handleResetFilters = () => {
    setSelectedCategory(null)
    setMinPrice('')
    setMaxPrice('')
    setMinQuantity('')
    setMinStars('0')
    setSearchTerm('')
    setSortBy('name')
  }

  const renderStars = (rarity_index) => {
    const stars = Math.min(Math.round(rarity_index), 5)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return (
    <div className="shop">
      <h1>🛒 Shop Centrale - Aste</h1>

      {error && <div className="error">{error}</div>}

      <div className="shop-container">
        {/* Sidebar Categories */}
        <aside className="categories-sidebar">
          <h3>Categorie</h3>
          <button 
            className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Tutti
          </button>
          <div className="categories-list">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <h3 className="filter-title">Filtri</h3>
          <div className="sidebar-filters">
            <label className="filter-label">Prezzo Min</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="filter-input"
              placeholder="0-100"
            />

            <label className="filter-label">Prezzo Max</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="filter-input"
              placeholder="0-100"
            />

            <label className="filter-label">Quantita Min</label>
            <input
              type="number"
              min="0"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="filter-input"
              placeholder="Es. 5"
            />

            <label className="filter-label">Stelle Minime</label>
            <select
              value={minStars}
              onChange={(e) => setMinStars(e.target.value)}
              className="filter-input"
            >
              <option value="0">Tutte</option>
              <option value="1">1+ stella</option>
              <option value="2">2+ stelle</option>
              <option value="3">3+ stelle</option>
              <option value="4">4+ stelle</option>
              <option value="5">5 stelle</option>
            </select>

            <button
              type="button"
              className="reset-filters-btn"
              onClick={handleResetFilters}
            >
              Reset filtri
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="shop-main">
          <div className="shop-controls">
            <input
              type="text"
              placeholder="Cerca item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Nome</option>
              <option value="price">Prezzo</option>
              <option value="rarity">Rarità</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Caricamento item...</div>
          ) : (
            <div className="items-grid">
              {items.length === 0 ? (
                <div className="no-items">Nessun item trovato</div>
              ) : (
                items.map((item) => (
                  <div 
                    key={item.id} 
                    className="item-card"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Content */}
                    <div className="item-content">
                      {item.is_legacy && <span className="legacy-badge">Legacy</span>}
                      <h3 className="item-name">{item.name}</h3>
                      
                      {/* Rarity Stars */}
                      <div className="rarity-stars">
                        {renderStars(item.rarity_index)}
                      </div>

                      {/* Description snippet */}
                      {item.description && (
                        <p className="item-description">
                          {item.description.substring(0, 80)}...
                        </p>
                      )}

                      {/* Stats */}
                      <div className="item-stats">
                        <div className="stat">
                          <span className="label">Prezzo</span>
                          <span className="value">{item.current_price.toFixed(2)}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Disponibili</span>
                          <span className="value">{item.available_copies}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => handlePurchase(item.id, e)}
                        disabled={item.available_copies === 0 || purchasingItemId === item.id}
                        className="buy-button"
                      >
                        {purchasingItemId === item.id ? 'Acquistando...' : 'Acquista'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail 
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

export default Shop
