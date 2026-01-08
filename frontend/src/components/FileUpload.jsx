import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function FileUpload({ onUploadSuccess, courseId = null }) {
  const { isDarkMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleUpload = async (file) => {
    // Validate file type - accept PDF and images
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (PNG, JPG, JPEG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (courseId) {
        formData.append('course_id', courseId);
      }

      const response = await api.post('/materials/upload/', formData);
      const result = response.data;
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload file';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-sky-500 bg-sky-500/10'
            : isDarkMode
            ? 'border-gray-700 hover:border-gray-600'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={handleChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="pointer-events-none">
          {uploading ? (
            <>
              <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Uploading...
              </p>
            </>
          ) : (
            <>
              <svg
                className={`mx-auto h-12 w-12 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-sky-400 hover:text-sky-300">Click to upload</span> or drag and drop
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                PDF or Image files (PNG, JPG) • Max 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg p-3 bg-red-500/10 border-2 border-red-500">
          <p className="text-sm font-medium text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
