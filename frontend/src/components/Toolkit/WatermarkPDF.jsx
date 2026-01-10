import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { toolkitService } from '../../services';
import Toast from '../Toast';
import { FiUpload, FiX, FiType, FiCheck, FiMove } from 'react-icons/fi';
import { FaTint } from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';
import './ToolkitModal.css';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function WatermarkPDF({ onClose }) {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [watermarkType, setWatermarkType] = useState('text');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  // Text watermark settings
  const [text, setText] = useState('WATERMARK');
  const [fontName, setFontName] = useState('helvetica');
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState('#000000');
  const [textOpacity, setTextOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  
  // Image watermark settings
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState(null);
  const [imageWidth, setImageWidth] = useState(200);
  const [imageHeight, setImageHeight] = useState(200);
  const [imageOpacity, setImageOpacity] = useState(0.3);
  
  // Position and page settings
  const [xPosition, setXPosition] = useState(300);
  const [yPosition, setYPosition] = useState(400);
  const [applyToAll, setApplyToAll] = useState(true);
  const [pageNumber, setPageNumber] = useState('');
  
  // Canvas preview
  const canvasRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'se' | 'ne' | 'sw' | 'nw'
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [hoveredHandle, setHoveredHandle] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
      loadPDFPreview(droppedFile);
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
        loadPDFPreview(selectedFile);
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const loadPDFPreview = async (pdfFile) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      
      // Render first page
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      
      // Calculate scale to fit in preview area (max 600px width)
      const scale = Math.min(600 / viewport.width, 1);
      setCanvasScale(scale);
      
      const scaledViewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        const context = canvas.getContext('2d');
        await page.render({
          canvasContext: context,
          viewport: scaledViewport
        }).promise;
        
        // Draw watermark preview
        drawWatermarkPreview();
      }
    } catch (err) {
      console.error('Error loading PDF preview:', err);
      setError('Failed to load PDF preview');
    }
  };

  const drawWatermarkPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfDocument) return;
    
    const ctx = canvas.getContext('2d');
    
    // Redraw the PDF page first
    pdfDocument.getPage(1).then(page => {
      const scaledViewport = page.getViewport({ scale: canvasScale });
      page.render({
        canvasContext: ctx,
        viewport: scaledViewport
      }).promise.then(() => {
        // Now draw the watermark
        ctx.save();
        ctx.globalAlpha = watermarkType === 'text' ? textOpacity : imageOpacity;
        
        const scaledX = xPosition * canvasScale;
        const scaledY = canvas.height - (yPosition * canvasScale); // Flip Y coordinate
        
        if (watermarkType === 'text') {
          // Text watermark rendering with rotation-aware bounding box
          ctx.translate(scaledX, scaledY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.fillStyle = color;
          ctx.font = `${fontSize * canvasScale}px ${fontName}`;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(text, 0, 0);
          
          // Calculate text bounds using actual metrics (in screen space)
          const metrics = ctx.measureText(text);
          const ascent = metrics.actualBoundingBoxAscent || fontSize * canvasScale * 0.8;
          const descent = metrics.actualBoundingBoxDescent || fontSize * canvasScale * 0.2;
          const width = metrics.width || fontSize * canvasScale;
          const height = ascent + descent;
          // Draw handles in the current transformed space so they rotate with the text
          drawResizeHandles(ctx, 0, -ascent, width, height, true);
          ctx.restore();
        } else if (watermarkType === 'image' && watermarkImagePreview) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(
              img,
              scaledX,
              scaledY - imageHeight * canvasScale,
              imageWidth * canvasScale,
              imageHeight * canvasScale
            );
            
            // Draw bounding box and resize handles after image loads (no rotation for images)
            drawResizeHandles(
              ctx,
              scaledX,
              scaledY - imageHeight * canvasScale,
              imageWidth * canvasScale,
              imageHeight * canvasScale,
              false
            );
            ctx.restore();
          };
          img.src = watermarkImagePreview;
          return; // Exit early since img.onload will handle the rest
        } else {
          ctx.restore();
        }
      });
    });
  };
  
  const drawResizeHandles = (ctx, x, y, width, height, useCurrentTransform = false) => {
    // Draw semi-transparent bounding box with optional rotation awareness
    if (!useCurrentTransform) ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(x, y, width, height);
    
    // Draw resize handles at corners
    const handleSize = 8;
    const handles = [
      { x: x, y: y, pos: 'nw' },                           // top-left
      { x: x + width, y: y, pos: 'ne' },                   // top-right
      { x: x, y: y + height, pos: 'sw' },                  // bottom-left
      { x: x + width, y: y + height, pos: 'se' }          // bottom-right
    ];
    
    handles.forEach(handle => {
      ctx.fillStyle = hoveredHandle === handle.pos ? '#60a5fa' : '#3b82f6';
      ctx.globalAlpha = hoveredHandle === handle.pos ? 1 : 0.8;
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
    
    if (!useCurrentTransform) ctx.restore();
  };

  // Redraw preview when settings change
  useEffect(() => {
    if (pdfDocument) {
      drawWatermarkPreview();
    }
  }, [
    text, fontName, fontSize, color, textOpacity, rotation,
    watermarkImagePreview, imageWidth, imageHeight, imageOpacity,
    xPosition, yPosition, watermarkType, pdfDocument, canvasScale, hoveredHandle
  ]);

  const getHandleAtPosition = (mouseX, mouseY, canvas) => {
    const scaledX = xPosition * canvasScale;
    const scaledY = canvas.height - (yPosition * canvasScale);
    const handleSize = 12;
    let corners = [];

    if (watermarkType === 'text') {
      const ctx = canvas.getContext('2d');
      ctx.font = `${fontSize * canvasScale}px ${fontName}`;
      const metrics = ctx.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent || fontSize * canvasScale * 0.8;
      const descent = metrics.actualBoundingBoxDescent || fontSize * canvasScale * 0.2;
      const width = metrics.width;
      const height = ascent + descent;

      // Corners before rotation relative to baseline origin
      const preRotateCorners = [
        { x: 0, y: -ascent, pos: 'nw' },
        { x: width, y: -ascent, pos: 'ne' },
        { x: width, y: descent, pos: 'se' },
        { x: 0, y: descent, pos: 'sw' }
      ];

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      corners = preRotateCorners.map((c) => ({
        x: scaledX + c.x * cos - c.y * sin,
        y: scaledY + c.x * sin + c.y * cos,
        pos: c.pos
      }));
    } else {
      corners = [
        { x: scaledX, y: scaledY - imageHeight * canvasScale, pos: 'nw' },
        { x: scaledX + imageWidth * canvasScale, y: scaledY - imageHeight * canvasScale, pos: 'ne' },
        { x: scaledX + imageWidth * canvasScale, y: scaledY, pos: 'se' },
        { x: scaledX, y: scaledY, pos: 'sw' }
      ];
    }

    for (const handle of corners) {
      const distance = Math.sqrt(
        Math.pow(mouseX - handle.x, 2) + Math.pow(mouseY - handle.y, 2)
      );
      if (distance < handleSize) {
        return handle.pos;
      }
    }
    return null;
  };

  const getWatermarkPolygon = (canvas) => {
    const scaledX = xPosition * canvasScale;
    const scaledY = canvas.height - (yPosition * canvasScale);

    if (watermarkType === 'text') {
      const ctx = canvas.getContext('2d');
      ctx.font = `${fontSize * canvasScale}px ${fontName}`;
      const metrics = ctx.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent || fontSize * canvasScale * 0.8;
      const descent = metrics.actualBoundingBoxDescent || fontSize * canvasScale * 0.2;
      const width = metrics.width;
      const height = ascent + descent;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const corners = [
        { x: 0, y: -ascent },
        { x: width, y: -ascent },
        { x: width, y: descent },
        { x: 0, y: descent }
      ];

      return corners.map((c) => ({
        x: scaledX + c.x * cos - c.y * sin,
        y: scaledY + c.x * sin + c.y * cos
      }));
    }

    // Image (no rotation)
    return [
      { x: scaledX, y: scaledY - imageHeight * canvasScale },
      { x: scaledX + imageWidth * canvasScale, y: scaledY - imageHeight * canvasScale },
      { x: scaledX + imageWidth * canvasScale, y: scaledY },
      { x: scaledX, y: scaledY },
    ];
  };

  const pointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const getCanvasMouse = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x: mouseX, y: mouseY } = getCanvasMouse(e, canvas);
    
    // Check if clicking on a resize handle
    const handle = getHandleAtPosition(mouseX, mouseY, canvas);
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      return;
    }
    
    // Convert canvas coordinates to PDF coordinates
    const pdfX = mouseX / canvasScale;
    const pdfY = (canvas.height - mouseY) / canvasScale; // Flip Y

    // Hit test the watermark body via polygon (rotation-aware)
    const polygon = getWatermarkPolygon(canvas);
    const isInside = pointInPolygon({ x: mouseX, y: mouseY }, polygon);

    if (isInside) {
      setIsDragging(true);
      setDragOffset({
        x: pdfX - xPosition,
        y: pdfY - yPosition
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x: mouseX, y: mouseY } = getCanvasMouse(e, canvas);
    
    // Update hover state for handles
    if (!isDragging && !isResizing) {
      const handle = getHandleAtPosition(mouseX, mouseY, canvas);
      setHoveredHandle(handle);
      
      // Update cursor based on what's under the mouse
      if (handle) {
        if (handle === 'nw' || handle === 'se') {
          canvas.style.cursor = 'nwse-resize';
        } else {
          canvas.style.cursor = 'nesw-resize';
        }
      } else {
        // Polygon hit test for accurate hover on rotated text
        const polygon = getWatermarkPolygon(canvas);
        const inside = pointInPolygon({ x: mouseX, y: mouseY }, polygon);
        canvas.style.cursor = inside ? 'move' : 'default';
      }
    }
    
    if (isResizing) {
      const pdfX = mouseX / canvasScale;
      const pdfY = (canvas.height - mouseY) / canvasScale;
      
      if (watermarkType === 'text') {
        // For text, adjust font size based on resize
        const deltaX = Math.abs(pdfX - xPosition);
        const deltaY = Math.abs(pdfY - yPosition);
        const delta = Math.max(deltaX, deltaY);
        setFontSize(Math.max(10, Math.min(100, delta / 2)));
      } else {
        // For image, adjust dimensions
        if (resizeHandle === 'se' || resizeHandle === 'ne') {
          const newWidth = Math.abs(pdfX - xPosition);
          setImageWidth(Math.max(50, Math.min(500, newWidth)));
        }
        if (resizeHandle === 'se' || resizeHandle === 'sw') {
          const newHeight = Math.abs(pdfY - yPosition);
          setImageHeight(Math.max(50, Math.min(500, newHeight)));
        }
      }
    } else if (isDragging) {
      // Convert to PDF coordinates
      const pdfX = mouseX / canvasScale;
      const pdfY = (canvas.height - mouseY) / canvasScale;
      
      // Update position
      setXPosition(Math.max(0, Math.min(600, pdfX - dragOffset.x)));
      setYPosition(Math.max(0, Math.min(800, pdfY - dragOffset.y)));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handleImageSelect = (e) => {
    const selectedImage = e.target.files[0];
    if (selectedImage) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (validTypes.includes(selectedImage.type)) {
        setWatermarkImage(selectedImage);
        setError('');
        
        // Create preview URL for canvas rendering
        const reader = new FileReader();
        reader.onload = (e) => {
          setWatermarkImagePreview(e.target.result);
        };
        reader.readAsDataURL(selectedImage);
      } else {
        setError('Please select a valid image file (PNG, JPEG, GIF)');
      }
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    if (watermarkType === 'text' && !text.trim()) {
      setError('Please enter watermark text');
      return;
    }

    if (watermarkType === 'image' && !watermarkImage) {
      setError('Please select a watermark image');
      return;
    }

    if (!applyToAll && !pageNumber) {
      setError('Please specify a page number or select "Apply to all pages"');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const options = {
        type: watermarkType,
        applyToAll,
        pageNumber: !applyToAll && pageNumber ? parseInt(pageNumber) : null,
      };

      if (watermarkType === 'text') {
        options.text = text;
        options.fontName = fontName;
        options.fontSize = fontSize;
        options.color = color.replace('#', '');
        options.opacity = textOpacity;
        options.xPosition = xPosition;
        options.yPosition = yPosition;
        options.rotation = rotation;
      } else {
        options.image = watermarkImage;
        options.width = imageWidth;
        options.height = imageHeight;
        options.xPosition = xPosition;
        options.yPosition = yPosition;
        options.opacity = imageOpacity;
      }

      await toolkitService.watermarkPDF(file, options);
      setToast({ message: 'Watermark added successfully!', type: 'success' });
      
      // Reset form
      setTimeout(() => {
        setFile(null);
        setWatermarkImage(null);
      }, 2000);
    } catch (err) {
      console.error('Watermark error:', err);
      let errorMsg = 'Failed to add watermark';
      
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const data = JSON.parse(text);
          errorMsg = data.detail || errorMsg;
        } catch (parseErr) {
          // Keep default message
        }
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        isDarkMode ? 'bg-black/50' : 'bg-white/30'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl mx-4 rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div
          className={`flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0 ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
              <FaTint className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Watermark PDF
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Add text or image watermarks with custom positioning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* PDF Upload */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Upload PDF File
            </label>
            <label
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDarkMode
                  ? 'border-gray-700 hover:border-cyan-500 hover:bg-cyan-500/5'
                  : 'border-gray-300 hover:border-cyan-500 hover:bg-cyan-50'
              } ${dragActive ? (isDarkMode ? 'border-cyan-500 bg-cyan-500/5' : 'border-cyan-500 bg-cyan-50') : ''} ${
                file ? (isDarkMode ? 'bg-green-500/5 border-green-500/50' : 'bg-green-50 border-green-300') : ''
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                disabled={isProcessing}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <FiCheck className="w-12 h-12 text-green-500 mb-2" />
                    <p className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      {file.name}
                    </p>
                  </>
                ) : (
                  <>
                    <FiUpload className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Drop PDF here or click to browse
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Watermark Type Selector */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Watermark Type
            </label>
            <div className="tab-switcher">
              <button
                type="button"
                className={`tab-btn ${watermarkType === 'text' ? 'active' : ''}`}
                onClick={() => setWatermarkType('text')}
              >
                <FiType className="w-4 h-4 mr-2" />
                Text
              </button>
              <button
                type="button"
                className={`tab-btn ${watermarkType === 'image' ? 'active' : ''}`}
                onClick={() => setWatermarkType('image')}
              >
                <FaTint className="w-4 h-4 mr-2" />
                Image
              </button>
            </div>
          </div>

          {/* PDF Preview Canvas */}
          {file && (
            <div className="mb-4">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <FiMove className="inline w-4 h-4 mr-1" />
                Preview & Position (Drag to move, resize at corners)
              </label>
              <div className={`relative border-2 rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <canvas
                  ref={canvasRef}
                  className="w-full"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag the watermark to move it. Drag the blue corner handles to resize.
              </p>
            </div>
          )}

          {/* Text Watermark Settings */}
          {watermarkType === 'text' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter watermark text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Font Style
                  </label>
                  <select
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="helvetica">Helvetica</option>
                    <option value="helvetica-bold">Helvetica Bold</option>
                    <option value="times">Times Roman</option>
                    <option value="times-bold">Times Bold</option>
                    <option value="courier">Courier</option>
                    <option value="courier-bold">Courier Bold</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Font Size: {fontSize}pt
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Color
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 rounded-lg border"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Opacity: {textOpacity.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={textOpacity}
                    onChange={(e) => setTextOpacity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Image Watermark Settings */}
          {watermarkType === 'image' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Watermark Image
                </label>
                <label
                  className={`block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDarkMode
                      ? 'border-gray-700 hover:border-cyan-500 hover:bg-cyan-500/5'
                      : 'border-gray-300 hover:border-cyan-500 hover:bg-cyan-50'
                  } ${watermarkImage ? (isDarkMode ? 'bg-green-500/5 border-green-500/50' : 'bg-green-50 border-green-300') : ''}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {watermarkImage ? (
                    <p className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      {watermarkImage.name}
                    </p>
                  ) : (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Click to select image
                    </p>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Width: {imageWidth}px
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Height: {imageHeight}px
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={imageHeight}
                    onChange={(e) => setImageHeight(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Opacity: {imageOpacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={imageOpacity}
                  onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Position Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                X Position: {xPosition}px
              </label>
              <input
                type="range"
                min="0"
                max="600"
                value={xPosition}
                onChange={(e) => setXPosition(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Y Position: {yPosition}px
              </label>
              <input
                type="range"
                min="0"
                max="800"
                value={yPosition}
                onChange={(e) => setYPosition(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Page Application Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="applyToAll"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="applyToAll" className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Apply to all pages
              </label>
            </div>

            {!applyToAll && (
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Page Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  placeholder="Enter page number"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                isDarkMode ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <FiX className="w-5 h-5 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApplyWatermark}
            disabled={isProcessing || !file}
            className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
              isProcessing || !file
                ? 'bg-cyan-400/60 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-600'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Apply Watermark'}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3500}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
