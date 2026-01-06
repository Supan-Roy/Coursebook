# Quick Fix: Get New Gemini API Keys

## Problem
All 4 current API keys have hit their free tier quotas (1500 requests/day limit).

## Quick Solution (5 minutes)

### Step 1: Get New Free API Keys
1. Open https://aistudio.google.com/apikey in a new browser
2. Click "Create API Key" (you might need to create/use a Google account)
3. Copy the key that appears
4. **Repeat 3-4 more times** with different Google accounts to get multiple keys
   - Each account gives you a separate quota pool
   - Having 5-7 keys = 7500-10,500 requests/day total

### Step 2: Update .env File
Edit `backend/.env` and replace the GEMINI_API_KEYS line:

**Current (exhausted):**
```env
GEMINI_API_KEYS=<redacted>
```

**New (with fresh keys):**
```env
GEMINI_API_KEYS=YOUR_KEY_1,YOUR_KEY_2,YOUR_KEY_3,YOUR_KEY_4,YOUR_KEY_5,YOUR_KEY_6,YOUR_KEY_7
```

### Step 3: Restart Django Server
```bash
# Stop current server (Ctrl+C)

# Restart with new keys
python manage.py runserver
```

## That's It!

The system will now:
- Use key 1 until quota
- Automatically rotate to key 2
- Continue rotating through all keys
- Fall back to rule-based generation if all keys exhausted

## How Many Keys Do You Need?

- **Light Usage**: 3-4 keys (4500-6000 requests/day)
- **Medium Usage**: 5-7 keys (7500-10,500 requests/day)
- **Heavy Usage**: 10+ keys or upgrade to paid tier

## Alternative: Upgrade to Paid Tier

If creating multiple accounts is inconvenient:
1. Go to https://aistudio.google.com
2. Enable billing on your Google Cloud project
3. Paid tier has much higher limits
4. Cost: ~$0.075 per 1M input tokens

## Need Help?

- Check `backend/config/settings.py` line 153 to see how keys are parsed
- Run `python manage.py test_gemini_keys` to verify keys are working
- Check Django server logs for rotation messages
- Current error messages guide users to this file

## Implementation Details

The system automatically:
- ✅ Parses comma-separated keys from env
- ✅ Rotates on quota errors (429 status)
- ✅ Tracks usage per key separately
- ✅ Falls back to rule-based generation
- ✅ Logs all rotation attempts

No code changes needed - just add keys to `.env`!
