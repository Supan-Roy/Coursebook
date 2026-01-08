import { useState } from 'react';
import { sharingService } from '../services';

export default function ShareDialog({ isOpen, onClose, type, data, onSuccess, isDarkMode }) {
  const [privacy, setPrivacy] = useState('public');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const shareData = {
        share_type: type === 'semester' ? 'semester' : 'course',
        privacy: privacy,
        title: title.trim() || undefined,
      };

      if (type === 'semester') {
        shareData.semester_name = data.semester_name;
      } else if (type === 'course') {
        shareData.course_id = data.course_id;
      }

      await sharingService.create(shareData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl transition-colors ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Share {type === 'semester' ? 'Semester' : 'Course'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {type === 'semester' ? 'Semester' : 'Course'}
              </label>
              <input
                type="text"
                value={type === 'semester' ? data.semester_name : data.course_name}
                disabled
                className={`w-full px-4 py-2 text-sm border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Custom title for this share`}
                className={`w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

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
                <option value="public" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>Public - Anyone with the link</option>
                <option value="coursebook_users" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>Coursebook Users Only</option>
              </select>
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
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

