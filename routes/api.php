<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\InscriptionController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ClasseController;
use App\Http\Controllers\Api\FamilleController;
use App\Http\Controllers\Api\VilleController;
use App\Http\Controllers\Api\FonctionController;
use App\Http\Controllers\Api\PhotoUploadController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\API\MemberController;
use App\Http\Controllers\AuthenticatedRegistrationController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\ExcelImportController;
use App\Http\Controllers\Admin\TresorerieController as AdminTresorerieController;
use App\Http\Controllers\Conducteur\TresorerieController as ConducteurTresorerieController;
use App\Http\Controllers\MembreFamille\FinancesController as MembreFamilleFinancesController;
use App\Http\Controllers\ResponsableFamille\TresorerieController as ResponsableFamilleTresorerieController;

// Routes publiques (sans authentification)
Route::get('/classes', [ClasseController::class, 'index']);
Route::get('/familles', [FamilleController::class, 'index']);
Route::get('/villes', [VilleController::class, 'index']);
Route::get('/fonctions', [FonctionController::class, 'index']);

// Route publique pour uploader des photos lors de l'inscription (avant authentification)
Route::post('/photo/upload-inscription', [PhotoUploadController::class, 'uploadInscriptionPhoto']);

// Paiement public (don en ligne depuis Welcome)
Route::post('/payment', [PaymentController::class, 'store']);

// Route API standard documentée pour upload photo (authentifié)
Route::middleware(['auth:web'])->post('/photo/upload', [PhotoController::class, 'upload']);

// Routes d'adresses avec rate limiting
Route::middleware(['throttle:60,1'])->group(function () {
    Route::post('/address/autocomplete', [AddressController::class, 'autocomplete']);
    Route::post('/address/details', [AddressController::class, 'details']);
    Route::post('/address/validate', [AddressController::class, 'validate']);
});

Route::middleware(['auth:web'])->group(function () {
    // Inscriptions API
    Route::get('/inscriptions/pending', [InscriptionController::class, 'pending']);
    Route::get('/inscriptions/{id}', [InscriptionController::class, 'show']);

    // Ajout de membre à la famille
    Route::post('/members/add-to-family', [MemberController::class, 'addToFamily']);

    // Enregistrement d'utilisateurs authentifiés (pas besoin d'approbation)
    Route::post('/authenticated/register/family', [AuthenticatedRegistrationController::class, 'registerFamily']);
    Route::post('/authenticated/register/conductor', [AuthenticatedRegistrationController::class, 'registerConductor']);

    // Upload et suppression de photos de profil
    Route::post('/profile/photo/upload', [PhotoUploadController::class, 'uploadProfilePhoto']);
    Route::delete('/profile/photo/delete', [PhotoUploadController::class, 'deleteProfilePhoto']);

    // Route API standard documentée pour suppression photo
    Route::delete('/photo/delete', [PhotoController::class, 'delete']);

    // Trésorerie - Responsable de famille
    Route::middleware('role:responsable_famille')
        ->prefix('responsable-famille/tresorerie')
        ->group(function () {
            Route::post('/paiements', [ResponsableFamilleTresorerieController::class, 'storePaiement']);
            Route::post('/paiements/initiate', [ResponsableFamilleTresorerieController::class, 'initiatePaiement']);
            Route::post('/dons', [ResponsableFamilleTresorerieController::class, 'storeDon']);
        });

    // Trésorerie - Admin
    Route::middleware('role:admin')
        ->prefix('admin/tresorerie')
        ->group(function () {
            Route::post('/cotisations', [AdminTresorerieController::class, 'storeCotisation']);
            Route::put('/cotisations/{cotisation}', [AdminTresorerieController::class, 'updateCotisation']);

            Route::post('/campagnes', [AdminTresorerieController::class, 'storeCampagne']);
            Route::put('/campagnes/{campagne}', [AdminTresorerieController::class, 'updateCampagne']);
            Route::post('/campagnes/{campagne}/close', [AdminTresorerieController::class, 'closeCampagne']);
        });

    // Trésorerie - Membre de famille
    Route::middleware('role:membre_famille')
        ->prefix('membre-famille/finances')
        ->group(function () {
            Route::post('/paiements', [MembreFamilleFinancesController::class, 'storePaiement']);
            Route::post('/dons', [MembreFamilleFinancesController::class, 'storeDon']);
        });

    // Trésorerie - Conducteur
    Route::middleware('role:conducteur')
        ->prefix('conducteur/tresorerie')
        ->group(function () {
            Route::post('/cotisations', [ConducteurTresorerieController::class, 'storeCotisation']);
        });
});

// Inclure les routes d'approbation des inscriptions
require_once __DIR__ . '/api_inscriptions_approval.php';
// === WEBHOOKS (sans authentification) ===
Route::post('/paydunya/webhook', [PaymentController::class, 'webhook'])->name('paydunya.webhook');
