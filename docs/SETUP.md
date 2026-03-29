# ZeroMarket - Setup Locale

## Prerequisiti
- Python 3.11+
- Node.js 18+
- PostgreSQL 15 locale

## Avvio Rapido
```bash
cd /workspaces/WZ-market
./start.sh
```

## Endpoint
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Setup Manuale
### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### PostgreSQL
Configura un DB locale con:
- user: zeroadmin
- password: zeropass
- db: zerodb
- host: localhost
- port: 5432

## Troubleshooting
- `pg_isready -h localhost -p 5432` per verificare PostgreSQL
- Se una porta e' occupata, cambia porta in `uvicorn` o `npm run dev`
