<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

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
