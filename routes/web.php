<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Conducteur\AnnuaireController as ConducteurAnnuaireController;
use App\Http\Controllers\Conducteur\DashboardController as ConducteurDashboardController;
use App\Http\Controllers\Conducteur\InscriptionsController as ConducteurInscriptionsController;
use App\Http\Controllers\Conducteur\TresorerieController as ConducteurTresorerieController;
use App\Http\Controllers\Conducteur\RegisterMemberController as RegisterMemberController;
use App\Http\Controllers\Conducteur\QuickMemberController;
use App\Http\Controllers\Conducteur\ProgrammesClasseController;
use App\Http\Controllers\ResponsableFamille\DashboardController as ResponsableFamilleDashboardController;
use App\Http\Controllers\ResponsableFamille\AnnuaireController as ResponsableFamilleAnnuaireController;
use App\Http\Controllers\ResponsableFamille\InscriptionsController as ResponsableFamilleInscriptionsController;
use App\Http\Controllers\ResponsableFamille\MemberController as ResponsableFamilleMemberController;
use App\Http\Controllers\ResponsableFamille\ProgrammeMembreController;
use App\Http\Controllers\Pasteur\AnnuaireController as PasteurAnnuaireController;
use App\Http\Controllers\Pasteur\DashboardController as PasteurDashboardController;
use App\Http\Controllers\Pasteur\TresorerieController as PasteurTresorerieController;
use App\Http\Controllers\Pasteur\ProgrammesPasteurController;
use App\Http\Controllers\MembreFamille\AnnuaireController as MembreFamilleAnnuaireController;
use App\Http\Controllers\MembreFamille\DashboardController as MembreFamilleDashboardController;
use App\Http\Controllers\MembreFamille\FinancesController as MembreFamilleFinancesController;
use App\Http\Controllers\MembreFamille\ProgrammesController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\Profile\ChangePasswordController;
use App\Http\Controllers\Admin\AdministrationController;
use App\Http\Controllers\Admin\InscriptionApprovalController;
use App\Http\Controllers\PresenceConducteurController;
use App\Http\Controllers\Admin\ClasseController;
use App\Http\Controllers\Admin\FonctionController;
use App\Http\Controllers\Admin\NotificationsController;
use App\Http\Controllers\Admin\AnnonceController;
use App\Http\Controllers\Admin\AnnuaireController;
use App\Http\Controllers\Admin\TresorerieController as AdminTresorerieController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\LiturgieController as AdminLiturgieController;
use App\Http\Controllers\Admin\FamilyCodeController;
use App\Http\Controllers\ExcelImportController;
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

Route::get('/presence/{token}', [\App\Http\Controllers\Public\PresenceScanController::class, 'show'])
    ->name('presence.scan.show');

Route::get('/sondages/public/{token}', [\App\Http\Controllers\Public\SondageController::class, 'show'])
    ->name('sondages.public.show');
Route::post('/sondages/public/{token}/acces', [\App\Http\Controllers\Public\SondageController::class, 'verifyAccess'])
    ->name('sondages.public.access');
Route::get('/sondages/public/{token}/repondre', [\App\Http\Controllers\Public\SondageController::class, 'respond'])
    ->name('sondages.public.respond');
Route::post('/sondages/public/{token}/reponses', [\App\Http\Controllers\Public\SondageController::class, 'storeResponse'])
    ->name('sondages.public.responses.store');

// Routes publiques — dons anonymes
Route::post('/dons/anonyme', [\App\Http\Controllers\Public\DonationController::class, 'storeAnonymous'])
    ->name('public.dons.anonyme.store');
Route::get('/dons/anonyme/verify', [\App\Http\Controllers\Public\DonationController::class, 'verifyAnonymous'])
    ->name('public.dons.anonyme.verify');
Route::get('/dons/recu/{reference}', [\App\Http\Controllers\Public\DonationController::class, 'downloadReceipt'])
    ->name('public.dons.recu');

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
    Route::post('/profile/signature', [\App\Http\Controllers\Profile\ProfileController::class, 'updateSignature'])->name('profile.signature');

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

// Inscriptions désactivées côté public — gérées uniquement par admin et conducteur

// Photos en direct (conducteur + marqueur de présence) — session web requise
Route::middleware(['auth'])->group(function () {
    Route::post('/activities/{eventId}/quick-photo', [\App\Http\Controllers\Api\LivePhotoController::class, 'store'])->name('activities.quick-photo');
    Route::get('/activities/{eventId}/photos-count', [\App\Http\Controllers\Api\LivePhotoController::class, 'count'])->name('activities.photos-count');
});

