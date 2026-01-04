import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toolkitService from '../../services/toolkitService';
import './ToolkitModal.css';

export const SplitPDF = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [pageRange, setPageRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleClose = () => {
    setFile(null);
    setPageRange('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setError('');
      setPageRange('');
    } else {
      setError('Please upload a PDF file');
      setFile(null);
    }
  };

  const handlePageRangeChange = (e) => {
    setPageRange(e.target.value);
  };

  const handleSplit = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    if (!pageRange.trim()) {
      setError('Please specify page range');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await toolkitService.splitPDF(file, pageRange);
      setFile(null);
      setPageRange('');
    } catch (err) {
      setError(err.message || 'Failed to split PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="toolkit-modal-overlay" onClick={onClose}>
      <div className={`toolkit-modal-content ${isDarkMode ? 'dark-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Split PDF</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* File Upload */}
          <div className="upload-section">
            <label>Upload PDF File</label>
            <div
              className={`upload-area ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="file-preview">
                  <div className="file-icon">📄</div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
                  <button
                    className="remove-file-btn"
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="upload-icon">📤</div>
                  <div className="upload-text">
                    Drag and drop your PDF here
                    <br />
                    or
                  </div>
                  <label className="file-input-label">
                    Browse Files
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="file-input"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Page Range Input */}
          {file && (
            <div className="config-section">
              <h3>Page Range</h3>
              <div className="form-group">
                <label>Enter page numbers or ranges</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., 1-5,7,9-10"
                  value={pageRange}
                  onChange={handlePageRangeChange}
                  disabled={loading}
                />
                <div className="help-text">
                  Examples: 1-5, 7, 9-10 or 1,3,5
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSplit}
            disabled={loading || !file || !pageRange.trim()}
          >
            {loading ? '⏳ Extracting...' : '✂️ Extract Pages'}
          </button>
        </div>
      </div>
    </div>
  );
};
