# Coursebook

A comprehensive, production-ready academic management platform for organizing courses, managing study materials, and enhancing your learning experience with AI-powered tools.

🌐 **Live Application**: [coursebook.supanroy.com](https://coursebook.supanroy.com)

## ✨ Features

### 🎓 Academic Management
- **Semester Management** - Organize courses by semester with automatic sorting (newest first)
- **Course Organization** - Create and manage individual courses with detailed information
- **Routine Upload** - Automatically extract course information from academic routine PDFs/images using OCR
- **Course Folders** - Dedicated folders for each course with automatic slug generation

### 📄 Study Materials
- **File Upload** - Upload PDFs, documents, and files with progress tracking and upload queue
- **Material Organization** - Organize materials within course folders
- **File Sharing** - Generate secure, time-limited shareable links for your materials
- **Storage Management** - Track storage usage with quota limits (default: 500MB)
- **Trash Bin** - Soft delete with recovery option
- **Search Functionality** - Quickly find courses and materials

### 🛠️ PDF Toolkit
Complete suite of PDF tools integrated into the platform:
- **Document to PDF** - Convert Doc, Docx, PPT, PPTX, XLS, XLSX, TXT, and Images to PDF
- **Merge PDFs** - Combine multiple PDF files into one
- **Split PDFs** - Divide PDFs into separate files
- **Compress PDFs** - Reduce file size while maintaining quality
- **Add Page Numbers** - Automatically number pages
- **Watermark PDFs** - Add custom watermarks
- **Secure/Unlock PDFs** - Password protect or remove protection
- **Edit PDFs** - Modify PDF content directly

### 📋 My Plans (Todo System)
- **Task Management** - Create, edit, and organize tasks with categories
- **Categories** - Organize tasks into Academic, Personal, or custom categories
- **Priorities** - Set task priorities (Low, Medium, High)
- **Due Dates & Times** - Schedule tasks with date and time pickers
- **Repeat Tasks** - Set recurring tasks (Daily, Weekly, Monthly, Yearly, Weekdays, Weekends)
- **Notifications** - Browser notifications for due tasks
- **Completion Tracking** - Mark tasks as complete and view completed items

### 🚀 Workspace
- **Recent Activity** - Track all interactions with materials (uploads, views, generated content)
- **AI Summaries** - Generate comprehensive summaries from uploaded materials
- **Quiz Generation** - Create practice quizzes from study materials
- **Progress Tracking** - Monitor academic progress and engagement

### 👤 User Features
- **Authentication** - Email/password and Google OAuth login
- **Profile Management** - Update profile with name, university, date of birth, and profile photo
- **Dark Mode** - Toggle between light and dark themes
- **Mobile Responsive** - Fully responsive design for all devices
- **Account Management** - Secure account deletion with email verification

### 🔒 Security & Privacy
- **JWT Authentication** - Secure token-based authentication
- **Email Verification** - OTP-based email verification
- **Password Reset** - Secure password recovery via email
- **User Data Isolation** - All data properly scoped to authenticated users
- **Secure File Storage** - Files stored on Cloudinary with secure access

## 🛠️ Tech Stack

### Backend
- **Django 5.0.4** - Python web framework
- **Django REST Framework 3.15.2** - REST API toolkit
- **djangorestframework-simplejwt 5.3.1** - JWT authentication
- **PostgreSQL** - Production database (SQLite for development)
- **Cloudinary** - Cloud file storage and management
- **Resend** - Email service for transactional emails
- **Tesseract OCR** - Text extraction from images/PDFs
- **OpenRouter/Gemini** - AI-powered content generation

### Frontend
- **React 18.3.1** - UI library
- **Vite 5.4.11** - Fast build tool
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Axios 1.6.7** - HTTP client with interceptors
- **React Router DOM 6.22.0** - Client-side routing
- **React Icons** - Icon library

## 📦 Project Structure

```
coursebook/
├── backend/                    # Django application
│   ├── config/                # Project settings
│   ├── accounts/              # User authentication & profiles
│   ├── courses/               # Course & semester management
│   ├── materials/             # Study materials & file uploads
│   ├── todos/                 # Todo/task management
│   ├── workspace/             # Workspace, summaries, quizzes
│   ├── toolkit/              # PDF toolkit features
│   ├── sharing/              # File sharing functionality
│   ├── usage/                 # Storage usage tracking
│   └── common/                # Shared utilities (OCR, text extraction)
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── context/          # React contexts (Auth, Theme)
│   │   ├── services/         # API service layer
│   │   └── utils/            # Helper utilities
│   └── public/               # Static assets
│
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn
- PostgreSQL (for production) or SQLite (for development)
- Tesseract OCR (for routine extraction)

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

4. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DJANGO_SECRET_KEY=your-secret-key-here
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
   DATABASE_URL=sqlite:///db.sqlite3
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   OPENROUTER_API_KEY=your-openrouter-key
   GEMINI_API_KEY=your-gemini-key
   TESSERACT_CMD=tesseract  # or full path on Windows
   FRONTEND_URL=http://localhost:5173
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
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

3. **Set up environment variables**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173/`

## 🔐 Authentication

- **Registration**: Create account with email, password, first name, and last name
- **Email Verification**: OTP-based verification required after registration
- **Login**: Sign in with email/password or Google OAuth
- **JWT Tokens**: Access tokens (30 min) and refresh tokens (7 days)
- **Automatic Refresh**: Interceptors auto-refresh expired tokens
- **Password Reset**: Secure password recovery via email link

## 📚 Key Features Explained

### Routine Upload & OCR
Upload your academic routine (PDF or image) and the system will:
- Extract text using Tesseract OCR
- Identify courses and semester information
- Automatically create semesters and courses
- Clean course names (remove teacher initials, room numbers, etc.)

### PDF Toolkit
All PDF operations are performed server-side using:
- **Ghostscript** - PDF manipulation
- **PyPDF2/PyMuPDF** - PDF processing
- **Pillow** - Image processing
- **python-docx** - Document conversion

### Workspace Features
- **Summaries**: AI-powered summaries of uploaded materials
- **Quizzes**: Generate practice questions from materials
- **Activity Feed**: Track all material interactions

### My Plans
- Create tasks with due dates, times, and priorities
- Organize into categories
- Set recurring tasks
- Receive browser notifications for due tasks

## 🌐 Deployment

### Backend (Railway)
- Uses PostgreSQL database
- Environment variables configured in Railway dashboard
- Automatic deployments on git push
- Custom domain support

### Frontend (Vercel)
- Automatic deployments on git push
- Environment variables configured in Vercel dashboard
- Custom domain support
- CDN for static assets

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get tokens
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user
- `PATCH /api/auth/me/` - Update profile
- `POST /api/auth/verify-email/` - Verify email with OTP
- `POST /api/auth/resend-verification/` - Resend verification OTP

### Courses & Semesters
- `GET /api/courses/` - List user's courses
- `POST /api/courses/` - Create new course
- `GET /api/courses/{id}/` - Get course details
- `PATCH /api/courses/{id}/` - Update course
- `DELETE /api/courses/{id}/` - Delete course
- `GET /api/semesters/` - List user's semesters
- `POST /api/semesters/` - Create new semester

### Materials
- `GET /api/materials/` - List materials (filterable by course_id)
- `POST /api/materials/` - Upload new material
- `GET /api/materials/{id}/` - Get material details
- `DELETE /api/materials/{id}/` - Delete material (soft delete)
- `GET /api/materials/files/{id}/` - Public file access

### Todos
- `GET /api/todos/categories/` - List todo categories
- `POST /api/todos/categories/` - Create category
- `GET /api/todos/` - List todos
- `POST /api/todos/` - Create todo
- `PATCH /api/todos/{id}/` - Update todo
- `DELETE /api/todos/{id}/` - Delete todo

### Workspace
- `GET /api/workspace/activity/` - Get recent activity
- `POST /api/workspace/summarize/` - Generate summary
- `POST /api/workspace/quiz/` - Generate quiz

### Storage
- `GET /api/usage/` - Get user storage usage stats

## 🎨 Design Features

- **Modern UI** - Clean, intuitive interface
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Mobile-first design that works on all devices
- **Glassmorphism** - Modern card designs with backdrop blur
- **Smooth Animations** - Polished user experience
- **Accessibility** - Keyboard navigation and screen reader support

## 🔄 Workflow

1. **Register/Login** - Create account and verify email
2. **Create Semesters** - Organize your academic terms
3. **Add Courses** - Create courses or upload routine for automatic extraction
4. **Upload Materials** - Add study materials to courses
5. **Use Tools** - Convert, merge, or process PDFs
6. **Plan Tasks** - Create todos with due dates and priorities
7. **Generate Content** - Create summaries and quizzes from materials
8. **Track Progress** - Monitor your academic journey

## 📄 License

This project is proprietary and confidential.

---

**Made with ⚛️ React & 🐍 Django**

For support, contact: support@supanroy.com
