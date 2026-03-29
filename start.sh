#!/bin/bash

# ZeroMarket - Local Startup Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() { echo -e "${GREEN}OK:${NC} $1"; }
print_error() { echo -e "${RED}ERR:${NC} $1"; }
print_info() { echo -e "${YELLOW}INFO:${NC} $1"; }

print_header "ZeroMarket - Avvio Locale"

if ! command -v python3 >/dev/null 2>&1; then
    print_error "python3 non trovato"
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    print_error "node non trovato"
    exit 1
fi

print_success "Prerequisiti trovati"

# Clean up stale processes on common dev ports.
for port in 8000 5173 5174; do
    pids=$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_info "Libero porta $port"
        kill $pids >/dev/null 2>&1 || true
    fi
done
sleep 1

if [ ! -d "venv" ]; then
    print_info "Creazione virtualenv root: /venv"
    python3 -m venv venv
fi

source venv/bin/activate
cd backend
print_info "Install dipendenze backend"
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

print_info "Avvio backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

cd frontend
if [ ! -d "node_modules" ]; then
    print_info "Install dipendenze frontend"
    npm install
fi

print_info "Avvio frontend"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
cd ..

cleanup() {
    print_info "Stop servizi"
    kill "$BACKEND_PID" "$FRONTEND_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

print_success "Servizi avviati"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "Docs API: http://localhost:8000/docs"
echo ""
echo "Premi Ctrl+C per fermare tutto"

wait
