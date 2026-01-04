import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { preparationService } from '../../services';
import Toast from '../Toast';
import ConfirmDialog from '../ConfirmDialog';

export default function SavedSummaries({ courseId, onLoadSummary, onRefresh }) {
  const { isDarkMode } = useTheme();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSummaries();
  }, [courseId]);

  const loadSummaries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await preparationService.listSummaries(courseId);
      setSummaries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load summaries', err);
      setError('Failed to load summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSummary = (summary) => {
    setSelectedSummary(summary);
    onLoadSummary?.(summary);
  };

  const handleDelete = async (summaryId) => {
    setShowDeleteConfirm(summaryId);
  };

  const confirmDelete = async (summaryId) => {
    setShowDeleteConfirm(null);
    setDeleting(summaryId);
    try {
      await preparationService.deleteSummary(summaryId);
      setSummaries(summaries.filter(s => s.id !== summaryId));
      if (selectedSummary?.id === summaryId) {
        setSelectedSummary(null);
      }
      setToast({ message: 'Summary deleted successfully', type: 'success' });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete summary', err);
      setError('Failed to delete summary');
      setToast({ message: 'Failed to delete summary', type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  if (!summaries.length) {
    return (
      <div className={`p-4 rounded-lg border-2 text-center ${
        isDarkMode
          ? 'bg-gray-800/50 border-gray-700 text-gray-400'
          : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <p className="text-sm">No saved summaries yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          📚 Saved Summaries ({summaries.length})
        </h3>
        <button
          onClick={loadSummaries}
          disabled={loading}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isDarkMode
              ? 'text-sky-300 hover:bg-sky-500/10'
              : 'text-sky-600 hover:bg-sky-50'
          }`}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={`p-2 rounded text-sm ${
          isDarkMode
            ? 'bg-red-500/10 text-red-300 border border-red-500/30'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            onClick={() => handleLoadSummary(summary)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedSummary?.id === summary.id
                ? isDarkMode
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-sky-400 bg-sky-50'
                : isDarkMode
                  ? 'border-gray-700 bg-gray-800/50 hover:border-sky-500/50 hover:bg-gray-800'
                  : 'border-gray-200 bg-white hover:border-sky-400/50 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {summary.title}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {summary.word_count} words • {new Date(summary.created_at).toLocaleDateString()}
                </p>
                <p className={`text-xs mt-1 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {summary.content}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(summary.id);
                }}
                disabled={deleting === summary.id}
                className={`flex-shrink-0 p-1 rounded transition-colors ${
                  deleting === summary.id
                    ? isDarkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-400'
                    : isDarkMode
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-red-500 hover:bg-red-50'
                }`}
                title="Delete summary"
              >
                <svg className={`w-4 h-4 ${deleting === summary.id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {deleting === summary.id ? (
                    <>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Summary"
          message="Are you sure you want to delete this summary? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={() => confirmDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
