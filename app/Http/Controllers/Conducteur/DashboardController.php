<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Vérifier que c'est un conducteur
        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        // Récupérer les classes gérées par le conducteur
        $conductorClasses = $user->getManagedClasses();

        if ($conductorClasses->isEmpty()) {
            return Inertia::render('Conducteur/Dashboard', [
                'role' => $user->role,
                'pendingInscriptions' => 0,
                'pendingTransfers' => 0,
                'inscriptions' => [],
                'users' => [],
                'className' => 'Aucune classe assignée',
            ]);
        }

        $classIds = $conductorClasses->pluck('id')->toArray();
        // NOTE: classe_id dans le JSON est une chaîne, donc on le convertit pour la comparaison
        $classIdsStr = array_map('strval', $classIds);
        $className = $conductorClasses->first()->nom ?? 'Classes multiples';

        // 1. Récupérer TOUTES les inscriptions en attente de sa classe
        $placeholders = implode(',', array_fill(0, count($classIdsStr), '?'));
        $pendingInscriptions = Inscription::whereRaw('JSON_EXTRACT(data, "$.famille.classe_id") IN (' . $placeholders . ')', $classIdsStr)
            ->where('status', 'en_attente')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($insc) {
                return [
                    'id' => $insc->id,
                    'nom' => $insc->nom,
                    'prenom' => $insc->prenom,
                    'email' => $insc->email,
                    'telephone' => $insc->telephone,
                    'genre' => $insc->genre,
                    'date_naissance' => $insc->date_naissance,
                    'adresse' => $insc->adresse,
                    'fonction_professionnelle' => $insc->fonction_professionnelle,
                    'statut_marital' => $insc->statut_marital,
                    'date_mariage' => $insc->date_mariage,
                    'lieu_mariage' => $insc->lieu_mariage,
                    'baptise' => $insc->baptise,
                    'date_bapteme' => $insc->date_bapteme,
                    'lieu_bapteme' => $insc->lieu_bapteme,
                    'premiere_communion' => $insc->premiere_communion,
                    'date_premiere_communion' => $insc->date_premiere_communion,
                    'mariage_religieux' => $insc->mariage_religieux,
                    'date_mariage_religieux' => $insc->date_mariage_religieux,
                    'famille_id' => $insc->famille_id,
                    'responsable_famille' => ($insc->responsable_nom && $insc->responsable_prenom) ? $insc->responsable_nom . ' ' . $insc->responsable_prenom : 'N/A',
                    'status' => $insc->status,
                    'classe_id' => $insc->data['famille']['classe_id'] ?? null,
                    'created_at' => $insc->created_at,
                ];
            });

        // 2. Récupérer TOUS les users de sa classe (responsables + membres)
        $classUsers = User::whereIn('classe_id', $classIds)
            ->where('id', '!=', $user->id) // Exclure l'utilisateur courant
            ->with('family')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'nom' => $u->nom,
                    'prenom' => $u->prenom,
                    'email' => $u->email,
                    'telephone' => $u->telephone,
                    'genre' => $u->genre,
                    'role' => $u->role,
                    'is_family_responsible' => $u->is_family_responsible,
                    'family_id' => $u->family_id,
                    'family_name' => $u->family ? $u->family->nom : null,
                    'created_at' => $u->created_at,
                ];
            });

        $pendingCount = $pendingInscriptions->count();
        $pendingTransfers = 0; // À implémenter selon votre logique

        return Inertia::render('Conducteur/Dashboard', [
            'role' => $user->role,
            'pendingInscriptions' => $pendingCount,
            'pendingTransfers' => $pendingTransfers,
            'inscriptions' => $pendingInscriptions->values(),
            'users' => $classUsers->values(),
            'className' => $className,
            'userCount' => $classUsers->count(),
            'totalInscriptionCount' => Inscription::whereRaw('JSON_EXTRACT(data, "$.famille.classe_id") IN (' . implode(',', array_fill(0, count($classIdsStr), '?')) . ')', $classIdsStr)->count(),
        ]);
    }

    /**
     * Approuver une inscription
     */
    public function approveInscription($inscriptionId)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        $inscription = Inscription::findOrFail($inscriptionId);

        // Vérifier que l'inscription est de sa classe
        $conductorClasses = $user->getManagedClasses();
        $inscriptionClasseId = $inscription->data['famille']['classe_id'] ?? null;
        if (!$conductorClasses->pluck('id')->contains($inscriptionClasseId)) {
            abort(403, 'Cette inscription n\'est pas de votre classe');
        }

        // Approuver l'inscription
        $inscription->update([
            'status' => 'approuve',
            'conducteur_id' => $user->id,
            'conducteur_approved_at' => now(),
        ]);

        return back()->with('success', 'Inscription approuvée avec succès');
    }

    /**
     * Rejeter une inscription
     */
    public function rejectInscription(Request $request, $inscriptionId)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        $inscription = Inscription::findOrFail($inscriptionId);

        // Vérifier que l'inscription est de sa classe
        $conductorClasses = $user->getManagedClasses();
        if (!$conductorClasses->pluck('id')->contains($inscription->classe_id)) {
            abort(403, 'Cette inscription n\'est pas de votre classe');
        }

        $reason = $request->input('raison_rejet', '');

        // Rejeter l'inscription
        $inscription->update([
            'status' => 'rejetee',
            'raison_rejet' => $reason,
            'rejected_by' => $user->id,
            'rejected_at' => now(),
        ]);

        return back()->with('success', 'Inscription rejetée avec succès');
    }
}
