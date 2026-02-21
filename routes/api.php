<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\InscriptionController;
use App\Http\Controllers\Api\ClasseController;
use App\Http\Controllers\Api\FamilleController;
use App\Http\Controllers\Api\VilleController;
use App\Http\Controllers\Api\FonctionController;
use App\Http\Controllers\Api\PhotoUploadController;
use App\Http\Controllers\API\MemberController;
use App\Http\Controllers\AuthenticatedRegistrationController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\ExcelImportController;

// Routes publiques (sans authentification)
Route::get('/classes', [ClasseController::class, 'index']);
Route::get('/familles', [FamilleController::class, 'index']);
Route::get('/villes', [VilleController::class, 'index']);
Route::get('/fonctions', [FonctionController::class, 'index']);

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
    // Route pour importer via Excel (Admin - Authentifié)
    Route::post('/admin/inscriptions/import-excel', [ExcelImportController::class, 'import'])->name('admin.inscriptions.import-excel');

    // Ajout de membre à la famille
    Route::post('/members/add-to-family', [MemberController::class, 'addToFamily']);

    // Enregistrement d'utilisateurs authentifiés (pas besoin d'approbation)
    Route::post('/authenticated/register/family', [AuthenticatedRegistrationController::class, 'registerFamily']);
    Route::post('/authenticated/register/conductor', [AuthenticatedRegistrationController::class, 'registerConductor']);

    // Upload et suppression de photos de profil
    Route::post('/profile/photo/upload', [PhotoUploadController::class, 'uploadProfilePhoto']);
    Route::delete('/profile/photo/delete', [PhotoUploadController::class, 'deleteProfilePhoto']);
});

// Inclure les routes d'approbation des inscriptions
require_once __DIR__ . '/api_inscriptions_approval.php';
