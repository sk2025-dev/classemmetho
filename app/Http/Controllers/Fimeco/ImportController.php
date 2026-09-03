<?php

namespace App\Http\Controllers\Fimeco;

use App\Http\Controllers\Controller;
use App\Models\FimecoImportLog;
use App\Services\FimecoImportService;
use App\Support\FimecoAccess;
use App\Support\FimecoCotisation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ImportController extends Controller
{
    public function __construct(private readonly FimecoImportService $service)
    {
    }

    public function importSouscriptions(Request $request): JsonResponse
    {
        $this->authorizeFimecoResponsable();

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:20480'],
        ]);

        $filename = $request->file('file')->getClientOriginalName();

        try {
            $result = $this->service->importSouscriptions($request->file('file'), Auth::user());
        } catch (\Throwable $e) {
            Log::error('Erreur import FIMECO souscriptions', ['message' => $e->getMessage()]);

            $this->recordLog(FimecoImportLog::TYPE_SOUSCRIPTIONS, $filename, [], false, "Erreur lors de l'import : " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'import : " . $e->getMessage(),
            ], 400);
        }

        $message = "{$result['created']} souscription(s) créée(s), {$result['updated']} mise(s) à jour, {$result['skipped']} ligne(s) ignorée(s).";
        $this->recordLog(FimecoImportLog::TYPE_SOUSCRIPTIONS, $filename, $result, true, $message);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $result,
        ]);
    }

    public function importVersements(Request $request): JsonResponse
    {
        $this->authorizeFimecoResponsable();

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:20480'],
        ]);

        $filename = $request->file('file')->getClientOriginalName();

        // Le module est global : on provisionne la cotisation FIMECO à la volée
        // plutôt que d'exiger une création manuelle préalable.
        FimecoCotisation::ensureGlobal(Auth::id());

        try {
            $result = $this->service->importVersements($request->file('file'), Auth::user());
        } catch (\Throwable $e) {
            Log::error('Erreur import FIMECO versements', ['message' => $e->getMessage()]);

            $this->recordLog(FimecoImportLog::TYPE_VERSEMENTS, $filename, [], false, "Erreur lors de l'import : " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'import : " . $e->getMessage(),
            ], 400);
        }

        if ($result['created'] === 0 && !empty($result['errors'][0]['reason']) && $result['errors'][0]['line'] === null) {
            $this->recordLog(FimecoImportLog::TYPE_VERSEMENTS, $filename, $result, false, $result['errors'][0]['reason']);

            return response()->json([
                'success' => false,
                'message' => $result['errors'][0]['reason'],
                'data' => $result,
            ], 422);
        }

        $message = "{$result['created']} versement(s) importé(s), {$result['duplicates']} déjà présent(s), {$result['skipped']} ligne(s) ignorée(s).";
        $this->recordLog(FimecoImportLog::TYPE_VERSEMENTS, $filename, $result, true, $message);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $result,
        ]);
    }

    private function authorizeFimecoResponsable(): void
    {
        $user = Auth::user();
        abort_unless(FimecoAccess::canManage($user), 403, 'Accès réservé au Responsable FIMECO.');
    }

    /**
     * Journalise un import (réussi ou en échec) pour consultation ultérieure.
     */
    private function recordLog(string $type, ?string $filename, array $result, bool $success, ?string $message): void
    {
        try {
            $errors = array_values($result['errors'] ?? []);

            FimecoImportLog::query()->create([
                'type' => $type,
                'original_filename' => $filename,
                'user_id' => Auth::id(),
                'success' => $success,
                'created_count' => (int) ($result['created'] ?? 0),
                'updated_count' => (int) ($result['updated'] ?? 0),
                'duplicate_count' => (int) ($result['duplicates'] ?? 0),
                'skipped_count' => (int) ($result['skipped'] ?? 0),
                'error_count' => count($errors),
                'message' => $message,
                'errors' => $errors,
            ]);
        } catch (\Throwable $e) {
            // Le journal ne doit jamais faire échouer l'import lui-même.
            Log::warning('Impossible de journaliser l\'import FIMECO', ['message' => $e->getMessage()]);
        }
    }
}
