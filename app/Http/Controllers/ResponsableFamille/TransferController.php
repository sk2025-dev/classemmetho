<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Classe;
use App\Models\Family;
use App\Models\ClassTransferRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TransferController extends Controller
{
    /**
     * Afficher le tableau de bord des transferts
     */
    public function index()
    {
        $user = Auth::user();

        // Récupérer les demandes de transfert de la famille avec toutes les relations
        $transfers = ClassTransferRequest::with([
            'family',
            'user',
            'sourceClass',
            'targetClass',
            'validatedBySource',
            'validatedByAccueil',
        ])
            ->where('family_id', $user->family_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transfer) {
                return [
                    'id' => $transfer->id,
                    'reference' => $transfer->reference,
                    'status' => $transfer->status,
                    'type' => $transfer->type,
                    'reason' => $transfer->reason,
                    'member' => $transfer->type === 'member' && $transfer->user ? [
                        'id' => $transfer->user->id,
                        'name' => $transfer->user->nom . ' ' . $transfer->user->prenom,
                    ] : null,
                    'family' => $transfer->type === 'family' && $transfer->family ? [
                        'id' => $transfer->family->id,
                        'name' => $transfer->family->nom,
                    ] : null,
                    'classe_source' => [
                        'id' => $transfer->sourceClass->id,
                        'nom' => $transfer->sourceClass->nom,
                    ],
                    'classe_cible' => $transfer->targetClass ? [
                        'id' => $transfer->targetClass->id,
                        'nom' => $transfer->targetClass->nom,
                    ] : null,
                    'external_destination' => $transfer->destination_city
                        ? trim($transfer->destination_city . ($transfer->destination_country ? " • {$transfer->destination_country}" : ''))
                        : null,
                    'destination_note' => $transfer->destination_note,
                    'created_at' => $transfer->created_at->format('Y-m-d'),
                    'validated_source_by' => $transfer->validatedBySource ? $transfer->validatedBySource->nom . ' ' . $transfer->validatedBySource->prenom : null,
                    'validated_source_at' => $transfer->validated_by_source_at ? $transfer->validated_by_source_at->format('Y-m-d') : null,
                    'validated_accueil_by' => $transfer->validatedByAccueil ? $transfer->validatedByAccueil->nom . ' ' . $transfer->validatedByAccueil->prenom : null,
                    'validated_accueil_at' => $transfer->validated_by_accueil_at ? $transfer->validated_by_accueil_at->format('Y-m-d') : null,
                ];
            });

        // Récupérer tous les membres de la famille (autres que le responsable et autres responsables)
        $members = User::where('family_id', $user->family_id)
            ->where('id', '!=', $user->id)
            ->where('is_family_responsible', false)
            ->select('id', 'nom', 'prenom', 'email', 'classe_id')
            ->get();

        // Récupérer la famille
        $family = Family::findOrFail($user->family_id);

        // Récupérer toutes les classes disponibles sauf celle d'origine de la famille
        $classes = Classe::where('id', '!=', $family->classe_id)->get();

        return Inertia::render('ResponsableFamille/TableauBordTransferts', [
            'transfers' => $transfers,
            'classes' => $classes,
            'members' => $members,
            'family' => $family,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Créer une nouvelle demande de transfert
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['member', 'family', 'external'])],
            'user_id' => 'nullable|integer|exists:users,id',
            'target_class_id' => [
                Rule::requiredIf(fn () => $request->input('type') !== 'external'),
                'nullable',
                'integer',
                'exists:classes,id',
            ],
            'destination_city' => 'required_if:type,external|string|max:255',
            'destination_country' => 'required_if:type,external|string|max:255',
            'destination_note' => 'nullable|string|max:500',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();

        // Vérifier si l'utilisateur est responsable
        if (!$user->family_id) {
            return redirect()->back()->with('error', 'Non autorisé');
        }

        try {
            DB::beginTransaction();

            $sourceClassId = null;
            if ($validated['type'] === 'member') {
                // Vérifier que le membre appartient à la famille
                $member = User::findOrFail($validated['user_id']);
                if ($member->family_id != $user->family_id) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Le membre n\'appartient pas à cette famille');
                }

                // Empêcher le transfert si c'est un responsable de famille ou si son transfert laisserait la famille sans responsable
                if ($member->is_family_responsible || ($member->id === $user->id && $user->is_family_responsible)) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Le responsable de famille ne peut pas être transféré. Désignez d\'abord un nouveau responsable.');
                }

                $sourceClassId = $member->classe_id;
            } else {
                // Pour les demandes familiales ou externes, utiliser la classe du responsable comme référence
                $sourceClassId = $user->classe_id;
            }

            // Créer la demande de transfert
            $transfer = ClassTransferRequest::create([
                'family_id' => $user->family_id,
                'user_id' => $validated['type'] === 'member' ? $validated['user_id'] : null,
                'source_class_id' => $sourceClassId,
                'target_class_id' => $validated['type'] === 'external' ? null : $validated['target_class_id'],
                'type' => $validated['type'],
                'reason' => $validated['reason'] ?? null,
                'destination_city' => $validated['destination_city'] ?? null,
                'destination_country' => $validated['destination_country'] ?? null,
                'destination_note' => $validated['destination_note'] ?? null,
                'status' => 'EN_ATTENTE_SOURCE',
                'reference' => ClassTransferRequest::generateReference(),
                'created_by_id' => $user->id,
            ]);

            DB::commit();

            return redirect()->route('responsable_famille.transferts.index')
                ->with('success', "Demande de transfert créée avec succès (Réf: {$transfer->reference})");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur lors de la création : ' . $e->getMessage());
        }
    }

    /**
     * Valider une demande de transfert par le conducteur source
     */
    public function approveBySource($id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();

        // Vérifier que l'utilisateur est conducteur de la classe source
        if ($user->classe_id != $transfer->source_class_id || $user->role !== 'conducteur') {
            return redirect()->back()->with('error', 'Non autorisé');
        }

        // Vérifier que la demande est en attente
        if ($transfer->status !== 'EN_ATTENTE_SOURCE') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas être approuvée à ce stade');
        }

        try {
            DB::beginTransaction();

            // Mettre à jour la demande
            $transfer->update([
                'status' => 'EN_ATTENTE_ACCUEIL',
                'validated_by_source_id' => $user->id,
                'validated_by_source_at' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Demande approuvée par votre classe source');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    /**
     * Valider une demande de transfert par le conducteur accueil et finir le transfert
     */
    public function approveByAccueil($id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();

        // Vérifier que l'utilisateur est conducteur de la classe cible
        if ($user->classe_id != $transfer->target_class_id || $user->role !== 'conducteur') {
            return redirect()->back()->with('error', 'Non autorisé');
        }

        // Vérifier que la demande est en attente d'accueil
        if ($transfer->status !== 'EN_ATTENTE_ACCUEIL') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas être approuvée à ce stade');
        }

        try {
            DB::beginTransaction();

            // Mettre à jour la demande
            $transfer->update([
                'status' => 'TERMINEE',
                'validated_by_accueil_id' => $user->id,
                'validated_by_accueil_at' => now(),
            ]);

            // Effectuer le transfert
            if ($transfer->type === 'member') {
                // Pour un transfert de membre, créer une nouvelle famille et le rendre responsable
                $member = User::findOrFail($transfer->user_id);
                $originalFamily = $member->family_id ? Family::find($member->family_id) : null;

                // Créer une nouvelle famille pour le membre (copier certaines infos de la famille d'origine)
                $newFamily = Family::create([
                    'nom' => $member->nom,
                    'email' => $member->email,
                    'classe_id' => $transfer->target_class_id,
                    'responsable_id' => $transfer->user_id,
// Auto-généré par le modèle Family (CF + incrémentation)

                    // Copier adresse et téléphone de la famille d'origine si elle existe
                    'adresse' => $originalFamily ? $originalFamily->adresse : null,
                    'quartier' => $originalFamily ? $originalFamily->quartier : null,
                    'telephone' => $originalFamily ? $originalFamily->telephone : null,
                    'telephone2' => $originalFamily ? $originalFamily->telephone2 : null,
                    'ville_id' => $originalFamily ? $originalFamily->ville_id : null,
                ]);

                // Mettre à jour le membre: classe + famille + rôle
                $member->update([
                    'classe_id' => $transfer->target_class_id,
                    'family_id' => $newFamily->id,
                    'role' => 'responsable_famille', // Devient responsable de sa nouvelle famille
                ]);
            } else {
                // Pour un transfert familial, juste changer la classe des membres
                User::where('family_id', $transfer->family_id)
                    ->where('id', '!=', $user->id)
                    ->update(['classe_id' => $transfer->target_class_id]);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Transfert complété avec succès!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    /**
     * Refuser une demande de transfert
     */
    public function refuse(Request $request, $id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Vérifier autorisation
        $isConductorSource = $user->classe_id === $transfer->source_class_id && $user->role === 'conducteur' && $transfer->status === 'EN_ATTENTE_SOURCE';
        $isConductorAccueil = $user->classe_id === $transfer->target_class_id && $user->role === 'conducteur' && $transfer->status === 'EN_ATTENTE_ACCUEIL';

        if (!$isConductorSource && !$isConductorAccueil) {
            return redirect()->back()->with('error', 'Non autorisé');
        }

        try {
            $transfer->update([
                'status' => 'REFUSEE',
                'refusal_reason' => $validated['reason'],
                'validated_by_source_id' => $isConductorSource ? $user->id : $transfer->validated_by_source_id,
                'validated_by_accueil_id' => $isConductorAccueil ? $user->id : $transfer->validated_by_accueil_id,
            ]);

            return redirect()->back()->with('success', 'Demande refusée');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    /**
     * Transférer un ou plusieurs membres vers une nouvelle classe (ancien endpoint, à remplacer par store)
     */
    public function transfer(Request $request)
    {
        // Validation
        $validated = $request->validate([
            'type' => 'required|in:membre,famille',
            'member_id' => 'nullable|integer|exists:users,id',
            'family_id' => 'required|integer|exists:families,id',
            'target_class_id' => 'required|integer|exists:classes,id',
        ]);

        $user = Auth::user();

        // Vérifier que l'utilisateur est responsable de la famille
        if ($user->family_id != $validated['family_id']) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        try {
            DB::beginTransaction();

            $targetClass = Classe::findOrFail($validated['target_class_id']);
            $transferredCount = 0;

            if ($validated['type'] === 'membre') {
                // Transférer un membre spécifique
                $member = User::findOrFail($validated['member_id']);

                // Vérifier que le membre appartient à la famille
                if ($member->family_id != $validated['family_id']) {
                    DB::rollBack();
                    return response()->json(['message' => 'Le membre n\'appartient pas à cette famille'], 403);
                }

                // Mettre à jour la classe
                $member->update(['classe_id' => $targetClass->id]);
                $transferredCount = 1;

            } else if ($validated['type'] === 'famille') {
                // Transférer tous les membres de la famille
                $transferred = User::where('family_id', $validated['family_id'])
                    ->where('id', '!=', $user->id) // Exclure le responsable
                    ->update(['classe_id' => $targetClass->id]);

                $transferredCount = $transferred;
            }

            DB::commit();

            return response()->json([
                'message' => "Transfert réussi : {$transferredCount} membre(s) transféré(s) vers {$targetClass->nom}",
                'success' => true,
                'transferred_count' => $transferredCount,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du transfert : ' . $e->getMessage(),
                'success' => false,
            ], 500);
        }
    }
}
