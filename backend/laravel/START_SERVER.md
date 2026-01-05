# How to Start Servers on Localhost

## Laravel Backend (Port 8000)

Start the Laravel server on localhost (not 127.0.0.1):

```bash
cd backend/laravel
php artisan serve --host=localhost --port=8000
```

This will start the server at: **http://localhost:8000**

The API will be available at: **http://localhost:8000/api**

**Note:** By default, `php artisan serve` uses `127.0.0.1:8000`. You must specify `--host=localhost` to use localhost.

## React/Next.js Frontend (Port 3001)

Start the Next.js frontend on localhost:

```bash
cd frontend
npm run dev
```

By default, Next.js will start on: **http://localhost:3000**

If port 3000 is busy, it will use **http://localhost:3001**

## To Force a Specific Port

### Frontend (Next.js)
```bash
npm run dev -- -p 3001
```

Or create/update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

### Backend (Laravel)
```bash
php artisan serve --host=localhost --port=8000
```

## Current Configuration

✅ **Frontend**: `http://localhost:3001` (or `:3000`)
✅ **Backend API**: `http://localhost:8000/api`
✅ **CORS Allowed**: `http://localhost:3000`, `http://localhost:3001`

## Access Your Application

1. Start Laravel: `php artisan serve --host=localhost --port=8000` → `http://localhost:8000`
2. Start Frontend: `npm run dev` → `http://localhost:3001`
3. Open browser: `http://localhost:3001`
4. Login page should work without CORS errors!

## Important Notes

- **Always use `localhost`** - don't mix with `127.0.0.1` or IP addresses
- Both servers must be running
- Access frontend at `http://localhost:3001` (not IP address)
- API calls will automatically go to `http://localhost:8000/api`

