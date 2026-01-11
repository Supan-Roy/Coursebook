import { useState, useEffect } from 'react';
import { materialService } from '../services';
import { useTheme } from '../context/ThemeContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export default function MaterialPrivacyDialog({ isOpen, onClose, material, onSuccess, isDarkMode: propIsDarkMode }) {
  const { isDarkMode: themeIsDarkMode } = useTheme();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : themeIsDarkMode;
  
  const [privacy, setPrivacy] = useState('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (material && isOpen) {
      setPrivacy(material.privacy || 'private');
      setError('');
    }
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await materialService.updatePrivacy(material.id, privacy);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update privacy setting');
    } finally {
      setLoading(false);
    }
  };

  const getPrivacyLabel = (value) => {
    switch (value) {
      case 'private':
        return 'Private - Only me';
      case 'public':
        return 'Public - Anyone with the link';
      case 'coursebook_users':
        return 'Coursebook Users Only';
      default:
        return value;
    }
  };

  const handleCopyLink = async () => {
    const fileUrl = `${BACKEND_BASE_URL}/materials/files/${material.id}/`;
    try {
      await navigator.clipboard.writeText(fileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = fileUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (fallbackErr) {
        setError('Failed to copy link. Please copy manually.');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl transition-colors ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Share Settings
          </h2>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {material.filename}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Privacy
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className={`w-full px-4 py-3 text-sm border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? 'bg-gray-900/70 border-gray-600 text-white hover:border-gray-500 focus:border-sky-500'
                    : 'bg-white border-gray-400 text-gray-900 hover:border-gray-500 focus:border-sky-500'
                }`}
              >
                <option value="private" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
                  Private - Only me
                </option>
                <option value="public" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
                  Public - Anyone with the link
                </option>
                <option value="coursebook_users" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
                  Coursebook Users Only
                </option>
              </select>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {privacy === 'private' && 'Only you can access this file.'}
                {privacy === 'public' && 'Anyone with the link can access this file.'}
                {privacy === 'coursebook_users' && 'Only logged-in Coursebook users can access this file.'}
              </p>
            </div>

            {/* Copy Link Section */}
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    File Link
                  </p>
                  <p className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} title={`${BACKEND_BASE_URL}/materials/files/${material.id}/`}>
                    {BACKEND_BASE_URL}/materials/files/{material.id}/
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
                    linkCopied
                      ? isDarkMode
                        ? 'bg-green-600 text-white'
                        : 'bg-green-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className={`p-3 rounded-lg bg-red-500/10 border border-red-500`}>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Privacy'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

