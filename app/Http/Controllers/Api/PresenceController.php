<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Presence;
use App\Models\SpecialEvent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PresenceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:100'],
            'code_membre' => ['required', 'string', 'max:30'],
        ]);

        $event = SpecialEvent::query()
            ->where('qr_token', $validated['token'])
            ->where('is_parish', false)
            ->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'QR code invalide.',
            ], 404);
        }

        if ($event->qr_expires_at && now()->greaterThan($event->qr_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Ce QR code a expiré.',
            ], 410);
        }

        $member = User::query()
            ->where('code_membre', $validated['code_membre'])
            ->where('classe_id', $event->class_id)
            ->first();

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Code membre invalide',
            ], 422);
        }

        $alreadyExists = Presence::query()
            ->where('special_event_id', $event->id)
            ->where('membre_famille_id', $member->id)
            ->exists();

        if ($alreadyExists) {
            return response()->json([
                'success' => false,
                'message' => 'Présence déjà enregistrée',
            ], 409);
        }

        Presence::create([
            'activite_id' => null,
            'special_event_id' => $event->id,
            'membre_famille_id' => $member->id,
            'statut' => 'present',
            'marquee_par' => Auth::id(),
            'marquee_le' => now(),
            'methode' => 'qr_code',
            'notes' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Présence enregistrée',
            'data' => [
                'event' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => $event->date,
                ],
                'member' => [
                    'id' => $member->id,
                    'nom' => $member->nom,
                    'prenom' => $member->prenom,
                    'code_membre' => $member->code_membre,
                ],
            ],
        ]);
    }

    public function programmeSummary(Request $request, SpecialEvent $event): JsonResponse
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'conducteur' || (int) $user->classe_id !== (int) $event->class_id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé.',
            ], 403);
        }

        $members = User::query()
            ->where('classe_id', $event->class_id)
            ->get(['id', 'nom', 'prenom', 'code_membre']);

        $presenceRows = Presence::query()
            ->where('special_event_id', $event->id)
            ->with('membre:id,nom,prenom,code_membre')
            ->get();

        $presentIds = $presenceRows->pluck('membre_famille_id')->unique();

        $presents = $presenceRows->map(function (Presence $presence) {
            return [
                'id' => $presence->membre?->id,
                'nom' => $presence->membre?->nom,
                'prenom' => $presence->membre?->prenom,
                'code_membre' => $presence->membre?->code_membre,
                'statut' => $presence->statut,
                'marquee_le' => $presence->marquee_le,
                'methode' => $presence->methode,
            ];
        })->values();

        $absents = $members
            ->whereNotIn('id', $presentIds)
            ->map(function (User $member) {
                return [
                    'id' => $member->id,
                    'nom' => $member->nom,
                    'prenom' => $member->prenom,
                    'code_membre' => $member->code_membre,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'programme' => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date,
                'time' => $event->time,
            ],
            'stats' => [
                'total_membres' => $members->count(),
                'presents' => $presents->count(),
                'absents' => $absents->count(),
            ],
            'presents' => $presents,
            'absents' => $absents,
        ]);
    }
}
