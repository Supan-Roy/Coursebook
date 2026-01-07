import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toolkitService from '../../services/toolkitService';
import './ToolkitModal.css';

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
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
      <div className={`rounded-2xl p-8 w-full max-w-md max-h-screen overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Compress PDF
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl font-bold ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ×
          </button>
        </div>

        {/* Info Message */}
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
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
          className={`mb-6 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
            dragActive
              ? isDarkMode
                ? 'border-sky-400 bg-sky-400/10'
                : 'border-sky-400 bg-sky-50'
              : isDarkMode
              ? 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            id="file-input-compress"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="file-input-compress" className="cursor-pointer block">
            <div className={`text-4xl mb-2`}>📄</div>
            <p className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {file ? file.name : 'Drop PDF here or click to select'}
            </p>
            {!file && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Supports PDF files up to 50MB
              </p>
            )}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {compressionInfo && compressionInfo.success && (
          <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
              ✓ PDF compressed successfully! File is being downloaded...
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleCompress}
            disabled={!file || isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              !file || isLoading
                ? isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'bg-sky-500 text-white hover:bg-sky-600'
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
