import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { preparationService } from '../../services';
import Toast from '../Toast';
import ConfirmDialog from '../ConfirmDialog';
import MarkdownViewer from '../MarkdownViewer';

export default function SummaryPanel({ courseId, selectedFiles, onSave, loadedSummary }) {
  const { isDarkMode } = useTheme();
  const [summary, setSummary] = useState('');
  const [savedSummaryId, setSavedSummaryId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load summary when one is selected from saved summaries
  useEffect(() => {
    if (loadedSummary) {
      setSummary(loadedSummary.content);
      setSavedSummaryId(loadedSummary.id);
    }
  }, [loadedSummary]);

  const handleSave = async () => {
    if (!summary.trim()) {
      setToast({ message: 'Please write notes first', type: 'error' });
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      let payload;
      if (savedSummaryId) {
        // Update existing summary
        payload = await preparationService.updateSummary(savedSummaryId, {
          content: summary,
        });
      } else {
        // Create new summary with material filenames in title
        const materialNames = selectedFiles.map(f => f.filename).join(', ');
        const summaryTitle = materialNames || 'Summary';
        
        payload = await preparationService.createSummary({
          course: courseId,
          materials: selectedFiles.map((f) => f.id),
          content: summary,
          title: summaryTitle,
        });
        setSavedSummaryId(payload.id);
      }
      onSave?.({ type: 'summary', content: summary, saved: payload });
    } catch (err) {
      console.error('Failed to save summary', err);
      setError('Failed to save summary. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!savedSummaryId) return;

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    setError('');

    try {
      await preparationService.deleteSummary(savedSummaryId);
      setSummary('');
      setSavedSummaryId(null);
      onSave?.({ type: 'summary_deleted', id: savedSummaryId });
    } catch (err) {
      console.error('Failed to delete summary', err);
      setError('Failed to delete summary. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one material');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await preparationService.generateSummary({
        course: courseId,
        materials: selectedFiles.map((f) => f.id),
      });

      if (!response || !response.summary) {
        throw new Error('No summary received from server');
      }

      setSummary(response.summary);
      // Reset saved ID when generating new summary
      // so it prompts to save as a new/updated version
    } catch (err) {
      console.error('Failed to generate summary', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate notes. Please try again.';
      setError(errorMsg);
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!summary.trim()) {
      setToast({ message: 'Please write or generate notes first', type: 'error' });
      return;
    }

    setIsDownloading(true);
    try {
      const materialNames = selectedFiles.map(f => f.filename).join(', ');
      await preparationService.downloadSummaryPdf({
        text: summary,
        title: `Notes - ${materialNames}`,
        courseCode: '',
      });
    } catch (err) {
      console.error('Failed to download PDF', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className={`p-2.5 sm:p-3 rounded-lg ${isDarkMode ? 'bg-sky-500/10 border border-sky-500/30' : 'bg-sky-50 border border-sky-200'}`}>
        <p className={`text-xs sm:text-sm break-words ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>
          📄 <strong>Materials:</strong> <span className="break-all">{selectedFiles.map((f) => f.filename).join(', ')}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label className={`block text-xs sm:text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Your Notes
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-1">
          <p className={`text-[10px] sm:text-xs flex-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            AI-generate detailed study notes from selected materials or write your own.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || selectedFiles.length === 0}
            className={`text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-md border transition-colors whitespace-nowrap flex-shrink-0 ${
              isGenerating || selectedFiles.length === 0
                ? isDarkMode
                  ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'border-sky-500 text-sky-300 hover:bg-sky-500/10'
                  : 'border-sky-400 text-sky-600 hover:bg-sky-50'
            }`}
          >
            {isGenerating ? 'Generating…' : 'Generate notes'}
          </button>
        </div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Write or generate detailed study notes here. Include key concepts, explanations, examples, and important points..."
          className={`w-full h-48 sm:h-56 md:h-64 p-3 sm:p-4 rounded-lg border transition-colors resize-none text-sm sm:text-base ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30'
          }`}
        />
        {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !summary.trim()}
          className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
            isSaving || !summary.trim()
              ? isDarkMode
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isDarkMode
                ? 'bg-sky-600 text-white hover:bg-sky-700'
                : 'bg-sky-500 text-white hover:bg-sky-600'
          }`}
        >
          {isSaving ? (
            <>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="hidden sm:inline">Saving...</span>
              <span className="sm:hidden">Saving</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V5" />
              </svg>
              <span className="hidden sm:inline">Save</span>
              <span className="sm:hidden">Save</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading || !summary.trim()}
          className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
            isDownloading || !summary.trim()
              ? isDarkMode
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isDarkMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {isDownloading ? (
            <>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="hidden sm:inline">Downloading...</span>
              <span className="sm:hidden">PDF...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
              <span className="sm:hidden">PDF</span>
            </>
          )}
        </button>

        {savedSummaryId && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-shrink-0 text-xs sm:text-sm ${
              isDeleting
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isDeleting ? (
              <>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      {savedSummaryId && (
        <div className={`p-2.5 sm:p-3 rounded-lg border flex items-center gap-2 ${
          isDarkMode
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-green-50 border-green-300'
        }`}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
            ✓ Summary Saved
          </p>
        </div>
      )}

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
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
