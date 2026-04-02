<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\FormationRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class FormationController extends Controller
{
    public function store(Request $request)
    {
        $payload = $request->validate([
            'membre_id' => 'required|integer|exists:users,id',
            'type_formation' => 'required|string|in:mariage,bapteme',
            'conjoint_nom' => 'nullable|string|max:255',
            'conjoint_contact' => 'nullable|digits:10',
            'conjoint_profession' => 'nullable|string|max:255',
            'conjoint_birthdate' => 'nullable|date',
            'conjoint_baptized' => 'boolean',
            'conjoint_church' => 'nullable|string|max:255',
            'bapteme_nom_parrain' => 'nullable|string|max:255',
            'bapteme_contact_parrain' => 'nullable|digits:10',
            'bapteme_nom_marraine' => 'nullable|string|max:255',
            'bapteme_contact_marraine' => 'nullable|digits:10',
            'bapteme_statut_catechumene' => 'nullable|string|in:debutant,en_cours,termine',
            'message' => 'nullable|string|max:2000',
        ]);

        if ($payload['type_formation'] === 'mariage') {
            if (empty($payload['conjoint_nom']) || empty($payload['conjoint_contact'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pour une formation mariage, le nom et le contact du conjoint sont obligatoires.',
                ], 422);
            }
        }

        /** @var User $user */
        $user = Auth::user();

        if (!$user || !$user->family_id) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune famille rattachee a votre compte.',
            ], 422);
        }

        $member = User::query()
            ->where('id', $payload['membre_id'])
            ->where('family_id', $user->family_id)
            ->first();

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Le membre selectionne n\'appartient pas a votre famille.',
            ], 422);
        }

        $alreadyRequested = FormationRequest::query()
            ->where('membre_id', $member->id)
            ->where(function ($query) use ($payload) {
                if ($payload['type_formation'] === 'mariage') {
                    $query->where('type_formation', 'mariage')->orWhereNull('type_formation');
                    return;
                }

                $query->where('type_formation', $payload['type_formation']);
            })
            ->exists();

        if ($alreadyRequested) {
            return response()->json([
                'success' => false,
                'message' => 'Ce membre a deja une demande pour ce type de formation.',
            ], 422);
        }

        $details = null;
        if ($payload['type_formation'] === 'bapteme') {
            $details = [
                'bapteme_nom_parrain' => $payload['bapteme_nom_parrain'] ?? null,
                'bapteme_contact_parrain' => $payload['bapteme_contact_parrain'] ?? null,
                'bapteme_nom_marraine' => $payload['bapteme_nom_marraine'] ?? null,
                'bapteme_contact_marraine' => $payload['bapteme_contact_marraine'] ?? null,
                'bapteme_statut_catechumene' => $payload['bapteme_statut_catechumene'] ?? null,
            ];
        }

        do {
            $reference = 'FORMATION-' . strtoupper(Str::random(6));
        } while (FormationRequest::where('reference', $reference)->exists());

        $formation = FormationRequest::create(array_merge($payload, [
            'reference' => $reference,
            'family_id' => $user->family_id,
            'created_by' => $user->id,
            'classe_id' => $member->classe_id,
            'membre_id' => $member->id,
            'statut' => 'SOUMISE',
            'details' => $details,
        ]));

        $formation->historiques()->create([
            'statut_precedent' => null,
            'statut_nouveau' => 'SOUMISE',
            'acteur_id' => $user->id,
            'commentaire' => $payload['message'] ?? null,
        ]);

        if (in_array($payload['type_formation'], ['mariage', 'bapteme'], true)) {
            \App\Models\ActeLiturgique::query()
                ->where('created_by', $user->id)
                ->where('membre_id', $member->id)
                ->where('type_acte', $payload['type_formation'])
                ->whereNull('formation_request_id')
                ->update([
                    'formation_request_id' => $formation->id,
                ]);
        }

        return response()->json([
            'success' => true,
            'formation' => $formation->load('membre', 'conducteur', 'classe', 'historiques.acteur', 'formationTermineePar'),
        ]);
    }
}
