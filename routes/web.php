<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Conducteur\DashboardController as ConducteurDashboardController;
use App\Http\Controllers\Conducteur\InscriptionsController as ConducteurInscriptionsController;
use App\Http\Controllers\Conducteur\RegisterMemberController as RegisterMemberController;
use App\Http\Controllers\Conducteur\QuickMemberController as QuickMemberController;
use App\Http\Controllers\ResponsableFamille\DashboardController as ResponsableFamilleDashboardController;
use App\Http\Controllers\ResponsableFamille\InscriptionsController as ResponsableFamilleInscriptionsController;
use App\Http\Controllers\ResponsableFamille\MemberController as ResponsableFamilleMemberController;
use App\Http\Controllers\Pasteur\DashboardController as PasteurDashboardController;
use App\Http\Controllers\MembreFamille\DashboardController as MembreFamilleDashboardController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\Profile\ChangePasswordController;
use App\Http\Controllers\Admin\AdministrationController;
use App\Http\Controllers\Admin\InscriptionApprovalController;
use App\Http\Controllers\Admin\ClasseController;
use App\Http\Controllers\Admin\FonctionController;
use App\Http\Controllers\Admin\NotificationsController;
use App\Http\Controllers\MembreFamille\FamilyController as MembreFamilleFamilyController;
use App\Http\Controllers\MembreFamille\ProfileController as MembreFamilleProfileController;
use App\Http\Controllers\ExcelImportController;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

// Pages d'authentification (Inertia)
Route::get('/login', function () {
    return Inertia::render('login');
})->name('login');

Route::post('/login', [\App\Http\Controllers\Auth\LoginController::class, 'login'])->name('login.attempt');

// Routes authentifiées
Route::middleware(['auth'])->group(function () {
    // Route de déconnexion
    Route::post('/logout', [\App\Http\Controllers\Auth\LoginController::class, 'logout'])->name('logout');
    // Profil utilisateur
    Route::get('/profile', [\App\Http\Controllers\Profile\ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/update', [\App\Http\Controllers\Profile\ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/identifier', [\App\Http\Controllers\Profile\ProfileController::class, 'updateIdentifier'])->name('profile.identifier');
    Route::post('/profile/password', [\App\Http\Controllers\Profile\ProfileController::class, 'changePassword'])->name('profile.password');

});

// Routes d'inscription personnalisées
Route::get('/register/famille', function () {
    return Inertia::render('ResponsableFamille/RegisterFamille');
})->name('register.famille');


Route::get('/register/conducteur', function () {
    return Inertia::render('Conducteur/RegisterConducteur');
})->name('register.conducteur');

// Endpoint pour soumettre le formulaire d'inscription
Route::post('/register', [RegistrationController::class, 'store'])->name('register.store');
Route::post('/register/conducteur', [RegistrationController::class, 'storeConductor'])->name('register.conductor');

// Admin routes for inscriptions approval - avec protection CSRF explicite
Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::post('/inscriptions/{id}/approve', [\App\Http\Controllers\Admin\InscriptionApprovalController::class, 'approve'])
        ->name('admin.inscriptions.approve');
    Route::post('/inscriptions/{id}/reject', [\App\Http\Controllers\Admin\InscriptionApprovalController::class, 'reject'])
        ->name('admin.inscriptions.reject')
        ->middleware('verified');
});

