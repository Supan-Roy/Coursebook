import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { materialService } from '../services';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';
import Toast from './Toast';

export default function TrashBin({ isOpen, onClose, onRestored }) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTrash();
    }
  }, [isOpen]);

  const loadTrash = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await materialService.getTrash();
      setItems(data);
    } catch (err) {
      console.error('Failed to load trash:', err);
      setError('Failed to load trash items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Material',
      message: 'Restore this material back to your course? It will return to its original folder.',
      onConfirm: async () => {
        try {
          await materialService.restore(id);
          setToast({ message: 'Material restored', type: 'success' });
          if (onRestored) onRestored();
          loadTrash();
        } catch (err) {
          console.error('Failed to restore material:', err);
          setAlertDialog({ isOpen: true, title: 'Restore Failed', message: 'Could not restore material. Please try again.', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handlePermanentDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Permanently',
      message: 'This will permanently remove the file from storage. Proceed?',
      onConfirm: async () => {
        try {
          await materialService.permanentDelete(id);
          setToast({ message: 'Deleted permanently', type: 'success' });
          loadTrash();
        } catch (err) {
          console.error('Failed to delete permanently:', err);
          setAlertDialog({ isOpen: true, title: 'Delete Failed', message: 'Could not delete this item. Please try again.', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleEmptyTrash = () => {
    if (items.length === 0) {
      setToast({ message: 'Trash is already empty', type: 'info' });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Empty Trash',
      message: 'Permanently delete all items in trash?',
      onConfirm: async () => {
        try {
          await materialService.emptyTrash();
          setToast({ message: 'Trash emptied', type: 'success' });
          loadTrash();
        } catch (err) {
          console.error('Failed to empty trash:', err);
          setAlertDialog({ isOpen: true, title: 'Empty Failed', message: 'Could not empty trash. Please try again.', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const daysSinceDeletion = (deletedAt) => {
    if (!deletedAt) return 0;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffMs = now - deletedDate;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysLeft = (deletedAt) => {
    const elapsed = daysSinceDeletion(deletedAt);
    const remaining = 30 - elapsed;
    return remaining < 0 ? 0 : remaining;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}>
          <div>
            <h2 className="text-xl font-bold">Trash Bin</h2>
            <p className="text-sm opacity-70">Items are auto-removed after 30 days</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEmptyTrash}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isDarkMode ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            >
              Empty Trash
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading && (
            <div className="text-center py-10 text-sm opacity-70">Loading trash...</div>
          )}

          {error && (
            <div className="rounded-lg border p-4 text-sm" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg font-semibold">Trash is empty</p>
              <p className="text-sm opacity-70">Deleted materials will appear here and auto-delete after 30 days</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 ${isDarkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.filename}</p>
                    <p className="text-xs opacity-70">Deleted {daysSinceDeletion(item.deleted_at)} day(s) ago • Auto-delete in {daysLeft(item.deleted_at)} day(s)</p>
                    <p className="text-xs opacity-70">Type: {item.content_type} • Size: {(item.size_bytes / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(item.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isDarkMode ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isDarkMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog {...confirmDialog} />
      <AlertDialog {...alertDialog} onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
