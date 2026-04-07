<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SpecialEvent;
use App\Models\Media; // Assurez-vous que ce modèle existe
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class ProgrammeMembreController extends Controller
{
    /**
     * Affiche le dashboard du responsable de famille.
     * Lecture seule : Programmes à venir, Historique, Galerie.
     */
    public function index()
    {
        // 1. Récupérer l'utilisateur connecté
       $user = Auth::user();
        
        // Récupérer la classe du conducteur connecté
        $classe = $user->classe;
        
        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
        }
        
         // 2. Récupérer les programmes à venir pour sa classe
        /** $initialClassList = SpecialEvent::where('is_parish', false)
           * ->where('class_id', $classe->id)
            *->where('date', '>=', now()->startOfDay())
           * ->orderBy('date', 'asc')
           * ->orderBy('time', 'asc')
           * ->get()
            *->map(function ($program) {
             * return [
                    *'id' => $program->id,
                    *'title' => $program->title,
                    *'date' => $program->date,
                   * 'time' => substr($program->time, 0, 5), // Format HH:MM
                    *'lieu' => $program->lieu,
                    *'orateur' => $program->orateur,
                    *'moderateur' => $program->moderateur,
                    *'dirigeant_priere' => $program->dirigeant_priere,
                *];
             *});
 */
        $classeId = $user->classe_id;
        $today = Carbon::today()->toDateString();

        // 3. Récupérer les programmes à venir (Date >= Aujourd'hui)
          // Récupérer les événements FUTURS de sa classe
        $evenementsActuels = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('date', '>=', now()->startOfDay())
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();

        // 4. Récupérer l'historique (Date < Aujourd'hui)
        $initialClassHistory = SpecialEvent::where('classe_id', $classeId)
            ->where('date', '<', $today)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($program) {
                return [
                    'id' => $program->id,
                    'title' => $program->title,
                    'date' => $program->date,
                    'time' => substr($program->time, 0, 5),
                    'lieu' => $program->lieu,
                    'orateur' => $program->orateur,
                    'moderateur' => $program->moderateur,
                    'dirigeant_priere' => $program->dirigeant_priere,
                ];
            });

        // 5. Récupérer la galerie média (Photos & Vidéos) de la classe
        // On suppose que la table 'media' a une colonne 'classe_id' ou une relation
        $galleryMedia = Media::where('classe_id', $classeId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($media) {
                // Génération de l'URL complète pour l'affichage
                $url = Storage::url($media->path);
                $thumbnail = $media->thumbnail ? Storage::url($media->thumbnail) : null;

                return [
                    'id' => $media->id,
                    'title' => $media->title,
                    'type' => $media->type, // 'photo' ou 'video'
                    'url' => $url,
                    'thumbnail' => $thumbnail,
                    'date' => $media->created_at->toDateString(), // Ou date de l'événement associé
                    'description' => $media->description,
                ];
            });

        // 6. Retourner les données à la vue Inertia
        return Inertia::render('ResponsableFamille/Programmes', [
            'initialClassList' => $initialClassList,
            'initialClassHistory' => $initialClassHistory,
            'galleryMedia' => $galleryMedia,
        ]);
    }
}