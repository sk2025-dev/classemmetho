<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Presence;
use App\Models\SpecialEvent;
use App\Models\User;
use Carbon\Carbon;
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

        $programmeOpeningAt = $this->resolveProgrammeOpeningAt($event);
        if (now()->lt($programmeOpeningAt)) {
            return response()->json([
                'success' => false,
                'message' => 'Le scan sera disponible deux jours avant la date de cette activité.',
            ], 423);
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

        $alreadyAbsent = Presence::query()
            ->where('special_event_id', $event->id)
            ->where('membre_famille_id', $member->id)
            ->where('statut', 'absent')
            ->exists();

        if ($alreadyAbsent) {
            return response()->json([
                'success' => false,
                'message' => 'Vous êtes déjà marqué absent pour cette activité. Pointage non autorisé.',
            ], 409);
        }

        $programmeEndAt = $this->resolveProgrammeEndAt($event);
        if (now()->greaterThanOrEqualTo($programmeEndAt)) {
            return response()->json([
                'success' => false,
                'message' => 'Cette activité est déjà passée. Le pointage est clôturé.',
            ], 410);
        }

        $alreadyExists = Presence::query()
            ->where('special_event_id', $event->id)
            ->where('membre_famille_id', $member->id)
            ->where('statut', 'present')
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
        $isConducteur = $user && $user->role === 'conducteur';
        $isPresenceMarker = $user && $this->isPresenceMarker($user);

        if (
            !$user
            || (int) $user->classe_id !== (int) $event->class_id
            || (!$isConducteur && !$isPresenceMarker)
        ) {
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
            ->where('statut', 'present')
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

        $nonScannes = $members
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

        $programmeEndAt = $this->resolveProgrammeEndAt($event);

        $isClosed = now()->greaterThanOrEqualTo($programmeEndAt);
        if ($isClosed) {
            $this->persistAbsencesAtClosure($event, $members, $presentIds);
        }

        $absenceIds = Presence::query()
            ->where('special_event_id', $event->id)
            ->where('statut', 'absent')
            ->pluck('membre_famille_id');

        $absents = $isClosed ? $nonScannes : collect();
        $pending = $isClosed ? collect() : $nonScannes;

        $membres = $members->map(function (User $member) use ($presentIds, $absenceIds, $isClosed) {
            if ($presentIds->contains($member->id)) {
                $statut = 'present';
            } elseif ($absenceIds->contains($member->id)) {
                $statut = 'absent';
            } elseif ($isClosed) {
                $statut = 'absent';
            } else {
                $statut = null;
            }

            return [
                'id' => $member->id,
                'nom' => $member->nom,
                'prenom' => $member->prenom,
                'code_membre' => $member->code_membre,
                'statut' => $statut,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'programme' => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date,
                'time' => $event->time,
                'end_time' => $event->end_time,
                'is_closed' => $isClosed,
                'end_at' => $programmeEndAt->toDateTimeString(),
            ],
            'stats' => [
                'total_membres' => $members->count(),
                'presents' => $presents->count(),
                'absents' => $absents->count(),
                'non_scannes' => $pending->count(),
            ],
            'membres' => $membres,
            'presents' => $presents,
            'absents' => $absents->values(),
            'non_scannes' => $pending->values(),
            'mode' => 'qr_read_only',
        ]);
    }

    public function marquerPresenceManuelle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => ['required', 'integer', 'exists:special_events,id'],
            'member_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = Auth::user();

        if (! $user || ! $this->isPresenceMarker($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé.',
            ], 403);
        }

        $event = SpecialEvent::query()
            ->whereKey($validated['event_id'])
            ->where('class_id', $user->classe_id)
            ->where('is_parish', false)
            ->first();

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Activité introuvable ou non autorisée.',
            ], 404);
        }

        $programmeOpeningAt = $this->resolveProgrammeOpeningAt($event);
        if (now()->lt($programmeOpeningAt)) {
            return response()->json([
                'success' => false,
                'message' => 'Le marquage sera disponible deux jours avant la date de cette activité.',
            ], 423);
        }

        $programmeEndAt = $this->resolveProgrammeEndAt($event);
        if (now()->greaterThanOrEqualTo($programmeEndAt)) {
            return response()->json([
                'success' => false,
                'message' => 'Cette activité est déjà passée. Le marquage est clôturé.',
            ], 410);
        }

        $member = User::query()
            ->whereKey($validated['member_id'])
            ->where('classe_id', $event->class_id)
            ->first();

        if (! $member) {
            return response()->json([
                'success' => false,
                'message' => 'Membre introuvable ou non autorisé.',
            ], 422);
        }

        $presence = Presence::query()
            ->where('special_event_id', $event->id)
            ->where('membre_famille_id', $member->id)
            ->first();

        if ($presence && $presence->statut === 'present') {
            return response()->json([
                'success' => false,
                'message' => 'Présence déjà enregistrée.',
            ], 409);
        }

        $payload = [
            'activite_id' => null,
            'special_event_id' => $event->id,
            'membre_famille_id' => $member->id,
            'statut' => 'present',
            'marquee_par' => Auth::id(),
            'marquee_le' => now(),
            'methode' => 'marquage_manuel',
            'notes' => 'Présence marquée manuellement par le marqueur de présence',
        ];

        if ($presence) {
            $presence->update($payload);
        } else {
            Presence::create($payload);
        }

        return response()->json([
            'success' => true,
            'message' => 'Présence marquée manuellement.',
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

    private function isPresenceMarker(User $user): bool
    {
        $user->loadMissing('fonction');
        $nom = mb_strtolower(trim((string) ($user->fonction?->nom ?? '')));
        $nom = strtr($nom, [
            'é' => 'e',
            'è' => 'e',
            'ê' => 'e',
            'ë' => 'e',
            'à' => 'a',
            'â' => 'a',
            'ù' => 'u',
            'û' => 'u',
            'î' => 'i',
            'ï' => 'i',
            'ô' => 'o',
            'ö' => 'o',
            'ç' => 'c',
        ]);

        return in_array($nom, ['marqueur de presence', 'marqueur presence'], true);
    }

    private function resolveProgrammeOpeningAt(SpecialEvent $event): Carbon
    {
        $programmeStartAt = Carbon::parse($event->date);

        if (!empty($event->time)) {
            $startTime = Carbon::parse($event->time);
            $programmeStartAt->setTime($startTime->hour, $startTime->minute, $startTime->second);
        } else {
            $programmeStartAt->setTime(0, 0, 0);
        }

        return $programmeStartAt->copy()->subDays(2);
    }

    private function resolveProgrammeEndAt(SpecialEvent $event): Carbon
    {
        $programmeEndAt = Carbon::parse($event->date);

        if (!empty($event->end_time)) {
            $endTime = Carbon::parse($event->end_time);
            $programmeEndAt->setTime($endTime->hour, $endTime->minute, $endTime->second);
        } elseif (!empty($event->time)) {
            $startTime = Carbon::parse($event->time);
            $programmeEndAt->setTime($startTime->hour, $startTime->minute, $startTime->second);
        } else {
            $programmeEndAt->setTime(23, 59, 59);
        }

        return $programmeEndAt;
    }

    private function persistAbsencesAtClosure(SpecialEvent $event, $members, $presentIds): void
    {
        $existingMemberIds = Presence::query()
            ->where('special_event_id', $event->id)
            ->pluck('membre_famille_id');

        $toInsert = $members
            ->filter(function (User $member) use ($presentIds, $existingMemberIds) {
                return ! $presentIds->contains($member->id) && ! $existingMemberIds->contains($member->id);
            })
            ->map(function (User $member) use ($event) {
                return [
                    'activite_id' => null,
                    'special_event_id' => $event->id,
                    'membre_famille_id' => $member->id,
                    'statut' => 'absent',
                    'marquee_par' => null,
                    'marquee_le' => now(),
                    'methode' => 'auto_cloture',
                    'notes' => 'Absence automatique (non scanne avant fin d activite)',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->values()
            ->all();

        if (! empty($toInsert)) {
            Presence::insert($toInsert);
        }
    }
}
