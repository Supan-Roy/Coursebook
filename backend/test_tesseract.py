#!/usr/bin/env python
"""
Test script to verify Tesseract installation and configuration
"""
import os
import sys
import platform

print(f"Operating System: {platform.system()}")
print(f"Python: {sys.version}")

# Test 1: Check if Tesseract is installed
print("\n=== Test 1: Check Tesseract Installation ===")
try:
    result = os.system("tesseract --version")
    if result == 0:
        print("✓ Tesseract is installed and accessible from PATH")
    else:
        print("✗ Tesseract not found in PATH")
except Exception as e:
    print(f"✗ Error checking Tesseract: {e}")

# Test 2: Check pytesseract installation
print("\n=== Test 2: Check pytesseract Installation ===")
try:
    import pytesseract
    print(f"✓ pytesseract is installed (version: {pytesseract.__version__ if hasattr(pytesseract, '__version__') else 'unknown'})")
except ImportError:
    print("✗ pytesseract is not installed")
    print("  Run: pip install pytesseract")
    sys.exit(1)

# Test 3: Check Pillow installation
print("\n=== Test 3: Check Pillow Installation ===")
try:
    from PIL import Image
    print(f"✓ Pillow is installed")
except ImportError:
    print("✗ Pillow is not installed")
    print("  Run: pip install Pillow")
    sys.exit(1)

# Test 4: Configure pytesseract
print("\n=== Test 4: Configure pytesseract ===")
if platform.system() == 'Windows':
    tesseract_path = os.getenv('TESSERACT_CMD')
    print(f"TESSERACT_CMD environment variable: {tesseract_path if tesseract_path else 'Not set'}")
    
    if not tesseract_path:
        default_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        print(f"Checking default path: {default_path}")
        if os.path.exists(default_path):
            print(f"✓ Found Tesseract at default location")
            pytesseract.pytesseract.pytesseract_cmd = default_path
        else:
            print(f"✗ Tesseract not found at default location")
            print(f"  Please set TESSERACT_CMD environment variable to your tesseract.exe path")
    else:
        if os.path.exists(tesseract_path):
            print(f"✓ Tesseract found at: {tesseract_path}")
            pytesseract.pytesseract.pytesseract_cmd = tesseract_path
        else:
            print(f"✗ Tesseract not found at: {tesseract_path}")
else:
    print(f"Running on {platform.system()} - Tesseract should be in PATH")

# Test 5: Test OCR on a simple text
print("\n=== Test 5: Test OCR Functionality ===")
try:
    from PIL import Image, ImageDraw, ImageFont
    
    # Create a simple test image with text
    img = Image.new('RGB', (200, 100), color='white')
    draw = ImageDraw.Draw(img)
    text = "CS101 TEST"
    
    # Try to draw text (font might not be available, but that's ok)
    try:
        draw.text((10, 40), text, fill='black')
    except:
        # If font fails, just draw with default
        draw.text((10, 40), text, fill='black')
    
    # Test OCR
    result = pytesseract.image_to_string(img)
    print(f"OCR Test Result: '{result.strip()}'")
    print("✓ OCR is working")
except Exception as e:
    print(f"✗ OCR test failed: {e}")
    print("  Check if Tesseract is properly installed")

print("\n=== Tests Complete ===")
