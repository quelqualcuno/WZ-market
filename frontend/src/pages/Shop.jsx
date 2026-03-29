import { useState, useEffect } from 'react'
import { itemsAPI, ordersAPI } from '../services/api'
import { authAPI } from '../services/api'
import ItemDetail from '../components/ItemDetail'
import './Shop.css'

const SEASONAL_COSMETICS = [
  {
    id: 'mock-cos-bp-neon',
    name: 'Battle Pass: Neon Ronin Set',
    description: 'Set cosmetico premium del Battle Pass con maschera neon e mantello reattivo.',
    current_price: 29.9,
    base_price: 24.9,
    available_copies: 999,
    total_copies: 999,
    rarity_index: 5,
    is_legacy: false,
    isMock: true,
    cosmetic_theme: 'battle-pass',
    categories: [{ id: 'cosmetics', name: 'Cosmetici' }],
  },
  {
    id: 'mock-cos-halloween',
    name: 'Halloween: Spectral Pumpkin Aura',
    description: 'Aura cosmetica di Halloween con effetti arancioni e particelle spettrali.',
    current_price: 21.5,
    base_price: 18.5,
    available_copies: 666,
    total_copies: 666,
    rarity_index: 4,
    is_legacy: false,
    isMock: true,
    cosmetic_theme: 'halloween',
    categories: [{ id: 'cosmetics', name: 'Cosmetici' }, { id: 'halloween', name: 'Halloween' }],
  },
  {
    id: 'mock-cos-natale',
    name: 'Natale: Frost Crown Halo',
    description: 'Cosmetico natalizio con corona ghiacciata, fiocchi luminosi e trail invernale.',
    current_price: 18,
    base_price: 15,
    available_copies: 1200,
    total_copies: 1200,
    rarity_index: 4,
    is_legacy: false,
    isMock: true,
    cosmetic_theme: 'natale',
    categories: [{ id: 'cosmetics', name: 'Cosmetici' }, { id: 'natale', name: 'Natale' }],
  },
  {
    id: 'mock-cos-estate',
    name: 'Estate: Solar Surfboard Trail',
    description: 'Trail cosmetico estivo con onde luminose e scintille dorate.',
    current_price: 16.75,
    base_price: 12.5,
    available_copies: 1500,
    total_copies: 1500,
    rarity_index: 3,
    is_legacy: false,
    isMock: true,
    cosmetic_theme: 'estate',
    categories: [{ id: 'cosmetics', name: 'Cosmetici' }, { id: 'estate', name: 'Estate' }],
  },
]

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
  const [itemTypeFilter, setItemTypeFilter] = useState('all')
  const [cosmeticThemeFilter, setCosmeticThemeFilter] = useState('all')
  const [purchasingItemId, setPurchasingItemId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchCategoriesAndItems()
  }, [searchTerm, sortBy, selectedCategory, minPrice, maxPrice, minQuantity, minStars, itemTypeFilter, cosmeticThemeFilter])

  const getItemType = (item) => {
    const categoryText = (item.categories || []).map((cat) => String(cat.name || '').toLowerCase()).join(' ')
    const text = `${item.name || ''} ${item.description || ''} ${categoryText}`.toLowerCase()
    const cosmeticKeywords = ['cosmetic', 'cosmet', 'skin', 'outfit', 'aura', 'halo', 'trail', 'battle pass', 'halloween', 'natale']
    const weaponKeywords = ['arma', 'weapon', 'blade', 'sword', 'axe', 'bow', 'staff', 'dagger', 'gun']

    if (item.isMock) return 'cosmetics'
    if (cosmeticKeywords.some((keyword) => text.includes(keyword))) return 'cosmetics'
    if (weaponKeywords.some((keyword) => text.includes(keyword))) return 'weapons'
    return 'weapons'
  }

  const getCosmeticTheme = (item) => {
    if (item.cosmetic_theme) return item.cosmetic_theme

    const categoryText = (item.categories || []).map((cat) => String(cat.name || '').toLowerCase()).join(' ')
    const text = `${item.name || ''} ${item.description || ''} ${categoryText}`.toLowerCase()

    if (text.includes('battle pass')) return 'battle-pass'
    if (text.includes('halloween') || text.includes('spooky') || text.includes('pumpkin')) return 'halloween'
    if (text.includes('natale') || text.includes('christmas') || text.includes('winter')) return 'natale'
    if (text.includes('estate') || text.includes('summer') || text.includes('beach')) return 'estate'
    return 'generale'
  }

  const fetchCategoriesAndItems = async () => {
    setLoading(true)
    try {
      const response = await itemsAPI.list(0, 100, searchTerm, sortBy)
      let allItems = [...(response.data.items || []), ...SEASONAL_COSMETICS]

      const normalizedSearch = searchTerm.trim().toLowerCase()
      if (normalizedSearch) {
        allItems = allItems.filter((item) => {
          const categoryText = (item.categories || []).map((cat) => cat.name).join(' ')
          const haystack = `${item.name || ''} ${item.description || ''} ${categoryText}`.toLowerCase()
          return haystack.includes(normalizedSearch)
        })
      }

      allItems = allItems.filter((item) => {
        const itemType = getItemType(item)
        if (itemTypeFilter === 'weapons') return itemType === 'weapons'
        if (itemTypeFilter === 'cosmetics') return itemType === 'cosmetics'
        return true
      })

      if (cosmeticThemeFilter !== 'all') {
        allItems = allItems.filter((item) => getItemType(item) === 'cosmetics' && getCosmeticTheme(item) === cosmeticThemeFilter)
      }
      
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
      
      const filteredCategories = Object.values(uniqueCategories)
        .filter((cat) => String(cat.name || '').toLowerCase() !== 'battle pass')
        .sort((a, b) => a.name.localeCompare(b.name))

      setCategories(filteredCategories)
      
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

      allItems.sort((a, b) => {
        if (sortBy === 'price') return Number(a.current_price) - Number(b.current_price)
        if (sortBy === 'rarity') return Number(b.rarity_index) - Number(a.rarity_index)
        return String(a.name || '').localeCompare(String(b.name || ''))
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

    if (item.isMock) {
      alert('Questo cosmetico e solo vetrina. Inseriscilo nel backend se vuoi renderlo acquistabile.')
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
    setItemTypeFilter('all')
    setCosmeticThemeFilter('all')
    setSearchTerm('')
    setSortBy('name')
  }

  const renderStars = (rarity_index) => {
    const stars = Math.min(Math.round(rarity_index), 5)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  const getRarityClass = (rarity_index) => {
    const stars = Math.min(Math.round(rarity_index), 5)
    if (stars >= 5) return 'rarity-legendary'
    if (stars === 4) return 'rarity-epic'
    if (stars === 3) return 'rarity-rare'
    if (stars === 2) return 'rarity-uncommon'
    return 'rarity-common'
  }

  const getRarityLabel = (rarity_index) => {
    const stars = Math.min(Math.round(rarity_index), 5)
    if (stars >= 5) return 'Legendary'
    if (stars === 4) return 'Epic'
    if (stars === 3) return 'Rare'
    if (stars === 2) return 'Uncommon'
    return 'Common'
  }

  return (
    <div className="shop">
      <h1>🛒 Shop Centrale - Aste</h1>

      {error && <div className="error">{error}</div>}

      <div className="shop-container">
        {/* Sidebar Categories */}
        <aside className="categories-sidebar">
          <details className="sidebar-section" open>
            <summary>Tipo Oggetto</summary>
            <div className="filter-table">
              <button
                className={`category-btn ${itemTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setItemTypeFilter('all')
                  setCosmeticThemeFilter('all')
                }}
              >
                Tutti
              </button>
              <button
                className={`category-btn ${itemTypeFilter === 'weapons' ? 'active' : ''}`}
                onClick={() => {
                  setItemTypeFilter('weapons')
                  setCosmeticThemeFilter('all')
                  setSelectedCategory(null)
                }}
              >
                Armi
              </button>
              <button
                className={`category-btn ${itemTypeFilter === 'cosmetics' ? 'active' : ''}`}
                onClick={() => {
                  setItemTypeFilter('cosmetics')
                  setSelectedCategory(null)
                }}
              >
                Cosmetici
              </button>
            </div>
          </details>

          {(itemTypeFilter === 'all' || itemTypeFilter === 'cosmetics') && (
            <details className="sidebar-section" open>
              <summary>Tema Cosmetici</summary>
              <div className="filter-table">
                <button
                  className={`category-btn ${cosmeticThemeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCosmeticThemeFilter('all')}
                >
                  Tutti i temi
                </button>
                <button
                  className={`category-btn ${cosmeticThemeFilter === 'battle-pass' ? 'active' : ''}`}
                  onClick={() => setCosmeticThemeFilter('battle-pass')}
                >
                  Battle Pass
                </button>
                <button
                  className={`category-btn ${cosmeticThemeFilter === 'halloween' ? 'active' : ''}`}
                  onClick={() => setCosmeticThemeFilter('halloween')}
                >
                  Halloween
                </button>
                <button
                  className={`category-btn ${cosmeticThemeFilter === 'natale' ? 'active' : ''}`}
                  onClick={() => setCosmeticThemeFilter('natale')}
                >
                  Natale
                </button>
                <button
                  className={`category-btn ${cosmeticThemeFilter === 'estate' ? 'active' : ''}`}
                  onClick={() => setCosmeticThemeFilter('estate')}
                >
                  Estate
                </button>
              </div>
            </details>
          )}

          <details className="sidebar-section" open>
            <summary>Categorie</summary>
            <div className="categories-list">
              <button 
                className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                Tutte
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id || cat.name}
                  className={`category-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </details>

          <details className="sidebar-section" open>
            <summary>Filtri</summary>
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
          </details>
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
                    className={`item-card ${getRarityClass(item.rarity_index)}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Content */}
                    <div className="item-content">
                      {item.is_legacy && <span className="legacy-badge">Legacy</span>}
                      <h3 className="item-name">{item.name}</h3>
                      
                      {/* Rarity section */}
                      <div className="rarity-panel">
                        <div className="rarity-stars">
                          {renderStars(item.rarity_index)}
                        </div>
                        <div className="rarity-label">
                          {getRarityLabel(item.rarity_index)}
                        </div>
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
                        disabled={item.available_copies === 0 || purchasingItemId === item.id || item.isMock}
                        className="buy-button"
                      >
                        {item.isMock ? 'Solo Vetrina' : purchasingItemId === item.id ? 'Acquistando...' : 'Acquista'}
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
