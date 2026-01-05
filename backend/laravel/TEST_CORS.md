# Testing CORS Fix

## Steps to Verify

1. **Restart Laravel server** (IMPORTANT - changes won't work until restart):
   ```bash
   # Stop server (Ctrl+C)
   php artisan serve --host=localhost --port=8000
   ```

2. **Test OPTIONS request** (preflight):
   Open browser DevTools → Network tab → Try to login
   
   Check the OPTIONS request to `/api/login`:
   - Response headers should show:
     - `Access-Control-Allow-Origin: http://localhost:3001` (NOT `*`)
     - `Access-Control-Allow-Credentials: true`

3. **If still seeing wildcard `*`**:
   - Check if server was restarted
   - Clear cache: `php artisan config:clear`
   - Check browser is accessing via `http://localhost:3001` (not IP)
   - Try incognito mode to rule out browser cache

4. **Debug with curl**:
   ```bash
   curl -X OPTIONS http://localhost:8000/api/login \
     -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   
   Look for in response:
   ```
   < Access-Control-Allow-Origin: http://localhost:3001
   < Access-Control-Allow-Credentials: true
   ```
   
   Should NOT see:
   ```
   < Access-Control-Allow-Origin: *
   ```

## Current Configuration

- ✅ Middleware: `HandleCors` runs first on API routes
- ✅ Allowed origins: `http://localhost:3000`, `http://localhost:3001`
- ✅ Headers: Specific origin (not wildcard), credentials allowed

## If Still Not Working

The middleware explicitly removes all CORS headers and sets new ones. If you still see wildcard, something else is setting headers AFTER our middleware runs. Check:

1. Other middleware in the stack
2. Response from controller setting headers
3. Server-level CORS (Apache/Nginx)

