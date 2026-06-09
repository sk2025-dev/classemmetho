<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\SpecialEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class LivePhotoController extends Controller
{
    private const MAX_PHOTOS = 20;

    public function store(Request $request, int $eventId): JsonResponse
    {
        $user = Auth::user();

        $event = SpecialEvent::where('id', $eventId)
            ->where('is_parish', false)
            ->firstOrFail();

        // Vérifier que l'utilisateur appartient à la même classe que l'activité
        if ((int) $user->classe_id !== (int) $event->class_id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Vous n\'êtes pas dans la classe de cette activité.',
            ], 403);
        }

        // Seuls le conducteur et le marqueur de présence peuvent prendre des photos
        if (!$this->canTakePhoto($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Seul le conducteur ou le marqueur de présence peut prendre des photos.',
            ], 403);
        }

        // Vérifier que l'activité est en cours
        if (!$this->isOngoing($event)) {
            return response()->json([
                'success' => false,
                'message' => 'Les photos ne peuvent être prises que pendant l\'activité.',
            ], 422);
        }

        // Vérifier la limite de 20 photos par activité
        $currentCount = Media::where('special_event_id', $eventId)
            ->where('type', 'photo')
            ->count();

        if ($currentCount >= self::MAX_PHOTOS) {
            return response()->json([
                'success' => false,
                'message' => 'Limite de ' . self::MAX_PHOTOS . ' photos atteinte pour cette activité.',
                'count' => $currentCount,
            ], 422);
        }

        $request->validate([
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $file     = $request->file('photo');
        $filename = now()->format('YmdHis') . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs('media/' . $event->class_id, $filename, 'public');

        $media = Media::create([
            'title'           => $event->title . ' — ' . now()->format('H:i'),
            'description'     => 'Photo prise en direct pendant l\'activité',
            'date'            => now()->toDateString(),
            'type'            => 'photo',
            'url'             => Storage::url($path),
            'video_url'       => null,
            'thumbnail'       => null,
            'class_id'        => $event->class_id,
            'special_event_id'=> $eventId,
            'created_by'      => $user->id,
            'is_featured'     => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Photo sauvegardée.',
            'media'   => $media,
            'count'   => $currentCount + 1,
            'remaining' => self::MAX_PHOTOS - ($currentCount + 1),
        ]);
    }

    public function count(int $eventId): JsonResponse
    {
        $count = Media::where('special_event_id', $eventId)
            ->where('type', 'photo')
            ->count();

        return response()->json([
            'count'     => $count,
            'max'       => self::MAX_PHOTOS,
            'remaining' => max(0, self::MAX_PHOTOS - $count),
        ]);
    }

    private function canTakePhoto($user): bool
    {
        if ($user->role === 'conducteur') {
            return true;
        }

        // Vérifier si le membre est marqueur de présence
        $user->loadMissing('fonction');
        $nom = mb_strtolower(trim((string) ($user->fonction?->nom ?? '')));
        $nom = strtr($nom, [
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'à' => 'a', 'â' => 'a', 'ù' => 'u', 'û' => 'u',
            'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ç' => 'c',
        ]);

        return in_array($nom, ['marqueur de presence', 'marqueur presence'], true);
    }

    private function isOngoing(SpecialEvent $event): bool
    {
        // Utilise les mêmes champs que PresenceController (date, time, end_time)
        $date = $event->date ?? $event->start_date;
        if (!$date) {
            return false;
        }

        $start = Carbon::parse($date);
        $startTime = $event->time ?? $event->start_time;
        if (!empty($startTime)) {
            $t = Carbon::parse($startTime);
            $start->setTime($t->hour, $t->minute, 0);
        } else {
            $start->setTime(0, 0, 0);
        }

        $endDate = $event->end_date ?? $date;
        $end = Carbon::parse($endDate);
        $endTime = $event->end_time;
        if (!empty($endTime)) {
            $t = Carbon::parse($endTime);
            $end->setTime($t->hour, $t->minute, 59);
        } else {
            $end->setTime(23, 59, 59);
        }

        return now()->between($start, $end);
    }
}
