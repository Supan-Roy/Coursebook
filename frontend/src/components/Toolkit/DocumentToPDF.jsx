import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { toolkitService } from '../../services';
import Toast from '../Toast';
import { FiUpload, FiDownload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { FaFileImport } from 'react-icons/fa';

export default function DocumentToPDF({ onClose }) {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [supportedFormats, setSupportedFormats] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadSupportedFormats();
  }, []);

  const loadSupportedFormats = async () => {
    try {
      const data = await toolkitService.getSupportedFormats();
      setSupportedFormats(data);
    } catch (err) {
      console.error('Failed to load supported formats:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        setToast({ message: 'File size exceeds 50MB limit', type: 'error' });
        return;
      }

      const ext = selectedFile.name.split('.').pop().toLowerCase();
      const supportedExts = supportedFormats
        ? Object.keys(supportedFormats.formats)
        : ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'png', 'jpg', 'jpeg'];

      if (!supportedExts.includes(ext)) {
        setError(`Unsupported file format: ${ext}`);
        setToast({ message: `Unsupported file format: ${ext}`, type: 'error' });
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file to convert');
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const pdfBlob = await toolkitService.documentToPDF(file);
      clearInterval(progressInterval);
      setProgress(100);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.split('.')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setToast({
        message: `Successfully converted ${file.name} to PDF!`,
        type: 'success',
      });

      // Reset after 2 seconds
      setTimeout(() => {
        setFile(null);
        setProgress(0);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Conversion error:', err);
      
      let errorMsg = 'Failed to convert document to PDF';
      
      // Handle blob error responses
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          errorMsg = errorData.detail || errorMsg;
        } catch (parseErr) {
          // If can't parse, use generic message
          console.error('Could not parse error response:', parseErr);
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 ${
        isDarkMode ? 'bg-black/50' : 'bg-white/30'
      }`}
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl transform transition-all ${
          isDarkMode
            ? 'bg-gray-900 border border-gray-800'
            : 'bg-white border border-gray-200'
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white flex-shrink-0">
              <FaFileImport className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Document to PDF
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Convert your documents to PDF format
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
          {/* Supported Formats */}
          <div>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Supported Formats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {supportedFormats ? (
                Object.entries(supportedFormats.formats).map(([ext, desc]) => (
                  <div
                    key={ext}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium text-center transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    .{ext.toUpperCase()}
                  </div>
                ))
              ) : (
                <div className={`col-span-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading supported formats...
                </div>
              )}
            </div>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Max file size: {supportedFormats ? `${supportedFormats.max_file_size_mb}MB` : 'Loading...'}
            </p>
          </div>

          {/* File Upload Area */}
          <div>
            <label
              className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDarkMode
                  ? 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/5'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              } ${file ? (isDarkMode ? 'bg-green-500/10 border-green-500/50' : 'bg-green-50 border-green-300') : ''}`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                disabled={isConverting}
                className="hidden"
                accept={supportedFormats ? Object.keys(supportedFormats.formats).map((ext) => `.${ext}`).join(',') : undefined}
              />
              <div className="flex flex-col items-center justify-center">
                {file ? (
                  <>
                    <FiCheck className="w-12 h-12 text-green-500 mb-2" />
                    <p className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {file.name}
                    </p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        setError(null);
                      }}
                      className={`mt-3 text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      Choose Different File
                    </button>
                  </>
                ) : (
                  <>
                    <FiUpload className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Drop your file here or click to browse
                    </p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Drag and drop your document to convert
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-red-500/10 border-red-500/50 text-red-400'
                  : 'bg-red-50 border-red-300 text-red-700'
              }`}
            >
              <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          {isConverting && progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Converting...
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {progress}%
                </p>
              </div>
              <div
                className={`w-full h-2 rounded-full overflow-hidden ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div
          className={`flex items-center justify-end gap-3 p-4 sm:p-6 border-t flex-shrink-0 ${
            isDarkMode ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
            disabled={isConverting}
          >
            Close
          </button>
          <button
            onClick={handleConvert}
            disabled={!file || isConverting}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              file && !isConverting
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                : `${isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
            }`}
          >
            {success ? (
              <>
                <FiCheck className="w-4 h-4" /> Converted!
              </>
            ) : isConverting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" /> Convert to PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
