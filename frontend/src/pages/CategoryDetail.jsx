import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { itemsAPI } from '../services/api'
import ItemDetail from '../components/ItemDetail'
import './CategoryDetail.css'

function CategoryDetail() {
  const { categoryName } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [categoryName])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, sortBy])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await itemsAPI.list(0, 500, '', 'name')
      const categoryItems = response.data.items.filter(
        item => item.categories && item.categories.some(cat => cat.name === categoryName)
      )
      setItems(categoryItems)
    } catch (err) {
      console.error('Errore nel caricamento item:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let result = [...items]

    // Search filter
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.current_price - b.current_price)
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.current_price - a.current_price)
    } else if (sortBy === 'rarity') {
      result.sort((a, b) => b.rarity_index - a.rarity_index)
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    setFilteredItems(result)
  }

  const renderStars = (rarity_index) => {
    const stars = Math.min(Math.round(rarity_index), 5)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  const formatPrice = (price) => {
    if (price >= 1_000_000) {
      return (price / 1_000_000).toFixed(1) + 'M'
    } else if (price >= 1_000) {
      return (price / 1_000).toFixed(1) + 'K'
    }
    return price.toFixed(0)
  }

  return (
    <div className="category-detail">
      <button className="back-btn" onClick={() => navigate('/categories')}>
        ← Torna al Catalogo
      </button>

      <div className="detail-header">
        <h1>📦 {categoryName}</h1>
        <p className="item-count">{filteredItems.length} articoli</p>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder={`Cerca in ${categoryName}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="name">Nome A-Z</option>
          <option value="price_asc">Prezzo (Basso → Alto)</option>
          <option value="price_desc">Prezzo (Alto → Basso)</option>
          <option value="rarity">Rarità</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Caricamento...</div>
      ) : filteredItems.length === 0 ? (
        <div className="no-results">
          <p>Nessun articolo trovato per "{searchTerm}"</p>
        </div>
      ) : (
        <div className="items-list">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="item-row"
              onClick={() => setSelectedItem(item)}
            >
              {/* Info */}
              <div className="item-info">
                <h3 className="item-name">{item.name}</h3>
                {item.description && (
                  <p className="item-desc">{item.description.substring(0, 100)}...</p>
                )}
              </div>

              {/* Stats */}
              <div className="item-stats">
                <div className="stat">
                  <span className="stars">{renderStars(item.rarity_index)}</span>
                </div>
                <div className="stat">
                  <span className="tier">Tier {Math.round(item.rarity_index)}</span>
                </div>
                <div className="stat">
                  <span className="stock">{item.available_copies}/{item.total_copies}</span>
                </div>
              </div>

              {/* Price */}
              <div className="item-price">
                <span className="price">{formatPrice(item.current_price)}</span>
              </div>

              {/* Action */}
              <button className="details-btn">Vedi Dettagli →</button>
            </div>
          ))}
        </div>
      )}

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

export default CategoryDetail
