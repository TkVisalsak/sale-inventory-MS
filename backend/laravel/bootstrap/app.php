<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Remove Laravel's default HandleCors middleware (it uses wildcard *)
        $middleware->remove(\Illuminate\Http\Middleware\HandleCors::class);
        
        // Add our custom CORS middleware as global middleware FIRST
        // This ensures it handles preflight OPTIONS requests for ALL routes
        $middleware->prepend(\App\Http\Middleware\HandleCors::class);
        
        // Enable sessions for API routes (needed for authentication)
        $middleware->api(prepend: [
            \Illuminate\Session\Middleware\StartSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

