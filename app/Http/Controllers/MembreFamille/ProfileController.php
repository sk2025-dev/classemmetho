<?php

namespace App\Http\Controllers\MembreFamille;

use App\Helpers\PhotoHelper;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Fonction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit()
    {
        $user = Auth::user();
        $user->profile_photo_url = $user->profile_photo_url ?: PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom);

        // Récupérer les fonctions disponibles
        $fonctions = Fonction::select('id', 'nom', 'description')
            ->orderBy('nom')
            ->get();

        $user->load('family', 'classe', 'fonction', 'fonctions', 'ville', 'sacrements');
        $currentFonctionIds = $user->fonctions->pluck('id')->toArray();

        return Inertia::render('MembreFamille/Profile', [
            'member' => $user,
            'currentFonctionIds' => $currentFonctionIds,
            'family' => $user->family,
            'fonctions' => $fonctions,
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        // Validation avec messages personnalisés
        $validated = $request->validate(
            [
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'nullable|email|unique:users,email,' . $user->id,
                'telephone' => 'nullable|string|max:20',
                'telephone2' => 'nullable|string|max:20',
                'genre' => 'required|in:M,F',
                'date_naissance' => 'nullable|date',
                'statut_marital' => 'nullable|string|max:50',
                'employment_status' => 'nullable|in:TRAVAILLEUR,ETUDIANT,RETRAITE,SANS_EMPLOI',
                'profession' => 'nullable|string|max:255',
                'niveau_etude' => 'nullable|string|max:255',
                'fonction_ids' => 'nullable|array',
                'fonction_ids.*' => 'exists:fonctions,id',
                'relation' => 'nullable|string|max:255',
                'date_mariage' => 'nullable|date',
                'lieu_mariage' => 'nullable|string|max:255',
                'photo' => 'nullable',
                'baptise' => 'nullable|in:0,1',
                'date_bapteme' => 'nullable|date|required_if:baptise,1',
                'lieu_bapteme' => 'nullable|string|max:255|required_if:baptise,1',
                'premiere_communion' => 'nullable|in:0,1',
                'date_premiere_communion' => 'nullable|date|required_if:premiere_communion,1',
                'lieu_premiere_communion' => 'nullable|string|max:255|required_if:premiere_communion,1',
                'marie_religieusement' => 'nullable|in:0,1',
                'date_mariage_religieux' => 'nullable|date|required_if:marie_religieusement,1',
                'lieu_mariage_religieux' => 'nullable|string|max:255|required_if:marie_religieusement,1',
            ],
            [
                'nom.required' => 'Le nom est obligatoire',
                'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
                'prenom.required' => 'Le prénom est obligatoire',
                'prenom.max' => 'Le prénom ne doit pas dépasser 255 caractères',
                'email.email' => 'L\'adresse email doit être valide',
                'email.unique' => 'Cette adresse email est déjà utilisée',
                'genre.required' => 'Le genre est obligatoire',
                'genre.in' => 'Le genre doit être Homme ou Femme',
                'date_naissance.date' => 'La date de naissance doit être valide',
                'date_mariage.date' => 'La date de mariage doit être valide',
                'lieu_mariage.string' => 'Le lieu de mariage doit être un texte valide',
                'profession.max' => 'La profession ne doit pas dépasser 255 caractères',
                'fonction_id.exists' => 'La fonction sélectionnée n\'existe pas',
                'photo.image' => 'Le fichier doit être une image valide',
                'photo.mimes' => 'L\'image doit être au format JPEG, PNG ou GIF',
                'photo.max' => 'L\'image ne doit pas dépasser 5MB',
                'date_bapteme.required_if' => 'La date du baptême est obligatoire si vous avez coché le baptême',
                'date_premiere_communion.required_if' => 'La date de la première communion est obligatoire si vous avez coché',
                'date_mariage_religieux.required_if' => 'La date du mariage religieux est obligatoire si vous avez coché',
            ]
        );

        // Handle photo upload
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $photoPath = $request->file('photo')->store('photos/users', 'public');
            $validated['photo_path'] = $photoPath;
            $validated['profile_photo_url'] = '/storage/' . ltrim($photoPath, '/');
        } elseif (is_string($request->input('photo')) && !empty($request->input('photo'))) {
            $validated['photo_path'] = $this->resolvePhotoPathFromInput($request->input('photo'));
            $validated['profile_photo_url'] = $validated['photo_path']
                ? '/storage/' . ltrim($validated['photo_path'], '/')
                : $request->input('photo');
        }

        // Mettre à jour l'utilisateur (colonnes qui existent dans users)
        $user->update([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'] ?? $user->email,
            'telephone' => $validated['telephone'] ?? $user->telephone,
            'telephone2' => $validated['telephone2'] ?? $user->telephone2,
            'genre' => $validated['genre'],
            'date_naissance' => $validated['date_naissance'] ?? $user->date_naissance,
            'employment_status' => $validated['employment_status'] ?? $user->employment_status,
            'profession' => ($validated['employment_status'] ?? '') === 'TRAVAILLEUR' ? ($validated['profession'] ?? null) : null,
            'niveau_etude' => ($validated['employment_status'] ?? '') === 'ETUDIANT' ? ($validated['niveau_etude'] ?? null) : null,
            'fonction_id' => !empty($validated['fonction_ids']) ? $validated['fonction_ids'][0] : null,
            'relation' => $validated['relation'] ?? $user->relation,
            'photo_path' => $validated['photo_path'] ?? $user->photo_path,
            'profile_photo_url' => $validated['profile_photo_url'] ?? $user->profile_photo_url,
        ]);

        // Sync des fonctions (pivot)
        $user->fonctions()->sync($validated['fonction_ids'] ?? []);

        // Mettre à jour les sacrements (relation hasOne)
        if ($user->sacrements) {
            $user->sacrements->update([
                // Sacrements religieux
                'baptise' => (bool)($validated['baptise'] ?? false),
                'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
                'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
                'premiere_communion' => (bool)($validated['premiere_communion'] ?? false),
                'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
                'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
                'marie_religieusement' => (bool)($validated['marie_religieusement'] ?? false),
                'mariage_religieux_date' => !empty($validated['date_mariage_religieux']) ? $validated['date_mariage_religieux'] : null,
                'mariage_religieux_lieu' => !empty($validated['lieu_mariage_religieux']) ? $validated['lieu_mariage_religieux'] : null,
                // Statut matrimonial civil (mappé depuis les champs du formulaire)
                'est_marie' => ($validated['statut_marital'] ?? '') === 'Marié(e)',
                'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
                'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
                'est_divorce' => ($validated['statut_marital'] ?? '') === 'Divorcé(e)',
                'est_veuf' => ($validated['statut_marital'] ?? '') === 'Veuf(ve)',
                'dot_effectue' => ($validated['statut_marital'] ?? '') === 'Dote',
            ]);
        } else {
            // Créer le record de sacrements s'il n'existe pas
            \App\Models\UserSacrement::create([
                'user_id' => $user->id,
                // Sacrements religieux
                'baptise' => (bool)($validated['baptise'] ?? false),
                'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
                'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
                'premiere_communion' => (bool)($validated['premiere_communion'] ?? false),
                'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
                'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
                'marie_religieusement' => (bool)($validated['marie_religieusement'] ?? false),
                'mariage_religieux_date' => !empty($validated['date_mariage_religieux']) ? $validated['date_mariage_religieux'] : null,
                'mariage_religieux_lieu' => !empty($validated['lieu_mariage_religieux']) ? $validated['lieu_mariage_religieux'] : null,
                // Statut matrimonial civil (mappé depuis les champs du formulaire)
                'est_marie' => ($validated['statut_marital'] ?? '') === 'Marié(e)',
                'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
                'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
                'est_divorce' => ($validated['statut_marital'] ?? '') === 'Divorcé(e)',
                'est_veuf' => ($validated['statut_marital'] ?? '') === 'Veuf(ve)',
                'dot_effectue' => ($validated['statut_marital'] ?? '') === 'Dote',
            ]);
        }

        return redirect()
            ->route('membre_famille.family')
            ->with('success', 'Modifications sauvegardées avec succès');
    }

    private function resolvePhotoPathFromInput(?string $photo): ?string
    {
        if (empty($photo)) {
            return null;
        }

        $photo = trim($photo);

        if (str_starts_with($photo, '/storage/')) {
            return ltrim(substr($photo, strlen('/storage/')), '/');
        }

        if (str_starts_with($photo, 'storage/')) {
            return ltrim(substr($photo, strlen('storage/')), '/');
        }

        if (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://')) {
            $parsed = parse_url($photo);
            if (!empty($parsed['path']) && str_contains($parsed['path'], '/storage/')) {
                $relative = substr($parsed['path'], strpos($parsed['path'], '/storage/') + strlen('/storage/'));
                return ltrim($relative, '/');
            }
            return null;
        }

        return ltrim($photo, '/');
    }
}
