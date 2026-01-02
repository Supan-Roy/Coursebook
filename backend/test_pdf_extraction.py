import re
from PyPDF2 import PdfReader

# Test extraction
with open('test_routine.pdf', 'rb') as f:
    reader = PdfReader(f)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    
    print("Extracted text:")
    print(text)
    print("\n" + "="*50 + "\n")
    
    # Test improved regex - avoid matching year patterns
    pattern = r'(?<![A-Z])\b([A-Z]{2,4})[\s-]?(\d{3,4})\b(?!\d)'
    matches = re.findall(pattern, text)
    print(f"Regex matches: {matches}")
    
    # Filter out year-like patterns
    courses = []
    seen = set()
    for match in matches:
        code = f"{match[0]}{match[1]}"
        # Skip if the first part is 4 letters (likely a year prefix like FALL)
        # or if code length suggests it's a year (4-digit number)
        if len(match[0]) <= 3 or (len(match[0]) == 4 and len(match[1]) == 3):
            if code not in seen:
                seen.add(code)
                courses.append(code)
    
    print(f"Filtered course codes: {courses}")

