<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Classe;
use App\Models\Family;
use App\Models\ClassTransferRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

        // Récupérer tous les membres de la famille (autres que le pasteur et autres responsables)
        $members = User::where('family_id', $user->family_id)
            ->where('id', '!=', $user->id)
            ->where('is_family_responsible', false)
            ->select('id', 'nom', 'prenom', 'email', 'classe_id')
            ->get();

        // Récupérer la famille
        $family = Family::findOrFail($user->family_id);

        // Récupérer toutes les classes disponibles sauf celle d'origine de la famille
        $classes = Classe::where('id', '!=', $family->classe_id)->get();

        return Inertia::render('Pasteur/TableauBordTransferts', [
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
            'type' => 'required|in:member,family',
            'user_id' => 'nullable|integer|exists:users,id',
            'target_class_id' => 'required|integer|exists:classes,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();

        // Vérifier si l'utilisateur est pasteur
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
                // Pour une demande familiale, utiliser la classe du pasteur comme référence
                $sourceClassId = $user->classe_id;
            }

            // Créer la demande de transfert
            $transfer = ClassTransferRequest::create([
                'family_id' => $user->family_id,
                'user_id' => $validated['type'] === 'member' ? $validated['user_id'] : null,
                'source_class_id' => $sourceClassId,
                'target_class_id' => $validated['target_class_id'],
                'type' => $validated['type'],
                'reason' => $validated['reason'] ?? null,
                'status' => 'EN_ATTENTE_SOURCE',
                'reference' => ClassTransferRequest::generateReference(),
                'created_by_id' => $user->id,
            ]);

            DB::commit();

            return redirect()->route('pasteur.transferts.index')
                ->with('success', 'Demande de transfert créée avec succès (Réf: ' . $transfer->reference . ')');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur lors de la création : ' . $e->getMessage());
        }
    }
}
