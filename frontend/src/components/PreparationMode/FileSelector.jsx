import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function FileSelector({ materials, selectedFiles, onSelect, onDeselect }) {
  const { isDarkMode } = useTheme();
  const [filter, setFilter] = useState('all');

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt'].includes(ext)) return 'doc';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return 'image';
    if (['ppt', 'pptx'].includes(ext)) return 'presentation';
    if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
    return 'other';
  };

  const getFileIcon = (filename) => {
    const type = getFileType(filename);
    const icons = {
      pdf: '📕',
      doc: '📘',
      image: '🖼️',
      presentation: '📙',
      spreadsheet: '📗',
      other: '📄'
    };
    return icons[type];
  };

  const filteredMaterials = filter === 'all' 
    ? materials 
    : materials.filter(m => getFileType(m.filename) === filter);

  const fileTypes = [
    { key: 'all', label: 'All Files', icon: '📋' },
    { key: 'pdf', label: 'PDFs', icon: '📕' },
    { key: 'doc', label: 'Documents', icon: '📘' },
    { key: 'image', label: 'Images', icon: '🖼️' },
  ];

  return (
    <div className={`rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className={`border-b p-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Select Study Materials
        </h3>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {fileTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setFilter(type.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filter === type.key
                  ? isDarkMode
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-sky-100 text-sky-600 border border-sky-300'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="divide-y" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredMaterials.length === 0 ? (
          <div className={`p-6 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No materials found
          </div>
        ) : (
          filteredMaterials.map(material => {
            const isSelected = selectedFiles.some(f => f.id === material.id);
            return (
              <div
                key={material.id}
                onClick={() => isSelected ? onDeselect(material.id) : onSelect(material)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-sky-500/10'
                      : 'bg-sky-50'
                    : isDarkMode
                      ? 'hover:bg-gray-800/50'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-sky-500 border-sky-500'
                        : isDarkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileIcon(material.filename)}</span>
                      <p className={`font-medium line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {material.filename}
                      </p>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(material.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="text-sky-500 font-bold">✓</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={`border-t p-4 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {selectedFiles.length} of {materials.length} materials selected
        </p>
      </div>
    </div>
  );
}
