<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use Carbon\Carbon;
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

        $openingAt = null;
        $endAt = null;
        $isNotYetOpen = false;
        $isClosed = false;

        if ($event) {
            $startAt = Carbon::parse($event->date);
            if (!empty($event->time)) {
                $startTime = Carbon::parse($event->time);
                $startAt->setTime($startTime->hour, $startTime->minute, $startTime->second);
            } else {
                $startAt->setTime(0, 0, 0);
            }

            $openingAt = $startAt->copy()->subDays(2);

            $endAt = Carbon::parse($event->date);
            if (!empty($event->end_time)) {
                $endTime = Carbon::parse($event->end_time);
                $endAt->setTime($endTime->hour, $endTime->minute, $endTime->second);
            } else {
                $endAt->setTime(23, 59, 59);
            }

            $isNotYetOpen = now()->lt($openingAt);
            $isClosed = now()->greaterThanOrEqualTo($endAt);
        }

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
            'isNotYetOpen' => $isNotYetOpen,
            'isClosed' => $isClosed,
            'openingAt' => $openingAt?->toDateTimeString(),
            'closingAt' => $endAt?->toDateTimeString(),
        ]);
    }
}
