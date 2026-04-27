<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Helpers\PhotoHelper;
use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Family;
use App\Services\TransferWorkflowService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InscriptionsController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $transferService = app(TransferWorkflowService::class);

        $family = Family::with('ville', 'classe')
            ->where('responsable_id', $user->id)
            ->first();

        if ($family && !$family->ville_id) {
            $inscription = \App\Models\Inscription::where('responsable_email', $family->email)
                ->whereIn('status', ['approuve', 'approved'])
                ->orderByDesc('updated_at')
                ->first();

            $inscVilleId = $inscription?->data['famille']['ville']
                ?? $inscription?->data['famille']['ville_id']
                ?? $inscription?->ville_id
                ?? null;

            if ($inscVilleId) {
                $family->ville_id = (int) $inscVilleId;
                $family->save();
                $family->load('ville');
                $family->users()->whereNull('ville_id')->update(['ville_id' => $family->ville_id]);
            }
        }

        if ($family) {
            $family = $transferService->hydrateFamiliesTransferState([$family])->first();
        }

        $classes = Classe::orderBy('nom')->get(['id', 'nom']);

        $familyStats = [];
        $familyData = null;
        $members = [];

        if ($family) {
            $allMembers = $family->users()
                ->with('classe', 'fonction', 'ville', 'sacrements')
                ->get();

            $allMembers = $transferService->hydrateUsersTransferState($allMembers)->values();

            $familyStats = [
                'totalMembers' => $allMembers->count(),
                'maleMembers' => $allMembers->where('genre', 'M')->count(),
                'femaleMembers' => $allMembers->where('genre', 'F')->count(),
                'familyName' => $family->nom,
                'className' => $family->classe?->nom ?? 'N/A',
                'familyId' => $family->id,
            ];

            $familyData = [
                'id' => $family->id,
                'nom' => $family->nom,
                'code_famille' => $family->code_famille,
                'email' => $family->email,
                'telephone' => $family->telephone,
                'adresse' => $family->adresse,
                'ville_name' => $family->ville?->nom ?? 'N/A',
                'classe_name' => $family->classe?->nom ?? 'N/A',
                'quartier' => $family->quartier,
                'transfer_status' => $family->transfer_status,
                'transfer_label' => $family->transfer_label,
                'transfer_locked' => (bool) $family->transfer_locked,
            ];

            $members = $allMembers->map(function ($member) use ($family) {
                return [
                    'id' => $member->id,
                    'nom' => $member->nom,
                    'prenom' => $member->prenom,
                    'email' => $member->email,
                    'telephone' => $member->telephone,
                    'code_membre' => $member->code_membre,
                    'created_at' => optional($member->created_at)->format('d/m/Y H:i'),
                    'updated_at' => optional($member->updated_at ?? $member->created_at)->format('d/m/Y H:i'),
                    'genre' => $member->genre,
                    'ville_name' => $member->ville?->nom ?? $family->ville?->nom ?? 'N/A',
                    'fonction_name' => $member->fonction?->nom ?? 'N/A',
                    'profession' => $member->profession ?? 'N/A',
                    'relation' => $member->relation ?? 'N/A',
                    'classe_name' => $member->classe?->nom ?? 'N/A',
                    'role' => $member->id === $family->responsable_id ? 'responsable_famille' : 'membre',
                    'is_responsable' => $member->id === $family->responsable_id,
                    'transfer_status' => $member->transfer_status,
                    'transfer_label' => $member->transfer_label,
                    'transfer_locked' => (bool) $member->transfer_locked,
                    'profile_photo_url' => $member->profile_photo_url
                        ?: PhotoHelper::getPhotoUrl($member->photo_path, $member->prenom, $member->nom),
                ];
            })->values();
        }

        return Inertia::render('ResponsableFamille/Inscriptions', [
            'family' => $familyData,
            'familyStats' => $familyStats,
            'members' => $members,
            'classes' => $classes,
        ]);
    }
}
