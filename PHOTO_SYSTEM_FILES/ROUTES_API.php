// ============================================================================
// ROUTES - À ajouter dans routes/api.php
// ============================================================================

// À ajouter en haut du fichier (avec les autres imports)
use App\Http\Controllers\Api\PhotoUploadController;

// À ajouter dans le groupe middleware ['auth:web']
Route::middleware(['auth:web'])->group(function () {

    // ===== ROUTES DE PHOTOS DE PROFIL =====
    // Upload une photo de profil
    Route::post('/profile/photo/upload', [PhotoUploadController::class, 'uploadProfilePhoto']);

    // Supprime la photo de profil
    Route::delete('/profile/photo/delete', [PhotoUploadController::class, 'deleteProfilePhoto']);

    // Upload une photo avec type optionnel
    Route::post('/photo/upload-with-type', [PhotoUploadController::class, 'uploadWithType']);

});

// ============================================================================
// LIGNE COMPLÈTE À AJOUTER - routes/api.php (ligne 10)
// ============================================================================
// use App\Http\Controllers\Api\PhotoUploadController;

// ============================================================================
// BLOC COMPLET - routes/api.php (dans middleware auth:web)
// ============================================================================
/*

Route::middleware(['auth:web'])->group(function () {
    // Inscriptions API
    Route::get('/inscriptions/pending', [InscriptionController::class, 'pending']);

    // Upload et suppression de photos de profil
    Route::post('/profile/photo/upload', [PhotoUploadController::class, 'uploadProfilePhoto']);
    Route::delete('/profile/photo/delete', [PhotoUploadController::class, 'deleteProfilePhoto']);

    // Routes Admin pour la gestion des utilisateurs
    Route::middleware(['role:admin'])->prefix('/admin/users')->group(function () {
        Route::get('/', [UserManagementController::class, 'index']);
        Route::post('/', [UserManagementController::class, 'store']);
        Route::get('/{id}', [UserManagementController::class, 'show']);
        Route::put('/{id}', [UserManagementController::class, 'update']);
        Route::delete('/{id}', [UserManagementController::class, 'destroy']);
    });
});

*/
