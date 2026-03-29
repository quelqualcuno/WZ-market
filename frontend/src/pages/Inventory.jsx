import { useState, useEffect } from 'react'
import { inventoryAPI } from '../services/api'
import './Inventory.css'

function Inventory() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [inventory, setInventory] = useState(null)
  const [listings, setListings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rowInputs, setRowInputs] = useState({})
  const [submittingKey, setSubmittingKey] = useState(null)
  const [priceEditingId, setPriceEditingId] = useState(null)
  const [priceEditValue, setPriceEditValue] = useState('')
  const [auctionModal, setAuctionModal] = useState({
    isOpen: false,
    item: null,
    quantity: 1,
    price: '',
    expiresAt: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, listRes] = await Promise.all([
        inventoryAPI.get(),
        inventoryAPI.getListings()
      ])
      setInventory(invRes.data)
      setListings(listRes.data)
      setError('')
    } catch (err) {
      setError('Errore nel caricamento dati')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.get()
      setInventory(response.data)
    } catch (err) {
      setError('Errore nel caricamento dell\'inventario')
      console.error(err)
    }
  }

  const fetchListings = async () => {
    try {
      const response = await inventoryAPI.getListings()
      setListings(response.data)
    } catch (err) {
      setError('Errore nel caricamento annunci')
      console.error(err)
    }
  }

  const getRowInput = (item) => {
    const current = rowInputs[item.item_id]
    if (current) return current
    return {
      quantity: 1,
      price: Number(item.unit_price.toFixed(2)),
    }
  }

  const toLocalDateTimeInput = (date) => {
    const pad = (value) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const updateRowInput = (itemId, patch) => {
    setRowInputs((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        ...patch,
      },
    }))
  }

  const handleList = async (item) => {
    const input = getRowInput(item)
    const quantity = Number(input.quantity)
    const price = Number(input.price)

    if (!Number.isFinite(quantity) || quantity < 1 || quantity > item.quantity) {
      alert('Quantita non valida')
      return
    }

    if (!Number.isFinite(price) || price < 0 || price > 100) {
      alert('Il prezzo deve essere tra 0 e 100')
      return
    }

    if (!window.confirm(`Confermi che vuoi mettere ${item.item_name} in vendita?`)) return

    const key = `${item.item_id}-sale`
    setSubmittingKey(key)
    try {
      await inventoryAPI.listForSale(item.item_id, quantity, price)
      alert('Oggetto messo in vendita con successo')
      fetchInventory()
      fetchListings()
    } catch (err) {
      alert(err.response?.data?.detail || 'Errore durante la pubblicazione')
      console.error(err)
    } finally {
      setSubmittingKey(null)
    }
  }

  const openAuctionModal = (item) => {
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)

    setAuctionModal({
      isOpen: true,
      item,
      quantity: 1,
      price: Number(item.unit_price.toFixed(2)),
      expiresAt: toLocalDateTimeInput(tomorrow),
    })
  }

  const closeAuctionModal = () => {
    setAuctionModal({
      isOpen: false,
      item: null,
      quantity: 1,
      price: '',
      expiresAt: '',
    })
  }

  const handleAuctionModalChange = (patch) => {
    setAuctionModal((prev) => ({ ...prev, ...patch }))
  }

  const handleCreateAuction = async () => {
    if (!auctionModal.item) return

    const quantity = Number(auctionModal.quantity)
    const price = Number(auctionModal.price)
    const expiryDate = new Date(auctionModal.expiresAt)
    const now = new Date()

    if (!Number.isFinite(quantity) || quantity < 1 || quantity > auctionModal.item.quantity) {
      alert('Quantita non valida')
      return
    }

    if (!Number.isFinite(price) || price < 0 || price > 100) {
      alert('Il prezzo deve essere tra 0 e 100')
      return
    }

    if (!auctionModal.expiresAt || Number.isNaN(expiryDate.getTime()) || expiryDate <= now) {
      alert('Inserisci una data di scadenza valida nel futuro')
      return
    }

    const durationHours = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (durationHours < 1 || durationHours > 720) {
      alert('La durata dell\'asta deve essere tra 1 e 720 ore')
      return
    }

    const key = `${auctionModal.item.item_id}-auction`
    setSubmittingKey(key)
    try {
      await inventoryAPI.listForAuction(auctionModal.item.item_id, quantity, price, durationHours)
      alert('Oggetto messo in asta con successo')
      closeAuctionModal()
      fetchInventory()
      fetchListings()
    } catch (err) {
      alert(err.response?.data?.detail || 'Errore durante la pubblicazione dell\'asta')
      console.error(err)
    } finally {
      setSubmittingKey(null)
    }
  }

  const handleUpdatePrice = async (listingId, listing) => {
    const newPrice = Number(priceEditValue)
    
    if (!Number.isFinite(newPrice) || newPrice < 0 || newPrice > 100) {
      alert('Il prezzo deve essere tra 0 e 100')
      return
    }

    setSubmittingKey(`price-${listingId}`)
    try {
      await inventoryAPI.updateListingPrice(listingId, newPrice)
      alert('Prezzo aggiornato con successo')
      setPriceEditingId(null)
      fetchListings()
    } catch (err) {
      alert(err.response?.data?.detail || 'Errore nell\'aggiornamento')
      console.error(err)
    } finally {
      setSubmittingKey(null)
    }
  }

  const startEditPrice = (listing) => {
    setPriceEditingId(listing.id)
    setPriceEditValue(listing.price)
  }

  return (
    <div className="inventory">
      <h1>📦 Il Mio Inventario</h1>

      <div className="inventory-tabs">
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventario
        </button>
        <button 
          className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          I Miei Annunci ({listings?.count || 0})
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Caricamento dati...</div>
      ) : (
        <>
          {activeTab === 'inventory' ? (
            // INVENTORY TAB
            <>
              <div className="inventory-summary">
                <div className="summary-card">
                  <div className="summary-label">Totale Item</div>
                  <div className="summary-value">
                    {inventory?.items?.length || 0}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Valore Totale</div>
                  <div className="summary-value highlight">
                    {inventory?.total_value?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {inventory?.items && inventory.items.length > 0 ? (
                <div className="inventory-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome Item</th>
                        <th>Quantità</th>
                        <th>Prezzo Unit.</th>
                        <th>Valore Totale</th>
                        <th>Metti Sul Mercato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.items.map((item) => {
                        const input = getRowInput(item)
                        return (
                        <tr key={item.item_id}>
                          <td className="item-name">{item.item_name}</td>
                          <td className="quantity">{item.quantity}</td>
                          <td className="price">{item.unit_price.toFixed(2)}</td>
                          <td className="total-value">{item.total_value.toFixed(2)}</td>
                          <td>
                            <div className="list-controls">
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={input.quantity}
                                onChange={(e) => updateRowInput(item.item_id, { quantity: e.target.value })}
                                className="small-input"
                                title="Quantita"
                              />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={input.price}
                                onChange={(e) => updateRowInput(item.item_id, { price: e.target.value })}
                                className="small-input"
                                title="Prezzo"
                              />
                              <button
                                className="list-btn sale"
                                onClick={() => handleList(item)}
                                disabled={submittingKey === `${item.item_id}-sale`}
                              >
                                {submittingKey === `${item.item_id}-sale` ? '...' : 'Vendi'}
                              </button>
                              <button
                                className="list-btn auction"
                                onClick={() => openAuctionModal(item)}
                                disabled={submittingKey === `${item.item_id}-auction`}
                              >
                                {submittingKey === `${item.item_id}-auction` ? '...' : 'Asta'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-inventory">
                  <p>📭 Il tuo inventario è vuoto</p>
                  <a href="/shop" className="shop-link">
                    Vai allo Shop →
                  </a>
                </div>
              )}
            </>
          ) : (
            // LISTINGS TAB
            <>
              {listings?.listings && listings.listings.length > 0 ? (
                <div className="listings-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome Item</th>
                        <th>Quantità</th>
                        <th>Tipo</th>
                        <th>Prezzo</th>
                        <th>Pubblicato</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.listings.map((listing) => (
                        <tr key={listing.id}>
                          <td className="item-name">{listing.item_name}</td>
                          <td className="quantity">{listing.quantity}</td>
                          <td className="listing-type">
                            <span className={`type-badge ${listing.listing_type}`}>
                              {listing.listing_type === 'sale' ? '🛒 Vendita' : '🔨 Asta'}
                            </span>
                          </td>
                          <td className="price">
                            {priceEditingId === listing.id ? (
                              <div className="price-edit">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={priceEditValue}
                                  onChange={(e) => setPriceEditValue(e.target.value)}
                                  className="price-input"
                                />
                                <button
                                  className="edit-btn confirm"
                                  onClick={() => handleUpdatePrice(listing.id, listing)}
                                  disabled={submittingKey === `price-${listing.id}`}
                                >
                                  ✓
                                </button>
                                <button
                                  className="edit-btn cancel"
                                  onClick={() => setPriceEditingId(null)}
                                  disabled={submittingKey === `price-${listing.id}`}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <span>{listing.price.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="created-at">
                            {new Date(listing.created_at).toLocaleDateString('it-IT')}
                          </td>
                          <td className="actions">
                            {priceEditingId !== listing.id && (
                              <button
                                className="edit-price-btn"
                                onClick={() => startEditPrice(listing)}
                              >
                                ✏️ Modifica Prezzo
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-listings">
                  <p>📋 Nessun annuncio attivo</p>
                  <p className="hint">Metti item in vendita o asta dalla scheda Inventario</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {auctionModal.isOpen && auctionModal.item && (
        <div className="auction-modal-overlay" onClick={closeAuctionModal}>
          <div className="auction-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Crea Asta</h2>
            <p className="auction-modal-item">{auctionModal.item.item_name}</p>

            <div className="auction-modal-grid">
              <label>
                Quantita
                <input
                  type="number"
                  min="1"
                  max={auctionModal.item.quantity}
                  value={auctionModal.quantity}
                  onChange={(e) => handleAuctionModalChange({ quantity: e.target.value })}
                />
              </label>

              <label>
                Prezzo iniziale
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={auctionModal.price}
                  onChange={(e) => handleAuctionModalChange({ price: e.target.value })}
                />
              </label>

              <label className="auction-modal-full-width">
                Data scadenza
                <input
                  type="datetime-local"
                  value={auctionModal.expiresAt}
                  onChange={(e) => handleAuctionModalChange({ expiresAt: e.target.value })}
                />
              </label>
            </div>

            <div className="auction-modal-actions">
              <button type="button" className="modal-btn secondary" onClick={closeAuctionModal}>
                Annulla
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleCreateAuction}
                disabled={submittingKey === `${auctionModal.item.item_id}-auction`}
              >
                {submittingKey === `${auctionModal.item.item_id}-auction` ? 'Pubblicazione...' : 'Pubblica Asta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory

