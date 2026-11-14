<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class PresenceScanController extends Controller
{
    public function show(Request $request, string $token): Response
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est authentifié
        if (! $user) {
            throw new AccessDeniedHttpException('Vous devez être connecté pour accéder à cette page.');
        }

        // Vérifier que l'utilisateur a la fonction "marqueur de présence"
        if (! $this->isPresenceMarker($user)) {
            throw new AccessDeniedHttpException('Accès refusé. Seuls les marqueurs de présence peuvent accéder à cette page.');
        }

        $event = SpecialEvent::query()
            ->where('qr_token', $token)
            ->where('is_parish', false)
            ->first();

        if (! $event) {
            throw new AccessDeniedHttpException('QR code invalide.');
        }

        // Vérifier que le marqueur appartient à la classe de l'événement
        if ((int) $user->classe_id !== (int) $event->class_id) {
            throw new AccessDeniedHttpException('Ce QR code ne correspond pas à votre classe.');
        }

        $startAtString = null;
        $endAt = null;
        $isNotYetOpen = false;
        $isClosed = false;

        $startAt = Carbon::parse($event->date);
        if (!empty($event->time)) {
            $startTime = Carbon::parse($event->time);
            $startAt->setTime($startTime->hour, $startTime->minute, $startTime->second);
        } else {
            $startAt->setTime(0, 0, 0);
        }

        $startAtString = $startAt->toDateTimeString();

        $endAt = Carbon::parse($event->date);
        if (!empty($event->end_time)) {
            $endTime = Carbon::parse($event->end_time);
            $endAt->setTime($endTime->hour, $endTime->minute, $endTime->second);
        } else {
            $endAt->setTime(23, 59, 59);
        }

        $isNotYetOpen = now()->lt($startAt);
        $isClosed = now()->greaterThanOrEqualTo($endAt);

        return Inertia::render('Presence/Scan', [
            'token' => $token,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date,
                'time' => $event->time,
                'lieu' => $event->lieu,
            ],
            'isInvalidToken' => false,
            'isExpired' => (bool) ($event?->qr_expires_at && now()->greaterThan($event->qr_expires_at)),
            'isNotYetOpen' => $isNotYetOpen,
            'isClosed' => $isClosed,
            'startAt' => $startAtString,
            'closingAt' => $endAt?->toDateTimeString(),
        ]);
    }

    private function isPresenceMarker($user): bool
    {
        $user->loadMissing('fonction');
        $nom = mb_strtolower(trim((string) ($user->fonction?->nom ?? '')));
        $nom = strtr($nom, [
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'à' => 'a', 'â' => 'a', 'ù' => 'u', 'û' => 'u',
            'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ö' => 'o', 'ç' => 'c',
        ]);

        return in_array($nom, ['marqueur de presence', 'marqueur presence'], true);
    }
}
