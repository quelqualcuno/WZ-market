# ZeroMarket

Piattaforma full-stack per marketplace virtuale in stile gaming.

## Panoramica (cosa include il progetto e qual e il suo obiettivo)

Il progetto include:
- autenticazione JWT
- shop con ricerca/ordinamento
- acquisto oggetti con controllo saldo e stock
- inventario utente
- listing diretti e aste
- UI React per dashboard, shop, inventario e aste

## Stack Tecnologico Reale (quali tecnologie usa davvero il progetto)

### Backend (parte server che gestisce API, dati e logica applicativa)

- Python 3.11+ (linguaggio principale usato per scrivere il backend)
- FastAPI 0.104.1 (framework che espone le API e gestisce le richieste HTTP)
- SQLAlchemy 2.0.23 (ORM usato per comunicare con il database in modo strutturato)
- Pydantic 2.5.0 + pydantic-settings 2.1.0 (validazione dei dati e gestione delle configurazioni)
- Uvicorn 0.24.0 (server ASGI che esegue l'app FastAPI)
- JWT: python-jose 3.3.0 (presente anche pyjwt 2.12.1) (crea e verifica i token di autenticazione)
- Password hashing: passlib[bcrypt] 1.7.4 + bcrypt 4.1.1 (protegge le password salvandole in forma cifrata)
- Database di default: SQLite (file backend/zeromarket.db) (database locale leggero usato per salvare i dati)

### Frontend (interfaccia web usata dall'utente per navigare e interagire)

- React 18 (libreria per costruire l'interfaccia utente)
- Vite 5 (tool di build e sviluppo rapido per il frontend)
- React Router DOM 6 (gestisce la navigazione tra le pagine)
- Axios (client HTTP usato per chiamare le API del backend)
- Recharts (libreria per grafici e visualizzazioni dei dati)

### Infrastruttura (strumenti e componenti per avvio, deploy e proxy)

- Script locale: start.sh (avvia backend e frontend in locale con un solo comando)
- Container: Docker + docker-compose (eseguono i servizi in ambienti isolati e coordinati)
- Reverse proxy: Caddy (Caddyfile) (inoltra il traffico verso backend e frontend e gestisce le richieste web)
- Frontend containerizzato servito con Nginx (serve i file statici del frontend dentro il container)

## Avvio Rapido (Locale) (come avviare tutto in modo veloce sul computer locale)

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

## Setup Manuale (passaggi separati per installare e avviare i servizi)

### 1) Backend (installazione e avvio del server e delle API)

```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2) Frontend (installazione e avvio dell'interfaccia web)

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Nota: in frontend/vite.config.js la porta default e 3000, ma con il comando sopra forzi 5173.

## Configurazione Ambiente (Backend) (variabili e impostazioni necessarie al server)

File: backend/.env

Variabili principali:
- API_V1_STR (default: /api/v1) (prefisso comune di tutte le route API)
- PROJECT_NAME (default: ZeroMarket) (nome mostrato dall'app e dalla documentazione automatica)
- DEBUG (default: true) (attiva log e comportamenti utili in sviluppo)
- ENVIRONMENT (default: development) (indica in che ambiente sta girando il backend)
- DATABASE_URL (default: sqlite:///./zeromarket.db) (stringa di connessione al database usato dall'app)
- SECRET_KEY (chiave segreta per firmare e proteggere i token JWT)
- ALGORITHM (default: HS256) (algoritmo usato per firmare i token JWT)
- ACCESS_TOKEN_EXPIRE_MINUTES (default: 30) (durata del token di accesso prima della scadenza)

## API Base URL (indirizzo base da usare per chiamare le API)

- Base: http://localhost:8000/api/v1

Endpoint principali:
- Auth: POST /auth/register, POST /auth/login, GET /auth/me
- Items: GET /items, GET /items/{item_id}, POST /items
- Orders: POST /orders, GET /orders/{order_id}
- Inventory: GET /inventory
- Listing: POST /inventory/list, GET /inventory/listings, PATCH /inventory/listings/{listing_id}/price
- Aste: GET /inventory/auctions/active, POST /inventory/auctions/{listing_id}/bid, GET /inventory/auctions/{listing_id}/bids

## Seed Dati (script per popolare il database con dati iniziali)

Da backend con virtualenv attivo:

```bash
python scripts/seed_shop_items.py
python scripts/seed_wz_items.py
```

## Avvio con Docker (Stato Attuale) (come parte l'app tramite container)

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

## Incongruenze Note (Da Tenere a Mente) (differenze tra documentazione e configurazione reale)

1. docs/SETUP.md menziona PostgreSQL, ma la config reale di default e SQLite.
2. Caddyfile non e pronto out-of-the-box per localhost perche usa un dominio placeholder.
3. In requirements ci sono sia python-jose sia pyjwt: non e necessariamente un errore, ma puo creare confusione in manutenzione.

## Struttura Progetto (mappa delle cartelle e dei file principali)

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