import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import FileSelector from './FileSelector';
import SummaryPanel from './SummaryPanel';
import QuizGenerator from './QuizGenerator';
import SavedSummaries from './SavedSummaries';

export default function PreparationMode({ materials, courseCode, courseId, onClose }) {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState(1); // 1: Select Files, 2: Choose Action
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null); // 'summary' or 'quiz'
  const [loadedSummary, setLoadedSummary] = useState(null);
  const [refreshSummaries, setRefreshSummaries] = useState(0);

  const handleSelectFile = (file) => {
    setSelectedFiles([...selectedFiles, file]);
  };

  const handleDeselectFile = (id) => {
    setSelectedFiles(selectedFiles.filter(f => f.id !== id));
  };

  const handleSave = (data) => {
    console.log('Saved:', data);
    alert('✅ ' + (data.type === 'summary' ? 'Summary saved!' : 'Quiz completed!'));
    setRefreshSummaries(r => r + 1);
    setStep(1);
    setSelectedFiles([]);
    setSelectedAction(null);
  };

  const handleLoadSummary = (summary) => {
    setLoadedSummary(summary);
    setSelectedAction('summary');
  };

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setLoadedSummary(null);
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? 'bg-black/50' : 'bg-white/50'}`} style={{ backdropFilter: 'blur(4px)' }}>
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl transition-colors ${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
          {/* Header */}
          <div className={`border-b p-6 flex justify-between items-center ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📚 Preparation Mode
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {courseCode} - Quick study & quiz
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Select Files */}
            {step === 1 && !selectedAction && (
              <div className="space-y-4">
                <FileSelector
                  materials={materials}
                  selectedFiles={selectedFiles}
                  onSelect={handleSelectFile}
                  onDeselect={handleDeselectFile}
                />
                {selectedFiles.length > 0 && (
                  <button
                    onClick={() => setStep(2)}
                    className="w-full px-6 py-3 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Choose Action */}
            {step === 2 && !selectedAction && (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-sky-500/10 border border-sky-500/30' : 'bg-sky-50 border border-sky-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                    📌 <strong>Selected:</strong> {selectedFiles.map(f => f.filename).join(', ')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Summary Option */}
                  <button
                    onClick={() => handleActionSelect('summary')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      isDarkMode
                        ? 'border-gray-700 bg-gray-800/50 hover:border-sky-500 hover:bg-sky-500/10'
                        : 'border-gray-300 bg-gray-50 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                  >
                    <div className="text-3xl mb-3">📝</div>
                    <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Summary & Notes
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Write a quick summary or notes based on the selected materials
                    </p>
                  </button>

                  {/* Quiz Option */}
                  <button
                    onClick={() => handleActionSelect('quiz')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      isDarkMode
                        ? 'border-gray-700 bg-gray-800/50 hover:border-sky-500 hover:bg-sky-500/10'
                        : 'border-gray-300 bg-gray-50 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                  >
                    <div className="text-3xl mb-3">✏️</div>
                    <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Quiz
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Generate and take a quiz based on the selected materials
                    </p>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedFiles([]);
                  }}
                  className={`w-full px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ← Back to Files
                </button>
              </div>
            )}

            {/* Summary Panel */}
            {selectedAction === 'summary' && (
              <div className="space-y-4">
                <SavedSummaries
                  courseId={courseId}
                  onLoadSummary={handleLoadSummary}
                  onRefresh={() => setRefreshSummaries(r => r + 1)}
                  key={refreshSummaries}
                />
                <SummaryPanel
                  courseId={courseId}
                  selectedFiles={selectedFiles}
                  onSave={handleSave}
                  loadedSummary={loadedSummary}
                />
                <button
                  onClick={() => setSelectedAction(null)}
                  className={`w-full px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ← Back
                </button>
              </div>
            )}

            {/* Quiz Generator */}
            {selectedAction === 'quiz' && (
              <div className="space-y-4">
                <QuizGenerator courseId={courseId} selectedFiles={selectedFiles} />
                <button
                  onClick={() => setSelectedAction(null)}
                  className={`w-full px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
