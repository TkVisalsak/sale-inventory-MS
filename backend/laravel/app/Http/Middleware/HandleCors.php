<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the origin from the request
        $origin = $request->headers->get('Origin');
        
        // Log for debugging
        \Log::info('CORS Middleware Running', [
            'origin' => $origin,
            'method' => $request->getMethod(),
            'path' => $request->path(),
            'full_url' => $request->fullUrl(),
        ]);
        
        // Allowed origins (use localhost consistently - do not mix with IP addresses)
        $allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
        ];

        // Check if origin is allowed
        $isAllowedOrigin = $origin && in_array($origin, $allowedOrigins);

        // Handle preflight requests first - MUST return CORS headers
        if ($request->getMethod() === 'OPTIONS') {
            \Log::info('CORS Preflight Request', ['origin' => $origin, 'allowed' => $isAllowedOrigin]);
            
            $response = response('', 200);
            
            if ($isAllowedOrigin) {
                // Set correct CORS headers with specific origin (NOT wildcard)
                $response->headers->set('Access-Control-Allow-Origin', $origin, true);
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH', true);
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-TOKEN', true);
                $response->headers->set('Access-Control-Allow-Credentials', 'true', true);
                $response->headers->set('Access-Control-Max-Age', '86400', true);
                
                \Log::info('CORS Preflight Response Headers Set', [
                    'origin_header' => $response->headers->get('Access-Control-Allow-Origin'),
                ]);
            } else {
                \Log::warning('CORS Preflight - Origin not allowed', ['origin' => $origin]);
            }
            
            return $response;
        }

        // Process the request
        $response = $next($request);

        // Debug: Log headers before we modify them
        \Log::info('Headers BEFORE CORS fix', [
            'cors_origin' => $response->headers->get('Access-Control-Allow-Origin'),
            'all_headers' => array_keys($response->headers->all()),
        ]);

        // Remove ALL CORS headers (case-insensitive check)
        $headersToRemove = [
            'Access-Control-Allow-Origin',
            'access-control-allow-origin',
            'Access-Control-Allow-Methods',
            'access-control-allow-methods',
            'Access-Control-Allow-Headers',
            'access-control-allow-headers',
            'Access-Control-Allow-Credentials',
            'access-control-allow-credentials',
            'Access-Control-Max-Age',
            'access-control-max-age',
            'Access-Control-Expose-Headers',
            'access-control-expose-headers',
        ];
        
        foreach ($headersToRemove as $header) {
            $response->headers->remove($header);
        }

        // Add correct CORS headers with specific origin (NOT wildcard)
        if ($isAllowedOrigin) {
            // Use direct array access to ensure headers are set correctly
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-TOKEN');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
            
            // Debug: Log headers after we set them
            \Log::info('Headers AFTER CORS fix', [
                'cors_origin' => $response->headers->get('Access-Control-Allow-Origin'),
            ]);
        }
        
        return $response;
    }
}

