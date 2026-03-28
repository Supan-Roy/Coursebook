# Use Python 3.11 slim image
FROM python:3.11-slim

# Install system dependencies
# - Ghostscript: for PDF compression
# - Tesseract OCR: for text extraction from images
# - LibreOffice: for document conversion (Word, Excel, PowerPoint to PDF)
# - Pillow dependencies: for image processing (JPEG, PNG, etc.)
# - WeasyPrint dependencies: GTK+ libraries for HTML/CSS to PDF conversion
RUN apt-get update && apt-get install -y \
    ghostscript \
    tesseract-ocr \
    libtesseract-dev \
    libreoffice \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    libgobject-2.0-0 \
    libcairo2 \
    libpango-1.0-0 \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Add executable startup script
RUN chmod +x /app/start.sh

# Render provides PORT at runtime; 10000 is a common default for local container runs.
ENV PORT=10000

# Run migrations, collect static, and start Gunicorn
CMD ["/app/start.sh"]

