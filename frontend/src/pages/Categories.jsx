import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { itemsAPI } from '../services/api'
import './Categories.css'

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      // Fetch all items to get unique categories
      const response = await itemsAPI.list(0, 500)
      
      // Extract unique categories from items
      const categoryMap = {}
      response.data.items.forEach(item => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = {
            name: item.category,
            count: 0,
            rarity: 0,
          }
        }
        categoryMap[item.category].count += 1
        categoryMap[item.category].rarity = Math.max(
          categoryMap[item.category].rarity,
          item.rarity_index
        )
      })

      const categoryList = Object.values(categoryMap).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      setCategories(categoryList)
    } catch (err) {
      console.error('Errore nel caricamento categorie:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (categoryName) => {
    navigate(`/category/${categoryName}`)
  }

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Longsword': '⚔️',
      'Greatsword': '🗡️',
      'Staff': '🪄',
      'Greataxe': '🪓',
      'Scythe': '💀',
      'Spear': '🔱',
      'Bow': '🏹',
      'Light Armor': '🛡️',
      'Cosmetic': '👗',
    }
    return icons[categoryName] || '📦'
  }

  return (
    <div className="categories">
      <h1>⚔️ Catalogo World Zero</h1>
      <p className="subtitle">Scegli una categoria per esplorare</p>

      {loading ? (
        <div className="loading">Caricamento categorie...</div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.name}
              className="category-card"
              onClick={() => handleCategoryClick(category.name)}
            >
              <div className="category-header">
                <span className="category-icon">{getCategoryIcon(category.name)}</span>
                <h3>{category.name}</h3>
              </div>
              
              <div className="category-stats">
                <div className="stat">
                  <span className="label">Item</span>
                  <span className="value">{category.count}</span>
                </div>
                <div className="stat">
                  <span className="label">Max Rarità</span>
                  <span className="value">{category.rarity.toFixed(1)}</span>
                </div>
              </div>

              <button className="view-btn">
                Visualizza {category.count} item →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Categories
