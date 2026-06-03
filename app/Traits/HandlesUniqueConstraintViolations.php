<?php

namespace App\Traits;

use App\Services\UniqueConstraintChecker;
use App\Exceptions\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;

/**
 * Trait pour gérer les violations de contraintes UNIQUE
 * Offre des méthodes utiles pour vérifier et rapporter les erreurs d'unicité
 */
trait HandlesUniqueConstraintViolations
{
    /**
     * Instance du service de vérification
     */
    protected UniqueConstraintChecker $uniqueChecker;

    /**
     * Initialiser le service
     */
    protected function initializeUniqueChecker(): void
    {
        $this->uniqueChecker = app(UniqueConstraintChecker::class);
    }

    /**
     * Vérifier une contrainte UNIQUE et retourner une erreur formatée
     *
     * @param callable $checkCallback Fonction qui lance UniqueConstraintViolationException
     * @param string $errorMessage Message d'erreur par défaut
     * @return JsonResponse|null Null si validation passée, JsonResponse si erreur
     */
    protected function checkAndCatchUniqueViolation(
        callable $checkCallback,
        string $errorMessage = "Une erreur de validation s'est produite."
    ): ?JsonResponse {
        try {
            call_user_func($checkCallback);
            return null; // ✅ Pas d'erreur
        } catch (UniqueConstraintViolationException $e) {
            return $this->errorResponse(
                message: $e->getHumanMessage(),
                field: $e->getField(),
                value: $e->getValue(),
                statusCode: 422,
                errorData: $e->toArray()
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                message: $errorMessage,
                statusCode: 500
            );
        }
    }

    /**
     * Réponse d'erreur formatée en JSON
     */
    protected function errorResponse(
        string $message,
        ?string $field = null,
        ?string $value = null,
        int $statusCode = 422,
        ?array $errorData = null
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'field' => $field,
            'value' => $value,
            'type' => 'ValidationError',
            'errors' => $errorData ? [$errorData] : [],
            'timestamp' => now()->toIso8601String(),
        ], $statusCode);
    }

    /**
     * Réponse de succès formatée en JSON
     */
    protected function successResponse(
        array $data = [],
        string $message = "Opération réussie",
        int $statusCode = 200
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ], $statusCode);
    }
}
