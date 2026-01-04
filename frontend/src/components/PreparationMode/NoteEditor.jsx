import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function NoteEditor({ initialContent = '', onSave, isDarkMode: propIsDarkMode }) {
  const { isDarkMode: contextIsDarkMode } = useTheme();
  const isDarkMode = propIsDarkMode ?? contextIsDarkMode;
  
  const [content, setContent] = useState(initialContent);
  const [highlights, setHighlights] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      setSelectedText(selection.toString());
    } else {
      setSelectedText('');
      setShowColorPicker(false);
    }
  };

  const highlightText = (color) => {
    if (!selectedText) return;

    const newHighlight = {
      id: Date.now(),
      text: selectedText,
      color,
      timestamp: new Date().toLocaleString()
    };

    setHighlights([...highlights, newHighlight]);
    setSelectedText('');
    setShowColorPicker(false);
  };

  const removeHighlight = (id) => {
    setHighlights(highlights.filter(h => h.id !== id));
  };

  const colors = [
    { name: 'Yellow', value: '#FBBF24', class: 'bg-yellow-300' },
    { name: 'Green', value: '#86EFAC', class: 'bg-green-300' },
    { name: 'Blue', value: '#93C5FD', class: 'bg-blue-300' },
    { name: 'Pink', value: '#F472B6', class: 'bg-pink-300' },
    { name: 'Purple', value: '#D8B4FE', class: 'bg-purple-300' },
  ];

  return (
    <div className={`rounded-lg border transition-colors overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Toolbar */}
      <div className={`border-b p-3 flex gap-2 flex-wrap ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
        <button
          onClick={() => setHighlights([])}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            isDarkMode
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Clear all highlights"
        >
          Clear Highlights
        </button>

        {selectedText && (
          <div className="flex gap-1 items-center ml-auto">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Highlight as:
            </span>
            <div className="flex gap-1">
              {colors.map(color => (
                <button
                  key={color.name}
                  onClick={() => highlightText(color.value)}
                  className={`w-6 h-6 rounded ${color.class} hover:scale-110 transition-transform`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => onSave(content, highlights)}
          className="ml-auto px-4 py-1.5 text-sm font-medium rounded bg-sky-500 text-white hover:bg-sky-600 transition-colors"
        >
          Save Notes
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Text Editor */}
        <div className="md:col-span-2 p-4 border-r" style={{ borderColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}>
          <div className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            📝 Notes & Annotations
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onMouseUp={handleMouseUp}
            placeholder="Type your notes here... Select text to highlight important sections."
            className={`w-full h-96 p-4 rounded border-2 resize-none focus:outline-none transition-colors font-mono text-sm ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-500'
            }`}
          />
        </div>

        {/* Highlights Sidebar */}
        <div className={`p-4 overflow-y-auto border-t md:border-t-0 md:border-l ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`} style={{ maxHeight: '450px' }}>
          <div className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            ⭐ Highlights ({highlights.length})
          </div>

          {highlights.length === 0 ? (
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Select text and highlight to organize important points
            </p>
          ) : (
            <div className="space-y-2">
              {highlights.map(highlight => (
                <div
                  key={highlight.id}
                  className={`p-2 rounded border-l-4 transition-all ${
                    isDarkMode ? 'bg-gray-800 border-opacity-50' : 'bg-white'
                  }`}
                  style={{ borderLeftColor: highlight.color }}
                >
                  <p className={`text-xs line-clamp-2 mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    "{highlight.text}"
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {highlight.timestamp}
                    </span>
                    <button
                      onClick={() => removeHighlight(highlight.id)}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        isDarkMode
                          ? 'text-red-400 hover:bg-red-500/20'
                          : 'text-red-600 hover:bg-red-100'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