// Routes authentifiées
Route::middleware(['auth'])->group(function () {
    // Tableau de bord Admin
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
        Route::get('/admin/inscriptions', [\App\Http\Controllers\Admin\InscriptionsController::class, 'index'])->name('admin.inscriptions');
        Route::get('/admin/inscriptions/type-selection', [\App\Http\Controllers\Admin\InscriptionsController::class, 'typeSelection'])->name('admin.inscriptions.type-selection');

        // Routes pour créer inscriptions directement
        Route::get('/admin/inscriptions/famille/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createFamilyForm'])->name('admin.inscriptions.famille.create');
        Route::get('/admin/inscriptions/conducteur/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createConductorForm'])->name('admin.inscriptions.conducteur.create');
        Route::get('/admin/inscriptions/pasteur/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createPastorForm'])->name('admin.inscriptions.pasteur.create');

        // Routes pour stocker les inscriptions
        Route::post('/admin/inscriptions/famille', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storeFamily'])->name('admin.inscriptions.famille.store');
        Route::post('/admin/inscriptions/conducteur', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storeConductor'])->name('admin.inscriptions.conducteur.store');
        Route::post('/admin/inscriptions/pasteur', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storePastor'])->name('admin.inscriptions.pasteur.store');

        // Route pour importer via Excel (Admin - Authentifié)
        Route::post('/admin/inscriptions/import-excel', [ExcelImportController::class, 'import'])->name('admin.inscriptions.import-excel');

        Route::get('/admin/administration', [\App\Http\Controllers\Admin\AdministrationController::class, 'index'])->name('admin.administration');

        // ═══════════════════════════════════════════════════════════════
        // ROUTES RESOURCE - CLASSES et FONCTIONS (Standard RESTful)
        // ═══════════════════════════════════════════════════════════════
        Route::resource('/admin/classes', \App\Http\Controllers\Admin\ClasseController::class, [
            'names' => [
                'index' => 'admin.classes.index',
                'create' => 'admin.classes.create',
                'store' => 'admin.classes.store',
                'show' => 'admin.classes.show',
                'edit' => 'admin.classes.edit',
                'update' => 'admin.classes.update',
                'destroy' => 'admin.classes.destroy',
            ]
        ]);
        Route::patch('/admin/classes/{classe}/status', [\App\Http\Controllers\Admin\ClasseController::class, 'toggleStatus'])->name('admin.classes.toggle-status');

        Route::resource('/admin/fonctions', \App\Http\Controllers\Admin\FonctionController::class, [
            'names' => [
                'index' => 'admin.fonctions.index',
                'create' => 'admin.fonctions.create',
                'store' => 'admin.fonctions.store',
                'show' => 'admin.fonctions.show',
                'edit' => 'admin.fonctions.edit',
                'update' => 'admin.fonctions.update',
                'destroy' => 'admin.fonctions.destroy',
            ]
        ]);

        // ═══════════════════════════════════════════════════════════════
        // ROUTES NOTIFICATIONS
        // ═══════════════════════════════════════════════════════════════
        Route::get('/admin/notifications', [\App\Http\Controllers\Admin\NotificationsController::class, 'index'])->name('admin.notifications');
        Route::get('/admin/notifications/{id}', [\App\Http\Controllers\Admin\NotificationsController::class, 'show'])->name('admin.notifications.show');

        // ═══════════════════════════════════════════════════════════════
        // ROUTES GESTION DES UTILISATEURS
        // ═══════════════════════════════════════════════════════════════
        Route::prefix('/admin/users')->name('admin.users.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\UserManagementController::class, 'index'])->name('index');
            Route::get('/stats', [\App\Http\Controllers\Admin\UserManagementController::class, 'getStats'])->name('stats');
            Route::get('/export', [\App\Http\Controllers\Admin\UserManagementController::class, 'export'])->name('export');
            Route::get('/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'show'])->name('show');
            Route::patch('/{user}/status', [\App\Http\Controllers\Admin\UserManagementController::class, 'updateStatus'])->name('updateStatus');
        });

        // ═══════════════════════════════════════════════════════════════
        // ROUTES INSCRIPTIONS ET APPROBATIONS
        // ═══════════════════════════════════════════════════════════════
        Route::post('/admin/inscriptions/{id}/approve', [InscriptionApprovalController::class, 'approve'])->name('admin.inscriptions.approve');
        Route::post('/admin/inscriptions/{id}/reject', [InscriptionApprovalController::class, 'reject'])->name('admin.inscriptions.reject');
        Route::get('/admin/inscriptions/{id}/details', [AdministrationController::class, 'getInscriptionDetails'])->name('admin.inscriptions.details');

        // ═══════════════════════════════════════════════════════════════
        // ROUTES GESTION DES MEMBRES (via UserManagementController)
        // ═══════════════════════════════════════════════════════════════
        Route::prefix('/admin/membres')->name('admin.membres.')->group(function () {
            Route::get('/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'show'])->name('show');
            Route::post('/', [\App\Http\Controllers\Admin\UserManagementController::class, 'store'])->name('store');
            Route::put('/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'update'])->name('update');
            Route::delete('/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'destroy'])->name('destroy');
            Route::patch('/{user}/status', [\App\Http\Controllers\Admin\UserManagementController::class, 'updateStatus'])->name('updateStatus');
        });
    });

    // Tableau de bord Conducteur
    Route::middleware('role:conducteur')->group(function () {
        Route::get('/conducteur/dashboard', [ConducteurDashboardController::class, 'index'])->name('conducteur.dashboard');
        Route::post('/conducteur/dashboard/inscriptions/{inscriptionId}/approve', [ConducteurDashboardController::class, 'approveInscription'])->name('conducteur.dashboard.inscriptions.approve');
        Route::post('/conducteur/dashboard/inscriptions/{inscriptionId}/reject', [ConducteurDashboardController::class, 'rejectInscription'])->name('conducteur.dashboard.inscriptions.reject');

        Route::get('/conducteur/inscriptions', [ConducteurInscriptionsController::class, 'index'])->name('conducteur.inscriptions');
        Route::post('/conducteur/inscriptions/{inscriptionId}/approve', [ConducteurInscriptionsController::class, 'approveInscription'])->name('conducteur.inscriptions.approve');
        Route::post('/conducteur/inscriptions/{inscriptionId}/reject', [ConducteurInscriptionsController::class, 'rejectInscription'])->name('conducteur.inscriptions.reject');
        Route::get('/conducteur/register', function () {
            return Inertia::render('Conducteur/RegisterConducteur');
        })->name('conducteur.register');
        Route::post('/conducteur/register', [RegisterMemberController::class, 'store'])->name('conducteur.register.store');

        // Formulaire de création de membre/responsable de famille
        Route::get('/conducteur/members/create', [RegisterMemberController::class, 'create'])->name('conducteur.members.create');
        Route::post('/conducteur/members', [RegisterMemberController::class, 'store'])->name('conducteur.members.store');

        // Endpoint simplifié pour ajouter rapidement un simple membre
        Route::post('/conducteur/quick-member', [QuickMemberController::class, 'store'])->name('conducteur.quick_member.store');

        Route::put('/conducteur/members/{memberId}', [ConducteurInscriptionsController::class, 'update'])->name('conducteur.members.update');
        Route::put('/conducteur/members/{memberId}/validate', [ConducteurInscriptionsController::class, 'validateMember'])->name('conducteur.members.validate');
        Route::put('/conducteur/members/{memberId}/reject', [ConducteurInscriptionsController::class, 'rejectMember'])->name('conducteur.members.reject');
        Route::post('/conducteur/inscriptions', [ConducteurInscriptionsController::class, 'store'])->name('conducteur.inscriptions.store');
        Route::post('/conducteur/inscriptions/famille/store', [ConducteurInscriptionsController::class, 'storeFamily'])->name('conducteur.inscriptions.famille.store');
        Route::put('/conducteur/inscriptions/{inscriptionId}', [ConducteurInscriptionsController::class, 'updateInscription'])->name('conducteur.inscriptions.update');
        Route::delete('/conducteur/inscriptions/{memberId}', [ConducteurInscriptionsController::class, 'destroy'])->name('conducteur.inscriptions.destroy');
    });

    // Tableau de bord Responsable de Famille
    Route::middleware('role:responsable_famille')->group(function () {
        Route::get('/responsable-famille/dashboard', [ResponsableFamilleDashboardController::class, 'index'])->name('responsable_famille.dashboard');
        Route::get('/responsable-famille/inscriptions', [ResponsableFamilleInscriptionsController::class, 'index'])->name('responsable_famille.inscriptions');
        Route::get('/responsable-famille/family/edit', [\App\Http\Controllers\ResponsableFamille\FamilyController::class, 'edit'])->name('responsable_famille.family.edit');
        Route::post('/responsable-famille/family/update', [\App\Http\Controllers\ResponsableFamille\FamilyController::class, 'update'])->name('responsable_famille.family.update');
        Route::get('/responsable-famille/members/create', [ResponsableFamilleMemberController::class, 'create'])->name('responsable_famille.members.create');
        Route::post('/responsable-famille/members/store', [ResponsableFamilleMemberController::class, 'store'])->name('responsable_famille.members.store');
        Route::get('/responsable-famille/members/{id}', [ResponsableFamilleMemberController::class, 'show'])->name('responsable_famille.members.show');
        Route::get('/responsable-famille/members/{id}/edit', [ResponsableFamilleMemberController::class, 'edit'])->name('responsable_famille.members.edit');
        Route::put('/responsable-famille/members/{id}', [ResponsableFamilleMemberController::class, 'update'])->name('responsable_famille.members.update');
    });

    // Tableau de bord Pasteur
    Route::middleware('role:pasteur')->group(function () {
        Route::get('/pasteur/dashboard', [PasteurDashboardController::class, 'index'])->name('pasteur.dashboard');
    });

    // Tableau de bord Membre de Famille
    Route::middleware('role:membre_famille')->group(function () {
        Route::get('/membre-famille/dashboard', [MembreFamilleDashboardController::class, 'index'])->name('membre_famille.dashboard');
        Route::get('/membre-famille/family', [MembreFamilleFamilyController::class, 'index'])->name('membre_famille.family');
        Route::get('/membre-famille/profile/edit', [MembreFamilleProfileController::class, 'edit'])->name('membre_famille.profile.edit');
        Route::put('/membre-famille/profile/update', [MembreFamilleProfileController::class, 'update'])->name('membre_famille.profile.update');
    });

    // Route pour changer le mot de passe
    Route::get('/profile/change-password', [ChangePasswordController::class, 'show'])->name('profile.change-password');
    Route::post('/profile/change-password', [ChangePasswordController::class, 'update'])->name('profile.change-password.update');});
