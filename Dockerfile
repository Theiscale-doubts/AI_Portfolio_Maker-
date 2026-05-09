<<<<<<< HEAD
FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# 🔥 REQUIRED FOR PLAYWRIGHT
RUN playwright install --with-deps chromium

ENV PORT=10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
=======
FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# 🔥 REQUIRED FOR PLAYWRIGHT
RUN playwright install --with-deps chromium

ENV PORT=10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
>>>>>>> 2ec3945eefdcffb8449b915eb2ba5ff0f3bf9a09
