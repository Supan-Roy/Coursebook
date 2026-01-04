import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toolkitService from '../../services/toolkitService';
import './ToolkitModal.css';

const MergePDFs = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

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

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        return false;
      }
      return true;
    });

    if (validFiles.length !== newFiles.length) {
      setError('Only PDF files are allowed');
    }

    const combined = [...files, ...validFiles].filter(
      (file, index, self) => self.findIndex((f) => f.name === file.name) === index
    );

    setFiles(combined);
  };

  const removeFile = (fileName) => {
    setFiles(files.filter((f) => f.name !== fileName));
    setError('');
  };

  const moveFile = (fromIndex, toIndex) => {
    const newFiles = [...files];
    const [file] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, file);
    setFiles(newFiles);
  };

  const handleMergePDFs = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await toolkitService.mergePDFs(files);
      setFiles([]);
    } catch (err) {
      setError(err.message || 'Failed to merge PDFs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="toolkit-modal-overlay" onClick={onClose}>
      <div className={`toolkit-modal-content ${isDarkMode ? 'dark-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Merge PDFs</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* File Upload Section */}
          <div className="upload-section">
            <label>Upload PDF Files</label>
            <div
              className={`upload-area ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-icon">📄</div>
              <div className="upload-text">
                Drag and drop PDF files here
                <br />
                or
              </div>
              <label className="file-input-label">
                Browse Files
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="file-input"
                />
              </label>
            </div>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="files-list-section">
              <h3>Files to Merge ({files.length})</h3>
              <p className="files-list-note">Drag to reorder files (top to bottom order)</p>
              <div className="files-list">
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
                        <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
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

          {/* Info Message */}
          {files.length > 0 && (
            <div className="info-message">
              <span>✓ Ready to merge {files.length} PDF file{files.length !== 1 ? 's' : ''}</span>
            </div>
          )}

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
            onClick={handleMergePDFs}
            disabled={files.length < 2 || isLoading}
          >
            {isLoading ? '⏳ Merging...' : '✓ Merge PDFs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergePDFs;
