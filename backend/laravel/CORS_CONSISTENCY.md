# CORS Consistency Guide

## Important: Use Consistent Origins

Browsers treat `localhost`, `127.0.0.1`, and IP addresses like `192.168.141.1` as **different origins**. You must use the same origin consistently across:

1. Frontend URL (where you access the app)
2. Backend API URL (in `frontend/lib/api.js`)
3. CORS allowed origins (in `backend/laravel/app/Http/Middleware/HandleCors.php`)

## Current Configuration: localhost

The system is configured to use **localhost** consistently:

- **Frontend**: `http://localhost:3001` (or `:3000`)
- **Backend API**: `http://localhost:8000/api`
- **CORS Allowed**: `http://localhost:3000`, `http://localhost:3001`

## If You Need to Use IP Address

If you need to access from a different machine on your network (e.g., `192.168.141.1`), update **all three** locations:

### 1. Frontend API URL
Edit `frontend/lib/api.js`:
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.141.1:8000/api"
```

### 2. CORS Middleware
Edit `backend/laravel/app/Http/Middleware/HandleCors.php`:
```php
$allowedOrigins = [
    'http://192.168.141.1:3000',
    'http://192.168.141.1:3001',
];
```

### 3. Access Frontend
Access your frontend at: `http://192.168.141.1:3001`

### 4. Start Laravel Server
Start Laravel with the IP:
```bash
php artisan serve --host=192.168.141.1 --port=8000
```

## Environment Variable Option

You can also use environment variables for flexibility:

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Backend** (`.env`):
```
FRONTEND_URL=http://localhost:3001
```

Then update the CORS middleware to read from config.

## Quick Check

To verify consistency, check:
- ✅ Frontend accessed at: `http://localhost:3001`
- ✅ API calls go to: `http://localhost:8000/api`
- ✅ CORS allows: `http://localhost:3001`

All three must match!

