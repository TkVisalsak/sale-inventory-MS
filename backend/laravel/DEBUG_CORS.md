# Debug CORS Wildcard Issue

## Current Problem
Still seeing `Access-Control-Allow-Origin: *` in response headers.

## Changes Made

1. **Middleware runs LAST** (using `append` instead of `prepend`)
2. **Force removes** all CORS headers (case-insensitive)
3. **Force sets** correct headers with specific origin

## Debug Steps

1. **Verify middleware is running**:
   Add this temporarily to `HandleCors.php`:
   ```php
   \Log::info('CORS Middleware Running', [
       'origin' => $origin,
       'is_allowed' => $isAllowedOrigin,
   ]);
   ```
   
   Then check `storage/logs/laravel.log` when making a request.

2. **Check what's setting wildcard**:
   Add this to see all headers before we modify:
   ```php
   \Log::info('Headers before CORS fix', $response->headers->all());
   ```

3. **Test with curl** to see raw response:
   ```bash
   curl -X OPTIONS http://localhost:8000/api/login \
     -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: POST" \
     -i
   ```

4. **Check if server was restarted**:
   - Stop server completely (Ctrl+C)
   - Clear cache: `php artisan config:clear`
   - Restart: `php artisan serve --host=localhost --port=8000`

## Possible Causes

1. **Server not restarted** - Most common issue
2. **Another middleware** setting headers after ours
3. **Response macro** or event listener modifying headers
4. **Browser cache** - Try incognito mode
5. **PHP-FPM/Apache** setting headers at server level

## Next Steps if Still Not Working

If still seeing wildcard after restart:
1. Check `storage/logs/laravel.log` for our debug messages
2. Check if there's a `config/cors.php` file we need to disable
3. Check Apache/Nginx config for CORS headers
4. Try using Laravel's built-in CORS package instead

