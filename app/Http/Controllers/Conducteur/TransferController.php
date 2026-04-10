<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\ClassTransferRequest;
use App\Models\Family;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransferController extends Controller
{
    /**
     * Afficher les demandes de transfert pour le conducteur (à valider)
     */
    public function index()
    {
        $user = Auth::user();

        // Récupérer les demandes en attente de validation par ce conducteur
        $pendingTransfers = ClassTransferRequest::with([
            'family',
            'user.family',
            'sourceClass',
            'targetClass',
            'validatedBySource',
            'validatedByAccueil',
            'createdBy.family',
        ])
            ->where(function ($query) use ($user) {
                // Soit en attente de validation source (conducteur source)
                $query->where('classe_source_id', $user->classe_id)
                    ->where('statut', 'EN_ATTENTE_SOURCE')
                    // Soit en attente de validation accueil (conducteur accueil)
                    ->orWhere(function ($q) use ($user) {
                        $q->where('classe_cible_id', $user->classe_id)
                            ->where('statut', 'EN_ATTENTE_ACCUEIL');
                    });
            })
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
                        'email' => $transfer->user->email,
                        'telephone' => $transfer->user->telephone,
                        'code_membre' => $transfer->user->code_membre,
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
                    'created_at' => $transfer->created_at->format('Y-m-d H:i'),
                    'created_by' => $transfer->createdBy ? $transfer->createdBy->nom . ' ' . $transfer->createdBy->prenom : null,
                    'validated_source_by' => $transfer->validatedBySource ? $transfer->validatedBySource->nom . ' ' . $transfer->validatedBySource->prenom : null,
                    'validated_source_at' => $transfer->validated_by_source_at ? $transfer->validated_by_source_at->format('Y-m-d H:i') : null,
                    'validated_accueil_by' => $transfer->validatedByAccueil ? $transfer->validatedByAccueil->nom . ' ' . $transfer->validatedByAccueil->prenom : null,
                    'validated_accueil_at' => $transfer->validated_by_accueil_at ? $transfer->validated_by_accueil_at->format('Y-m-d H:i') : null,
                    'famille_source' => $transfer->family ? [
                        'id' => $transfer->family->id,
                        'nom' => $transfer->family->nom,
                        'code_famille' => $transfer->family->code_famille,
                    ] : ($transfer->user && $transfer->user->family ? [
                        'id' => $transfer->user->family->id,
                        'nom' => $transfer->user->family->nom,
                        'code_famille' => $transfer->user->family->code_famille,
                    ] : ($transfer->createdBy && $transfer->createdBy->family ? [
                        'id' => $transfer->createdBy->family->id,
                        'nom' => $transfer->createdBy->family->nom,
                        'code_famille' => $transfer->createdBy->family->code_famille,
                    ] : null)),
                ];
            });

        // Récupérer les demandes approuvées/refusées par ce conducteur
        $processedTransfers = ClassTransferRequest::with([
            'family',
            'user.family',
            'sourceClass',
            'targetClass',
            'validatedBySource',
            'validatedByAccueil',
            'createdBy.family',
        ])
            ->where(function ($query) use ($user) {
                // Soit validées source par ce conducteur
                $query->where('validateur_source_id', $user->id)
                    // Soit validées accueil par ce conducteur
                    ->orWhere('validateur_accueil_id', $user->id);
            })
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transfer) {
                // Debug log pour les transferts traités
                \Log::debug('ProcessedTransfer - User family relation:', [
                    'transfer_id' => $transfer->id,
                    'user_family_id' => $transfer->user?->family_id,
                    'user_family_nom' => $transfer->user?->family?->nom,
                ]);

                return [
                    'id' => $transfer->id,
                    'reference' => $transfer->reference,
                    'status' => $transfer->status,
                    'type' => $transfer->type,
                    'reason' => $transfer->reason,
                    'member' => $transfer->type === 'member' && $transfer->user ? [
                        'id' => $transfer->user->id,
                        'name' => $transfer->user->nom . ' ' . $transfer->user->prenom,
                        'email' => $transfer->user->email,
                        'telephone' => $transfer->user->telephone,
                        'code_membre' => $transfer->user->code_membre,
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
                    'created_at' => $transfer->created_at->format('Y-m-d H:i'),
                    'created_by' => $transfer->createdBy ? $transfer->createdBy->nom . ' ' . $transfer->createdBy->prenom : null,
                    'validated_source_by' => $transfer->validatedBySource ? $transfer->validatedBySource->nom . ' ' . $transfer->validatedBySource->prenom : null,
                    'validated_source_at' => $transfer->validated_by_source_at ? $transfer->validated_by_source_at->format('Y-m-d H:i') : null,
                    'validated_accueil_by' => $transfer->validatedByAccueil ? $transfer->validatedByAccueil->nom . ' ' . $transfer->validatedByAccueil->prenom : null,
                    'validated_accueil_at' => $transfer->validated_by_accueil_at ? $transfer->validated_by_accueil_at->format('Y-m-d H:i') : null,
                    'famille_source' => $transfer->family ? [
                        'id' => $transfer->family->id,
                        'nom' => $transfer->family->nom,
                        'code_famille' => $transfer->family->code_famille,
                    ] : ($transfer->user && $transfer->user->family ? [
                        'id' => $transfer->user->family->id,
                        'nom' => $transfer->user->family->nom,
                        'code_famille' => $transfer->user->family->code_famille,
                    ] : ($transfer->createdBy && $transfer->createdBy->family ? [
                        'id' => $transfer->createdBy->family->id,
                        'nom' => $transfer->createdBy->family->nom,
                        'code_famille' => $transfer->createdBy->family->code_famille,
                    ] : null)),
                ];
            });

        return Inertia::render('Conducteur/Transfers', [
            'pendingTransfers' => $pendingTransfers,
            'processedTransfers' => $processedTransfers,
            'stats' => [
                'total' => $pendingTransfers->count() + $processedTransfers->count(),
                'pending_source' => $pendingTransfers->where('status', 'EN_ATTENTE_SOURCE')->count(),
                'pending_accueil' => $pendingTransfers->where('status', 'EN_ATTENTE_ACCUEIL')->count(),
                'completed' => $processedTransfers->where('status', 'TERMINEE')->count(),
                'refused' => $processedTransfers->where('status', 'REFUSEE')->count(),
            ],
            'userClass' => [
                'id' => $user->classe_id,
                'nom' => $user->classe?->nom ?? 'Classe inconnue',
            ],
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Approuver une demande en tant que conducteur source
     */
    public function approveAsSource($id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();

        // Vérifier que l'utilisateur est conducteur de la classe source
        if ($user->classe_id != $transfer->source_class_id) {
            return redirect()->back()->with('error', 'Non autorisé');
        }

        // Vérifier que la demande est EN_ATTENTE_SOURCE
        if ($transfer->status !== 'EN_ATTENTE_SOURCE') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas être approuvée à ce stade');
        }

        if ($transfer->type === 'external') {
            try {
                DB::beginTransaction();

                $transfer->update([
                    'status' => 'TERMINEE',
                    'validated_by_source_id' => $user->id,
                    'validated_by_source_at' => now(),
                    'validated_by_accueil_id' => $user->id,
                    'validated_by_accueil_at' => now(),
                ]);

                DB::commit();
                return redirect()->back()->with('success', 'Transfert hors communauté validé et clôturé.');
            } catch (\Exception $e) {
                DB::rollBack();
                return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
            }
        }

        try {
            DB::beginTransaction();

            $transfer->update([
                'status' => 'EN_ATTENTE_ACCUEIL',
                'validated_by_source_id' => $user->id,
                'validated_by_source_at' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Demande approuvée. En attente de validation accueil.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    /**
     * Approuver une demande en tant que conducteur accueil
     */
    public function approveAsAccueil($id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();

        // Vérifier que l'utilisateur est conducteur de la classe cible
        if ($user->classe_id != $transfer->target_class_id) {
            return redirect()->back()->with('error', 'Non autorisé');
        }

        // Vérifier que la demande est EN_ATTENTE_ACCUEIL
        if ($transfer->status !== 'EN_ATTENTE_ACCUEIL') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas être approuvée à ce stade');
        }

        try {
            DB::beginTransaction();

            $transfer->update([
                'status' => 'TERMINEE',
                'validated_by_accueil_id' => $user->id,
                'validated_by_accueil_at' => now(),
            ]);

            // Effectuer le transfert automatiquement
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
                // Pour un transfert familial, synchroniser la classe de la famille
                // puis de tous ses membres.
                Family::where('id', $transfer->family_id)
                    ->update(['classe_id' => $transfer->target_class_id]);

                User::where('family_id', $transfer->family_id)
                    ->update(['classe_id' => $transfer->target_class_id]);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Demande approuvée et transfert complété !');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    /**
     * Refuser une demande
     */
    public function refuse(Request $request, $id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Vérifier autorisation (conducteur source ou accueil)
        $isSource = $user->classe_id === $transfer->source_class_id && $transfer->status === 'EN_ATTENTE_SOURCE';
        $isAccueil = $user->classe_id === $transfer->target_class_id && $transfer->status === 'EN_ATTENTE_ACCUEIL';

        if (!$isSource && !$isAccueil) {
            return redirect()->back()->with('error', 'Non autorisé');
        }

        try {
            $updateData = [
                'status' => 'REFUSEE',
                'refusal_reason' => $validated['reason'],
            ];

            if ($isSource) {
                $updateData['validated_by_source_id'] = $user->id;
                $updateData['validated_by_source_at'] = now();
            } else {
                $updateData['validated_by_accueil_id'] = $user->id;
                $updateData['validated_by_accueil_at'] = now();
            }

            $transfer->update($updateData);

            return redirect()->back()->with('success', 'Demande refusée');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }
}
