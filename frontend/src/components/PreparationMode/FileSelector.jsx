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

  const truncateFileName = (filename, maxLength = 25) => {
    if (filename.length <= maxLength) {
      return filename;
    }
    
    // Extract extension
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // No extension, just truncate
      return filename.substring(0, maxLength - 3) + '...';
    }
    
    const extension = filename.substring(lastDotIndex); // includes the dot
    const nameWithoutExt = filename.substring(0, lastDotIndex);
    
    // Calculate available space: maxLength - extension length - 3 (for "...")
    const availableSpace = maxLength - extension.length - 3;
    
    if (availableSpace <= 0) {
      // Extension is too long, just show extension
      return '...' + extension;
    }
    
    // Truncate name and add ellipsis + extension
    return nameWithoutExt.substring(0, availableSpace) + '...' + extension;
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
      <div className={`border-b p-3 sm:p-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <h3 className={`text-base sm:text-lg font-bold mb-2 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Select Study Materials
        </h3>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {fileTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setFilter(type.key)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
                filter === type.key
                  ? isDarkMode
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-sky-100 text-sky-600 border border-sky-300'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.icon} <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="divide-y" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {filteredMaterials.length === 0 ? (
          <div className={`p-4 sm:p-6 text-center text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No materials found
          </div>
        ) : (
          filteredMaterials.map(material => {
            const isSelected = selectedFiles.some(f => f.id === material.id);
            return (
              <div
                key={material.id}
                onClick={() => isSelected ? onDeselect(material.id) : onSelect(material)}
                className={`p-2.5 sm:p-3 md:p-4 cursor-pointer transition-all ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-sky-500/10'
                      : 'bg-sky-50'
                    : isDarkMode
                      ? 'hover:bg-gray-800/50'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Checkbox */}
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-sky-500 border-sky-500'
                        : isDarkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-xl md:text-2xl lg:text-3xl flex-shrink-0">{getFileIcon(material.filename)}</span>
                      <p className={`font-medium text-xs sm:text-sm md:text-base break-words ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={material.filename}>
                        <span className="hidden sm:inline line-clamp-1">{material.filename}</span>
                        <span className="sm:hidden">{truncateFileName(material.filename, 25)}</span>
                      </p>
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(material.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="text-sky-500 font-bold text-sm sm:text-base flex-shrink-0">✓</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={`border-t p-2.5 sm:p-3 md:p-4 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {selectedFiles.length} of {materials.length} materials selected
        </p>
      </div>
    </div>
  );
}
