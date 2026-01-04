import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toolkitService from '../../services/toolkitService';
import './ToolkitModal.css';

const SecurePDF = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('lock'); // 'lock' or 'unlock'
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSecurePDF = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (activeTab === 'lock') {
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      if (activeTab === 'lock') {
        await toolkitService.lockPDF(file, password);
      } else {
        await toolkitService.unlockPDF(file, password);
      }
      setFile(null);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Secure PDF error:', err);
      // Try to get error message from different response structures
      let errorMessage = '';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.statusText) {
        errorMessage = err.response.statusText;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = `Failed to ${activeTab} PDF`;
      }
      
      // Map backend error messages to user-friendly messages
      const errorMap = {
        'Incorrect password': 'Incorrect Password',
        'PDF is not encrypted': 'This document is not password protected',
        'Bad Request': activeTab === 'unlock' ? 'Incorrect Password' : 'Failed to lock PDF',
      };
      
      const displayError = errorMap[errorMessage] || errorMessage;
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="toolkit-modal-overlay" onClick={onClose}>
      <div className={`toolkit-modal-content ${isDarkMode ? 'dark-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Secure PDF</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Tab Switcher */}
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'lock' ? 'active' : ''}`}
              onClick={() => handleTabChange('lock')}
            >
              🔒 Lock PDF
            </button>
            <button
              className={`tab-btn ${activeTab === 'unlock' ? 'active' : ''}`}
              onClick={() => handleTabChange('unlock')}
            >
              🔓 Unlock PDF
            </button>
          </div>

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

          {/* Password Section */}
          <div className="config-section">
            <h3>{activeTab === 'lock' ? 'Set Password' : 'Enter Password'}</h3>

            {/* Password Input */}
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder={activeTab === 'lock' ? 'Enter password (min 4 characters)' : 'Enter password to unlock'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password (only for lock) */}
            {activeTab === 'lock' && (
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Info Message */}
            <div className={`info-message ${isDarkMode ? 'dark-mode' : ''}`}>
              <span className="info-icon">ℹ️</span>
              {activeTab === 'lock' 
                ? 'Your PDF will be encrypted with AES-256 encryption. Keep your password safe!'
                : 'Enter the password to remove encryption from your PDF.'}
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
            onClick={handleSecurePDF}
            disabled={!file || !password || isLoading || (activeTab === 'lock' && !confirmPassword)}
          >
            {isLoading 
              ? '⏳ Processing...' 
              : activeTab === 'lock' 
                ? '🔒 Lock PDF' 
                : '🔓 Unlock PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurePDF;
