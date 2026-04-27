# ZeroMarket

Piattaforma full-stack per marketplace virtuale in stile gaming.

## Panoramica

Il progetto include:
- autenticazione JWT
- shop con ricerca/ordinamento
- acquisto oggetti con controllo saldo e stock
- inventario utente
- listing diretti e aste
- UI React per dashboard, shop, inventario e aste

## Stack Tecnologico Reale

### Backend

- Python 3.11+
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- Pydantic 2.5.0 + pydantic-settings 2.1.0
- Uvicorn 0.24.0
- JWT: python-jose 3.3.0 (presente anche pyjwt 2.12.1)
- Password hashing: passlib[bcrypt] 1.7.4 + bcrypt 4.1.1
- Database di default: SQLite (file backend/zeromarket.db)

### Frontend

- React 18
- Vite 5
- React Router DOM 6
- Axios
- Recharts

### Infrastruttura

- Script locale: start.sh
- Container: Docker + docker-compose
- Reverse proxy: Caddy (Caddyfile)
- Frontend containerizzato servito con Nginx

## Avvio Rapido (Locale)

Dalla root:

```bash
chmod +x start.sh
./start.sh
```

Servizi:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

Nota: lo script resta in foreground. Se chiudi terminale o premi Ctrl+C, esegue cleanup e spegne backend/frontend.

## Setup Manuale

### 1) Backend

```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Nota: in frontend/vite.config.js la porta default e 3000, ma con il comando sopra forzi 5173.

## Configurazione Ambiente (Backend)

File: backend/.env

Variabili principali:
- API_V1_STR (default: /api/v1)
- PROJECT_NAME (default: ZeroMarket)
- DEBUG (default: true)
- ENVIRONMENT (default: development)
- DATABASE_URL (default: sqlite:///./zeromarket.db)
- SECRET_KEY
- ALGORITHM (default: HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES (default: 30)

## API Base URL

- Base: http://localhost:8000/api/v1

Endpoint principali:
- Auth: POST /auth/register, POST /auth/login, GET /auth/me
- Items: GET /items, GET /items/{item_id}, POST /items
- Orders: POST /orders, GET /orders/{order_id}
- Inventory: GET /inventory
- Listing: POST /inventory/list, GET /inventory/listings, PATCH /inventory/listings/{listing_id}/price
- Aste: GET /inventory/auctions/active, POST /inventory/auctions/{listing_id}/bid, GET /inventory/auctions/{listing_id}/bids

## Seed Dati

Da backend con virtualenv attivo:

```bash
python scripts/seed_shop_items.py
python scripts/seed_wz_items.py
```

## Avvio con Docker (Stato Attuale)

Esiste una configurazione docker-compose con 3 servizi:
- backend
- frontend
- caddy

Comando:

```bash
docker compose up --build
```

Importante:
- nel compose sono pubblicate verso host solo le porte di caddy (80/443)
- backend/frontend non espongono porte host dirette
- Caddyfile usa ancora il placeholder tuo-dominio.com, quindi per uso locale va adattato

## Incongruenze Note (Da Tenere a Mente)

1. docs/SETUP.md menziona PostgreSQL, ma la config reale di default e SQLite.
2. Caddyfile non e pronto out-of-the-box per localhost perche usa un dominio placeholder.
3. In requirements ci sono sia python-jose sia pyjwt: non e necessariamente un errore, ma puo creare confusione in manutenzione.

## Struttura Progetto

```text
WZ-market/
	backend/
		app/
			api/
			core/
			db/
			models/
			schemas/
		scripts/
		main.py
		requirements.txt
	frontend/
		src/
		package.json
		vite.config.js
	docs/
		API.md
		SETUP.md
	Caddyfile
	docker-compose.yml
	start.sh
```