# Google OAuth Setup Guide

## Backend Configuration

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "People API"
   - Click **Enable**
4. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add **Authorized redirect URIs**:
     - For development: `http://localhost:3001/auth/google/callback`
     - For production: `https://yourdomain.com/auth/google/callback`
   - Click **Create**
   - **Copy the Client ID and Client Secret**

### 2. Add to Backend .env File

Add these to your `backend/.env` file:

```env
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret
```

### 3. Restart Django Server

After adding the credentials, restart your Django server.

## Frontend Configuration

The frontend is already configured! The Google Sign-In button will appear on the login page automatically.

## Testing

1. Start your Django backend: `python manage.py runserver`
2. Start your React frontend: `npm run dev`
3. Go to the login page
4. Click "Sign in with Google"
5. Select your Google account
6. You should be redirected back and logged in

## How It Works

1. User clicks "Sign in with Google" button
2. Frontend requests OAuth URL from backend
3. User is redirected to Google login
4. User authorizes the app
5. Google redirects back to `/auth/google/callback` with code
6. Frontend sends code to backend
7. Backend exchanges code for user info
8. Backend creates/updates user and returns JWT tokens
9. User is logged in and redirected to dashboard

## Security Notes

- OAuth state token is used for CSRF protection
- Google emails are automatically marked as verified
- Users created via Google OAuth don't need email verification
- Existing users can also log in with Google if email matches

## Troubleshooting

### "Google OAuth is not configured"
- Make sure `GOOGLE_OAUTH2_CLIENT_ID` and `GOOGLE_OAUTH2_CLIENT_SECRET` are set in `.env`
- Restart Django server after adding credentials

### "Redirect URI mismatch"
- Check that the redirect URI in Google Console matches exactly:
  - Development: `http://localhost:3001/auth/google/callback`
  - Production: `https://yourdomain.com/auth/google/callback`

### "Invalid state parameter"
- This is a CSRF protection error
- Clear browser cookies and try again
- Make sure sessions are working (check Django settings)

### User not created
- Check Django logs for errors
- Verify Google API is enabled in Google Cloud Console
- Check that email is being returned from Google

