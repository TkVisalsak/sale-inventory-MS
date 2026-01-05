# CORS Troubleshooting

## If you still see wildcard '*' error

The error "The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when credentials mode is 'include'" means something is setting wildcard headers.

### Solution Applied

The `HandleCors` middleware now:
1. **Removes** any existing CORS headers before setting new ones
2. **Only sets** headers if origin is in allowed list
3. **Uses specific origin** (not wildcard)

### Steps to Fix

1. **Restart Laravel server** (important!):
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   php artisan serve --host=localhost --port=8000
   ```

2. **Clear Laravel cache**:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

3. **Verify middleware is running**:
   - Check `bootstrap/app.php` - `HandleCors` should be in `api(prepend: [...])`
   - It should run BEFORE other middleware

4. **Test the preflight request**:
   - Open browser DevTools → Network tab
   - Try to login
   - Check the OPTIONS request to `/api/login`
   - Response headers should show:
     - `Access-Control-Allow-Origin: http://localhost:3001` (specific, not `*`)
     - `Access-Control-Allow-Credentials: true`

### Debug Steps

If still not working:

1. **Check if other middleware is interfering**:
   ```bash
   php artisan route:list --path=api/login
   ```

2. **Verify origin is being sent**:
   - In browser DevTools → Network → Request Headers
   - Should see: `Origin: http://localhost:3001`

3. **Check Laravel logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

4. **Test with curl**:
   ```bash
   curl -X OPTIONS http://localhost:8000/api/login \
     -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   
   Should see in response:
   ```
   < Access-Control-Allow-Origin: http://localhost:3001
   < Access-Control-Allow-Credentials: true
   ```

### Common Issues

- **Server not restarted**: Changes to middleware require server restart
- **Cache not cleared**: Config cache might have old settings
- **Wrong origin**: Frontend must access via `http://localhost:3001` (not IP)
- **Browser cache**: Clear browser cache or use incognito mode

