# ZeroMarket

Piattaforma web full-stack per marketplace virtuale in stile gaming, con backend FastAPI + SQLAlchemy e frontend React + Vite.

## Stato Attuale

- Backend API con autenticazione JWT e sessione utente persistente.
- Shop con lista oggetti, ricerca, ordinamento e dettaglio item.
- Flusso acquisto con controllo saldo, stock e creazione ordini.
- Inventario utente con valore totale e listing oggetti.
- Sistema aste: pubblicazione aste, offerte e visualizzazione bid attuali.
- Frontend React con pagine dedicate a dashboard, shop, aste e inventario.

## Stack Tecnologico

### Backend

- FastAPI
- SQLAlchemy 2
- Pydantic v2
- JWT (python-jose)
- Passlib bcrypt
- Uvicorn
- SQLite (default locale)

### Frontend

- React 18
- Vite
- React Router
- Axios
- Recharts

## Avvio Rapido

Dalla root del progetto:

```bash
chmod +x start.sh
./start.sh
```

Servizi disponibili:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Setup Manuale

### 1) Backend

```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Configurazione Ambiente

Parametri principali backend (file .env in cartella backend):

- DATABASE_URL (default: sqlite:///./zeromarket.db)
- SECRET_KEY
- ALGORITHM (default: HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES (usato come base config)
- API_V1_STR (default: /api/v1)

Nota: in login il token viene emesso con durata impostata a 7 giorni nel codice attuale.

## Struttura Progetto

```text
WZ-market/
	backend/
		main.py
		requirements.txt
		app/
			api/
			core/
			db/
			models/
			schemas/
		scripts/
			seed_shop_items.py
			seed_wz_items.py
	frontend/
		package.json
		vite.config.js
		src/
			App.jsx
			services/api.js
			pages/
			components/
	docs/
		API.md
		SETUP.md
	start.sh
```

## Funzionalita Implementate

### Autenticazione

- Registrazione utente.
- Login con JWT bearer token.
- Endpoint profilo corrente (/auth/me) per restore sessione frontend.

### Shop e Ordini

- Lista item con paginazione, ricerca e sorting.
- Dettaglio item.
- Acquisto item con validazione saldo e disponibilita copie.
- Riduzione saldo utente e aggiornamento inventario dopo acquisto.

### Inventario e Market Listing

- Visualizzazione inventario personale e valore totale.
- Messa in vendita diretta o in asta da inventario.
- Visualizzazione listing attivi utente.
- Aggiornamento prezzo listing attivi.

### Aste

- Elenco aste attive pubbliche.
- Piazzamento offerte con regole minime (no self-bid, importo crescente).
- Visualizzazione storico offerte e highest bid di una specifica asta.

## Endpoint Principali

Base API:

```text
http://localhost:8000/api/v1
```

### Auth

- POST /auth/register
- POST /auth/login
- GET /auth/me

### Items

- GET /items
- GET /items/{item_id}
- POST /items

### Orders

- POST /orders
- GET /orders/{order_id}

### Inventory / Listings / Auctions

- GET /inventory
- POST /inventory/list
- GET /inventory/listings
- PATCH /inventory/listings/{listing_id}/price
- GET /inventory/auctions/active
- POST /inventory/auctions/{listing_id}/bid
- GET /inventory/auctions/{listing_id}/bids

## Seed Dati e Utility

Da eseguire dalla cartella backend con virtualenv attivo:

```bash
python scripts/seed_shop_items.py
python scripts/seed_wz_items.py
```

Questi script creano/aggiornano categorie e oggetti di esempio per popolare lo shop.

## Note Operative

- Il DB di default e SQLite locale nella cartella backend.
- Se cambi modelli/schema backend, riavvia il server FastAPI.
- Se frontend e backend sono su host/porte diverse, controlla CORS in backend/main.py.
- In caso di porte occupate, start.sh prova a liberare 8000, 5173 e 5174 automaticamente.