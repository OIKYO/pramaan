# Pramaan API for Render (Docker web service, root directory: backend/).
FROM python:3.12-slim

# Tesseract with English, Hindi and Bengali data for the second read of key numbers.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin tesseract-ocr-ben libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN useradd --create-home --uid 10001 pramaan
USER pramaan

# Render sets $PORT.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
