"""
PDF export utility for summaries and study materials.
Converts Markdown directly to PDF using HTML as intermediate format.
This preserves formatting including math equations.
"""

import re
import base64
from io import BytesIO
from datetime import datetime

try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False

# Don't import weasyprint at module level - it requires system libraries that may not be available
# Import will be done lazily in the function when needed
WEASYPRINT_AVAILABLE = None

def _check_weasyprint():
    """Check if weasyprint is available, caching the result."""
    global WEASYPRINT_AVAILABLE
    if WEASYPRINT_AVAILABLE is not None:
        return WEASYPRINT_AVAILABLE
    try:
        # Try importing weasyprint - this may fail if system libraries (GTK+) are missing
        # Wrap in try-except to catch any import-time errors
        import sys
        import importlib.util
        
        # Use importlib to safely check if module can be imported
        spec = importlib.util.find_spec("weasyprint")
        if spec is None:
            WEASYPRINT_AVAILABLE = False
            return False
            
        # Try actual import
        from weasyprint import HTML, CSS
        WEASYPRINT_AVAILABLE = True
        return True
    except Exception as e:
        # Catch ALL exceptions including OSError, ImportError, etc.
        # weasyprint can fail in various ways on Windows if GTK+ libraries are missing
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"WeasyPrint not available: {type(e).__name__}: {e}")
        WEASYPRINT_AVAILABLE = False
        return False

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False


