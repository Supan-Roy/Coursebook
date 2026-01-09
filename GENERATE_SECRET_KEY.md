# 🔑 How to Generate Django Secret Key

## Method 1: Using Python Command (Recommended)

Run this command in your terminal:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**On Windows (PowerShell):**
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**On Windows (Command Prompt):**
```cmd
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

This will output something like:
```
django-insecure-abc123xyz789...very-long-string...
```

Copy the entire output and use it as your `DJANGO_SECRET_KEY`.

## Method 2: Using Django Shell

```bash
cd backend
python manage.py shell
```

Then in the shell:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

## Method 3: Online Generator (Less Secure)

You can also use: https://djecrety.ir/

But Method 1 is recommended as it uses Django's official generator.

## ⚠️ Important:
- **Never share your secret key publicly**
- **Never commit it to Git**
- **Use a different key for production vs development**
- **Keep it secure and don't lose it**

