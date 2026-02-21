<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Conducteur\DashboardController as ConducteurDashboardController;
use App\Http\Controllers\Conducteur\InscriptionsController as ConducteurInscriptionsController;
use App\Http\Controllers\Conducteur\RegisterMemberController as RegisterMemberController;
use App\Http\Controllers\Conducteur\QuickMemberController;
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
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\ExcelImportController;
use App\Http\Controllers\MembreFamille\FamilyController as MembreFamilleFamilyController;
use App\Http\Controllers\MembreFamille\ProfileController as MembreFamilleProfileController;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

// Route for API documentation using Scramble
// Route::get('/api-docs', function () {
//     return view('api-docs');
// })->name('api.docs');


// Route::get('/debug/user-info', function () {
//     $user = Auth::user();
//     return response()->json([
//         'id' => $user?->id,
//         'identifier' => $user?->identifier,
//         'role' => $user?->role,
//         'family_id' => $user?->family_id,
//         'authenticated' => Auth::check(),
//     ]);
// })->middleware('auth');

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

    // Route générique /dashboard redirige selon le rôle connecté
    Route::get('/dashboard', function () {
        $user = Auth::user();
        if (!$user) return redirect()->route('login');

        switch ($user->role) {
            case 'admin':
                return redirect()->route('admin.dashboard');
            case 'conducteur':
                return redirect()->route('conducteur.dashboard');
            case 'pasteur':
                return redirect()->route('pasteur.dashboard');
            case 'responsable_famille':
                return redirect()->route('responsable_famille.dashboard');
            case 'membre_famille':
                return redirect()->route('membre_famille.dashboard');
            default:
                return Inertia::render('Dashboard');
        }
    })->name('dashboard');
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
        Route::get('/admin/inscriptions/{id}/approval-log', [\App\Http\Controllers\Admin\InscriptionApprovalController::class, 'approvalLog'])->name('admin.inscriptions.approval_log');
        Route::get('/admin/inscriptions/type-selection', [\App\Http\Controllers\Admin\InscriptionsController::class, 'typeSelection'])->name('admin.inscriptions.type-selection');
        // Route pour importer via Excel (Admin - Authentifié)
        Route::post('/admin/inscriptions/import-excel', [ExcelImportController::class, 'import'])->name('admin.inscriptions.import-excel');
        // Routes pour créer inscriptions directement
        Route::get('/admin/inscriptions/famille/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createFamilyForm'])->name('admin.inscriptions.famille.create');
        Route::get('/admin/inscriptions/conducteur/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createConductorForm'])->name('admin.inscriptions.conducteur.create');
        Route::get('/admin/inscriptions/pasteur/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createPastorForm'])->name('admin.inscriptions.pasteur.create');

        // Routes pour stocker les inscriptions
        Route::post('/admin/inscriptions/famille', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storeFamily'])->name('admin.inscriptions.famille.store');
        Route::post('/admin/inscriptions/conducteur', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storeConductor'])->name('admin.inscriptions.conducteur.store');
        Route::post('/admin/inscriptions/pasteur', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storePastor'])->name('admin.inscriptions.pasteur.store');

        Route::get('/admin/administration', [\App\Http\Controllers\Admin\AdministrationController::class, 'index'])->name('admin.administration');

        // Routes pour les classes
        Route::resource('/admin/classes', \App\Http\Controllers\Admin\ClasseController::class);
        Route::patch('/admin/classes/{classe}/status', [\App\Http\Controllers\Admin\ClasseController::class, 'toggleStatus'])->name('classes.toggle-status');

        // Routes pour les fonctions
        Route::resource('/admin/fonctions', \App\Http\Controllers\Admin\FonctionController::class);

        Route::get('/admin/notifications', [\App\Http\Controllers\Admin\NotificationsController::class, 'index'])->name('admin.notifications');
        Route::get('/admin/notifications/{id}', [\App\Http\Controllers\Admin\NotificationsController::class, 'show'])->name('admin.notifications.show');


        // --- Tableau de bord complet (Votre AdministrationController) ---
        // J'utilise 'administration' comme nom de route pour éviter conflit avec 'dashboard'
        Route::get('/administration', [AdministrationController::class, 'index'])->name('administration');

        // --- Actions Legacy (Approve/Reject) ---
        Route::post('/inscriptions/{id}/approve', [InscriptionApprovalController::class, 'approve'])->name('inscriptions.approve');
        Route::post('/inscriptions/{id}/reject', [InscriptionApprovalController::class, 'reject'])->name('inscriptions.reject');

        // --- Actions CRUD (Comptes, Membres, Status) ---

        // Routes comptes
        Route::put('/comptes/{id}', [AdministrationController::class, 'updateCompte'])->name('comptes.update');
        Route::delete('/comptes/{id}', [AdministrationController::class, 'destroyCompte'])->name('comptes.destroy');

        // Routes membres
        Route::post('/membres', [AdministrationController::class, 'storeMembre'])->name('membres.store');
        Route::put('/membres/{id}', [AdministrationController::class, 'updateMembre'])->name('membres.update');
        Route::delete('/membres/{id}', [AdministrationController::class, 'destroyMembre'])->name('membres.destroy');
        Route::post('/admin/membres', [AdministrationController::class, 'storeMembre'])->name('admin.membres.store');
        Route::get('/admin/membres/{id}', [UserManagementController::class, 'show'])->name('admin.membres.show');
        Route::put('/admin/membres/{id}', [AdministrationController::class, 'updateMembre'])->name('admin.membres.update');
        Route::delete('/admin/membres/{id}', [AdministrationController::class, 'destroyMembre'])->name('admin.membres.destroy');
        Route::patch('/admin/membres/{id}/status', [UserManagementController::class, 'updateStatus'])->name('admin.membres.status');

        // Routes pour les détails
        Route::get('/inscriptions/{id}', [AdministrationController::class, 'getInscriptionDetails'])
            ->name('admin.inscriptions.details');
        Route::get('/actes/{id}', [AdministrationController::class, 'getActeDetails'])
            ->name('admin.actes.details');

        // Route pour mettre à jour le statut
        Route::put('/status/{id}/{type}', [AdministrationController::class, 'updateStatus'])
            ->name('admin.updateStatus');
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
        Route::delete('/conducteur/members/{memberId}', [ConducteurInscriptionsController::class, 'destroy'])->name('conducteur.members.destroy');
        Route::put('/conducteur/members/{memberId}/validate', [ConducteurInscriptionsController::class, 'validateMember'])->name('conducteur.members.validate');
        Route::put('/conducteur/members/{memberId}/reject', [ConducteurInscriptionsController::class, 'rejectMember'])->name('conducteur.members.reject');
        Route::post('/conducteur/inscriptions', [ConducteurInscriptionsController::class, 'store'])->name('conducteur.inscriptions.store');
        Route::post('/conducteur/inscriptions/famille/store', [ConducteurInscriptionsController::class, 'storeFamily'])->name('conducteur.inscriptions.famille.store');
        Route::put('/conducteur/inscriptions/{inscriptionId}', [ConducteurInscriptionsController::class, 'updateInscription'])->name('conducteur.inscriptions.update');
        Route::delete('/conducteur/inscriptions/{memberId}', [ConducteurInscriptionsController::class, 'destroy'])->name('conducteur.inscriptions.destroy');

        // Endpoint: récupérer/créer UserSacrement pour un utilisateur
        Route::get('/users/{id}/sacrements', [\App\Http\Controllers\UserSacrementController::class, 'show'])->name('users.sacrements');
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
        // Liste des inscriptions pour le pasteur (module controller)
        Route::get('/pasteur/inscriptions', [\App\Http\Controllers\Pasteur\InscriptionsController::class, 'index'])
            ->name('pasteur.inscriptions');

        // Routes pasteur pour gérer sa famille et ses membres
        Route::get('/pasteur/family/edit', [\App\Http\Controllers\Pasteur\FamilyController::class, 'edit'])->name('pasteur.family.edit');
        Route::post('/pasteur/family/update', [\App\Http\Controllers\Pasteur\FamilyController::class, 'update'])->name('pasteur.family.update');
        Route::get('/pasteur/members/create', [\App\Http\Controllers\Pasteur\MemberController::class, 'create'])->name('pasteur.members.create');
        Route::post('/pasteur/members/store', [\App\Http\Controllers\Pasteur\MemberController::class, 'store'])->name('pasteur.members.store');
        Route::get('/pasteur/members/{id}', [\App\Http\Controllers\Pasteur\MemberController::class, 'show'])->name('pasteur.members.show');
        Route::get('/pasteur/members/{id}/edit', [\App\Http\Controllers\Pasteur\MemberController::class, 'edit'])->name('pasteur.members.edit');
        Route::put('/pasteur/members/{id}', [\App\Http\Controllers\Pasteur\MemberController::class, 'update'])->name('pasteur.members.update');
    });

    // Tableau de bord Membre de Famille
    Route::middleware(['auth', 'role:membre_famille'])->group(function () {
        Route::get('/membre-famille/dashboard', [MembreFamilleDashboardController::class, 'index'])->name('membre_famille.dashboard');
        Route::get('/membre-famille/inscriptions', [\App\Http\Controllers\MembreFamille\InscriptionsController::class, 'index'])->name('membre_famille.inscriptions');
        Route::get('/membre-famille/family', [MembreFamilleFamilyController::class, 'index'])->name('membre_famille.family');
        Route::get('/membre-famille/profile/edit', [MembreFamilleProfileController::class, 'edit'])->name('membre_famille.profile.edit');
        Route::put('/membre-famille/profile/update', [MembreFamilleProfileController::class, 'update'])->name('membre_famille.profile.update');
    });

    // Route pour changer le mot de passe
    Route::get('/profile/change-password', [ChangePasswordController::class, 'show'])->name('profile.change-password');
    Route::post('/profile/change-password', [ChangePasswordController::class, 'update'])->name('profile.change-password.update');
});
