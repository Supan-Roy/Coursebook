import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function CookiePolicyPage() {
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
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cookie Policy</h1>
          <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last updated: January 3, 2026</p>

          <div className={`space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1. What Are Cookies</h2>
              <p className="leading-relaxed">
                Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored 
                in your web browser and allows the Service or a third-party to recognize you and make your next visit 
                easier and the Service more useful to you. Cookies can be "persistent" or "session" cookies.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2. How Coursebook Uses Cookies</h2>
              <p className="leading-relaxed mb-3">
                When you use and access the Service, we may place a number of cookie files in your web browser. 
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> To enable certain functions of the Service and authenticate users</li>
                <li><strong>Preference Cookies:</strong> To remember your settings and preferences (like theme preferences)</li>
                <li><strong>Security Cookies:</strong> To secure your account and protect against fraudulent logins</li>
                <li><strong>Analytics Cookies:</strong> To help us understand how visitors interact with our Service</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3. Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>Session Cookies</h3>
                  <p className="text-sm leading-relaxed">
                    We use session cookies to operate our Service. These cookies are temporary and expire when you close 
                    your browser. They help maintain your session state while you navigate through different pages.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>Persistent Cookies</h3>
                  <p className="text-sm leading-relaxed">
                    We use persistent cookies to remember your preferences and settings. These cookies remain on your 
                    device until they expire or you delete them. They help us recognize you when you return to our Service.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>Authentication Cookies</h3>
                  <p className="text-sm leading-relaxed">
                    These cookies are used to authenticate users and prevent fraudulent use of login credentials. 
                    They are essential for the security of your account and the Service.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>Functionality Cookies</h3>
                  <p className="text-sm leading-relaxed">
                    These cookies allow us to remember choices you make (such as your theme preference - dark or light mode) 
                    and provide enhanced, more personalized features.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4. Third-Party Cookies</h2>
              <p className="leading-relaxed">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics 
                of the Service, deliver advertisements on and through the Service, and so on. These third-party services 
                have their own privacy policies addressing how they use such information.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5. What Are Your Choices Regarding Cookies</h2>
              <p className="leading-relaxed mb-3">
                If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit 
                the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept 
                them, you might not be able to use all of the features we offer.
              </p>
              
              <div className={`mt-4 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                  💡 Managing Cookies in Popular Browsers:
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                  <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                  <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6. Local Storage</h2>
              <p className="leading-relaxed">
                In addition to cookies, we may use browser local storage to store your authentication tokens and 
                preferences. Local storage is similar to cookies but can store larger amounts of data. This data remains 
                on your device even after you close your browser and is only accessible by our Service.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7. Updates to This Policy</h2>
              <p className="leading-relaxed">
                We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new 
                Cookie Policy on this page and updating the "Last updated" date at the top of this Cookie Policy. 
                You are advised to review this Cookie Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8. Cookie Consent</h2>
              <p className="leading-relaxed">
                By using Coursebook, you consent to the use of cookies in accordance with this Cookie Policy. If you do 
                not agree to our use of cookies in this way, you should set your browser settings accordingly or not use 
                our Service. If you disable the cookies that we use, this may impact your user experience while on our Service.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>9. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className={`mt-3 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <p className="font-semibold">Email: contact@supanroy.com</p>
                <p>Developer: Supan Roy</p>
                <p>GitHub: github.com/Supan-Roy</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
