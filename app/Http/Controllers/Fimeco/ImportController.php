<?php

namespace App\Http\Controllers\Fimeco;

use App\Http\Controllers\Controller;
use App\Services\FimecoImportService;
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
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        try {
            $result = $this->service->importSouscriptions($request->file('file'), Auth::user());
        } catch (\Throwable $e) {
            Log::error('Erreur import FIMECO souscriptions', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'import : " . $e->getMessage(),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => "{$result['created']} souscription(s) créée(s), {$result['updated']} mise(s) à jour, {$result['skipped']} ligne(s) ignorée(s).",
            'data' => $result,
        ]);
    }

    public function importVersements(Request $request): JsonResponse
    {
        $this->authorizeFimecoResponsable();

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        try {
            $result = $this->service->importVersements($request->file('file'), Auth::user());
        } catch (\Throwable $e) {
            Log::error('Erreur import FIMECO versements', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'import : " . $e->getMessage(),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => "{$result['created']} versement(s) importé(s), {$result['duplicates']} déjà présent(s), {$result['skipped']} ligne(s) ignorée(s).",
            'data' => $result,
        ]);
    }

    private function authorizeFimecoResponsable(): void
    {
        $user = Auth::user();
        abort_unless($user && ($user->role === 'admin' || $user->hasFonction('Responsable FIMECO')), 403, 'Accès réservé au Responsable FIMECO.');
    }
}
