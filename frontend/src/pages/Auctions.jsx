import { useState, useEffect } from 'react'
import { inventoryAPI } from '../services/api'
import './Auctions.css'

function Auctions() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, ending-soon
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [bids, setBids] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [biddingLoading, setBiddingLoading] = useState(false)

  useEffect(() => {
    fetchAuctions()
    // Refresh every 30 seconds to update countdown timers
    const interval = setInterval(fetchAuctions, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedAuction) {
      fetchBids(selectedAuction.id)
    }
  }, [selectedAuction])

  const fetchAuctions = async () => {
    setLoading(true)
    try {
      const response = await inventoryAPI.getActiveAuctions()
      setAuctions(response.data.listings || [])
      setError('')
    } catch (err) {
      setError('Errore nel caricamento delle aste')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBids = async (listingId) => {
    try {
      const response = await inventoryAPI.getAuctionBids(listingId)
      setBids(response.data)
    } catch (err) {
      console.error('Errore nel caricamento delle offerte', err)
    }
  }

  const handlePlaceBid = async (auctionId) => {
    const amount = Number(bidAmount)
    
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
      alert('L\'offerta deve essere tra 0 e 100')
      return
    }

    setBiddingLoading(true)
    try {
      const response = await inventoryAPI.placeBid(auctionId, amount)
      alert('Offerta piazzata con successo!')
      setBidAmount('')
      fetchBids(auctionId)
    } catch (err) {
      alert(err.response?.data?.detail || 'Errore nel piazzare l\'offerta')
      console.error(err)
    } finally {
      setBiddingLoading(false)
    }
  }

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'N/A'
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now
    
    if (diff <= 0) return 'Scaduta'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}g ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getTimeRemainingClass = (expiresAt) => {
    if (!expiresAt) return ''
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now
    const hours = diff / (1000 * 60 * 60)
    
    if (hours <= 1) return 'expiring-soon'
    if (hours <= 6) return 'expiring-soon-medium'
    return 'expiring-normal'
  }

  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'ending-soon') {
      const now = new Date()
      const expiry = new Date(auction.expires_at)
      const hours = (expiry - now) / (1000 * 60 * 60)
      return hours > 0 && hours <= 6
    }
    return true
  })

  if (selectedAuction) {
    return (
      <div className="auctions">
        <button className="back-btn" onClick={() => {
          setSelectedAuction(null)
          setBids(null)
          setBidAmount('')
        }}>
          ← Indietro
        </button>

        <div className="auction-detail">
          <h1>{selectedAuction.item_name}</h1>
          
          <div className="auction-info">
            <div className="info-card">
              <label>Prezzo di Partenza</label>
              <div className="value">{selectedAuction.price.toFixed(2)} 💰</div>
            </div>
            
            {bids && bids.highest_bid && (
              <div className="info-card">
                <label>Offerta Più Alta</label>
                <div className="value highlight">{bids.highest_bid.toFixed(2)} 💰</div>
                <div className="winning-bidder">{bids.current_winning_bidder}</div>
              </div>
            )}
            
            <div className="info-card">
              <label>Tempo Rimanente</label>
              <div className={`value ${getTimeRemainingClass(selectedAuction.expires_at)}`}>
                {getTimeRemaining(selectedAuction.expires_at)}
              </div>
            </div>

            <div className="info-card">
              <label>Quantità</label>
              <div className="value">×{selectedAuction.quantity}</div>
            </div>
          </div>

          <div className="bid-section">
            <h2>🎯 Fai un Offerta</h2>
            <div className="bid-form">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimo: ${(bids?.highest_bid || selectedAuction.price) + 0.01}`}
                className="bid-input"
              />
              <button
                className="bid-button"
                onClick={() => handlePlaceBid(selectedAuction.id)}
                disabled={biddingLoading}
              >
                {biddingLoading ? '...' : 'Offerta'}
              </button>
            </div>
          </div>

          <div className="bids-history">
            <h2>📋 Offerte Ricevute ({bids?.total_bids || 0})</h2>
            {bids && bids.bids.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Offerente</th>
                    <th>Importo</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.bids.map((bid) => (
                    <tr key={bid.id}>
                      <td>{bid.bidder_username}</td>
                      <td className="amount">{bid.amount.toFixed(2)} 💰</td>
                      <td className="date">
                        {new Date(bid.created_at).toLocaleDateString('it-IT')} 
                        {' '}{new Date(bid.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-bids">Nessuna offerta ancora</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auctions">
      <h1>🔨 Aste Attive</h1>

      <div className="auctions-header">
        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tutte ({auctions.length})
          </button>
          <button
            className={`filter-btn ${filter === 'ending-soon' ? 'active' : ''}`}
            onClick={() => setFilter('ending-soon')}
          >
            In Scadenza
          </button>
        </div>
        <button className="refresh-btn" onClick={fetchAuctions} disabled={loading}>
          🔄 Ricarica
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Caricamento aste...</div>
      ) : filteredAuctions.length > 0 ? (
        <div className="auctions-grid">
          {filteredAuctions.map((auction) => (
            <div
              key={auction.id}
              className="auction-card"
              onClick={() => setSelectedAuction(auction)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-header">
                <h3>{auction.item_name}</h3>
                <span className="quantity-badge">×{auction.quantity}</span>
              </div>

              <div className="card-body">
                <div className="price-section">
                  <span className="label">Prezzo Attuale</span>
                  <span className="price">{auction.price.toFixed(2)} 💰</span>
                </div>

                <div className={`time-remaining ${getTimeRemainingClass(auction.expires_at)}`}>
                  <span className="label">Tempo Rimanente</span>
                  <span className="time">{getTimeRemaining(auction.expires_at)}</span>
                </div>

                <div className="seller-info">
                  <span className="label">Numero Asta</span>
                  <span className="seller-id">#{auction.id}</span>
                </div>

                <div className="created-info">
                  <span className="created-date">
                    📅 {new Date(auction.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <button className="bid-btn">
                  🎯 Fai un Offerta
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-auctions">
          <p>📭 Nessuna asta attiva al momento</p>
          <p className="hint">Torna tra poco per scoprire nuove aste</p>
        </div>
      )}
    </div>
  )
}

export default Auctions
