<?php

// routes/api.php - Ajouter ces routes pour l'approbation d'inscriptions

use App\Http\Controllers\InscriptionApprovalController;
use Illuminate\Support\Facades\Route;

/**
 * Routes pour l'approbation des inscriptions
 * Protégées par middleware authentication et roles
 */

Route::middleware(['auth:sanctum'])->group(function () {
    // Lister les inscriptions à approuver (admin: toutes, conducteur: sa classe)
    Route::get('/inscriptions/pending-approvals',
        [InscriptionApprovalController::class, 'pendingApprovals'])
        ->name('inscriptions.pending-approvals');

    // Approbation par l'administrateur
    Route::post('/inscriptions/{inscription}/approve-admin',
        [InscriptionApprovalController::class, 'approveAsAdmin'])
        ->middleware('role:admin')
        ->name('inscriptions.approve-admin');

    // Approbation par le conducteur
    Route::post('/inscriptions/{inscription}/approve-conductor',
        [InscriptionApprovalController::class, 'approveAsConductor'])
        ->middleware('role:conducteur')
        ->name('inscriptions.approve-conductor');

    // Rejet d'inscription (admin ou conducteur)
    Route::post('/inscriptions/{inscription}/reject',
        [InscriptionApprovalController::class, 'reject'])
        ->middleware('role:admin,conducteur')
        ->name('inscriptions.reject');
});

/**
 * ===== DOCUMENTATION D'UTILISATION =====
 *
 * 1. APPROBATION ADMIN
 * -------------------
 * POST /api/inscriptions/{id}/approve-admin
 * Headers: Authorization: Bearer {token}
 * Body JSON (optionnel):
 * {
 *     "reason": "Inscription acceptée après vérification"
 * }
 *
 * Réponse: 200 OK
 * "Inscription approuvée par l'administrateur"
 *
 * ---
 *
 * 2. APPROBATION CONDUCTEUR
 * -------------------------
 * POST /api/inscriptions/{id}/approve-conductor
 * Headers: Authorization: Bearer {token}
 * Body JSON (optionnel):
 * {
 *     "reason": "Inscription acceptée"
 * }
 *
 * Réponse: 200 OK
 * "Inscription approuvée par le conducteur"
 *
 * Logique:
 * - Quand ADMIN et CONDUCTEUR ont tous deux approuvé:
 *   → status = 'approuve'
 *   → Création automatique du compte RESPONSABLE
 *   → Création automatique des FAMILY_MEMBERS
 *
 * ---
 *
 * 3. REJET D'INSCRIPTION
 * ----------------------
 * POST /api/inscriptions/{id}/reject
 * Headers: Authorization: Bearer {token}
 * Body JSON (requis):
 * {
 *     "reason": "Motif du rejet (requis)"
 * }
 *
 * Réponse: 200 OK
 * "Inscription rejetée"
 *
 * ---
 *
 * FLUX COMPLET D'UNE INSCRIPTION FAMILLE:
 *
 * 1. Responsable remplit le formulaire
 *    - Infos famille
 *    - Ses infos
 *    - Infos des membres
 *
 * 2. Création d'une INSCRIPTION avec:
 *    - type = 'famille'
 *    - status = 'en_attente'
 *    - family_id = créée
 *    - data = JSON avec tous les membres
 *
 * 3. Admin approuve
 *    POST /inscriptions/{id}/approve-admin
 *    → admin_approved = true
 *    → admin_id = admin user id
 *
 * 4. Conducteur approuve
 *    POST /inscriptions/{id}/approve-conductor
 *    → conducteur_approved = true
 *    → conducteur_id = conducteur user id
 *    → Automatiquement: status = 'approuve'
 *
 * 5. Service crée automatiquement:
 *    - User (responsable_id dans Family)
 *    - FamilyMembers (1 par membre)
 *    - Génère mot de passe temporaire
 *
 * 6. Responsable reçoit email avec credentials
 *
 * 7. À la première connexion:
 *    - must_change_password = true force le changement
 *
 * ---
 *
 * EXEMPLE COMPLET EN JAVASCRIPT:
 *
 * // Approuver par l'admin
 * async function approveAsAdmin(inscriptionId) {
 *     const response = await fetch(
 *         `/api/inscriptions/${inscriptionId}/approve-admin`,
 *         {
 *             method: 'POST',
 *             headers: {
 *                 'Authorization': `Bearer ${token}`,
 *                 'Content-Type': 'application/json',
 *             },
 *             body: JSON.stringify({
 *                 reason: 'Données vérifiées et acceptées'
 *             })
 *         }
 *     );
 *
 *     if (response.ok) {
 *         console.log('Approuvé par l\'admin');
 *     } else {
 *         const error = await response.text();
 *         console.error('Erreur:', error);
 *     }
 * }
 *
 * // Approuver par le conducteur
 * async function approveByConductor(inscriptionId) {
 *     const response = await fetch(
 *         `/api/inscriptions/${inscriptionId}/approve-conductor`,
 *         {
 *             method: 'POST',
 *             headers: {
 *                 'Authorization': `Bearer ${token}`,
 *                 'Content-Type': 'application/json',
 *             }
 *         }
 *     );
 *
 *     if (response.ok) {
 *         console.log('Approuvé par le conducteur');
 *         // À ce stade, les FamilyMembers sont créés automatiquement
 *         // Vous pouvez rafraîchir pour voir les modifications
 *     }
 * }
 *
 * // Rejeter
 * async function rejectInscription(inscriptionId, reason) {
 *     const response = await fetch(
 *         `/api/inscriptions/${inscriptionId}/reject`,
 *         {
 *             method: 'POST',
 *             headers: {
 *                 'Authorization': `Bearer ${token}`,
 *                 'Content-Type': 'application/json',
 *             },
 *             body: JSON.stringify({
 *                 reason: reason
 *             })
 *         }
 *     );
 *
 *     if (response.ok) {
 *         console.log('Inscription rejetée');
 *     }
 * }
 *
 * ---
 *
 * STATES D'UNE INSCRIPTION:
 *
 * 'en_attente'  - En attente d'approbation (initial)
 * 'approuve'    - Approuvée par admin ET conducteur
 * 'rejete'      - Rejetée (soft deleted)
 *
 * CHAMPS DE SUIVI:
 *
 * admin_approved (boolean)
 * admin_id (FK user)
 * admin_approved_at (timestamp)
 *
 * conducteur_approved (boolean)
 * conducteur_id (FK user)
 * conducteur_approved_at (timestamp)
 *
 * ---
 */
