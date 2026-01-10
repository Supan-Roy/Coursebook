import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useTheme } from '../context/ThemeContext';

export default function MarkdownViewer({ content, className = '', isDarkMode: propIsDarkMode }) {
  const { isDarkMode: themeIsDarkMode } = useTheme();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : themeIsDarkMode;
  
  // Safety check for content
  if (!content || typeof content !== 'string') {
    return (
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        No content available.
      </div>
    );
  }
  
  const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const headingColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const subHeadingColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const codeBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
  const codeText = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => <h1 className={`text-2xl font-bold mt-6 mb-4 ${headingColor}`} {...props} />,
          h2: ({ node, ...props }) => <h2 className={`text-xl font-bold mt-5 mb-3 ${headingColor}`} {...props} />,
          h3: ({ node, ...props }) => <h3 className={`text-lg font-semibold mt-4 mb-2 ${subHeadingColor}`} {...props} />,
          p: ({ node, ...props }) => <p className={`mb-3 ${textColor} leading-relaxed`} {...props} />,
          ul: ({ node, ...props }) => <ul className={`list-disc list-inside mb-3 space-y-1 ${textColor}`} {...props} />,
          ol: ({ node, ...props }) => <ol className={`list-decimal list-inside mb-3 space-y-1 ${textColor}`} {...props} />,
          li: ({ node, ...props }) => <li className="ml-4" {...props} />,
          strong: ({ node, ...props }) => <strong className={`font-bold ${headingColor}`} {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          code: ({ node, inline, ...props }) => 
            inline ? (
              <code className={`${codeBg} px-1.5 py-0.5 rounded text-sm font-mono ${codeText}`} {...props} />
            ) : (
              <code className={`block ${codeBg} p-3 rounded mb-3 text-sm font-mono ${codeText} overflow-x-auto`} {...props} />
            ),
          blockquote: ({ node, ...props }) => <blockquote className={`border-l-4 ${borderColor} pl-4 italic my-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

