<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $exception)
    {
        // Gérer les exceptions d'authentification pour les API
        if ($exception instanceof AuthenticationException) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first',
                    'type' => 'AuthenticationError',
                    'errors' => ['auth' => 'You are not authenticated'],
                    'timestamp' => now()->toIso8601String(),
                ], 401);
            }
        }

        // Gérer les exceptions d'autorisation pour les API
        if ($exception instanceof AuthorizationException) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - You do not have permission to access this resource',
                    'type' => 'AuthorizationError',
                    'errors' => ['auth' => 'Insufficient permissions'],
                    'timestamp' => now()->toIso8601String(),
                ], 403);
            }
        }

        // Gérer les exceptions de contrainte UNIQUE
        if ($exception instanceof UniqueConstraintViolationException) {
            return response()->json([
                'success' => false,
                'message' => $exception->getHumanMessage(),
                'field' => $exception->getField(),
                'value' => $exception->getValue(),
                'type' => 'UniqueConstraintViolation',
                'errors' => [$exception->toArray()],
                'timestamp' => now()->toIso8601String(),
            ], 422);
        }

        // Gérer les erreurs QueryException (erreurs DB)
        if ($exception instanceof QueryException) {
            // Vérifier si c'est une erreur UNIQUE
            if (strpos($exception->getMessage(), 'Duplicate entry') !== false) {
                // Extraire l'info de l'erreur
                preg_match("/Duplicate entry '(.+?)' for key '(.+?)'/", $exception->getMessage(), $matches);
                $value = $matches[1] ?? 'Unknown';
                $key = $matches[2] ?? 'Unknown';

                // Extraire le nom du champ du nom de la clé
                // Format: table_field_unique => field
                preg_match('/([a-z_]+)_unique/', $key, $fieldMatches);
                $field = $fieldMatches[1] ?? 'email';

                return response()->json([
                    'success' => false,
                    'message' => "La valeur '$value' existe déjà dans la base de données.",
                    'field' => $field,
                    'value' => $value,
                    'type' => 'DatabaseConstraintViolation',
                    'timestamp' => now()->toIso8601String(),
                ], 422);
            }
        }

        // Gérer les ValidationException (validations Laravel)
        if ($exception instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'type' => 'ValidationError',
                'errors' => $exception->errors(),
                'timestamp' => now()->toIso8601String(),
            ], 422);
        }

        return parent::render($request, $exception);
    }
}
