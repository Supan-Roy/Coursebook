import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import DatePicker from '../components/DatePicker';

// Comprehensive list of Bangladeshi Universities
const BANGLADESHI_UNIVERSITIES = [
  // Public Universities
  'University of Dhaka',
  'University of Rajshahi',
  'Bangladesh University of Engineering and Technology (BUET)',
  'University of Chittagong',
  'Jahangirnagar University',
  'Islamic University, Bangladesh',
  'Shahjalal University of Science and Technology (SUST)',
  'Khulna University',
  'Bangladesh Agricultural University',
  'Gazipur Agricultural University',
  'Bangladesh University of Professionals (BUP)',
  'Chittagong University of Engineering and Technology (CUET)',
  'Rajshahi University of Engineering and Technology (RUET)',
  'Khulna University of Engineering and Technology (KUET)',
  'Dhaka University of Engineering and Technology (DUET)',
  'Bangladesh University of Textiles (BUTEX)',
  'Hajee Mohammad Danesh Science and Technology University',
  'Mawlana Bhashani Science and Technology University',
  'Patuakhali Science and Technology University',
  'Noakhali Science and Technology University',
  'Jagannath University',
  'Comilla University',
  'Jessore University of Science and Technology',
  'Pabna University of Science and Technology',
  'Begum Rokeya University, Rangpur',
  'Gopalganj Science and Technology University',
  'Bangladesh Maritime University',
  'University of Frontier Technology',
  'Netrokona University',
  'Jamalpur Science and Technology University',
  'Rangamati Science and Technology University',
  'Aviation and Aerospace University',
  'Bangladesh Open University',
  'National University',
  'Islamic Arabic University',
  'Bangladesh University of Health Sciences',
  'Bangladesh Medical University',
  'Chittagong Medical University',
  'Rajshahi Medical University',
  'Sylhet Medical University',
  'Khulna Medical University',
  'Mymensingh Medical University',
  'Sher-e-Bangla Agricultural University',
  'Sylhet Agricultural University',
  'Chittagong Veterinary and Animal Sciences University',
  
  // Private Universities
  'North South University (NSU)',
  'BRAC University',
  'Independent University, Bangladesh (IUB)',
  'American International University-Bangladesh (AIUB)',
  'East West University',
  'Ahsanullah University of Science and Technology (AUST)',
  'Daffodil International University',
  'United International University (UIU)',
  'International Islamic University Chittagong (IIUC)',
  'Gono Bishwabidyalay',
  'Green University of Bangladesh',
  'Premier University',
  'Southeast University',
  'Stamford University Bangladesh',
  'University of Asia Pacific (UAP)',
  'World University of Bangladesh',
  'Manarat International University',
  'Bangladesh University of Business and Technology (BUBT)',
  'City University',
  'ASA University Bangladesh',
  'Northern University Bangladesh',
  'Prime University',
  'Southern University Bangladesh',
  'Bangladesh University',
  'BGMEA University of Fashion and Technology (BUFT)',
  'Shanto-Mariam University of Creative Technology',
  'University of Development Alternative (UODA)',
  'Presidency University',
  'IUBAT - International University of Business Agriculture and Technology',
  'Leading University',
  'Millennium University',
  'Metropolitan University',
  'Varendra University',
  'University of Information Technology and Sciences (UITS)',
  'Atish Dipankar University of Science and Technology',
  'Central Women\'s University',
  'European University of Bangladesh',
  'Fareast International University',
  'Hamdard University Bangladesh',
  'International University of Scholars',
  'Ishakha International University',
  'Khwaja Yunus Ali University',
  'North Bengal International University',
  'Port City International University',
  'Queens University',
  'Royal University of Dhaka',
  'Sonargaon University',
  'Times University',
  'University of Creative Technology Chittagong',
  'University of Global Village',
  'University of Liberal Arts Bangladesh',
  'University of Science and Technology Chittagong',
  'Z H Sikder University of Science and Technology',
  'First Capital University of Bangladesh',
  'Canadian University of Bangladesh',
  'Cox\'s Bazar International University',
  'Exim Bank Agricultural University Bangladesh',
  'German University Bangladesh',
  'Global University Bangladesh',
  'Ideal University',
  'International Standard University',
  'Lakshmipur Engineering and Technology University',
  'Northern University of Business and Technology Khulna',
  'North Western University',
  'Notre Dame University Bangladesh',
  'Ranada Prasad Shaha University',
  'Sheikh Fazilatunnesa Mujib University',
  'Trust University',
  'University of Brahmanbaria',
  'University of Chattogram',
  'University of Skill Enrichment and Technology',
  'Yunnan Agricultural University Bangladesh Campus',
].sort();

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const DOB_STORAGE_KEY = 'user_dob';
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    university: '',
  });
  const [dob, setDob] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
  const [universityDropdownOpen, setUniversityDropdownOpen] = useState(false);
  const [universitySearch, setUniversitySearch] = useState('');
  const universityInputRef = useRef(null);
  const universityDropdownRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        university: user.university || '',
      });
      const savedDob = typeof window !== 'undefined' ? localStorage.getItem(DOB_STORAGE_KEY) : '';
      setDob(savedDob || '');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (message.type === 'success' && message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Close university dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        universityDropdownRef.current &&
        !universityDropdownRef.current.contains(event.target) &&
        universityInputRef.current &&
        !universityInputRef.current.contains(event.target)
      ) {
        setUniversityDropdownOpen(false);
      }
    };

    if (universityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [universityDropdownOpen]);

  // Filter universities based on search
  const filteredUniversities = universitySearch.trim() === ''
    ? BANGLADESHI_UNIVERSITIES // Show all universities when no search
    : BANGLADESHI_UNIVERSITIES.filter(uni =>
        uni.toLowerCase().includes(universitySearch.toLowerCase())
      );

  // Handle university input change
  const handleUniversityChange = (e) => {
    const value = e.target.value;
    setUniversitySearch(value);
    setFormData({ ...formData, university: value });
    if (value.length > 0) {
      setUniversityDropdownOpen(true);
    }
  };

  // Handle university selection from dropdown
  const handleUniversitySelect = (university) => {
    setFormData({ ...formData, university });
    setUniversitySearch('');
    setUniversityDropdownOpen(false);
    if (universityInputRef.current) {
      universityInputRef.current.focus();
    }
  };

  // Handle university input focus
  const handleUniversityFocus = () => {
    if (formData.university) {
      setUniversitySearch(formData.university);
    }
    setUniversityDropdownOpen(true);
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload an image (PNG, JPEG, JPG, GIF, or WEBP).' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB.' });
      return;
    }

    setUploadingPhoto(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await authService.uploadProfilePhoto(file);
      await refreshUser();
      setMessage({ type: 'success', text: result.detail || 'Profile photo uploaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to upload profile photo' });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getGreeting = () => {
    const name = user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || 'Student';

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const key = `${day}-${month}`;

    const specialDays = {
      '01-01': 'Happy New Year',
      '14-04': 'শুভ নববর্ষ',
      '21-02': 'আন্তর্জাতিক মাতৃভাষা দিবসের শুভেচ্ছা',
      '26-03': 'Happy Independence Day',
      '16-12': 'Happy Victory Day',
    };

    if (specialDays[key]) {
      return `${specialDays[key]}, ${name}!`;
    }

    if (dob) {
      const [year, monthStr, dayStr] = dob.split('-');
      if (monthStr && dayStr && dayStr.padStart(2, '0') === day && monthStr.padStart(2, '0') === month) {
        return `Happy Birthday, ${name}!`;
      }
    }

    return `Welcome, ${name}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authService.updateProfile(formData);
      await refreshUser();
      if (typeof window !== 'undefined') {
        if (dob) {
          localStorage.setItem(DOB_STORAGE_KEY, dob);
        } else {
          localStorage.removeItem(DOB_STORAGE_KEY);
        }
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setUniversitySearch('');
      setUniversityDropdownOpen(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 flex ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey="settings"
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
            <div className="flex items-center gap-4">
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
              
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {(() => {
                  const greeting = getGreeting();
                  const name = user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.first_name || 'Student';
                  if (greeting.includes(', ')) {
                    const parts = greeting.split(', ');
                    const message = parts.slice(0, -1).join(', ');
                    return (
                      <>
                        {message}, <span className={`font-semibold ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>{name}</span>{greeting.endsWith('!') ? '!' : ''}
                      </>
                    );
                  }
                  return greeting;
                })()}
              </span>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all border ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                >
                  {user?.profile_photo ? (
                    <img
                      src={user.profile_photo}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-sky-500/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {user?.first_name?.[0] || 'S'}
                    </div>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-50 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.first_name} {user?.last_name}</p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </button>
                      <button
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/settings');
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      <div className={`border-t my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-2xl p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          {/* Profile Header */}
          <div className={`flex items-center gap-6 mb-8 pb-8 border-b ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
            <div className="relative group">
              {user?.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-sky-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-4xl border-2 border-sky-500">
                  {user?.first_name?.[0] || 'S'}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className={`absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed ${uploadingPhoto ? 'opacity-100' : ''}`}
                title="Upload profile photo"
              >
                {uploadingPhoto ? (
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.first_name || 'User'}
                {user?.university && (
                  <span className={`text-xl font-normal ml-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    • {user.university}
                  </span>
                )}
              </h1>
              <p className={`text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Manage your personal information</p>
            </div>
          </div>

          {/* Delete Photo Button (only when editing and photo exists) */}
          {isEditing && user?.profile_photo && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowDeletePhotoConfirm(true)}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/50 hover:border-red-500' : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Profile Photo
                </span>
              </button>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`rounded-lg p-3 mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-2 border-green-500' 
                : 'bg-red-500/10 border-2 border-red-500'
            }`}>
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>{message.text}</p>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 text-sm border rounded-lg transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${isDarkMode ? 'bg-gray-900/50 border-gray-700 disabled:bg-gray-900/30 text-white disabled:text-white placeholder-gray-500' : 'bg-white border-gray-300 disabled:bg-gray-100 text-gray-900 disabled:text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 text-sm border rounded-lg transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${isDarkMode ? 'bg-gray-900/50 border-gray-700 disabled:bg-gray-900/30 text-white disabled:text-white placeholder-gray-500' : 'bg-white border-gray-300 disabled:bg-gray-100 text-gray-900 disabled:text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled
                value={formData.email}
                className={`block w-full px-4 py-3 text-sm border rounded-lg cursor-not-allowed ${isDarkMode ? 'bg-gray-900/30 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email cannot be changed</p>
            </div>

            {/* Date of Birth (local only) */}
            <div>
              <label htmlFor="dob" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Date of Birth
              </label>
              <DatePicker
                value={dob}
                onChange={setDob}
                disabled={!isEditing}
                maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>

            {/* University */}
            <div className="relative">
              <label htmlFor="university" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                University
              </label>
              <div className="relative">
                <input
                  ref={universityInputRef}
                  id="university"
                  name="university"
                  type="text"
                  disabled={!isEditing}
                  value={formData.university}
                  onChange={handleUniversityChange}
                  onFocus={handleUniversityFocus}
                  onBlur={(e) => {
                    // Keep the value in formData even if not in dropdown
                    if (e.target.value) {
                      setFormData({ ...formData, university: e.target.value });
                    }
                    // Close dropdown after a short delay to allow click events
                    setTimeout(() => setUniversityDropdownOpen(false), 200);
                  }}
                  placeholder="Type to search or enter your university name"
                  className={`block w-full px-4 py-3 pr-10 text-sm border rounded-lg transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${isDarkMode ? 'bg-gray-900/50 border-gray-700 disabled:bg-gray-900/30 text-white disabled:text-white placeholder-gray-500' : 'bg-white border-gray-300 disabled:bg-gray-100 text-gray-900 disabled:text-gray-900 placeholder-gray-400'}`}
                />
                {isEditing && (
                  <svg
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-transform ${universityDropdownOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                
                {/* Dropdown */}
                {isEditing && universityDropdownOpen && (
                  <div
                    ref={universityDropdownRef}
                    className={`absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
                  >
                    {filteredUniversities.length > 0 ? (
                      <ul className="py-1">
                        {filteredUniversities.map((university, index) => (
                          <li key={index}>
                            <button
                              type="button"
                              onClick={() => handleUniversitySelect(university)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-sky-500/10 transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-900 hover:text-sky-600'}`}
                            >
                              {university}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No matching university found. You can type your own.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isEditing && (
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Type to search from the list or enter your own university name
                </p>
              )}
            </div>

            {/* Account Info */}
            <div className={`pt-6 border-t ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Plan</span>
                  <span className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.plan || 'Free'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Storage Quota</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.quota_mb || 500} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Member Since</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditing(true);
                    setMessage({ type: '', text: '' });
                    setUniversitySearch('');
                    setUniversityDropdownOpen(false);
                  }}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        first_name: user?.first_name || '',
                        last_name: user?.last_name || '',
                        email: user?.email || '',
                        university: user?.university || '',
                      });
                      setMessage({ type: '', text: '' });
                      setUniversitySearch('');
                      setUniversityDropdownOpen(false);
                    }}
                    className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all border ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-gray-400'}`}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </main>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out of Coursebook?"
        confirmText="Log out"
        type="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate('/login');
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeletePhotoConfirm}
        title="Delete Profile Photo"
        message="Are you sure you want to delete your profile photo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={async () => {
          setShowDeletePhotoConfirm(false);
          setLoading(true);
          setMessage({ type: '', text: '' });
          try {
            await authService.deleteProfilePhoto();
            await refreshUser();
            setMessage({ type: 'success', text: 'Profile photo deleted successfully!' });
          } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete profile photo' });
          } finally {
            setLoading(false);
          }
        }}
        onCancel={() => setShowDeletePhotoConfirm(false)}
      />
      </div>
    </div>
  );
}
