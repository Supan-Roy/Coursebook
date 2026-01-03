# Tesseract OCR Setup Guide

This guide explains how to configure Tesseract OCR for course extraction from routine images.

## Installation

### Windows

1. **Download Tesseract Installer**
   - Visit: https://github.com/UB-Mannheim/tesseract/wiki
   - Download the latest Windows installer (e.g., `tesseract-ocr-w64-setup-v5.x.x.exe`)

2. **Install Tesseract**
   - Run the installer
   - During installation, note the installation path (usually `C:\Program Files\Tesseract-OCR`)
   - Complete the installation

3. **Verify Installation**
   - Open Command Prompt and run:
   ```bash
   tesseract --version
   ```
   - You should see the version information if installed correctly

### Linux

```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

### macOS

```bash
brew install tesseract
```

## Configuration for Django Project

The project automatically detects the Tesseract installation on Windows. However, if it's installed in a non-standard location, you can configure it:

### Option 1: Environment Variable (Recommended)

1. Open `.env` file in the backend directory
2. Add the TESSERACT_CMD variable:
   ```
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```
3. Adjust the path if Tesseract is installed elsewhere

### Option 2: Automatic Detection (Default)

If Tesseract is installed in the default Windows location (`C:\Program Files\Tesseract-OCR`), it will be automatically detected and used.

## Testing OCR Functionality

1. Start the Django backend server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Go to the dashboard and click "Upload Routine"

3. Upload a routine image (PNG, JPG) or PDF

4. The system will extract courses using OCR/PDF extraction

## Troubleshooting

### "TesseractNotFoundError"
- **Cause**: Tesseract is not installed or the path is incorrect
- **Solution**: 
  1. Verify Tesseract is installed: `tesseract --version`
  2. Check the installation path matches your system
  3. Update `TESSERACT_CMD` in `.env` if needed
  4. Restart the Django server after updating `.env`

### Poor OCR Recognition
- **Cause**: Image quality is low or text is at an angle
- **Solution**:
  1. Use clear, high-quality routine images
  2. Ensure text is horizontal and not rotated
  3. Use better lighting when taking screenshots
  4. PDF files typically have better recognition than images

### Slow Processing
- **Cause**: Large image files or low system resources
- **Solution**:
  1. Compress images before uploading (max 10MB)
  2. Use PDF format for faster processing
  3. Close other applications to free up system resources

## Supported File Formats

- **Images**: PNG, JPG, JPEG (with OCR)
- **PDF**: PDF files (with text extraction)

## How It Works

1. **Image Upload**: User uploads an image or PDF of the routine
2. **Text Extraction**: 
   - PDFs: Text is extracted using PyPDF2
   - Images: Text is extracted using Tesseract OCR
3. **Course Parsing**: Regular expressions parse the extracted text to identify course codes and names
4. **Course Creation**: Courses are automatically created in a new semester

## Requirements

- Python 3.8+
- Django 5.0.4+
- pytesseract 0.3.10+
- Tesseract OCR (system-level)
- Pillow 11.0.0+ (for image handling)
- PyPDF2 3.0.1+ (for PDF handling)
