import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function AboutPage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header
        className={`border-b sticky top-0 z-20 backdrop-blur-sm shadow bg-gradient-to-r transition-colors ${
          isDarkMode
            ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700'
            : 'from-gray-100 via-gray-200 to-gray-100 border-gray-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-16 gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0 overflow-hidden">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                title="Go to Dashboard"
              >
                <img src="/coursebook.svg" alt="Coursebook" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                <CoursebookTextLogo className="w-36 h-9 sm:w-28 sm:h-7 md:w-40 md:h-10 lg:w-48 lg:h-12 flex-shrink-0" isDarkMode={isDarkMode} showUnderline={false} />
              </button>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm md:text-base ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-900 border border-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`rounded-xl sm:rounded-2xl p-6 sm:p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About Coursebook</h1>
          <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your all-in-one academic companion</p>

          <div className={`space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Our Purpose</h2>
              <p className="leading-relaxed">
                Coursebook is designed to be your comprehensive academic management platform. We understand the challenges students face in organizing their coursework, managing study materials, and tracking their academic progress. Our mission is to simplify your academic journey by providing an intuitive, all-in-one solution that helps you stay organized and focused on what matters most—your education.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>What We Offer</h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Semester Management:</strong> Organize your courses by semester, create custom semester structures, and keep track of all your academic terms in one place. Semesters are automatically sorted with the latest additions appearing first.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Course Organization:</strong> Manage individual courses with detailed information, track course materials, and maintain a structured view of your academic curriculum. Each course folder keeps all your materials organized and easily accessible.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Study Materials:</strong> Upload, organize, and access your study materials seamlessly. Keep all your PDFs, documents, and files in one centralized location with support for multiple file formats. Share materials with others through secure shareable links.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>PDF Toolkit:</strong> Comprehensive suite of PDF tools including document-to-PDF conversion, merge multiple PDFs, split PDFs into separate files, compress PDFs to reduce file size, add page numbers, watermark PDFs with text or images, secure PDFs with passwords, unlock protected PDFs, convert images to PDF, and edit PDF content—all without leaving the platform.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>My Plans:</strong> Create and manage your academic and personal plans with our integrated todo system. Organize tasks by categories, set priorities, track progress, and receive notifications for due tasks. Perfect for managing assignments, projects, and personal goals.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Workspace:</strong> A dedicated workspace for organizing your academic work, managing projects, and keeping track of your study sessions. Access all your materials and tools in one convenient location.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Progress Tracking:</strong> Monitor your academic progress with detailed analytics and insights. Track your course completion, material usage, and study patterns to stay on top of your academic journey.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Preparation Mode:</strong> Generate detailed study notes and summaries from your course materials using AI-powered analysis. Create comprehensive study guides, extract key information, and prepare for exams more effectively.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Routine Upload:</strong> Automatically extract course information from your academic routine PDFs or images. Our intelligent system recognizes course codes, titles, and semester information, making semester setup effortless and error-free.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Recent Activity:</strong> Stay informed with a comprehensive activity feed that tracks all your interactions—file uploads, summary generation, quiz activities, and material management. Never lose track of what you've been working on.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>File Sharing:</strong> Share your course materials with classmates and colleagues through secure, shareable links. Control access permissions and track shared content easily.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Search Functionality:</strong> Quickly find courses, materials, and content across your entire academic library with our powerful search feature. Search by course code, title, or file name.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Dark Mode:</strong> Comfortable viewing experience with a beautiful dark mode option that reduces eye strain during late-night study sessions.
                </li>
                <li>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Mobile Responsive:</strong> Access Coursebook from any device with our fully responsive design. Whether you're on your phone, tablet, or desktop, the experience is optimized for your screen size.
                </li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Our Vision</h2>
              <p className="leading-relaxed">
                We envision a world where students can focus entirely on learning without the burden of managing scattered academic resources. Coursebook aims to be the go-to platform for students worldwide, providing a seamless, secure, and user-friendly experience that grows with your academic journey.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Privacy & Security</h2>
              <p className="leading-relaxed">
                Your data privacy and security are our top priorities. We implement industry-standard security measures to protect your academic information and ensure that your study materials remain private and secure. Learn more about our privacy practices in our <button onClick={() => navigate('/privacy-policy')} className={`underline hover:text-sky-400 transition-colors ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`}>Privacy Policy</button>.
              </p>
            </section>

            <section className={`pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Developed by</h2>
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img 
                      src="https://www.supanroy.com/Supan%20-%20Profile%20Main.jpg" 
                      alt="Supan Roy"
                      className="w-16 h-16 rounded-full object-cover border-2 border-sky-500/30"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className={`w-16 h-16 rounded-full hidden items-center justify-center text-2xl font-bold absolute top-0 left-0 ${isDarkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                      SR
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Supan Roy</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Aspiring Software Engineer</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a 
                      href="https://www.linkedin.com/in/supanroy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      LinkedIn: /supanroy
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a 
                      href="mailto:contact@supanroy.com" 
                      className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      contact@supanroy.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <a 
                      href="https://www.facebook.com/supan.being.roy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Facebook: supan.being.roy
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <a 
                      href="https://www.instagram.com/supan.being.roy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Instagram: supan.being.roy
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <a 
                      href="https://x.com/supanroy0" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      X (Twitter): /supanroy0
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

