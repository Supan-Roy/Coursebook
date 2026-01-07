# Use Python 3.11 slim image
FROM python:3.11-slim

# Install system dependencies
# - Ghostscript: for PDF compression
# - Tesseract OCR: for text extraction from images
# - Pillow dependencies: for image processing (JPEG, PNG, etc.)
RUN apt-get update && apt-get install -y \
    ghostscript \
    tesseract-ocr \
    libtesseract-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000

