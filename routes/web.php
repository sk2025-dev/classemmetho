<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Conducteur\DashboardController as ConducteurDashboardController;
use App\Http\Controllers\Conducteur\InscriptionsController as ConducteurInscriptionsController;
use App\Http\Controllers\Conducteur\TresorerieController as ConducteurTresorerieController;
use App\Http\Controllers\Conducteur\RegisterMemberController as RegisterMemberController;
use App\Http\Controllers\Conducteur\QuickMemberController;
use App\Http\Controllers\ResponsableFamille\DashboardController as ResponsableFamilleDashboardController;
use App\Http\Controllers\ResponsableFamille\InscriptionsController as ResponsableFamilleInscriptionsController;
use App\Http\Controllers\ResponsableFamille\MemberController as ResponsableFamilleMemberController;
use App\Http\Controllers\Pasteur\DashboardController as PasteurDashboardController;
use App\Http\Controllers\Pasteur\TresorerieController as PasteurTresorerieController;
use App\Http\Controllers\MembreFamille\DashboardController as MembreFamilleDashboardController;
use App\Http\Controllers\MembreFamille\FinancesController as MembreFamilleFinancesController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\Profile\ChangePasswordController;
use App\Http\Controllers\Admin\AdministrationController;
use App\Http\Controllers\Admin\InscriptionApprovalController;
use App\Http\Controllers\Admin\ClasseController;
use App\Http\Controllers\Admin\FonctionController;
use App\Http\Controllers\Admin\NotificationsController;
use App\Http\Controllers\Admin\AnnonceController;
use App\Http\Controllers\Admin\TresorerieController as AdminTresorerieController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\LiturgieController as AdminLiturgieController;
use App\Http\Controllers\Admin\FamilyCodeController;
use App\Http\Controllers\ExcelImportController;
use App\Http\Controllers\MembreFamille\FamilyController as MembreFamilleFamilyController;
use App\Http\Controllers\MembreFamille\ProfileController as MembreFamilleProfileController;
use App\Http\Controllers\MembreFamille\LiturgieController as MembreFamilleLiturgieController;
use App\Http\Controllers\Conducteur\LiturgieController as ConducteurLiturgieController;
use App\Http\Controllers\Pasteur\LiturgieController as PasteurLiturgieController;
use App\Http\Controllers\ResponsableFamille\LiturgieController as ResponsableFamilleLiturgieController;
use App\Http\Controllers\ResponsableFamille\TresorerieController as ResponsableFamilleTresorerieController;
use App\Http\Controllers\VerificationCertificatController;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/certificat/verification/{reference}', [VerificationCertificatController::class, 'show'])
    ->name('certificat.verification');

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

