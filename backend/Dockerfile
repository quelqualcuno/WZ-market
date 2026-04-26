# Usa un'immagine Python ufficiale leggera
FROM python:3.12-slim

# Imposta la directory di lavoro
WORKDIR /app

# Copia i requisiti e installa le dipendenze
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il resto del codice backend
COPY . .

# Espone la porta su cui gira FastAPI
EXPOSE 8000

# Comando per avviare l'app (assicurati che "main:app" corrisponda al tuo file main.py)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
