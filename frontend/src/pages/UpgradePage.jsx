import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import Sidebar from '../components/Sidebar';

const plans = [
  {
    name: 'Free',
    price: '0 BDT',
    cadence: 'forever',
    storage: '500 MB',
    highlight: 'Great for getting started',
    cta: 'Current plan',
    disabled: true,
    popular: false,
  },
  {
    name: 'Pro 5 GB',
    price: '99 BDT',
    cadence: 'per month',
    storage: '5 GB',
    highlight: 'Best for active students',
    cta: 'Upgrade',
    disabled: false,
    popular: true,
  },
  {
    name: 'Pro 10 GB',
    price: '199 BDT',
    cadence: 'per month',
    storage: '10 GB',
    highlight: 'For power users',
    cta: 'Upgrade',
    disabled: false,
    popular: false,
  },
];

export default function UpgradePage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const cardBase =
    'rounded-2xl border p-6 shadow-sm transition transform hover:-translate-y-1 hover:shadow-lg';

  const colors = useMemo(
    () => ({
      page: isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900',
      card: isDarkMode ? 'glass-card border-gray-700/60' : 'bg-white border-gray-200',
      textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-600',
      badge: isDarkMode ? 'bg-sky-500/10 text-sky-300 border border-sky-500/40' : 'bg-sky-100 text-sky-700',
      button:
        'w-full mt-6 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition',
      buttonPrimary: isDarkMode
        ? 'bg-sky-500 text-white hover:bg-sky-400'
        : 'bg-sky-600 text-white hover:bg-sky-500',
      buttonGhost: isDarkMode
        ? 'border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-900'
        : 'border border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-100',
      accent: isDarkMode ? 'text-sky-300' : 'text-sky-600',
    }),
    [isDarkMode]
  );

  const handleUpgrade = (planName) => {
    // Placeholder for future integration
    alert(`${planName} upgrade flow will be added soon.`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 flex ${colors.page}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey="dashboard"
        isDarkMode={isDarkMode}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] items-start">
          <div className={`rounded-2xl p-8 border ${colors.card}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>Upgrade to Pro</span>
            </div>
            <h1 className="text-4xl font-bold mb-3">Unlock more storage</h1>
            <p className={`${colors.textMuted} leading-relaxed`}>
              Choose a plan that fits your study flow. All plans include secure material storage, fast access, and the
              same Coursebook experience—just with more room for your files.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-6">
              <div className={`rounded-xl p-4 border ${colors.card}`}>
                <p className={colors.textMuted}>Current plan</p>
                <p className="text-lg font-semibold">Free • 0 BDT</p>
                <p className="text-sm mt-2">
                  Storage limit: <span className="font-semibold">500 MB</span>
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${colors.card}`}>
                <p className={colors.textMuted}>Need more space?</p>
                <p className="text-lg font-semibold">Upgrade in two clicks</p>
                <ul className={`mt-3 space-y-2 text-sm ${colors.textMuted}`}>
                  <li>• Keep all your course materials organized</li>
                  <li>• Faster uploads for larger files</li>
                  <li>• Priority support for Pro users</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1 sm:grid-cols-2">
            {plans.map((plan) => {
              const buttonStyle = plan.disabled ? colors.buttonGhost : colors.buttonPrimary;
              return (
                <div
                  key={plan.name}
                  className={`${cardBase} ${colors.card} ${
                    plan.popular ? (isDarkMode ? 'ring-2 ring-sky-500/60' : 'ring-2 ring-sky-200') : ''
                  }`}
                >
                  {plan.popular && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colors.badge}`}>Most popular</span>
                  )}
                  <h2 className="text-2xl font-bold mt-2">{plan.name}</h2>
                  <p className={`${colors.textMuted} mt-1`}>{plan.highlight}</p>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className={colors.textMuted}>/{plan.cadence}</span>
                  </div>
                  <p className="mt-2">
                    Storage: <span className="font-semibold">{plan.storage}</span>
                  </p>
                  <button
                    className={`${colors.button} ${buttonStyle}`}
                    disabled={plan.disabled}
                    onClick={() => !plan.disabled && handleUpgrade(plan.name)}
                  >
                    {plan.cta}
                    {!plan.disabled && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  <p className={`mt-3 text-sm ${colors.textMuted}`}>
                    No long-term commitment. Change or cancel anytime.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

