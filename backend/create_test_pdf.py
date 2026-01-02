#!/usr/bin/env python
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

# Create PDF content with course codes
pdf_buffer = io.BytesIO()
c = canvas.Canvas(pdf_buffer, pagesize=letter)

c.setFont("Helvetica", 14)
c.drawString(50, 750, "CLASS ROUTINE - FALL 2024")

c.setFont("Helvetica", 11)
y = 700
lines = [
    "Monday - Friday Schedule",
    "",
    "CSE101 - Introduction to Computer Science",
    "Monday & Wednesday 10:00 AM - 11:30 AM",
    "",
    "MATH201 - Calculus II",
    "Tuesday & Thursday 2:00 PM - 3:30 PM",
    "",
    "ENG102 - English Composition",
    "Monday & Wednesday 2:00 PM - 3:30 PM",
    "",
    "PHY203 - Physics Laboratory",
    "Friday 1:00 PM - 4:00 PM",
    "",
    "CSE220 - Data Structures",
    "Tuesday & Thursday 10:00 AM - 11:30 AM"
]

for line in lines:
    c.drawString(50, y, line)
    y -= 20

c.save()
pdf_buffer.seek(0)

with open('test_routine.pdf', 'wb') as f:
    f.write(pdf_buffer.getvalue())
    
print("Test PDF created: test_routine.pdf")