// Routes authentifiÃ©es
Route::middleware(['auth'])->group(function () {
    // Route de dÃ©connexion
    Route::post('/logout', [\App\Http\Controllers\Auth\LoginController::class, 'logout'])->name('logout');
    // Profil utilisateur
    Route::get('/profile', [\App\Http\Controllers\Profile\ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/update', [\App\Http\Controllers\Profile\ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/identifier', [\App\Http\Controllers\Profile\ProfileController::class, 'updateIdentifier'])->name('profile.identifier');
    Route::post('/profile/password', [\App\Http\Controllers\Profile\ProfileController::class, 'changePassword'])->name('profile.password');
    Route::post('/profile/signature', [\App\Http\Controllers\Profile\ProfileController::class, 'updateSignature'])->name('profile.signature');

    // Route gÃ©nÃ©rique /dashboard redirige selon le rÃ´le connectÃ©
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

// Routes d'inscription personnalisÃ©es
Route::get('/register/famille', function () {
    return Inertia::render('ResponsableFamille/RegisterFamille');
})->name('register.famille');


Route::get('/register/conducteur', function () {
    return Inertia::render('Conducteur/RegisterConducteur');
})->name('register.conducteur');

// Endpoint pour soumettre le formulaire d'inscription
Route::post('/register', [RegistrationController::class, 'store'])->name('register.store');
Route::post('/register/family', [RegistrationController::class, 'store'])->name('register.family');
Route::post('/register/conducteur', [RegistrationController::class, 'storeConductor'])->name('register.conductor');

// Admin routes for inscriptions approval - avec protection CSRF explicite
Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::post('/inscriptions/{id}/approve', [\App\Http\Controllers\Admin\InscriptionApprovalController::class, 'approve'])
        ->name('admin.inscriptions.approve');
    Route::post('/inscriptions/{id}/reject', [\App\Http\Controllers\Admin\InscriptionApprovalController::class, 'reject'])
        ->name('admin.inscriptions.reject')
        ->middleware('verified');
});

// Routes authentifiÃ©es
Route::middleware(['auth'])->group(function () {
    // Tableau de bord Admin
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
        Route::get('/admin/inscriptions', [\App\Http\Controllers\Admin\InscriptionsController::class, 'index'])->name('admin.inscriptions');
        Route::get('/admin/inscriptions/{id}/approval-log', [\App\Http\Controllers\Admin\InscriptionApprovalController::class, 'approvalLog'])->name('admin.inscriptions.approval_log');
        Route::get('/admin/inscriptions/type-selection', [\App\Http\Controllers\Admin\InscriptionsController::class, 'typeSelection'])->name('admin.inscriptions.type-selection');
        // Route pour importer via Excel (Admin - AuthentifiÃ©)
        Route::post('/admin/inscriptions/import-excel', [ExcelImportController::class, 'import'])->name('admin.inscriptions.import-excel');
        // Routes pour crÃ©er inscriptions directement
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

        // Routes module Actes Liturgiques (Admin)
        Route::get('/admin/liturgie', [AdminLiturgieController::class, 'index'])->name('admin.liturgie.index');
        Route::post('/admin/liturgie', [AdminLiturgieController::class, 'store'])->name('admin.liturgie.store');
        Route::put('/admin/liturgie/{id}', [AdminLiturgieController::class, 'update'])->name('admin.liturgie.update');
        Route::post('/admin/liturgie/{id}/transition', [AdminLiturgieController::class, 'transition'])->name('admin.liturgie.transition');
        Route::delete('/admin/liturgie/{id}', [AdminLiturgieController::class, 'destroy'])->name('admin.liturgie.destroy');

        // Routes module Trésorerie (Admin)
        Route::get('/admin/tresorerie', [AdminTresorerieController::class, 'index'])
            ->name('admin.tresorerie.index');

        // Codes familles
        Route::get('/admin/families', [FamilyCodeController::class, 'index'])->name('admin.families.index');
        Route::post('/admin/families/generate-all', [FamilyCodeController::class, 'generateAll'])->name('admin.families.generate-all');
        Route::post('/admin/families/{id}/generate', [FamilyCodeController::class, 'generate'])->name('admin.families.generate');


        // --- Tableau de bord complet (Votre AdministrationController) ---
        // J'utilise 'administration' comme nom de route pour Ã©viter conflit avec 'dashboard'
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

        // Routes pour les dÃ©tails
        Route::get('/inscriptions/{id}', [AdministrationController::class, 'getInscriptionDetails'])
            ->name('admin.inscriptions.details');
        Route::get('/actes/{id}', [AdministrationController::class, 'getActeDetails'])
            ->name('admin.actes.details');

        // Route pour mettre Ã jour le statut
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

        // Formulaire de crÃ©ation de membre/responsable de famille
        Route::get('/conducteur/members/create', [RegisterMemberController::class, 'create'])->name('conducteur.members.create');
        Route::post('/conducteur/members', [RegisterMemberController::class, 'store'])->name('conducteur.members.store');

        // Endpoint simplifiÃ© pour ajouter rapidement un simple membre
        Route::post('/conducteur/quick-member', [QuickMemberController::class, 'store'])->name('conducteur.quick_member.store');

        Route::put('/conducteur/members/{memberId}', [ConducteurInscriptionsController::class, 'update'])->name('conducteur.members.update');
        Route::delete('/conducteur/members/{memberId}', [ConducteurInscriptionsController::class, 'destroy'])->name('conducteur.members.destroy');
        Route::put('/conducteur/members/{memberId}/validate', [ConducteurInscriptionsController::class, 'validateMember'])->name('conducteur.members.validate');
        Route::put('/conducteur/members/{memberId}/reject', [ConducteurInscriptionsController::class, 'rejectMember'])->name('conducteur.members.reject');
        Route::post('/conducteur/inscriptions', [ConducteurInscriptionsController::class, 'store'])->name('conducteur.inscriptions.store');
        Route::post('/conducteur/inscriptions/famille/store', [ConducteurInscriptionsController::class, 'storeFamily'])->name('conducteur.inscriptions.famille.store');
        Route::put('/conducteur/inscriptions/{inscriptionId}', [ConducteurInscriptionsController::class, 'updateInscription'])->name('conducteur.inscriptions.update');
        Route::delete('/conducteur/inscriptions/{memberId}', [ConducteurInscriptionsController::class, 'destroy'])->name('conducteur.inscriptions.destroy');

        // Endpoint: rÃ©cupÃ©rer/crÃ©er UserSacrement pour un utilisateur
        Route::get('/users/{id}/sacrements', [\App\Http\Controllers\UserSacrementController::class, 'show'])->name('users.sacrements');

        // Routes module Actes Liturgiques (Conducteur)
        Route::get('/conducteur/liturgie', [ConducteurLiturgieController::class, 'index'])->name('conducteur.liturgie.index');
        Route::post('/conducteur/liturgie', [ConducteurLiturgieController::class, 'store'])->name('conducteur.liturgie.store');
        Route::post('/conducteur/liturgie/{id}/transition', [ConducteurLiturgieController::class, 'transition'])->name('conducteur.liturgie.transition');
        Route::get('/conducteur/liturgie/{id}/certificat', [ConducteurLiturgieController::class, 'certificat'])->name('conducteur.liturgie.certificat');
        Route::get('/conducteur/liturgie/{id}/fiche', [ConducteurLiturgieController::class, 'fiche'])->name('conducteur.liturgie.fiche');

        // Routes Annonces (Conducteur)
        Route::post('/conducteur/annonces', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'store'])->name('conducteur.annonces.store');
        Route::get('/conducteur/annonces', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'index'])->name('conducteur.annonces.index');
        Route::get('/conducteur/annonces/{id}', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'show'])->name('conducteur.annonces.show');
        Route::post('/conducteur/annonces/{id}/valider', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'valider'])->name('conducteur.annonces.valider');
        Route::post('/conducteur/annonces/{id}/transmettre', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'transmettreAuPasteur'])->name('conducteur.annonces.transmettre');
        Route::post('/conducteur/annonces/{id}/rejeter', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'rejeter'])->name('conducteur.annonces.rejeter');

        // Routes pour les demandes de transfert (validation par conducteur)
        Route::get('/conducteur/transferts', [\App\Http\Controllers\Conducteur\TransferController::class, 'index'])->name('conducteur.transferts.index');
        Route::post('/conducteur/transferts/{id}/approve-source', [\App\Http\Controllers\Conducteur\TransferController::class, 'approveAsSource'])->name('conducteur.transferts.approve_source');
        Route::post('/conducteur/transferts/{id}/approve-accueil', [\App\Http\Controllers\Conducteur\TransferController::class, 'approveAsAccueil'])->name('conducteur.transferts.approve_accueil');
        Route::post('/conducteur/transferts/{id}/refuse', [\App\Http\Controllers\Conducteur\TransferController::class, 'refuse'])->name('conducteur.transferts.refuse');
        Route::post('/conducteur/annonces/{id}/publier', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'publier'])->name('conducteur.annonces.publier');
        Route::post('/conducteur/annonces/{id}/archiver', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'archiver'])->name('conducteur.annonces.archiver');
        Route::get('/conducteur/annonces/{id}/fiche', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'fiche'])->name('conducteur.annonces.fiche');

        // Routes module Trésorerie (Conducteur)
        Route::get('/conducteur/tresorerie', [ConducteurTresorerieController::class, 'index'])
            ->name('conducteur.tresorerie.index');
        Route::post('/conducteur/tresorerie/cotisations', [ConducteurTresorerieController::class, 'storeCotisation'])
            ->name('conducteur.tresorerie.cotisations.store');
        Route::get('/conducteur/tresorerie/cotisations/{cotisation}', [ConducteurTresorerieController::class, 'showCotisation'])
            ->name('conducteur.tresorerie.cotisations.show');
        Route::put('/conducteur/tresorerie/cotisations/{cotisation}', [ConducteurTresorerieController::class, 'updateCotisation'])
            ->name('conducteur.tresorerie.cotisations.update');
        Route::delete('/conducteur/tresorerie/cotisations/{cotisation}', [ConducteurTresorerieController::class, 'destroyCotisation'])
            ->name('conducteur.tresorerie.cotisations.destroy');
        Route::post('/conducteur/tresorerie/collectes', [ConducteurTresorerieController::class, 'storeCollecte'])
            ->name('conducteur.tresorerie.collectes.store');
        Route::post('/conducteur/tresorerie/paiements', [ConducteurTresorerieController::class, 'storePaiement'])
            ->name('conducteur.tresorerie.paiements.store');
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
        Route::get('/responsable-famille/liturgie', [ResponsableFamilleLiturgieController::class, 'index'])->name('responsable_famille.liturgie.index');
        Route::get('/responsable-famille/liturgie/nouvelle', [ResponsableFamilleLiturgieController::class, 'create'])->name('responsable_famille.liturgie.create');
        Route::get('/responsable-famille/liturgie/nouvelle/formulaire', [ResponsableFamilleLiturgieController::class, 'createForm'])->name('responsable_famille.liturgie.form');
        Route::post('/responsable-famille/liturgie', [ResponsableFamilleLiturgieController::class, 'store'])->name('responsable_famille.liturgie.store');
        Route::get('/responsable-famille/liturgie/{id}/certificat', [ResponsableFamilleLiturgieController::class, 'certificat'])->name('responsable_famille.liturgie.certificat');
        Route::get('/responsable-famille/liturgie/{id}/fiche', [ResponsableFamilleLiturgieController::class, 'fiche'])->name('responsable_famille.liturgie.fiche');
        // Routes Annonces (ResponsableFamille)
        Route::get('/responsable-famille/annonces', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'index'])->name('responsable_famille.annonces.index');
        Route::get('/responsable-famille/annonces/create', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'create'])->name('responsable_famille.annonces.create');
        Route::post('/responsable-famille/annonces', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'store'])->name('responsable_famille.annonces.store');
        Route::get('/responsable-famille/annonces/{id}', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'show'])->name('responsable_famille.annonces.show');
        Route::get('/responsable-famille/annonces/{id}/fiche', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'fiche'])->name('responsable_famille.annonces.fiche');
        Route::get('/responsable-famille/annonces/{id}/edit', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'edit'])->name('responsable_famille.annonces.edit');
        Route::put('/responsable-famille/annonces/{id}', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'update'])->name('responsable_famille.annonces.update');
        Route::delete('/responsable-famille/annonces/{id}', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'destroy'])->name('responsable_famille.annonces.destroy');

        // Route de tableau de bord des transferts
        Route::get('/responsable-famille/transferts', [\App\Http\Controllers\ResponsableFamille\TransferController::class, 'index'])->name('responsable_famille.transferts.index');
        // Route de création de demande de transfert
        Route::post('/responsable-famille/transferts', [\App\Http\Controllers\ResponsableFamille\TransferController::class, 'store'])->name('responsable_famille.transferts.store');
        // Route de transfert de classe (ancien endpoint pour compatibilité)
        Route::post('/responsable-famille/transfer', [\App\Http\Controllers\ResponsableFamille\TransferController::class, 'transfer'])->name('responsable_famille.transfer');

        // Props Inertia dans le contrôleur

    });

    // Tableau de bord Pasteur
    Route::get('/pasteur/transferts', [\App\Http\Controllers\Pasteur\TransferController::class, 'index'])->name('pasteur.transferts.index');
    Route::post('/pasteur/transferts', [\App\Http\Controllers\Pasteur\TransferController::class, 'store'])->name('pasteur.transferts.store');

    Route::middleware('role:pasteur')->group(function () {
        Route::get('/pasteur/dashboard', [PasteurDashboardController::class, 'index'])->name('pasteur.dashboard');
        // Liste des inscriptions pour le pasteur (module controller)
        Route::get('/pasteur/inscriptions', [\App\Http\Controllers\Pasteur\InscriptionsController::class, 'index'])
            ->name('pasteur.inscriptions');

        // Routes pasteur pour gÃ©rer sa famille et ses membres
        Route::get('/pasteur/family/edit', [\App\Http\Controllers\Pasteur\FamilyController::class, 'edit'])->name('pasteur.family.edit');
        Route::post('/pasteur/family/update', [\App\Http\Controllers\Pasteur\FamilyController::class, 'update'])->name('pasteur.family.update');
        Route::get('/pasteur/members/create', [\App\Http\Controllers\Pasteur\MemberController::class, 'create'])->name('pasteur.members.create');
        Route::post('/pasteur/members/store', [\App\Http\Controllers\Pasteur\MemberController::class, 'store'])->name('pasteur.members.store');
        Route::get('/pasteur/members/{id}', [\App\Http\Controllers\Pasteur\MemberController::class, 'show'])->name('pasteur.members.show');
        Route::get('/pasteur/members/{id}/edit', [\App\Http\Controllers\Pasteur\MemberController::class, 'edit'])->name('pasteur.members.edit');
        Route::put('/pasteur/members/{id}', [\App\Http\Controllers\Pasteur\MemberController::class, 'update'])->name('pasteur.members.update');
        Route::get('/pasteur/liturgie', [PasteurLiturgieController::class, 'index'])->name('pasteur.liturgie.index');
        Route::post('/pasteur/liturgie', [PasteurLiturgieController::class, 'store'])->name('pasteur.liturgie.store');
        Route::post('/pasteur/liturgie/{id}/transition', [PasteurLiturgieController::class, 'transition'])->name('pasteur.liturgie.transition');
        Route::get('/pasteur/liturgie/{id}/certificat', [PasteurLiturgieController::class, 'certificat'])->name('pasteur.liturgie.certificat');

        // Routes Annonces (Pasteur)
        Route::post('/pasteur/annonces', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'store'])->name('pasteur.annonces.store');
        Route::get('/pasteur/annonces', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'index'])->name('pasteur.annonces.index');
        Route::get('/pasteur/annonces/{id}', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'show'])->name('pasteur.annonces.show');
        Route::get('/pasteur/annonces/{id}/fiche', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'fiche'])->name('pasteur.annonces.fiche');
        Route::post('/pasteur/annonces/{id}/valider', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'valider'])->name('pasteur.annonces.valider');
        Route::post('/pasteur/annonces/{id}/rejeter', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'rejeter'])->name('pasteur.annonces.rejeter');
        Route::post('/pasteur/annonces/{id}/publier', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'publier'])->name('pasteur.annonces.publier');
        Route::post('/pasteur/annonces/{id}/archiver', [\App\Http\Controllers\Pasteur\AnnonceController::class, 'archiver'])->name('pasteur.annonces.archiver');

        // Routes module Trésorerie (Pasteur)
        Route::get('/pasteur/tresorerie', [PasteurTresorerieController::class, 'index'])
            ->name('pasteur.tresorerie.index');
    });

    // Tableau de bord Membre de Famille
    Route::middleware(['auth', 'role:membre_famille'])->group(function () {
        Route::get('/membre-famille/dashboard', [MembreFamilleDashboardController::class, 'index'])->name('membre_famille.dashboard');
        Route::get('/membre-famille/inscriptions', [\App\Http\Controllers\MembreFamille\InscriptionsController::class, 'index'])->name('membre_famille.inscriptions');
        Route::get('/membre-famille/family', [MembreFamilleFamilyController::class, 'index'])->name('membre_famille.family');
        Route::get('/membre-famille/profile/edit', [MembreFamilleProfileController::class, 'edit'])->name('membre_famille.profile.edit');
        Route::put('/membre-famille/profile/update', [MembreFamilleProfileController::class, 'update'])->name('membre_famille.profile.update');
        Route::get('/membre-famille/liturgie', [MembreFamilleLiturgieController::class, 'index'])->name('membre_famille.liturgie.index');
        Route::get('/membre-famille/liturgie/nouvelle', [MembreFamilleLiturgieController::class, 'create'])->name('membre_famille.liturgie.create');
        Route::get('/membre-famille/liturgie/nouvelle/formulaire', [MembreFamilleLiturgieController::class, 'createForm'])->name('membre_famille.liturgie.form');
        Route::post('/membre-famille/liturgie', [MembreFamilleLiturgieController::class, 'store'])->name('membre_famille.liturgie.store');
        Route::get('/membre-famille/liturgie/{id}/certificat', [MembreFamilleLiturgieController::class, 'certificat'])->name('membre_famille.liturgie.certificat');
        Route::post('/membre-famille/annonces', [\App\Http\Controllers\MembreFamille\AnnonceController::class, 'store'])->name('membre_famille.annonces.store');
        Route::get('/membre-famille/annonces/{id}/fiche', [\App\Http\Controllers\MembreFamille\AnnonceController::class, 'fiche'])->name('membre_famille.annonces.fiche');

        // Routes module Finances (MembreFamille)
        Route::get('/membre-famille/tresorerie', [MembreFamilleFinancesController::class, 'index'])
            ->name('membre_famille.finances.index');
        Route::post('/membre-famille/finances/paiements', [MembreFamilleFinancesController::class, 'storePaiement'])
            ->name('membre_famille.finances.paiements.store');
        Route::post('/membre-famille/finances/paiements/initiate', [MembreFamilleFinancesController::class, 'initiatePaiement'])
            ->name('membre_famille.finances.paiements.initiate');
        Route::post('/membre-famille/finances/dons', [MembreFamilleFinancesController::class, 'storeDon'])
            ->name('membre_famille.finances.dons.store');
        Route::get('/membre-famille/finances/paiement/{paiement}/verify', [MembreFamilleFinancesController::class, 'verifyPaiement'])
            ->name('membre_famille.finances.paiement.verify');
    });

    // Route pour changer le mot de passe
    Route::get('/profile/change-password', [ChangePasswordController::class, 'show'])->name('profile.change-password');
    Route::post('/profile/change-password', [ChangePasswordController::class, 'update'])->name('profile.change-password.update');
});