// Routes authentifiées
Route::middleware(['auth'])->group(function () {
    // Tableau de bord Admin
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
        Route::get('/admin/prieres', [\App\Http\Controllers\Admin\PrieresController::class, 'index'])->name('admin.prieres.index');
        Route::get('/admin/sondages', [\App\Http\Controllers\Admin\Sondage\SondageController::class, 'index'])->name('admin.sondages.index');
        Route::get('/admin/sondages/{id}/export', [\App\Http\Controllers\Admin\Sondage\SondageController::class, 'export'])->whereNumber('id')->name('admin.sondages.export');
        Route::get('/admin/sondages/{id}', [\App\Http\Controllers\Admin\Sondage\SondageController::class, 'show'])->whereNumber('id')->name('admin.sondages.show');
        Route::get('/admin/inscriptions/type-selection', [\App\Http\Controllers\Admin\InscriptionsController::class, 'typeSelection'])->name('admin.inscriptions.type-selection');
        Route::post('/admin/inscriptions/import-excel', [ExcelImportController::class, 'import'])->name('admin.inscriptions.import-excel');

        // Routes pour créer inscriptions directement
        Route::get('/admin/inscriptions/famille/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createFamilyForm'])->name('admin.inscriptions.famille.create');
        Route::get('/admin/inscriptions/conducteur/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createConductorForm'])->name('admin.inscriptions.conducteur.create');
        Route::get('/admin/inscriptions/pasteur/create', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'createPastorForm'])->name('admin.inscriptions.pasteur.create');
        Route::post('/admin/inscriptions/famille', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storeFamily'])->name('admin.inscriptions.famille.store');
        Route::post('/admin/inscriptions/conducteur', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storeConductor'])->name('admin.inscriptions.conducteur.store');
        Route::post('/admin/inscriptions/pasteur', [\App\Http\Controllers\Admin\AdminInscriptionsController::class, 'storePastor'])->name('admin.inscriptions.pasteur.store');

        Route::get('/admin/administration', [\App\Http\Controllers\Admin\AdministrationController::class, 'index'])->name('admin.administration');

        // ===== MODULE ANNUAIRE (Admin - accès global) =====
        Route::middleware('role:admin')->prefix('admin/annuaire')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AnnuaireController::class, 'index'])->name('admin.annuaire.index');
            Route::get('/search', [\App\Http\Controllers\Admin\AnnuaireController::class, 'search'])->name('admin.annuaire.search');
            Route::get('/export', [\App\Http\Controllers\Admin\AnnuaireController::class, 'export'])->name('admin.annuaire.export');
            Route::get('/stats', [\App\Http\Controllers\Admin\AnnuaireController::class, 'stats'])->name('admin.annuaire.stats');
        });

        // Routes pour les classes
        Route::resource('/admin/classes', \App\Http\Controllers\Admin\ClasseController::class);
        Route::patch('/admin/classes/{classe}/status', [\App\Http\Controllers\Admin\ClasseController::class, 'toggleStatus'])->name('classes.toggle-status');

        // Routes pour les fonctions
        Route::resource('/admin/fonctions', \App\Http\Controllers\Admin\FonctionController::class);

        Route::get('/admin/notifications', [\App\Http\Controllers\Admin\NotificationsController::class, 'index'])->name('admin.notifications');
        Route::get('/admin/notifications/{id}', [\App\Http\Controllers\Admin\NotificationsController::class, 'show'])->name('admin.notifications.show');

        // Routes Annonces (Admin - flash info paroissial)
        Route::get('/admin/annonces', [AnnonceController::class, 'index'])->name('admin.annonces.index');
        Route::post('/admin/annonces', [AnnonceController::class, 'store'])->name('admin.annonces.store');
        Route::post('/admin/annonces/{id}/archiver', [AnnonceController::class, 'archiver'])->name('admin.annonces.archiver');
        Route::post('/admin/annonces/{id}/valider', [AnnonceController::class, 'valider'])->name('admin.annonces.valider');
        Route::post('/admin/annonces/{id}/rejeter', [AnnonceController::class, 'rejeter'])->name('admin.annonces.rejeter');
        Route::delete('/admin/annonces/{id}', [AnnonceController::class, 'destroy'])->name('admin.annonces.destroy');

        // Routes module Présences (Admin)
        Route::get('/admin/presences', [\App\Http\Controllers\Admin\PresencesController::class, 'index'])->name('admin.presences.index');
        Route::get('/admin/presences/export', [\App\Http\Controllers\Admin\PresencesController::class, 'export'])->name('admin.presences.export');

        // Routes module Actes Liturgiques (Admin)
        Route::get('/admin/liturgie', [AdminLiturgieController::class, 'index'])->name('admin.liturgie.index');
        Route::post('/admin/liturgie', [AdminLiturgieController::class, 'store'])->name('admin.liturgie.store');
        Route::put('/admin/liturgie/{id}', [AdminLiturgieController::class, 'update'])->name('admin.liturgie.update');
        Route::post('/admin/liturgie/{id}/transition', [AdminLiturgieController::class, 'transition'])->name('admin.liturgie.transition');
        Route::delete('/admin/liturgie/{id}', [AdminLiturgieController::class, 'destroy'])->name('admin.liturgie.destroy');
        Route::get('/admin/liturgie/{id}/certificat', [\App\Http\Controllers\Pasteur\LiturgieController::class, 'certificat'])->name('admin.liturgie.certificat');
        Route::get('/admin/liturgie/{id}/fiche', [\App\Http\Controllers\Pasteur\LiturgieController::class, 'fiche'])->name('admin.liturgie.fiche');

        // Routes module Trésorerie (Admin)
        Route::get('/admin/tresorerie', [AdminTresorerieController::class, 'index'])
            ->name('admin.tresorerie.index');
        Route::get('/admin/tresorerie/export', [AdminTresorerieController::class, 'export'])
            ->name('admin.tresorerie.export');

        // Codes familles
        Route::get('/admin/families', [FamilyCodeController::class, 'index'])->name('admin.families.index');
        Route::post('/admin/families/generate-all', [FamilyCodeController::class, 'generateAll'])->name('admin.families.generate-all');
        Route::post('/admin/families/{id}/generate', [FamilyCodeController::class, 'generate'])->name('admin.families.generate');

        // --- Tableau de bord complet (Votre AdministrationController) ---
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
        Route::post('/admin/membres/{id}/president-conducteurs', [AdministrationController::class, 'assignPresidentConducteurs'])->name('admin.membres.president_conducteurs.assign');
        Route::delete('/admin/membres/{id}/president-conducteurs', [AdministrationController::class, 'unassignPresidentConducteurs'])->name('admin.membres.president_conducteurs.unassign');

        // Routes pour les détails
        Route::get('/inscriptions/{id}', [AdministrationController::class, 'getInscriptionDetails'])
            ->name('admin.inscriptions.details');
        Route::get('/actes/{id}', [AdministrationController::class, 'getActeDetails'])
            ->name('admin.actes.details');

        // Route pour mettre à jour le statut
        Route::put('/status/{id}/{type}', [AdministrationController::class, 'updateStatus'])
            ->name('admin.updateStatus');

        // ===== ROUTES PROGRAMMES PASTEUR =====
        Route::get('/admin/programmes', [ProgrammesPasteurController::class, 'index'])->name('admin.programmes');
        Route::get('/admin/programmes/classe/{id}', [ProgrammesPasteurController::class, 'getClassProgrammes'])->name('admin.programmes.classe');
    });

    // Tableau de bord Conducteur
    Route::middleware('role:conducteur')->group(function () {
        Route::get('/conducteur/annuaire', [ConducteurAnnuaireController::class, 'index'])->name('conducteur.annuaire.index');

        Route::get('/conducteur/prieres', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'index'])->name('conducteur.prieres.index');
        Route::get('/conducteur/dashboard', [ConducteurDashboardController::class, 'index'])->name('conducteur.dashboard');
        Route::get('/conducteur/presences', [PresenceConducteurController::class, 'index'])->name('presences.index');
        Route::get('/conducteur/presences/programmes-activites', [PresenceConducteurController::class, 'activitesProgramme'])
            ->name('presences.programmes_activites');
        Route::post('/conducteur/presences/assign-marqueur', [PresenceConducteurController::class, 'assignPresenceMarker'])
            ->name('presences.assign_marqueur');
        Route::post('/conducteur/presences/unassign-marqueur', [PresenceConducteurController::class, 'unassignPresenceMarker'])
            ->name('presences.unassign_marqueur');
        Route::post('/conducteur/presences/programme/{event}', [PresenceConducteurController::class, 'enregistrerProgramme'])
            ->whereNumber('event')
            ->name('presences.enregistrer_programme');
        Route::post('/conducteur/presences/{activite}', [PresenceConducteurController::class, 'enregistrer'])
            ->whereNumber('activite')
            ->name('presences.enregistrer');
        Route::get('/conducteur/prieres', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'index'])->name('conducteur.prieres.index');
        Route::get('/conducteur/prieres', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'index'])->name('conducteur.prieres.index');
        Route::post('/conducteur/prieres', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'store'])->name('conducteur.prieres.store');
        Route::patch('/conducteur/prieres/{priere}/commentaire', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'updateTestimony'])->name('conducteur.prieres.testimony');
        Route::patch('/conducteur/prieres/{priere}/status', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'updateStatus'])->name('conducteur.prieres.status');
        Route::patch('/conducteur/prieres/{priere}/exaucee', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'markFulfilled'])->name('conducteur.prieres.fulfilled');
        Route::patch('/conducteur/prieres/{priere}/non-exaucee', [\App\Http\Controllers\Conducteur\Prieres\PrieresController::class, 'markUnfulfilled'])->name('conducteur.prieres.unfulfilled');
        Route::get('/conducteur/sondages', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'index'])->name('conducteur.sondages.index');
        Route::get('/conducteur/sondages/create', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'create'])->name('conducteur.sondages.create');
        Route::get('/conducteur/sondages/{id}/edit', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'edit'])->whereNumber('id')->name('conducteur.sondages.edit');
        Route::get('/conducteur/sondages/{id}/repondre', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'respond'])->whereNumber('id')->name('conducteur.sondages.respond');
        Route::post('/conducteur/sondages/{id}/reponses', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'storeResponse'])->whereNumber('id')->name('conducteur.sondages.responses.store');
        Route::get('/conducteur/sondages/{id}/export', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'export'])->whereNumber('id')->name('conducteur.sondages.export');
        Route::get('/conducteur/sondages/{id}', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'show'])->whereNumber('id')->name('conducteur.sondages.show');
        Route::post('/conducteur/sondages', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'store'])->name('conducteur.sondages.store');
        Route::post('/conducteur/sondages/{id}/publish', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'publish'])->whereNumber('id')->name('conducteur.sondages.publish');
        Route::put('/conducteur/sondages/{id}', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'update'])->whereNumber('id')->name('conducteur.sondages.update');
        Route::get('/conducteur/sondages/preview/{id?}', [\App\Http\Controllers\Conducteur\Sondage\SondageController::class, 'preview'])->name('conducteur.sondages.preview');
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
        Route::get('/conducteur/check-email', [QuickMemberController::class, 'checkEmail'])->name('conducteur.check_email');

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

        // Routes module Actes Liturgiques (Conducteur)
        Route::get('/conducteur/liturgie', [ConducteurLiturgieController::class, 'index'])->name('conducteur.liturgie.index');
        Route::post('/conducteur/liturgie', [ConducteurLiturgieController::class, 'store'])->name('conducteur.liturgie.store');
        Route::post('/conducteur/liturgie/{id}/transition', [ConducteurLiturgieController::class, 'transition'])->name('conducteur.liturgie.transition');
        Route::post('/conducteur/liturgie/{id}/ceremonie/decision', [ConducteurLiturgieController::class, 'decisionCeremonie'])->name('conducteur.liturgie.ceremonie.decision');
        Route::get('/conducteur/liturgie/{id}/certificat', [ConducteurLiturgieController::class, 'certificat'])->name('conducteur.liturgie.certificat');
        Route::get('/conducteur/liturgie/{id}/fiche-conducteur', [ConducteurLiturgieController::class, 'ficheConducteur'])->name('conducteur.liturgie.fiche_conducteur');
        Route::get('/conducteur/liturgie/{id}/fiche', [ConducteurLiturgieController::class, 'fiche'])->name('conducteur.liturgie.fiche');

        Route::get('/conducteur/liturgie/selection', function () {
            return Inertia::render('Conducteur/Liturgie/Selection');
        })->name('conducteur.liturgie.selection');

        // Route dynamique pour afficher le bon formulaire selon le type_acte
        Route::get('/conducteur/liturgie/nouvelle/formulaire', function (\Illuminate\Http\Request $request) {
            $type = $request->query('type_acte');
            $map = [
                'bapteme' => 'BaptemeForm',
                'mariage' => 'MariageForm',
                'naissance' => 'NaissanceForm',
                'deces' => 'DecesForm',
                // Ajoute ici d'autres types si besoin
            ];
            if (!isset($map[$type])) abort(404);

            $user = Auth::user();
            $classIds = $user->getManagedClasses()->pluck('id')->toArray();
            $columns = ['id', 'nom', 'prenom', 'classe_id', 'genre'];
            $familyMembers = \App\Models\User::query()
                ->whereIn('classe_id', $classIds)
                ->select($columns)
                ->orderBy('prenom')
                ->orderBy('nom')
                ->get();

            return Inertia::render('Conducteur/Liturgie/' . $map[$type], [
                'backHref' => '/conducteur/liturgie/selection',
                'submitUrl' => '/conducteur/liturgie',
                'familyMembers' => $familyMembers,
            ]);
        })->name('conducteur.liturgie.nouvelle.formulaire');

        // Routes Annonces (Conducteur)
        Route::post('/conducteur/annonces', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'store'])->name('conducteur.annonces.store');
        Route::post('/conducteur/flash-info', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'storeFlashInfo'])->name('conducteur.flash_info.store');
        Route::get('/conducteur/annonces', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'index'])->name('conducteur.annonces.index');
        Route::get('/conducteur/annonces/{id}', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'show'])->name('conducteur.annonces.show');
        Route::post('/conducteur/annonces/{id}/valider', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'valider'])->name('conducteur.annonces.valider');
        Route::post('/conducteur/annonces/{id}/transmettre', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'transmettreAuPasteur'])->name('conducteur.annonces.transmettre');
        Route::post('/conducteur/annonces/{id}/rejeter', [\App\Http\Controllers\Conducteur\AnnonceController::class, 'rejeter'])->name('conducteur.annonces.rejeter');

        // Routes pour les demandes de transfert (creation + validation conducteur)
        Route::get('/conducteur/transferts', [\App\Http\Controllers\Conducteur\TransferWorkflowController::class, 'index'])->name('conducteur.transferts.index');
        Route::post('/conducteur/transferts', [\App\Http\Controllers\Conducteur\TransferWorkflowController::class, 'store'])->name('conducteur.transferts.store');
        Route::post('/conducteur/transferts/{id}/approve-source', [\App\Http\Controllers\Conducteur\TransferWorkflowController::class, 'approveAsSource'])->name('conducteur.transferts.approve_source');
        Route::post('/conducteur/transferts/{id}/approve-accueil', [\App\Http\Controllers\Conducteur\TransferWorkflowController::class, 'approveAsAccueil'])->name('conducteur.transferts.approve_accueil');
        Route::post('/conducteur/transferts/{id}/refuse', [\App\Http\Controllers\Conducteur\TransferWorkflowController::class, 'refuse'])->name('conducteur.transferts.refuse');
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
        Route::post('/conducteur/tresorerie/dons', [ConducteurTresorerieController::class, 'storeDon'])
            ->name('conducteur.tresorerie.dons.store');
        Route::post('/conducteur/tresorerie/rappels', [ConducteurTresorerieController::class, 'storeRappelTresorier'])
            ->name('conducteur.tresorerie.rappels.store');
        Route::post('/conducteur/tresorerie/assign-tresorier', [ConducteurTresorerieController::class, 'assignTresorier'])
            ->name('conducteur.tresorerie.assign-tresorier');
        Route::post('/conducteur/tresorerie/unassign-tresorier', [ConducteurTresorerieController::class, 'unassignTresorier'])
            ->name('conducteur.tresorerie.unassign-tresorier');

        // ===== ROUTES PROGRAMMES CONDUCTEUR =====
        Route::get('/conducteur/programmes', [ProgrammesClasseController::class, 'index'])->name('conducteur.programmes');
        Route::get('/conducteur/programmes/all', [ProgrammesClasseController::class, 'allProgrammes'])->name('conducteur.programmes.all');
        Route::post('/conducteur/programmes/event', [ProgrammesClasseController::class, 'storeEvent'])->name('conducteur.programmes.event');
        Route::post('/conducteur/programmes/events-multiple', [ProgrammesClasseController::class, 'storeMultipleEvents'])->name('conducteur.programmes.events-multiple');
        Route::put('/conducteur/programmes/event/{id}', [ProgrammesClasseController::class, 'updateEvent'])->name('conducteur.programmes.event.update');
        Route::get('/conducteur/programmes/event/{id}/qr', [ProgrammesClasseController::class, 'qrCode'])->name('conducteur.programmes.event.qr');
        Route::get('/conducteur/programmes/{event}/presences', [\App\Http\Controllers\Api\PresenceController::class, 'programmeSummary'])
            ->whereNumber('event')
            ->name('conducteur.programmes.presences');
        Route::get('/conducteur/programmes/event/{id}/qr/fiche-pdf', [ProgrammesClasseController::class, 'qrSheetPdf'])->name('conducteur.programmes.event.qr.sheet-pdf');
        Route::get('/conducteur/programmes/event/{id}/qr/preview', [ProgrammesClasseController::class, 'qrPreview'])->name('conducteur.programmes.event.qr.preview');
        Route::get('/conducteur/programmes/event/{id}/qr/data', [ProgrammesClasseController::class, 'qrData'])->name('conducteur.programmes.event.qr.data');
        Route::delete('/conducteur/programmes/event/{id}', [ProgrammesClasseController::class, 'destroy'])->name('conducteur.programmes.event.destroy');
        Route::post('/conducteur/programmes/import-events', [ProgrammesClasseController::class, 'importEvents'])->name('conducteur.programmes.import');
        Route::get('/conducteur/programmes/events-by-month', [ProgrammesClasseController::class, 'getEventsByMonth'])->name('conducteur.programmes.events.by-month');
        Route::get('/conducteur/programmes/history', [ProgrammesClasseController::class, 'historyProgrammes'])->name('conducteur.programmes.history');
        Route::get('/conducteur/programmes/history/filter', [ProgrammesClasseController::class, 'getHistoryProgrammes'])->name('conducteur.programmes.history.filter');
        // ===== ROUTES GALERIE CONDUCTEUR =====
        Route::post('/conducteur/galerie/add', [ProgrammesClasseController::class, 'addMedia'])->name('conducteur.galerie.add');
        Route::get('/conducteur/galerie', [ProgrammesClasseController::class, 'getGalleryMedia'])->name('conducteur.galerie');
        Route::delete('/conducteur/galerie/{id}', [ProgrammesClasseController::class, 'deleteMedia'])->name('conducteur.galerie.delete');
        Route::get('/conducteur/galerie/edit/{id}', [ProgrammesClasseController::class, 'editMedia'])->name('galerie.edit');
        Route::put('/conducteur/galerie/update/{id}', [ProgrammesClasseController::class, 'updateMedia'])->name('galerie.update');
        Route::put('/conducteur/galerie/set-featured/{id}', [ProgrammesClasseController::class, 'setFeaturedMedia']);
        Route::get('/conducteur/galerie/filter', [ProgrammesClasseController::class, 'getGalleryMediaFiltered'])->name('conducteur.galerie.filter');
    });

    // Routes module Trésorerie (Trésorier de Classe)
    Route::group([], function () {
        Route::get('/tresorier/tresorerie', [ConducteurTresorerieController::class, 'indexTresorier'])
            ->name('tresorier.tresorerie.index');
        Route::post('/tresorier/tresorerie/paiements', [ConducteurTresorerieController::class, 'storePaiement'])
            ->name('tresorier.tresorerie.paiements.store');
        Route::post('/tresorier/tresorerie/dons', [ConducteurTresorerieController::class, 'storeDon'])
            ->name('tresorier.tresorerie.dons.store');
        Route::post('/tresorier/tresorerie/rappels', [ConducteurTresorerieController::class, 'storeRappelTresorier'])
            ->name('tresorier.tresorerie.rappels.store');
    });

    // Tableau de bord Responsable de Famille
    Route::middleware('role:responsable_famille')->group(function () {
        Route::get('/responsable-famille/annuaire', [ResponsableFamilleAnnuaireController::class, 'index'])->name('responsable_famille.annuaire.index');
        Route::get('/responsable-famille/dashboard', [ResponsableFamilleDashboardController::class, 'index'])->name('responsable_famille.dashboard');
        Route::get('/responsable-famille/prieres', [\App\Http\Controllers\ResponsableFamille\Prieres\PrieresController::class, 'index'])->name('responsable_famille.prieres.index');
        Route::post('/responsable-famille/prieres', [\App\Http\Controllers\ResponsableFamille\Prieres\PrieresController::class, 'store'])->name('responsable_famille.prieres.store');
        Route::patch('/responsable-famille/prieres/{priere}/commentaire', [\App\Http\Controllers\ResponsableFamille\Prieres\PrieresController::class, 'updateTestimony'])->name('responsable_famille.prieres.testimony');
        Route::patch('/responsable-famille/prieres/{priere}/status', [\App\Http\Controllers\ResponsableFamille\Prieres\PrieresController::class, 'updateStatus'])->name('responsable_famille.prieres.status');
        Route::patch('/responsable-famille/prieres/{priere}/exaucee', [\App\Http\Controllers\ResponsableFamille\Prieres\PrieresController::class, 'markFulfilled'])->name('responsable_famille.prieres.fulfilled');
        Route::patch('/responsable-famille/prieres/{priere}/non-exaucee', [\App\Http\Controllers\ResponsableFamille\Prieres\PrieresController::class, 'markUnfulfilled'])->name('responsable_famille.prieres.unfulfilled');
        Route::get('/responsable-famille/sondages', [\App\Http\Controllers\ResponsableFamille\Sondage\SondageController::class, 'index'])->name('responsable_famille.sondages.index');
        Route::get('/responsable-famille/sondages/{id}', [\App\Http\Controllers\ResponsableFamille\Sondage\SondageController::class, 'show'])->name('responsable_famille.sondages.show');
        Route::post('/responsable-famille/sondages/{id}/reponses', [\App\Http\Controllers\ResponsableFamille\Sondage\SondageController::class, 'storeResponse'])->name('responsable_famille.sondages.responses.store');
        Route::get('/responsable-famille/inscriptions', [ResponsableFamilleInscriptionsController::class, 'index'])->name('responsable_famille.inscriptions');
        Route::get('/responsable-famille/family/edit', [\App\Http\Controllers\ResponsableFamille\FamilyController::class, 'edit'])->name('responsable_famille.family.edit');
        Route::post('/responsable-famille/family/update', [\App\Http\Controllers\ResponsableFamille\FamilyController::class, 'update'])->name('responsable_famille.family.update');
        Route::get('/responsable-famille/members/create', [ResponsableFamilleMemberController::class, 'create'])->name('responsable_famille.members.create');
        Route::post('/responsable-famille/members/store', [ResponsableFamilleMemberController::class, 'store'])->name('responsable_famille.members.store');
        Route::get('/responsable-famille/members/{id}', [ResponsableFamilleMemberController::class, 'show'])->name('responsable_famille.members.show');
        Route::get('/responsable-famille/members/{id}/edit', [ResponsableFamilleMemberController::class, 'edit'])->name('responsable_famille.members.edit');
        Route::put('/responsable-famille/members/{id}', [ResponsableFamilleMemberController::class, 'update'])->name('responsable_famille.members.update');
        Route::delete('/responsable-famille/members/{id}', [ResponsableFamilleMemberController::class, 'destroy'])->name('responsable_famille.members.destroy');
        // Flash Info (Responsable Famille → soumission admin)
        Route::get('/responsable-famille/flash-annonces', [\App\Http\Controllers\ResponsableFamille\FlashAnnonceController::class, 'index'])->name('responsable_famille.flash_annonces.index');
        Route::post('/responsable-famille/flash-annonces', [\App\Http\Controllers\ResponsableFamille\FlashAnnonceController::class, 'store'])->name('responsable_famille.flash_annonces.store');

        Route::get('/responsable-famille/liturgie', [ResponsableFamilleLiturgieController::class, 'index'])->name('responsable_famille.liturgie.index');
        Route::get('/responsable-famille/liturgie/nouvelle', [ResponsableFamilleLiturgieController::class, 'create'])->name('responsable_famille.liturgie.create');
        Route::get('/responsable-famille/liturgie/nouvelle/formulaire', [ResponsableFamilleLiturgieController::class, 'createForm'])->name('responsable_famille.liturgie.form');
        Route::post('/responsable-famille/liturgie', [ResponsableFamilleLiturgieController::class, 'store'])->name('responsable_famille.liturgie.store');
        Route::put('/responsable-famille/liturgie/{id}/ceremonie', [ResponsableFamilleLiturgieController::class, 'updateCeremonie'])->name('responsable_famille.liturgie.ceremonie.update');
        Route::get('/responsable-famille/liturgie/{id}/certificat', [ResponsableFamilleLiturgieController::class, 'certificat'])->name('responsable_famille.liturgie.certificat');
        Route::get('/responsable-famille/liturgie/{id}/fiche', [ResponsableFamilleLiturgieController::class, 'fiche'])->name('responsable_famille.liturgie.fiche');

        // Routes Présences (ResponsableFamille)
        Route::get('/responsable-famille/presences', [\App\Http\Controllers\ResponsableFamille\PresencesController::class, 'index'])->name('responsable_famille.presences.index');

        // Routes Annonces (ResponsableFamille)
        Route::get('/responsable-famille/annonces', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'index'])->name('responsable_famille.annonces.index');
        Route::get('/responsable-famille/annonces/create', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'create'])->name('responsable_famille.annonces.create');
        Route::post('/responsable-famille/annonces', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'store'])->name('responsable_famille.annonces.store');
        Route::get('/responsable-famille/annonces/{id}', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'show'])->name('responsable_famille.annonces.show');
        Route::get('/responsable-famille/annonces/{id}/fiche', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'fiche'])->name('responsable_famille.annonces.fiche');
        Route::get('/responsable-famille/annonces/{id}/edit', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'edit'])->name('responsable_famille.annonces.edit');
        Route::put('/responsable-famille/annonces/{id}', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'update'])->name('responsable_famille.annonces.update');
        Route::delete('/responsable-famille/annonces/{id}', [\App\Http\Controllers\ResponsableFamille\AnnonceController::class, 'destroy'])->name('responsable_famille.annonces.destroy');

        // Routes module Tresorerie (ResponsableFamille)
        Route::get('/responsable-famille/tresorerie', [ResponsableFamilleTresorerieController::class, 'index'])
            ->name('responsable_famille.tresorerie.index');
        Route::post('/responsable-famille/tresorerie/paiements', [ResponsableFamilleTresorerieController::class, 'storePaiement'])
            ->name('responsable_famille.tresorerie.paiements.store');
        Route::post('/responsable-famille/tresorerie/paiements/initiate', [ResponsableFamilleTresorerieController::class, 'initiatePaiement'])
            ->name('responsable_famille.tresorerie.paiements.initiate');
        Route::post('/responsable-famille/tresorerie/dons', [ResponsableFamilleTresorerieController::class, 'storeDon'])
            ->name('responsable_famille.tresorerie.dons.store');
        Route::post('/responsable-famille/tresorerie/dons/initiate', [ResponsableFamilleTresorerieController::class, 'initiateDonLibre'])
            ->name('responsable_famille.tresorerie.dons.initiate');
        Route::get('/responsable-famille/tresorerie/dons/verify', [ResponsableFamilleTresorerieController::class, 'verifyDonLibre'])
            ->name('responsable_famille.tresorerie.dons.verify');
        Route::get('/responsable-famille/tresorerie/paiement/{paiement}/verify', [ResponsableFamilleTresorerieController::class, 'verifyPaiement'])
            ->name('responsable_famille.tresorerie.paiement.verify');

        // Route de tableau de bord des transferts
        Route::get('/responsable-famille/transferts', [\App\Http\Controllers\ResponsableFamille\TransferController::class, 'index'])->name('responsable_famille.transferts.index');
        Route::post('/responsable-famille/transferts', [\App\Http\Controllers\ResponsableFamille\TransferController::class, 'store'])->name('responsable_famille.transferts.store');
        Route::post('/responsable-famille/transfer', [\App\Http\Controllers\ResponsableFamille\TransferController::class, 'transfer'])->name('responsable_famille.transfer');

        // ===== ROUTES PROGRAMMES RESPONSABLE FAMILLE (LECTURE SEULE) =====
        Route::get('/responsable-famille/programmes', [ProgrammesController::class, 'index'])->name('responsable_famille.programmes');
        Route::get('/responsable-famille/programmes/all', [ProgrammesController::class, 'allProgrammes'])->name('responsable_famille.programmes.all');
        Route::get('/responsable-famille/programmes/history', [ProgrammesController::class, 'historyProgrammes'])->name('responsable_famille.programmes.history');

        // Routes API pour les données (lecture seule)
        Route::get('/responsable-famille/api/events/by-month', [ProgrammesController::class, 'getEventsByMonth'])->name('responsable_famille.api.events.by-month');
        Route::get('/responsable-famille/api/events/{id}', [ProgrammesController::class, 'showEvent'])->name('responsable_famille.api.events.show');
        Route::get('/responsable-famille/api/gallery/media', [ProgrammesController::class, 'getGalleryMedia'])->name('responsable_famille.api.gallery.index');
        Route::get('/responsable-famille/api/gallery/media/{id}', [ProgrammesController::class, 'showMedia'])->name('responsable_famille.api.gallery.show');
        Route::get('/responsable-famille/api/events/{eventId}/media', [ProgrammesController::class, 'getMediaByEvent'])->name('responsable_famille.api.events.media');
        Route::get('/responsable-famille/galerie/filter', [ProgrammesController::class, 'getGalleryMediaFiltered'])->name('responsable_famille.galerie.filter');
        Route::get('/responsable-famille/programmes/history/filter', [ProgrammesController::class, 'getHistoryProgrammes'])->name('responsable_famille.programmes.history.filter');
    });

    // Tableau de bord Pasteur
    Route::get('/pasteur/transferts', [\App\Http\Controllers\Pasteur\TransferController::class, 'index'])->name('pasteur.transferts.index');
    Route::post('/pasteur/transferts', [\App\Http\Controllers\Pasteur\TransferController::class, 'store'])->name('pasteur.transferts.store');
    Route::post('/pasteur/transferts/{id}/approve', [\App\Http\Controllers\Pasteur\TransferController::class, 'approve'])->name('pasteur.transferts.approve');
    Route::post('/pasteur/transferts/{id}/refuse', [\App\Http\Controllers\Pasteur\TransferController::class, 'refuse'])->name('pasteur.transferts.refuse');

    // ===== ROUTES PRESIDENT DES CONDUCTEURS =====
    Route::middleware('role:bureau_conducteur')->group(function () {
        Route::get('/president-conducteurs/dashboard', [\App\Http\Controllers\PresidentConducteurs\DashboardController::class, 'index'])->name('president_conducteurs.dashboard');

        // Présences - statistiques
        Route::get('/president-conducteurs/presences/stats', [\App\Http\Controllers\PresidentConducteurs\PresencesController::class, 'stats'])->name('president_conducteurs.presences.stats');

        // Validation des actes
        Route::get('/president-conducteurs/liturgie/historique', [\App\Http\Controllers\PresidentConducteurs\LiturgieController::class, 'historique'])->name('president_conducteurs.liturgie.historique');
        Route::post('/president-conducteurs/liturgie/{id}/transition', [\App\Http\Controllers\PresidentConducteurs\LiturgieController::class, 'transition'])->name('president_conducteurs.liturgie.transition');
        Route::get('/president-conducteurs/liturgie/{id}/fiche-conducteur', [\App\Http\Controllers\PresidentConducteurs\LiturgieController::class, 'ficheConducteur'])->name('president_conducteurs.liturgie.fiche_conducteur');
        Route::get('/president-conducteurs/liturgie/{id}/fiche-priere', [\App\Http\Controllers\PresidentConducteurs\LiturgieController::class, 'fichePriere'])->name('president_conducteurs.liturgie.fiche_priere');

        // Trésorerie
        Route::post('/president-conducteurs/tresorerie/encouragement', [\App\Http\Controllers\PresidentConducteurs\DashboardController::class, 'storeEncouragement'])->name('president_conducteurs.tresorerie.encouragement');

        // Flash info
        Route::post('/president-conducteurs/flash-info', [\App\Http\Controllers\PresidentConducteurs\DashboardController::class, 'storeFlashInfo'])->name('president_conducteurs.flash_info.store');
        Route::put('/president-conducteurs/flash-info/{flashInfo}', [\App\Http\Controllers\PresidentConducteurs\DashboardController::class, 'updateFlashInfo'])->name('president_conducteurs.flash_info.update');
        Route::delete('/president-conducteurs/flash-info/{flashInfo}', [\App\Http\Controllers\PresidentConducteurs\DashboardController::class, 'destroyFlashInfo'])->name('president_conducteurs.flash_info.destroy');

        // Sondages
        Route::get('/president-conducteurs/sondages/{id}/details', [\App\Http\Controllers\PresidentConducteurs\Sondage\SondageController::class, 'details'])->whereNumber('id')->name('president_conducteurs.sondages.details');
        Route::get('/president-conducteurs/sondages/{id}/export', [\App\Http\Controllers\PresidentConducteurs\Sondage\SondageController::class, 'export'])->whereNumber('id')->name('president_conducteurs.sondages.export');
    });

    // ===== ROUTES PASTEUR =====
    Route::middleware('role:pasteur')->group(function () {
        Route::get('/pasteur/annuaire', [PasteurAnnuaireController::class, 'index'])->name('pasteur.annuaire.index');
        Route::get('/pasteur/dashboard', [PasteurDashboardController::class, 'index'])->name('pasteur.dashboard');
        Route::get('/pasteur/prieres', [\App\Http\Controllers\Pasteur\Prieres\PrieresController::class, 'index'])->name('pasteur.prieres.index');
        Route::patch('/pasteur/prieres/{priere}/status', [\App\Http\Controllers\Pasteur\Prieres\PrieresController::class, 'updateStatus'])->name('pasteur.prieres.status');
        Route::patch('/pasteur/prieres/{priere}/commentaire', [\App\Http\Controllers\Pasteur\Prieres\PrieresController::class, 'addComment'])->name('pasteur.prieres.comment');
        Route::patch('/pasteur/prieres/{priere}/reaction', [\App\Http\Controllers\Pasteur\Prieres\PrieresController::class, 'toggleReaction'])->name('pasteur.prieres.reaction');
        Route::get('/pasteur/sondages', [\App\Http\Controllers\Pasteur\Sondage\SondageController::class, 'index'])->name('pasteur.sondages.index');
        Route::get('/pasteur/sondages/{id}/export', [\App\Http\Controllers\Pasteur\Sondage\SondageController::class, 'export'])->whereNumber('id')->name('pasteur.sondages.export');
        Route::get('/pasteur/sondages/{id}', [\App\Http\Controllers\Pasteur\Sondage\SondageController::class, 'show'])->whereNumber('id')->name('pasteur.sondages.show');
        // Liste des inscriptions pour le pasteur (module controller)
        Route::get('/pasteur/inscriptions', [\App\Http\Controllers\Pasteur\InscriptionsController::class, 'index'])
            ->name('pasteur.inscriptions');

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
        Route::post('/pasteur/liturgie/{id}/ceremonie/decision', [PasteurLiturgieController::class, 'decisionCeremonie'])->name('pasteur.liturgie.ceremonie.decision');
        Route::get('/pasteur/liturgie/{id}/certificat', [PasteurLiturgieController::class, 'certificat'])->name('pasteur.liturgie.certificat');
        Route::get('/pasteur/liturgie/{id}/fiche-conducteur', [PasteurLiturgieController::class, 'ficheConducteur'])->name('pasteur.liturgie.fiche_conducteur');
        Route::get('/pasteur/liturgie/{id}/fiche', [PasteurLiturgieController::class, 'fiche'])->name('pasteur.liturgie.fiche');
        Route::get('/pasteur/liturgie/{id}/fiche-priere', [PasteurLiturgieController::class, 'fichePriere'])->name('pasteur.liturgie.fiche_priere');
        Route::post('/pasteur/liturgie/fiche/envoyer', [PasteurLiturgieController::class, 'envoyerFiche'])->name('pasteur.liturgie.fiche.envoyer');
        Route::get('/pasteur/liturgie/bapteme/liste-pdf', [PasteurLiturgieController::class, 'ficheBaptemeList'])->name('pasteur.liturgie.bapteme.liste_pdf');
        Route::post('/pasteur/liturgie/bapteme/fiche/envoyer', [PasteurLiturgieController::class, 'envoyerFicheBapteme'])->name('pasteur.liturgie.bapteme.fiche.envoyer');

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
        Route::post('/pasteur/tresorerie/encouragement', [PasteurTresorerieController::class, 'storeEncouragement'])
            ->name('pasteur.tresorerie.encouragement');

        // ===== ROUTES PROGRAMMES PASTEUR =====
        Route::get('/pasteur/programmes', [ProgrammesPasteurController::class, 'index'])->name('pasteur.programmes');
        Route::get('/pasteur/programmes/classe/{id}', [ProgrammesPasteurController::class, 'getClassProgrammes'])->name('pasteur.programmes.classe');

        // Routes module Présences (Pasteur)
        Route::get('/pasteur/presences', [\App\Http\Controllers\Pasteur\PresencesController::class, 'index'])->name('pasteur.presences.index');
        Route::get('/pasteur/presences/export', [\App\Http\Controllers\Pasteur\PresencesController::class, 'export'])->name('pasteur.presences.export');
    });

    // Tableau de bord Membre de Famille
    Route::middleware(['auth', 'role:membre_famille'])->group(function () {
        Route::get('/membre-famille/annuaire', [MembreFamilleAnnuaireController::class, 'index'])->name('membre_famille.annuaire.index');
        Route::get('/membre-famille/prieres', [\App\Http\Controllers\MembreFamille\Prieres\PrieresController::class, 'index'])->name('membre_famille.prieres.index');
        Route::get('/membre-famille/dashboard', [MembreFamilleDashboardController::class, 'index'])->name('membre_famille.dashboard');
        Route::get('/membre-famille/presences', [\App\Http\Controllers\MembreFamille\PresencesController::class, 'index'])->name('membre_famille.presences.index');
        Route::get('/membre-famille/presences/marquage', [PresenceConducteurController::class, 'indexMarqueur'])
            ->name('membre_famille.presences.marquage.index');
        Route::get('/membre-famille/presences/marquage/programmes-activites', [PresenceConducteurController::class, 'activitesProgramme'])
            ->name('membre_famille.presences.marquage.programmes_activites');
        Route::get('/membre-famille/presences/marquage/programmes/{event}/presences', [\App\Http\Controllers\Api\PresenceController::class, 'programmeSummary'])
            ->whereNumber('event')
            ->name('membre_famille.presences.marquage.programmes.presences');
        Route::post('/membre-famille/presences/marquage/marquer', [\App\Http\Controllers\Api\PresenceController::class, 'marquerPresenceManuelle'])
            ->name('membre_famille.presences.marquage.marquer');
        Route::get('/membre-famille/prieres', [\App\Http\Controllers\MembreFamille\Prieres\PrieresController::class, 'index'])->name('membre_famille.prieres.index');
        Route::post('/membre-famille/prieres', [\App\Http\Controllers\MembreFamille\Prieres\PrieresController::class, 'store'])->name('membre_famille.prieres.store');
        Route::patch('/membre-famille/prieres/{priere}/commentaire', [\App\Http\Controllers\MembreFamille\Prieres\PrieresController::class, 'updateTestimony'])->name('membre_famille.prieres.testimony');
        Route::patch('/membre-famille/prieres/{priere}/status', [\App\Http\Controllers\MembreFamille\Prieres\PrieresController::class, 'updateStatus'])->name('membre_famille.prieres.status');
        Route::patch('/membre-famille/prieres/{priere}/exaucee', [\App\Http\Controllers\MembreFamille\Prieres\PrieresController::class, 'markFulfilled'])->name('membre_famille.prieres.fulfilled');
        Route::patch('/membre-famille/prieres/{priere}/non-exaucee', [\App\Http\Controllers\MembreFamille\Prieres\PrieresController::class, 'markUnfulfilled'])->name('membre_famille.prieres.unfulfilled');
        Route::get('/membre-famille/sondages', [\App\Http\Controllers\MembreFamille\Sondage\SondageController::class, 'index'])->name('membre_famille.sondages.index');
        Route::get('/membre-famille/sondages/{id}', [\App\Http\Controllers\MembreFamille\Sondage\SondageController::class, 'show'])->whereNumber('id')->name('membre_famille.sondages.show');
        Route::post('/membre-famille/sondages/{id}/reponses', [\App\Http\Controllers\MembreFamille\Sondage\SondageController::class, 'storeResponse'])->whereNumber('id')->name('membre_famille.sondages.responses.store');
        Route::get('/membre-famille/inscriptions', [\App\Http\Controllers\MembreFamille\InscriptionsController::class, 'index'])->name('membre_famille.inscriptions');
        Route::get('/membre-famille/profile/edit', [MembreFamilleProfileController::class, 'edit'])->name('membre_famille.profile.edit');
        Route::put('/membre-famille/profile/update', [MembreFamilleProfileController::class, 'update'])->name('membre_famille.profile.update');
        Route::get('/membre-famille/liturgie', [MembreFamilleLiturgieController::class, 'index'])->name('membre_famille.liturgie.index');
        Route::get('/membre-famille/liturgie/nouvelle', [MembreFamilleLiturgieController::class, 'create'])->name('membre_famille.liturgie.create');
        Route::get('/membre-famille/liturgie/nouvelle/formulaire', [MembreFamilleLiturgieController::class, 'createForm'])->name('membre_famille.liturgie.form');
        Route::post('/membre-famille/liturgie', [MembreFamilleLiturgieController::class, 'store'])->name('membre_famille.liturgie.store');
        Route::get('/membre-famille/liturgie/{id}/certificat', [MembreFamilleLiturgieController::class, 'certificat'])->name('membre_famille.liturgie.certificat');
        Route::post('/membre-famille/annonces', [\App\Http\Controllers\MembreFamille\AnnonceController::class, 'store'])->name('membre_famille.annonces.store');
        Route::post('/membre-famille/flash-annonces', [\App\Http\Controllers\MembreFamille\FlashAnnonceController::class, 'store'])->name('membre_famille.flash_annonces.store');
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

        // ===== ROUTES PROGRAMMES MEMBRE (LECTURE SEULE) =====
        Route::get('/membre-famille/programmes', [ProgrammesController::class, 'index'])->name('membre_famille.programmes');
        Route::get('/membre-famille/programmes/all', [ProgrammesController::class, 'allProgrammes'])->name('membre_famille.programmes.all');
        Route::get('/membre-famille/programmes/history', [ProgrammesController::class, 'historyProgrammes'])->name('membre_famille.programmes.history');

        // Routes API pour les données (lecture seule)
        Route::get('/membre-famille/api/events/by-month', [ProgrammesController::class, 'getEventsByMonth'])->name('membre_famille.api.events.by-month');
        Route::get('/membre-famille/api/events/{id}', [ProgrammesController::class, 'showEvent'])->name('membre_famille.api.events.show');
        Route::get('/membre-famille/api/gallery/media', [ProgrammesController::class, 'getGalleryMedia'])->name('membre_famille.api.gallery.index');
        Route::get('/membre-famille/api/gallery/media/{id}', [ProgrammesController::class, 'showMedia'])->name('membre_famille.api.gallery.show');
        Route::get('/membre-famille/api/events/{eventId}/media', [ProgrammesController::class, 'getMediaByEvent'])->name('membre_famille.api.events.media');
        Route::get('/membre-famille/programmes/history/filter', [ProgrammesController::class, 'getHistoryProgrammes'])->name('membre_famille.programmes.history.filter');
        Route::get('/membre-famille/galerie/filter', [ProgrammesController::class, 'getGalleryMediaFiltered'])->name('membre_famille.galerie.filter');
    });

    // Route pour changer le mot de passe
    Route::get('/profile/change-password', [ChangePasswordController::class, 'show'])->name('profile.change-password');
    Route::post('/profile/change-password', [ChangePasswordController::class, 'update'])->name('profile.change-password.update');
});
