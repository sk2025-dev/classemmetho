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

use App\Http\Controllers\Api\DiagnosticController;

// Routes publiques (sans authentification)
Route::get('/classes', [ClasseController::class, 'index']);
Route::get('/familles', [FamilleController::class, 'index']);
Route::get('/villes', [VilleController::class, 'index']);
Route::get('/fonctions', [FonctionController::class, 'index']);

// Route de diagnostic (sans authentification)
Route::get('/diagnostic/auth-status', [DiagnosticController::class, 'checkAuth']);

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

    // Import Excel (Admin)
    Route::post('/import-excel', [ExcelImportController::class, 'import'])->middleware('role:admin');

    // Ajout de membre à la famille
    Route::post('/members/add-to-family', [MemberController::class, 'addToFamily']);

    // Enregistrement d'utilisateurs authentifiés (pas besoin d'approbation)
    Route::post('/authenticated/register/family', [AuthenticatedRegistrationController::class, 'registerFamily']);
    Route::post('/authenticated/register/conductor', [AuthenticatedRegistrationController::class, 'registerConductor']);

    // Upload et suppression de photos de profil
    Route::post('/profile/photo/upload', [PhotoUploadController::class, 'uploadProfilePhoto']);
    Route::delete('/profile/photo/delete', [PhotoUploadController::class, 'deleteProfilePhoto']);

    // Routes Admin pour la gestion des utilisateurs (API)
    Route::middleware(['role:admin'])->prefix('/admin/users')->name('admin.users.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\UserManagementController::class, 'index'])->name('api.index');
        Route::get('/stats', [\App\Http\Controllers\Admin\UserManagementController::class, 'getStats'])->name('api.stats');
        Route::get('/classes', [\App\Http\Controllers\Admin\UserManagementController::class, 'getClasses'])->name('api.classes');
        Route::get('/fonctions', [\App\Http\Controllers\Admin\UserManagementController::class, 'getFonctions'])->name('api.fonctions');
        Route::get('/{id}', [\App\Http\Controllers\Admin\UserManagementController::class, 'show'])->name('api.show');
        Route::patch('/{id}/status', [\App\Http\Controllers\Admin\UserManagementController::class, 'updateStatus'])->name('api.updateStatus');
    });
});

// Routes Admin pour les classes et fonctions (API avec authentification)
// NOTE: Ces routes sont déjà définies dans web.php avec Route::resource()
// Laissez-les ici uniquement pour les endpoints GET qui retournent du JSON
Route::middleware(['auth:web', 'role:admin'])->prefix('/admin')->group(function () {
    // Classes API - GET only (pour les données JSON)
    Route::get('/classes', [\App\Http\Controllers\Admin\ClasseController::class, 'index'])->name('admin.classes.json');
    Route::get('/classes/{classe}', [\App\Http\Controllers\Admin\ClasseController::class, 'show'])->name('admin.classes.json.show');

    // Fonctions API - GET only
    Route::get('/fonctions', [\App\Http\Controllers\Admin\FonctionController::class, 'index'])->name('admin.fonctions.json');
    Route::get('/fonctions/{fonction}', [\App\Http\Controllers\Admin\FonctionController::class, 'show'])->name('admin.fonctions.json.show');
});

// Inclure les routes d'approbation des inscriptions
require_once __DIR__ . '/api_inscriptions_approval.php';
