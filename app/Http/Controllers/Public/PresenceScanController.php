<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use Inertia\Inertia;
use Inertia\Response;

class PresenceScanController extends Controller
{
    public function show(string $token): Response
    {
        $event = SpecialEvent::query()
            ->where('qr_token', $token)
            ->where('is_parish', false)
            ->first();

        return Inertia::render('Presence/Scan', [
            'token' => $token,
            'event' => $event ? [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date,
                'time' => $event->time,
                'lieu' => $event->lieu,
            ] : null,
            'isInvalidToken' => !$event,
            'isExpired' => (bool) ($event?->qr_expires_at && now()->greaterThan($event->qr_expires_at)),
        ]);
    }
}
