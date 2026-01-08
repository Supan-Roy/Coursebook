import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function PrivacyPolicyPage() {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <img src="/coursebook.svg" alt="Coursebook" className="w-10 h-10" />
              <CoursebookTextLogo className="w-48 h-12" isDarkMode={isDarkMode} showUnderline={false} />
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-900 border border-gray-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`rounded-2xl p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Privacy Policy</h1>
          <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last updated: January 3, 2026</p>

          <div className={`space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1. Introduction</h2>
              <p className="leading-relaxed">
                Welcome to Coursebook. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit our 
                platform and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2. Information We Collect</h2>
              <p className="leading-relaxed mb-3">We may collect, use, store and transfer different kinds of personal data about you:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Identity Data:</strong> First name, last name, username or similar identifier</li>
                <li><strong>Contact Data:</strong> Email address and telephone numbers</li>
                <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting and location</li>
                <li><strong>Usage Data:</strong> Information about how you use our platform, courses, and materials</li>
                <li><strong>Content Data:</strong> Course materials, PDFs, and documents you upload to our platform</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To allow you to participate in interactive features of our service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4. Data Security</h2>
              <p className="leading-relaxed">
                We have put in place appropriate security measures to prevent your personal data from being accidentally 
                lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your 
                personal data to those employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5. Data Retention</h2>
              <p className="leading-relaxed">
                We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
                including for the purposes of satisfying any legal, accounting, or reporting requirements. When you delete 
                your account, we will delete or anonymize your personal data.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6. Your Legal Rights</h2>
              <p className="leading-relaxed mb-3">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
                <li>Right to withdraw consent</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7. Third-Party Links</h2>
              <p className="leading-relaxed">
                Our platform may include links to third-party websites, plug-ins and applications. Clicking on those links 
                or enabling those connections may allow third parties to collect or share data about you. We do not control 
                these third-party websites and are not responsible for their privacy statements.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className={`mt-3 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <p className="font-semibold">Email: contact@supanroy.com</p>
                <p>Developer: Supan Roy</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