def generate_summary_pdf(summary_text: str, title: str = "Study Summary", course_code: str = "") -> BytesIO:
    """
    Generate a formatted PDF from Markdown summary text.
    
    Args:
        summary_text: The Markdown summary content
        title: PDF title/heading
        course_code: Optional course code for header
    
    Returns:
        BytesIO object containing PDF data (ready to serve as download)
    """
    if not MARKDOWN_AVAILABLE or not _check_weasyprint():
        # Fallback to basic PDF if libraries not available
        return _generate_basic_pdf(summary_text, title, course_code)
    
    # Convert Markdown to HTML, rendering math equations as images
    html_content = _markdown_to_html(summary_text, title, course_code)
    
    # Convert HTML to PDF
    pdf_buffer = BytesIO()
    
    # CSS for styling
    css_string = """
    @page {
        size: letter;
        margin: 1in 0.75in 0.75in 0.75in;
    }
    
    body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
        max-width: 100%;
    }
    
    h1 {
        font-size: 18pt;
        font-weight: bold;
        color: #1e3a8a;
        text-align: center;
        margin-bottom: 6pt;
    }
    
    .metadata {
        font-size: 10pt;
        color: #666;
        text-align: center;
        font-style: italic;
        margin-bottom: 12pt;
    }
    
    h2 {
        font-size: 14pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-top: 12pt;
        margin-bottom: 8pt;
    }
    
    h3 {
        font-size: 12pt;
        font-weight: bold;
        color: #2563eb;
        margin-top: 8pt;
        margin-bottom: 6pt;
    }
    
    p {
        margin-bottom: 8pt;
        text-align: justify;
    }
    
    ul, ol {
        margin-bottom: 8pt;
        padding-left: 20pt;
    }
    
    li {
        margin-bottom: 4pt;
    }
    
    strong {
        font-weight: bold;
        color: #1e3a8a;
    }
    
    em {
        font-style: italic;
    }
    
    code {
        font-family: 'Courier New', monospace;
        background-color: #f5f5f5;
        padding: 2pt 4pt;
        border-radius: 3pt;
        font-size: 10pt;
    }
    
    pre {
        background-color: #f5f5f5;
        padding: 8pt;
        border-radius: 4pt;
        overflow-x: auto;
        margin-bottom: 8pt;
    }
    
    pre code {
        background-color: transparent;
        padding: 0;
    }
    
    .math-block {
        text-align: center;
        margin: 12pt 0;
    }
    
    .math-inline {
        display: inline-block;
        vertical-align: middle;
    }
    
    .math-image {
        max-width: 100%;
        height: auto;
    }
    
    .footer {
        font-size: 8pt;
        color: #999;
        text-align: center;
        font-style: italic;
        margin-top: 20pt;
    }
    """
    
    try:
        # Import here to avoid crashing on module load if system libraries missing
        from weasyprint import HTML, CSS
        HTML(string=html_content).write_pdf(
            pdf_buffer,
            stylesheets=[CSS(string=css_string)]
        )
        pdf_buffer.seek(0)
        return pdf_buffer
    except Exception as e:
        print(f"Error generating PDF with weasyprint: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to basic PDF
        return _generate_basic_pdf(summary_text, title, course_code)


def _markdown_to_html(markdown_text: str, title: str, course_code: str) -> str:
    """Convert Markdown to HTML, rendering math equations as base64-encoded images."""
    
    # Process math equations first - replace them with image tags
    processed_text = _process_math_equations(markdown_text)
    
    # Convert Markdown to HTML
    # Use extensions that match frontend rendering
    md = markdown.Markdown(extensions=[
        'extra',      # Tables, fenced code blocks, etc.
        'codehilite', # Syntax highlighting
        'nl2br',      # Newline to break
        'fenced_code' # Fenced code blocks
    ])
    html_body = md.convert(processed_text)
    
    # Build complete HTML document
    timestamp = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    course_text = f"{course_code} • " if course_code else ""
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{title}</title>
    </head>
    <body>
        <h1>{title}</h1>
        <div class="metadata">{course_text}{timestamp}</div>
        {html_body}
        <div class="footer">Generated by Coursebook Preparation System</div>
    </body>
    </html>
    """
    
    return html


def _process_math_equations(text: str) -> str:
    """Replace LaTeX math equations with base64-encoded image tags."""
    
    # Process block math ($$...$$)
    def replace_block_math(match):
        math_content = match.group(1)
        img_tag = _render_math_to_img_tag(math_content, is_inline=False)
        return img_tag if img_tag else f'<div class="math-block">[Math: {math_content}]</div>'
    
    # Handle both single-line and multi-line block math
    text = re.sub(r'\$\$([^$]+?)\$\$', replace_block_math, text, flags=re.DOTALL)
    
    # Process inline math ($...$)
    def replace_inline_math(match):
        math_content = match.group(1)
        img_tag = _render_math_to_img_tag(math_content, is_inline=True)
        return img_tag if img_tag else f'<span class="math-inline">({math_content})</span>'
    
    text = re.sub(r'(?<!\$)\$([^$]+?)\$(?!\$)', replace_inline_math, text)
    
    return text


def _render_math_to_img_tag(latex_str: str, is_inline: bool = True) -> str:
    """Render LaTeX equation to base64-encoded image and return HTML img tag."""
    
    if not MATPLOTLIB_AVAILABLE:
        return None
    
    try:
        # Configure matplotlib for math rendering
        plt.rcParams['text.usetex'] = False
        plt.rcParams['mathtext.default'] = 'regular'
        plt.rcParams['mathtext.fontset'] = 'cm'
        
        # Clean up the LaTeX string
        latex_str = latex_str.strip().strip('$')
        
        # Create figure with appropriate size
        if is_inline:
            fig, ax = plt.subplots(figsize=(8, 0.5))
            fontsize = 14
        else:
            fig, ax = plt.subplots(figsize=(10, 1.2))
            fontsize = 18
        
        # Render the equation
        ax.text(0.5, 0.5, f'${latex_str}$',
                fontsize=fontsize,
                ha='center', va='center',
                transform=ax.transAxes,
                bbox=dict(boxstyle='round,pad=0.1', facecolor='white', edgecolor='none', alpha=0))
        ax.axis('off')
        
        # Save to BytesIO with higher DPI for better quality
        img_buffer = BytesIO()
        fig.savefig(img_buffer, format='png', bbox_inches='tight',
                   pad_inches=0.15, dpi=300, transparent=True, facecolor='white')
        img_buffer.seek(0)
        plt.close(fig)
        
        # Convert to base64
        img_data = img_buffer.getvalue()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        # Return HTML img tag
        css_class = 'math-inline' if is_inline else 'math-block'
        return f'<img src="data:image/png;base64,{img_base64}" class="{css_class} math-image" alt="Math equation" />'
        
    except Exception as e:
        print(f"Failed to render LaTeX '{latex_str}': {e}")
        import traceback
        traceback.print_exc()
        return None


def _generate_basic_pdf(summary_text: str, title: str, course_code: str) -> BytesIO:
    """Fallback PDF generation using ReportLab with proper Markdown parsing."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, KeepTogether
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=1 * inch,
        bottomMargin=0.75 * inch,
    )
    
    styles = getSampleStyleSheet()
    
    # Define styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor='#1e3a8a',
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor='#1e3a8a',
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold',
    )
    
    h3_style = ParagraphStyle(
        'H3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor='#2563eb',
        spaceAfter=6,
        spaceBefore=8,
        fontName='Helvetica-Bold',
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        leading=14,
        alignment=TA_LEFT,
        spaceAfter=6,
        fontName='Helvetica',
    )
    
    list_item_style = ParagraphStyle(
        'ListItem',
        parent=styles['BodyText'],
        fontSize=11,
        leading=14,
        leftIndent=20,
        bulletIndent=10,
        spaceAfter=4,
        fontName='Helvetica',
    )
    
    story = []
    story.append(Paragraph(title, title_style))
    
    timestamp = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    course_text = f"{course_code} • " if course_code else ""
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontSize=10,
        textColor='#666666',
        alignment=TA_CENTER,
        spaceAfter=12,
        fontName='Helvetica-Oblique',
    )
    story.append(Paragraph(f"{course_text}{timestamp}", meta_style))
    story.append(Spacer(1, 0.2 * inch))
    
    # Parse Markdown properly
    _parse_markdown_to_reportlab(summary_text, story, styles, h2_style, h3_style, body_style, list_item_style)
    
    # Footer
    story.append(Spacer(1, 0.3 * inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor='#999999',
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique',
    )
    story.append(Paragraph("Generated by Coursebook Preparation System", footer_style))
    
    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer


def _parse_markdown_to_reportlab(markdown_text: str, story: list, styles, h2_style, h3_style, body_style, list_item_style):
    """Parse Markdown and convert to ReportLab elements with math support."""
    from reportlab.lib.units import inch
    from reportlab.platypus import Spacer, Paragraph, Image, Table, TableStyle
    from reportlab.lib.enums import TA_CENTER
    from PIL import Image as PILImage
    
    lines = markdown_text.split('\n')
    in_list = False
    list_type = None
    i = 0
    
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Empty line
        if not line.strip():
            if in_list:
                in_list = False
                list_type = None
            story.append(Spacer(1, 0.1 * inch))
            i += 1
            continue
        
        # Headers
        if line.startswith('##'):
            if in_list:
                in_list = False
                list_type = None
            if line.startswith('## ') and not line.startswith('###'):
                header_text = line[3:].strip()
                header_text = _parse_inline_markdown_reportlab(header_text)
                story.append(Paragraph(header_text, h2_style))
                i += 1
                continue
            elif line.startswith('### '):
                header_text = line[4:].strip()
                header_text = _parse_inline_markdown_reportlab(header_text)
                story.append(Paragraph(header_text, h3_style))
                i += 1
                continue
        
        # Lists
        if re.match(r'^[-*]\s+', line):
            if not in_list or list_type != 'bullet':
                if in_list:
                    story.append(Spacer(1, 0.1 * inch))
                in_list = True
                list_type = 'bullet'
            list_text = re.sub(r'^[-*]\s+', '', line)
            list_text = _parse_inline_markdown_reportlab(list_text)
            story.append(Paragraph(f"• {list_text}", list_item_style))
            i += 1
            continue
        
        numbered_match = re.match(r'^(\d+)\.\s+', line)
        if numbered_match:
            if not in_list or list_type != 'numbered':
                if in_list:
                    story.append(Spacer(1, 0.1 * inch))
                in_list = True
                list_type = 'numbered'
            list_text = re.sub(r'^\d+\.\s+', '', line)
            list_text = _parse_inline_markdown_reportlab(list_text)
            number = numbered_match.group(1)
            story.append(Paragraph(f"{number}. {list_text}", list_item_style))
            i += 1
            continue
        
        # Block math ($$...$$)
        stripped_line = line.strip()
        if stripped_line.startswith('$$'):
            if stripped_line.endswith('$$') and len(stripped_line) > 4:
                math_content = stripped_line[2:-2].strip()
                math_image = _render_latex_to_reportlab_image(math_content, is_inline=False)
                if math_image:
                    story.append(Spacer(1, 0.15 * inch))
                    story.append(math_image)
                    story.append(Spacer(1, 0.15 * inch))
                else:
                    from reportlab.lib.styles import ParagraphStyle as RLParagraphStyle
                    math_style = RLParagraphStyle(
                        'Math',
                        parent=body_style,
                        fontSize=11,
                        alignment=TA_CENTER,
                        fontName='Courier',
                        textColor='#1e3a8a',
                    )
                    para_text = _parse_inline_markdown_reportlab(f"[Math: {math_content}]")
                    story.append(Paragraph(para_text, math_style))
                i += 1
                continue
        
        # Regular paragraph with inline math
        if in_list:
            in_list = False
            list_type = None
            story.append(Spacer(1, 0.1 * inch))
        
        para_elements = _parse_line_with_inline_math_reportlab(line, body_style, styles)
        story.extend(para_elements)
        i += 1


def _render_latex_to_reportlab_image(latex_str: str, is_inline: bool = True):
    """Render LaTeX to ReportLab Image flowable."""
    from reportlab.lib.units import inch as rl_inch
    from reportlab.platypus import Image as RLImage
    
    if not MATPLOTLIB_AVAILABLE:
        return None
    
    try:
        plt.rcParams['text.usetex'] = False
        plt.rcParams['mathtext.default'] = 'regular'
        plt.rcParams['mathtext.fontset'] = 'cm'
        
        latex_str = latex_str.strip().strip('$')
        
        if is_inline:
            fig, ax = plt.subplots(figsize=(10, 0.6))
            fontsize = 16
        else:
            fig, ax = plt.subplots(figsize=(12, 1.5))
            fontsize = 22
        
        ax.text(0.5, 0.5, f'${latex_str}$',
                fontsize=fontsize,
                ha='center', va='center',
                transform=ax.transAxes,
                bbox=dict(boxstyle='round,pad=0.1', facecolor='white', edgecolor='none', alpha=0))
        ax.axis('off')
        
        img_buffer = BytesIO()
        fig.savefig(img_buffer, format='png', bbox_inches='tight',
                   pad_inches=0.15, dpi=300, transparent=True, facecolor='white')
        img_buffer.seek(0)
        plt.close(fig)
        
        # Calculate dimensions
        from PIL import Image as PILImage
        pil_img = PILImage.open(img_buffer)
        img_width_px, img_height_px = pil_img.size
        img_buffer.seek(0)
        
        dpi = 300
        img_width_inches = img_width_px / dpi
        img_height_inches = img_height_px / dpi
        
        max_width_inches = 5 if not is_inline else 3.5
        scale_factor = min(max_width_inches / img_width_inches, 1.0)
        pdf_width = img_width_inches * scale_factor * rl_inch
        pdf_height = img_height_inches * scale_factor * rl_inch
        
        return RLImage(img_buffer, width=pdf_width, height=pdf_height)
    except Exception as e:
        print(f"Failed to render LaTeX '{latex_str}': {e}")
        return None


def _parse_line_with_inline_math_reportlab(line: str, body_style, styles):
    """Parse line with inline math for ReportLab."""
    from reportlab.platypus import Paragraph, Table, TableStyle
    from reportlab.lib.styles import ParagraphStyle as RLParagraphStyle
    
    math_pattern = r'(?<!\$)\$([^$]+?)\$(?!\$)'
    matches = list(re.finditer(math_pattern, line))
    
    if not matches:
        para_text = _parse_inline_markdown_reportlab(line)
        return [Paragraph(para_text, body_style)]
    
    table_data = []
    last_end = 0
    
    for match in matches:
        if match.start() > last_end:
            text_before = line[last_end:match.start()]
            if text_before.strip():
                para_text = _parse_inline_markdown_reportlab(text_before)
                table_data.append(Paragraph(para_text, body_style))
        
        math_content = match.group(1)
        math_image = _render_latex_to_reportlab_image(math_content, is_inline=True)
        if math_image:
            table_data.append(math_image)
        else:
            math_style = RLParagraphStyle(
                'InlineMath',
                parent=body_style,
                fontName='Courier',
                textColor='#1e3a8a',
            )
            para_text = _parse_inline_markdown_reportlab(f"({math_content})")
            table_data.append(Paragraph(para_text, math_style))
        
        last_end = match.end()
    
    if last_end < len(line):
        text_after = line[last_end:]
        if text_after.strip():
            para_text = _parse_inline_markdown_reportlab(text_after)
            table_data.append(Paragraph(para_text, body_style))
    
    if not table_data:
        para_text = _parse_inline_markdown_reportlab(line)
        return [Paragraph(para_text, body_style)]
    
    table = Table([table_data], colWidths=None)
    table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    
    return [table]


def _parse_inline_markdown_reportlab(text: str) -> str:
    """Convert inline Markdown to ReportLab HTML tags."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'__(.+?)__', r'<b>\1</b>', text)
    text = re.sub(r'(?<!\*)\*([^*$]+?)\*(?!\*)', r'<i>\1</i>', text)
    text = re.sub(r'(?<!_)_([^_$]+?)_(?!_)', r'<i>\1</i>', text)
    text = re.sub(r'`([^`]+?)`', r'<font name="Courier">\1</font>', text)
    
    return text
