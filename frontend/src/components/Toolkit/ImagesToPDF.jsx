import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { toolkitService } from '../../services';
import Toast from '../Toast';
import { FiUpload, FiX, FiImage, FiTrash2, FiCheck } from 'react-icons/fi';
import './ToolkitModal.css';

export default function ImagesToPDF({ onClose }) {
  const { isDarkMode } = useTheme();
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/tif'];
  const maxSize = 50 * 1024 * 1024; // 50MB per image

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFilesAdded = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const accepted = [];
    for (const file of incoming) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Unsupported format: ${file.name}`);
        setToast({ message: `Unsupported format: ${file.name}`, type: 'error' });
        continue;
      }
      if (file.size > maxSize) {
        setError(`${file.name} exceeds 50MB limit`);
        setToast({ message: `${file.name} exceeds 50MB limit`, type: 'error' });
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length) {
      setFiles((prev) => [...prev, ...accepted]);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleConvert = async () => {
    if (!files.length) {
      setError('Please add at least one image');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      await toolkitService.imagesToPDF(files);
      setToast({ message: 'Images converted to PDF successfully!', type: 'success' });
      setFiles([]);
    } catch (err) {
      console.error('Images to PDF error:', err);
      let errorMsg = 'Failed to convert images to PDF';

      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const data = JSON.parse(text);
          errorMsg = data.detail || errorMsg;
        } catch (parseErr) {
          // If parsing fails, keep default message
        }
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsConverting(false);
    }
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const moveFile = (fromIndex, toIndex) => {
    const newFiles = [...files];
    const [file] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, file);
    setFiles(newFiles);
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        isDarkMode ? 'bg-black/50' : 'bg-white/30'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl transform transition-all ${
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              <FiImage className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Images to PDF
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Combine multiple images into a PDF with edge-to-edge pages
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Dropzone */}
          <label
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDarkMode
                ? 'border-gray-700 hover:border-pink-500 hover:bg-pink-500/5'
                : 'border-gray-300 hover:border-pink-500 hover:bg-pink-50'
            } ${
              dragActive
                ? isDarkMode
                  ? 'border-pink-500 bg-pink-500/5'
                  : 'border-pink-500 bg-pink-50'
                : ''
            } ${
              files.length
                ? isDarkMode
                  ? 'bg-green-500/5 border-green-500/50'
                  : 'bg-green-50 border-green-300'
                : ''
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={isConverting}
              onChange={(e) => handleFilesAdded(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              {files.length ? (
                <>
                  <FiCheck className="w-12 h-12 text-green-500 mb-2" />
                  <p className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    {files.length} {files.length === 1 ? 'image selected' : 'images selected'}
                  </p>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total size: {formatBytes(totalSize)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFiles([]);
                    }}
                    className={`mt-3 text-sm font-medium ${
                      isDarkMode ? 'text-pink-300 hover:text-pink-200' : 'text-pink-600 hover:text-pink-700'
                    }`}
                  >
                    Clear selection
                  </button>
                </>
              ) : (
                <>
                  <FiUpload className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Drop images here or click to browse
                  </p>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Supported: JPG, PNG, WEBP, BMP, TIFF (50MB each)
                  </p>
                </>
              )}
            </div>
          </label>

          {/* Selected files */}
          {files.length > 0 && (
            <div className={`border rounded-xl p-4 ${isDarkMode ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Selected Images ({files.length})
                </h3>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatBytes(totalSize)} total
                </span>
              </div>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag to reorder images (top to bottom order)
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className={`file-item ${isDarkMode ? 'dark-mode' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('fromIndex', index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
                      if (fromIndex !== index) {
                        moveFile(fromIndex, index);
                      }
                    }}
                  >
                    <div className="file-item-drag-handle">⋮⋮</div>
                    <div className="file-item-info">
                      <span className="file-item-number">{index + 1}</span>
                      <div className="file-item-details">
                        <div className="file-item-name">{file.name}</div>
                        <div className="file-item-size">{formatBytes(file.size)}</div>
                      </div>
                    </div>
                    <button
                      className="file-item-remove"
                      onClick={() => removeFile(file.name)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                isDarkMode ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <FiX className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
                <p className="text-sm opacity-80">Ensure all images are supported and under 50MB each.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer - Fixed */}
        <div className={`flex items-center justify-end gap-3 p-4 sm:p-6 border-t flex-shrink-0 ${isDarkMode ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
            disabled={isConverting}
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={isConverting || !files.length}
            className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isConverting || !files.length
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white shadow-lg'
            }`}
          >
            {isConverting ? 'Converting...' : 'Convert to PDF'}
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
