import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toolkitService from '../../services/toolkitService';
import './ToolkitModal.css';

const POSITIONS = [
  { value: 'top_left', label: 'Top Left' },
  { value: 'top_center', label: 'Top Center' },
  { value: 'top_right', label: 'Top Right' },
  { value: 'bottom_left', label: 'Bottom Left' },
  { value: 'bottom_center', label: 'Bottom Center' },
  { value: 'bottom_right', label: 'Bottom Right (Default)' },
];

const AddPageNumbers = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Configuration states
  const [position, setPosition] = useState('bottom_right');
  const [fontSize, setFontSize] = useState(10);
  const [color, setColor] = useState('#000000');
  const [startNumber, setStartNumber] = useState(1);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [previewText, setPreviewText] = useState('1');

  // Update preview text when inputs change
  React.useEffect(() => {
    setPreviewText(`${prefix}${startNumber}${suffix}`);
  }, [prefix, startNumber, suffix]);

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

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles[0]) {
      if (droppedFiles[0].type === 'application/pdf') {
        setFile(droppedFiles[0]);
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

  const handleAddPageNumbers = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await toolkitService.addPageNumbers(file, {
        position,
        font_size: fontSize,
        color: color.substring(1), // Remove # from hex
        start_number: startNumber,
        prefix,
        suffix,
      });
      setFile(null);
    } catch (err) {
      setError(err.message || 'Failed to add page numbers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="toolkit-modal-overlay" onClick={onClose}>
      <div className={`toolkit-modal-content ${isDarkMode ? 'dark-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Page Numbers to PDF</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* File Upload Section */}
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
                  <div className="file-size">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
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
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Configuration Section */}
          <div className="config-section">
            <h3>Page Number Configuration</h3>

            {/* Position */}
            <div className="form-group">
              <label>Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="form-control"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
              <div className="position-preview">
                <div className={`preview-box position-${position}`}>
                  <div className="preview-text" style={{ fontSize: `${fontSize * 0.8}px` }}>
                    {previewText}
                  </div>
                </div>
              </div>
            </div>

            {/* Font Size */}
            <div className="form-group form-row">
              <div className="form-col">
                <label>Font Size</label>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="form-control"
                />
                <div className="value-display">{fontSize}pt</div>
              </div>

              {/* Color */}
              <div className="form-col">
                <label>Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="form-control color-input"
                />
                <div className="color-display">{color}</div>
              </div>
            </div>

            {/* Start Number */}
            <div className="form-group">
              <label>Start Page Number</label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                className="form-control"
              />
            </div>

            {/* Prefix */}
            <div className="form-group">
              <label>Prefix (optional)</label>
              <input
                type="text"
                placeholder="e.g., Page "
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="form-control"
                maxLength="20"
              />
            </div>

            {/* Suffix */}
            <div className="form-group">
              <label>Suffix (optional)</label>
              <input
                type="text"
                placeholder="e.g., /100"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="form-control"
                maxLength="20"
              />
            </div>

            {/* Preview */}
            <div className="form-group">
              <label>Preview</label>
              <div className="preview-box-text">
                Page numbers will appear as: <strong>{previewText}</strong>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddPageNumbers}
            disabled={!file || isLoading}
          >
            {isLoading ? '⏳ Processing...' : '✓ Add Page Numbers'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPageNumbers;
