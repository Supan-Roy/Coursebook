import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function TermsOfServicePage() {
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
        <div className={`rounded-2xl p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Terms of Service</h1>
          <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last updated: January 3, 2026</p>

          <div className={`space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Coursebook ("the Service"), you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service. 
                These Terms of Service constitute a legally binding agreement between you and Coursebook.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2. Description of Service</h2>
              <p className="leading-relaxed">
                Coursebook provides users with an academic organization platform that includes course management, 
                material storage, routine management, and related features. The service is designed to help students 
                organize their academic materials and manage their coursework efficiently.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3. User Accounts</h2>
              <p className="leading-relaxed mb-3">To use our service, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 13 years of age</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your password and identification</li>
                <li>Accept all risks of unauthorized access to your account and information</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="leading-relaxed mt-3">
                You are responsible for all activities that occur under your account. We reserve the right to refuse 
                service, terminate accounts, or remove or edit content at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4. User Content and Conduct</h2>
              <p className="leading-relaxed mb-3">You agree not to upload, post, or transmit any content that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violates any third party's copyrights or other rights</li>
                <li>Contains software viruses or any other malicious code</li>
                <li>Is unlawful, harmful, threatening, abusive, harassing, or defamatory</li>
                <li>Promotes illegal activity or violates the rights of others</li>
                <li>Impersonates any person or entity</li>
              </ul>
              <p className="leading-relaxed mt-3">
                You retain all rights to content you upload. However, by uploading content, you grant Coursebook a 
                license to store, display, and distribute your content as necessary to provide the service.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5. Storage and Quota</h2>
              <p className="leading-relaxed">
                Each user account is provided with a storage quota for uploading course materials. We reserve the right 
                to modify storage limits at any time. Users exceeding their storage quota may be required to delete 
                content or upgrade to a premium plan (if available). We are not responsible for any loss of data.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6. Intellectual Property</h2>
              <p className="leading-relaxed">
                The Service and its original content (excluding user-uploaded content), features, and functionality are 
                and will remain the exclusive property of Coursebook and its licensors. The Service is protected by 
                copyright, trademark, and other laws. Our trademarks may not be used in connection with any product or 
                service without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7. Termination</h2>
              <p className="leading-relaxed">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice 
                or liability, under our sole discretion, for any reason whatsoever, including without limitation if you 
                breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to 
                terminate your account, you may simply discontinue using the Service or contact us.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8. Limitation of Liability</h2>
              <p className="leading-relaxed">
                In no event shall Coursebook, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                be liable for any indirect, incidental, special, consequential or punitive damages, including without 
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access 
                to or use of or inability to access or use the Service.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>9. Disclaimer</h2>
              <p className="leading-relaxed">
                Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" 
                basis. The Service is provided without warranties of any kind, whether express or implied, including, 
                but not limited to, implied warranties of merchantability, fitness for a particular purpose, 
                non-infringement or course of performance.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>10. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed and construed in accordance with the laws of your jurisdiction, without 
                regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms 
                will not be considered a waiver of those rights.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>11. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision 
                is material, we will provide at least 30 days' notice prior to any new terms taking effect. What 
                constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>12. Contact Information</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className={`mt-3 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <p className="font-semibold">Email: <a href="mailto:contact@supanroy.com" className="text-sky-400 hover:text-sky-300 transition-colors">contact@supanroy.com</a></p>
                <p>Developer: Supan Roy</p>
                <p>GitHub: <a href="https://github.com/Supan-Roy" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors">github.com/Supan-Roy</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
