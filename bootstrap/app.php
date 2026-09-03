<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureUtf8Encoding;
use App\Http\Middleware\ApiUtf8Encoding;
use App\Http\Middleware\EnsureFimecoResponsable;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'conducteur/inscriptions/*/approve',
            'conducteur/inscriptions/*/reject',
            'conducteur/dashboard/inscriptions/*/approve',
            'conducteur/dashboard/inscriptions/*/reject',
        ]);

        $middleware->web(prepend: [
            EnsureUtf8Encoding::class,
        ], append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->api(prepend: [
            ApiUtf8Encoding::class,
        ]);

        $middleware->statefulApi();

        $middleware->alias([
            'role' => CheckRole::class,
            'fimeco' => EnsureFimecoResponsable::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
