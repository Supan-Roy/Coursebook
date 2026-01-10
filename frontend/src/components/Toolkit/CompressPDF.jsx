import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toolkitService from '../../services/toolkitService';
import { FaCompress } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

const CompressPDF = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);

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
    if (droppedFile) {
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please select a PDF file');
        setFile(null);
      }
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a PDF file');
        setFile(null);
      }
    }
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    setError('');
    setCompressionInfo(null);

    try {
      const originalSize = file.size;
      await toolkitService.compressPDF(file);
      
      // Note: The actual compressed size would be returned from the backend
      // For now, show a success message
      setCompressionInfo({
        originalSize: originalSize,
        success: true
      });
      
      // Reset form after successful compression
      setTimeout(() => {
        setFile(null);
        setCompressionInfo(null);
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to compress PDF';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 ${isDarkMode ? 'bg-black/50' : 'bg-white/30'}`} onClick={onClose}>
      <div className={`w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl transform transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
        {/* Header - Fixed */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
              <FaCompress className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Compress PDF
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Reduce file size while maintaining quality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Info Message */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Compress your PDF to reduce file size while maintaining quality.
            </p>
          </div>

          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition ${
              dragActive
                ? isDarkMode
                  ? 'border-sky-400 bg-sky-400/10'
                  : 'border-sky-400 bg-sky-50'
                : isDarkMode
                ? 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            } ${file ? (isDarkMode ? 'bg-green-500/10 border-green-500/50' : 'bg-green-50 border-green-300') : ''}`}
          >
            <input
              type="file"
              id="file-input-compress"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="file-input-compress" className="cursor-pointer block">
              {file ? (
                <>
                  <div className={`text-3xl sm:text-4xl mb-2`}>📄</div>
                  <p className={`font-semibold mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {file.name}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <div className={`text-3xl sm:text-4xl mb-2`}>📄</div>
                  <p className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Drop PDF here or click to select
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Supports PDF files up to 50MB
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-red-500/10 border-red-500/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <p className={`text-sm`}>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {compressionInfo && compressionInfo.success && (
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-green-500/10 border-green-500/50 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <p className={`text-sm`}>
                ✓ PDF compressed successfully! File is being downloaded...
              </p>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className={`flex items-center justify-end gap-3 p-4 sm:p-6 border-t flex-shrink-0 ${isDarkMode ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleCompress}
            disabled={!file || isLoading}
            className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              !file || isLoading
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg'
            }`}
          >
            {isLoading ? 'Compressing...' : 'Compress PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompressPDF;
