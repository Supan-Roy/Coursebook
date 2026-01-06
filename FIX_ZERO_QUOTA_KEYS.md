# URGENT: Your New API Keys Have Zero Quota

## The Problem

Your new API keys show **"limit: 0"** in the error logs:
```
Quota exceeded for metric: ...free_tier_requests, limit: 0
```

This means the keys were **created incorrectly** or from projects without the Generative AI API enabled.

---

## How to Fix: Generate Keys Correctly

### Step 1: Use the Correct Link
❌ **Don't use**: Google Cloud Console directly  
✅ **Do use**: https://aistudio.google.com/app/apikey (AI Studio)

### Step 2: Create Keys Properly

1. **Open in INCOGNITO/PRIVATE window** (to use a fresh Google account)
   - Chrome: `Ctrl+Shift+N`
   - Firefox: `Ctrl+Shift+P`
   - Edge: `Ctrl+Shift+N`

2. **Go to**: https://aistudio.google.com/app/apikey

3. **Sign in** with a Google account (create new one if needed)

4. **Click "Create API Key"**
   - Select "Create API key in new project"
   - **DO NOT** select an existing project with disabled APIs

5. **Copy the key immediately** (starts with `AIza...`)

6. **Repeat 3-5 more times** with different Google accounts

### Step 3: Verify Keys Work

Before adding to `.env`, test each key:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_KEY_HERE" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

**Good response**: JSON with `"text": "..."` (actual content)  
**Bad response**: `"limit: 0"` or `"API not enabled"`

---

## Why Your Keys Have Zero Quota

Your keys show these errors:
- `generate_content_free_tier_requests, limit: 0` ← No free tier quota
- `generate_content_free_tier_input_token_count, limit: 0` ← No token quota

This happens when:
1. ❌ Keys created in Google Cloud Console (not AI Studio)
2. ❌ Keys from projects with Generative AI API disabled
3. ❌ Keys from projects with billing issues
4. ❌ Keys from regions where Gemini free tier is unavailable

---

## Correct Process (Step by Step)

### Account 1:
```
1. Open Chrome incognito
2. Go to: https://aistudio.google.com/app/apikey
3. Sign in with account1@gmail.com
4. Click "Create API Key" → "Create API key in new project"
5. Copy key: AIza... (should be 39 characters)
6. Test key with curl command above
7. If successful, save key
```

### Account 2-7:
```
Repeat above with different Google accounts
Use incognito windows to avoid mixing accounts
```

### Update .env:
```env
GEMINI_API_KEYS=working_key1,working_key2,working_key3,working_key4,working_key5
```

---

## Alternative: Enable API on Existing Projects

If you want to use your existing keys:

1. Go to: https://console.cloud.google.com
2. Select each project (associated with each key)
3. Go to "APIs & Services" → "Library"
4. Search for "Generative Language API"
5. Click "Enable"
6. Wait 1-2 minutes
7. Test keys again

**But**: Creating new keys in AI Studio is faster and more reliable.

---

## Quick Test Script

Save this as `test_key.py`:

```python
import os
import requests

def test_key(api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    data = {"contents": [{"parts": [{"text": "Hi"}]}]}
    response = requests.post(url, json=data)
    
    print(f"Key: {api_key[:15]}...")
    if response.status_code == 200:
        print("✅ WORKING - Has quota")
        return True
    elif "limit: 0" in response.text:
        print("❌ ZERO QUOTA - Key created incorrectly")
    elif "API_KEY_INVALID" in response.text:
        print("❌ INVALID - Key doesn't exist")
    elif "403" in str(response.status_code):
        print("❌ DISABLED - API not enabled for project")
    else:
        print(f"❌ ERROR - {response.status_code}: {response.text[:100]}")
    return False

# Test your keys
keys = [
  "<YOUR_KEY_1>",
  "<YOUR_KEY_2>",
  "<YOUR_KEY_3>",
  "<YOUR_KEY_4>"
]

for key in keys:
    test_key(key)
    print()
```

Run: `python test_key.py`

---

## Expected Results

**Working keys will show**:
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Hello! How can I help you today?"}]
    }
  }],
  "usageMetadata": {
    "promptTokenCount": 2,
    "candidatesTokenCount": 8
  }
}
```

**Your current keys show**:
```json
{
  "error": {
    "message": "Quota exceeded",
    "violations": [{
      "quota_metric": "...free_tier_requests",
      "limit": 0  ← This is the problem!
    }]
  }
}
```

---

## Summary

Your keys **physically exist** but have **zero quota assigned**. This is a Google API configuration issue, not a code issue.

**Solution**: Generate new keys from https://aistudio.google.com/app/apikey using fresh Google accounts, ensuring you select "Create API key in new project" so the Generative AI API is automatically enabled.

**Time required**: 10-15 minutes to create 5-7 working keys
