# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

# --- install python deps ---------------------------------------------------
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt \
 && pip install gunicorn psycopg2-binary

# --- copy source & entrypoint --------------------------------------------
COPY . .


CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]