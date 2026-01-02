# Coursebook 📚

A modern, production-grade SaaS platform for academic course management and study material organization.

## 🚀 Features

- **User Authentication** - Email-based registration and login with JWT tokens
- **Routine Upload** - Upload class routines (PDF or Image) and automatically generate course folders
- **Course Management** - Create, edit, and delete courses with automatic slug generation
- **Dashboard Course Management** - Manage all courses directly from the dashboard interface
- **Course Materials Summary** - View comprehensive summaries of all course materials with metadata
- **Study Materials** - Upload and manage study materials (PDFs, slides, etc.)
- **Material Metadata Tracking** - Automatic file type detection, size tracking, and upload timestamps
- **Material Deletion** - Delete materials with automatic storage cleanup and quota recalculation
- **File Upload Endpoints** - Robust file upload with initialization and completion tracking
- **To-Do List** - Manage tasks with real-time notifications and reminders
- **Storage Quota** - Track and enforce per-user storage limits with real-time usage updates
- **User-Scoped Data** - All data properly isolated and scoped to authenticated users
- **Interactive UI** - Beautiful dark space theme with animated educational elements
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Practice Quiz** - Test yourself with practice exams before the real exam (v2)

## 🛠️ Tech Stack

### Backend
- **Django 5.0.4** - Python web framework
- **Django REST Framework 3.15.2** - REST API toolkit
- **djangorestframework-simplejwt 5.3.1** - JWT authentication
- **SQLite** - Development database (PostgreSQL for production)
- **Python 3.11+**

### Frontend
- **React 18.3.1** - UI library
- **Vite 5.4.11** - Fast build tool
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Axios 1.6.7** - HTTP client
- **React Router DOM 6.22.0** - Client-side routing

## 📦 Project Structure

```
coursebook/
├── backend/                    # Django application
│   ├── config/                # Project settings
│   ├── accounts/              # User authentication
│   ├── courses/               # Course management
│   ├── materials/             # Study materials
│   ├── usage/                 # Storage usage tracking
│   ├── db.sqlite3             # Development database
│   └── manage.py              # Django CLI
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── pages/            # Page components (Login, Register, Dashboard)
│   │   ├── context/          # Auth context for global state
│   │   ├── services/         # API service layer
│   │   ├── utils/            # Helper utilities
│   │   ├── App.jsx           # Main router
│   │   └── index.css         # Global styles
│   ├── package.json          # Dependencies
│   └── vite.config.js        # Vite configuration
│
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at `http://127.0.0.1:8000/`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173/`

## 🔐 Authentication

- **Registration**: Create new account with email, password, first name, and last name
- **Login**: Sign in with email and password
- **JWT Tokens**: Access tokens (30 min) and refresh tokens (7 days)
- **Automatic Refresh**: Interceptors auto-refresh expired tokens

### Test Credentials
- Email: `admin@coursebook.com`
- Password: `admin123`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get tokens
- `POST /api/auth/refresh/` - Refresh access token

### Courses
- `GET /api/courses/` - List user's courses
- `POST /api/courses/` - Create new course
- `GET /api/courses/{id}/` - Get course details
- `DELETE /api/courses/{id}/` - Delete course

### Materials
- `GET /api/materials/` - List materials (filterable by course_id)
- `POST /api/materials/` - Create new material
- `GET /api/materials/{id}/` - Get material details
- `DELETE /api/materials/{id}/` - Delete material

### Storage
- `GET /api/usage/` - Get user storage usage stats

## 🎨 Design Features

- **Dark Space Theme** - Pure black background with glowing educational elements
- **Glassmorphism** - Transparent cards with backdrop blur effect
- **Interactive Elements** - Floating math equations and symbols that react to mouse movement
- **Premium Fonts** - Inter (body) and Poppins (headings) from Google Fonts
- **Responsive Grid** - Mobile-first design that adapts to all screen sizes

## 🔄 Workflow

1. User registers or logs in
2. Dashboard displays user's courses and storage usage
3. User can create courses and upload study materials
4. System tracks storage usage against quota
5. Materials are stored with metadata and accessible via API

## 📝 Models

### User (Custom)
- Email-based authentication
- Storage quota (default: 500 MB)
- Plan field for future tier support

### Course
- Belongs to user
- Auto-generated slug for folder organization
- Collision detection and numbering

### Material
- Belongs to course and user
- Stores file metadata (size, type, URL)
- Tracks storage usage

### StorageUsage
- One-to-one with user
- Cached bytes used
- Auto-created on first access

## 🚀 Future Enhancements (v2+)

- File upload to external storage (Cloudinary/S3)
- Course routine parsing from PDF/Image with advanced auto-course creation
- Practice Test Quiz - Take practice exams to test yourself before real exams
- Material sharing and collaboration between users
- Advanced search and filtering capabilities
- Progress tracking and analytics dashboard
- Production deployment setup with PostgreSQL
- User preferences and customization settings

## 📄 Environment Variables

Create `.env` file in backend directory:
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

## 🤝 Contributing

This is an active development project. For contributions, please:
1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📞 Support

For issues or questions, please create an issue in the repository.

## 📄 License

This project is proprietary and confidential.

---

**Made with ⚛️ React & 🐍 Django**
