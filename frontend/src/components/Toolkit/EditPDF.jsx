import { useEffect, useRef, useState } from 'react';
import { FiUpload, FiX, FiCheck, FiMove, FiEdit3, FiPenTool, FiTrash2, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { toolkitService } from '../../services';
import Toast from '../Toast';
import * as pdfjsLib from 'pdfjs-dist';
import './ToolkitModal.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function EditPDF({ onClose }) {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canvasScale, setCanvasScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [tool, setTool] = useState('text'); // text | highlight
  const [textValue, setTextValue] = useState('Note');
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#3b82f6');
  const [textOpacity, setTextOpacity] = useState(0.8);
  const [highlightColor, setHighlightColor] = useState('#f59e0b');
  const [highlightOpacity, setHighlightOpacity] = useState(0.25);

  const [annotations, setAnnotations] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [dragAnnotationOffset, setDragAnnotationOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

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
      setTotalPages(pdf.numPages);
      setPageNumber(1);
      await renderPage(pdf, 1, annotations);
    } catch (err) {
      console.error('Error loading PDF preview:', err);
      setError('Failed to load PDF preview');
    }
  };

  const renderPage = async (pdf, pageNum, annList) => {
    if (!pdf) return;
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(700 / viewport.width, 1.5);
      setCanvasScale(scale);
      const scaledViewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      drawAnnotations(ctx, scaledViewport.height, annList, scale, pageNum);
    } catch (err) {
      console.error('Render error:', err);
      setError('Failed to render page');
    }
  };

  const drawAnnotations = (ctx, pageHeight, annList, scale, pageNum) => {
    if (!ctx) return;
    annList
      .filter((a) => a.page === pageNum)
      .forEach((ann) => {
        ctx.save();
        const isSelected = selectedAnnotation?.id === ann.id;
        
        if (ann.type === 'highlight') {
          ctx.globalAlpha = ann.opacity;
          ctx.fillStyle = ann.color;
          ctx.fillRect(
            ann.x * scale,
            pageHeight - (ann.y + ann.height) * scale,
            ann.width * scale,
            ann.height * scale
          );
          // Draw selection border
          if (isSelected) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(
              ann.x * scale - 2,
              pageHeight - (ann.y + ann.height) * scale - 2,
              ann.width * scale + 4,
              ann.height * scale + 4
            );
            ctx.setLineDash([]);
          }
        } else if (ann.type === 'text') {
          ctx.globalAlpha = ann.opacity;
          ctx.fillStyle = ann.color;
          ctx.font = `${ann.fontSize * scale}px Helvetica`;
          ctx.fillText(ann.text, ann.x * scale, pageHeight - ann.y * scale);
          // Draw selection/hover border
          const textWidth = ann.text.length * ann.fontSize * 0.6 * scale;
          const textHeight = ann.fontSize * scale;
          ctx.strokeStyle = isSelected ? '#3b82f6' : '#60a5fa';
          ctx.globalAlpha = isSelected ? 1 : 0.5;
          ctx.lineWidth = isSelected ? 2 : 1;
          if (isSelected) ctx.setLineDash([5, 3]);
          ctx.strokeRect(ann.x * scale - 4, pageHeight - ann.y * scale - textHeight, textWidth + 8, textHeight + 8);
          ctx.setLineDash([]);
        }
        ctx.restore();
      });
  };

  const refreshPage = () => {
    if (pdfDocument) {
      renderPage(pdfDocument, pageNumber, annotations);
    }
  };

  const getCanvasMouse = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e) => {
    if (!pdfDocument) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasMouse(e);
    const pdfX = x / canvasScale;
    const pdfY = (canvas.height - y) / canvasScale;

    // Check if clicking on existing annotation
    const clickedAnn = annotations
      .filter(a => a.page === pageNumber)
      .reverse()
      .find(ann => {
        if (ann.type === 'text') {
          const textWidth = ann.text.length * ann.fontSize * 0.6;
          const textHeight = ann.fontSize;
          return pdfX >= ann.x - 0.2 && pdfX <= ann.x + textWidth + 0.2 &&
                 pdfY >= ann.y - 0.2 && pdfY <= ann.y + textHeight + 0.2;
        } else if (ann.type === 'highlight') {
          return pdfX >= ann.x && pdfX <= ann.x + ann.width &&
                 pdfY >= ann.y && pdfY <= ann.y + ann.height;
        }
        return false;
      });

    if (clickedAnn) {
      // Start dragging existing annotation
      setSelectedAnnotation(clickedAnn);
      setIsDraggingAnnotation(true);
      setDragAnnotationOffset({
        x: pdfX - clickedAnn.x,
        y: pdfY - clickedAnn.y
      });
    } else {
      // Create new annotation
      setSelectedAnnotation(null);
      if (tool === 'text') {
        const newAnn = {
          id: Date.now(),
          page: pageNumber,
          type: 'text',
          text: textValue || 'Note',
          fontSize,
          color: textColor,
          opacity: textOpacity,
          x: pdfX,
          y: pdfY,
        };
        const next = [...annotations, newAnn];
        setAnnotations(next);
        setSelectedAnnotation(newAnn);
        drawAnnotations(canvas.getContext('2d'), canvas.height, next, canvasScale, pageNumber);
      } else if (tool === 'highlight') {
        setIsDrawing(true);
        setDrawStart({ x, y, pdfX, pdfY });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingAnnotation || !selectedAnnotation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasMouse(e);
    const pdfX = x / canvasScale;
    const pdfY = (canvas.height - y) / canvasScale;

    const newX = pdfX - dragAnnotationOffset.x;
    const newY = pdfY - dragAnnotationOffset.y;

    const next = annotations.map(ann => 
      ann.id === selectedAnnotation.id
        ? { ...ann, x: newX, y: newY }
        : ann
    );
    setAnnotations(next);
    setSelectedAnnotation({ ...selectedAnnotation, x: newX, y: newY });
  };

  const handleCanvasMouseUp = (e) => {
    if (isDraggingAnnotation) {
      setIsDraggingAnnotation(false);
      return;
    }
    if (!isDrawing || tool !== 'highlight') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasMouse(e);
    const pdfX2 = x / canvasScale;
    const pdfY2 = (canvas.height - y) / canvasScale;
    const start = drawStart;
    const width = Math.abs(pdfX2 - start.pdfX) || 120;
    const height = Math.abs(pdfY2 - start.pdfY) || 32;
    const finalX = Math.min(pdfX2, start.pdfX);
    const finalY = Math.min(pdfY2, start.pdfY);

    const newAnn = {
      id: Date.now(),
      page: pageNumber,
      type: 'highlight',
      color: highlightColor,
      opacity: highlightOpacity,
      x: finalX,
      y: finalY,
      width,
      height,
    };
    const next = [...annotations, newAnn];
    setAnnotations(next);
    setIsDrawing(false);
    setDrawStart(null);
    drawAnnotations(canvas.getContext('2d'), canvas.height, next, canvasScale, pageNumber);
  };

  const handleRemove = (id) => {
    const next = annotations.filter((a) => a.id !== id);
    setAnnotations(next);
    refreshPage();
  };

  const handleSave = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    setIsProcessing(true);
    setError('');
    try {
      await toolkitService.editPDF(file, annotations);
      setToast({ message: 'Edited PDF downloaded', type: 'success' });
    } catch (err) {
      console.error('Edit PDF error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to edit PDF';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const goToPage = async (delta) => {
    const next = Math.min(Math.max(1, pageNumber + delta), totalPages);
    setPageNumber(next);
    if (pdfDocument) {
      await renderPage(pdfDocument, next, annotations);
    }
  };

  useEffect(() => {
    if (pdfDocument) {
      renderPage(pdfDocument, pageNumber, annotations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, pageNumber]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        isDarkMode ? 'bg-black/50' : 'bg-white/30'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-6xl mx-4 rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white">
              <FiEdit3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit PDF
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Add text notes or highlights directly on pages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isProcessing || !file}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isProcessing || !file
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              <FiDownload />
              {isProcessing ? 'Saving...' : 'Download Edited PDF'}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 96px)' }}>
          {/* Left controls */}
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Upload PDF File
              </label>
              <label
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDarkMode
                    ? 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/5'
                    : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                } ${dragActive ? (isDarkMode ? 'border-indigo-500 bg-indigo-500/5' : 'border-indigo-500 bg-indigo-50') : ''} ${
                  file ? (isDarkMode ? 'bg-green-500/5 border-green-500/50' : 'bg-green-50 border-green-300') : ''
                }`}
              >
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                <div className="flex flex-col items-center">
                  {file ? (
                    <>
                      <FiCheck className="w-10 h-10 text-green-500 mb-2" />
                      <p className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>{file.name}</p>
                    </>
                  ) : (
                    <>
                      <FiUpload className={`w-10 h-10 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Drop PDF here or click to browse
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${tool === 'text' ? 'bg-indigo-600 text-white border-indigo-600' : isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}
                  onClick={() => setTool('text')}
                >
                  <FiEdit3 /> Text
                </button>
                <button
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${tool === 'highlight' ? 'bg-amber-500 text-white border-amber-500' : isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}
                  onClick={() => setTool('highlight')}
                >
                  <FiPenTool /> Highlight
                </button>
              </div>

              {tool === 'text' ? (
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Text
                    </label>
                    <input
                      type="text"
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter text"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Font Size: {fontSize}pt
                    </label>
                    <input type="range" min="10" max="72" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Color</label>
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10 rounded-lg border" />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Opacity: {textOpacity.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={textOpacity}
                        onChange={(e) => setTextOpacity(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Highlight Color</label>
                      <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="w-full h-10 rounded-lg border" />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Opacity: {highlightOpacity.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={highlightOpacity}
                        onChange={(e) => setHighlightOpacity(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click and drag to draw a highlight box.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Annotations</h4>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{annotations.length} total</span>
              </div>
              <div className={`rounded-xl border ${isDarkMode ? 'border-gray-800 bg-gray-900/70' : 'border-gray-200 bg-gray-50'} max-h-48 overflow-y-auto custom-scrollbar`}>
                {annotations.length === 0 ? (
                  <p className={`text-sm p-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>No annotations yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-700/40">
                    {annotations.map((ann) => (
                      <li key={ann.id} className={`flex items-center justify-between px-3 py-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold">{ann.type === 'text' ? 'Text' : 'Highlight'} · Page {ann.page}</span>
                          {ann.type === 'text' ? <span className="text-gray-500">"{ann.text}"</span> : <span className="text-gray-500">{Math.round(ann.width)} x {Math.round(ann.height)}</span>}
                        </div>
                        <button
                          onClick={() => handleRemove(ann.id)}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                        >
                          <FiTrash2 />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          </div>

          {/* Canvas area */}
          <div className="lg:col-span-2">
            {file ? (
              <div className={`rounded-2xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} bg-black/5 p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => goToPage(-1)} disabled={pageNumber <= 1} className={`p-2 rounded-lg border ${pageNumber <= 1 ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}>
                      <FiChevronLeft />
                    </button>
                    <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
                      Page {pageNumber} / {totalPages}
                    </span>
                    <button onClick={() => goToPage(1)} disabled={pageNumber >= totalPages} className={`p-2 rounded-lg border ${pageNumber >= totalPages ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}>
                      <FiChevronRight />
                    </button>
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FiMove />
                    {tool === 'text' ? 'Click to place text' : 'Click-drag to highlight'}
                  </div>
                </div>
                <div className={`relative border-2 rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <canvas
                    ref={canvasRef}
                    className="w-full"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={() => {
                      setIsDraggingAnnotation(false);
                      setIsDrawing(false);
                    }}
                    style={{ 
                      display: 'block', 
                      maxWidth: '100%', 
                      height: 'auto', 
                      cursor: isDraggingAnnotation ? 'move' : (tool === 'highlight' ? 'crosshair' : 'text') 
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={`h-full min-h-[480px] rounded-2xl border-2 border-dashed flex items-center justify-center text-center ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-600'}`}>
                <div className="space-y-2">
                  <FiEdit3 className="w-10 h-10 mx-auto" />
                  <p className="font-semibold">Upload a PDF to start editing</p>
                  <p className="text-sm">Use the panel on the left to add text or highlights.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
