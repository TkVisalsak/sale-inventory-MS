# CORS Configuration for Cross-Origin Requests

## Issue
When using `credentials: "include"` in fetch requests, the CORS policy requires:
- `Access-Control-Allow-Origin` must be a **specific origin** (not wildcard `*`)
- `Access-Control-Allow-Credentials` must be `true`

## Solution Implemented

1. **Custom CORS Middleware** (`app/Http/Middleware/HandleCors.php`)
   - Handles preflight OPTIONS requests
   - Sets proper CORS headers with specific origin
   - Allows credentials

2. **Session Configuration**
   - For cross-origin cookies to work, update your `.env` file:

```env
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=false  # Set to true in production with HTTPS
```

**Note:** For local development with HTTP, you may need to:
- Use `same_site: 'lax'` instead of `'none'` if cookies aren't working
- Or set up HTTPS for local development

## Allowed Origins

The middleware currently allows these origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- `http://192.168.141.1:3000`
- `http://192.168.141.1:3001`

To add more origins, edit `app/Http/Middleware/HandleCors.php` and add to the `$allowedOrigins` array.

## Testing

After updating the configuration:
1. Clear Laravel config cache: `php artisan config:clear`
2. Restart your Laravel server
3. Try logging in from your frontend

## Troubleshooting

If cookies still don't work:
1. Check browser console for cookie warnings
2. Verify `SESSION_SAME_SITE` in `.env`
3. For local HTTP, try `SESSION_SAME_SITE=lax` instead of `none`
4. Ensure frontend is using `credentials: "include"` in fetch requests

