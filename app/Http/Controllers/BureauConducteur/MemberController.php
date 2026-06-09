<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Mail\SendCredentials;
use App\Models\Fonction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function show($id)
    {
        $member = User::with('family', 'classe', 'fonctions', 'ville', 'sacrements')
            ->findOrFail($id);

        $auth = Auth::user();

        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        $member->is_pasteur = $member->id === $auth->id;
        $member->setAttribute('fonction_ids', $member->fonctions->pluck('id')->values()->all());

        return Inertia::render('Pasteur/Members/ShowMember', [
            'member' => $member,
            'family' => $member->family,
            'auth' => $auth,
        ]);
    }

    public function create(Request $request)
    {
        $auth = Auth::user();
        $family = $auth->family;

        if (!$family) {
            return abort(403, 'Pas de famille associée');
        }

        return Inertia::render('Pasteur/Members/CreateMember', [
            'family' => $family,
        ]);
    }

    public function store(Request $request)
    {
        $auth = Auth::user();
        $family = $auth->family;

        if (!$family) {
            return abort(403, 'Pas de famille associée');
        }

        $validated = $request->validate(
            [
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'nullable|email|unique:users,email',
                'telephone' => 'nullable|string|max:20',
                'telephone2' => 'nullable|string|max:20',
                'genre' => 'required|in:M,F',
                'date_naissance' => 'nullable|date',
                'statut_marital' => 'nullable|string|max:50|in:Célibataire,Marié(e),Divorcé(e),Veuf(ve),Dote',
                'date_mariage' => 'nullable|date',
                'lieu_mariage' => 'nullable|string|max:255',
                'employment_status' => 'nullable|string|in:TRAVAILLEUR,RETRAITE,ETUDIANT,SANS_EMPLOI',
                'profession' => 'nullable|string|max:255',
                'niveau_etude' => 'nullable|string|max:255',
                'fonction_ids'   => 'nullable|array',
                'fonction_ids.*' => 'integer|exists:fonctions,id',
                'relation' => 'nullable|string|max:255',
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
                'prenom.required' => 'Le prénom est obligatoire',
                'email.unique' => 'Cette adresse email est déjà utilisée',
            ]
        );

        if (empty($validated['email'])) {
            $validated['email'] = null;
        }

        $photoPath = null;
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $photoPath = $request->file('photo')->store('photos/users', 'public');
        } elseif (is_string($request->input('photo')) && !empty($request->input('photo'))) {
            $photoPath = $this->resolvePhotoPathFromInput($request->input('photo'));
        }

        $identifier = User::generateIdentifier($validated['nom'], $validated['prenom'], $validated['date_naissance'] ?? null);

        $user = User::create([
            'identifier' => $identifier,
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'telephone' => $validated['telephone'] ?? null,
            'telephone2' => $validated['telephone2'] ?? null,
            'genre' => $validated['genre'],
            'date_naissance' => $validated['date_naissance'] ?? null,
            'employment_status' => $validated['employment_status'] ?? null,
            'profession' => $validated['profession'] ?? null,
            'niveau_etude' => $validated['niveau_etude'] ?? null,
            'relation' => $validated['relation'] ?? null,
            'password' => bcrypt('11111'),
            'role' => 'membre_famille',
            'family_id' => $family->id,
            'classe_id' => $family->classe_id,
            'ville_id' => $family->ville_id,
            'photo_path' => $photoPath,
        ]);

        $fonctionIds = array_filter(array_map('intval', $validated['fonction_ids'] ?? []));
        $user->fonctions()->sync($fonctionIds);
        if (!empty($fonctionIds)) {
            $user->update(['fonction_id' => $fonctionIds[0]]);
        }

        \App\Models\UserSacrement::create([
            'user_id' => $user->id,
            'baptise' => (bool)($validated['baptise'] ?? false),
            'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
            'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
            'premiere_communion' => (bool)($validated['premiere_communion'] ?? false),
            'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
            'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
            'marie_religieusement' => (bool)($validated['marie_religieusement'] ?? false),
            'mariage_religieux_date' => !empty($validated['date_mariage_religieux']) ? $validated['date_mariage_religieux'] : null,
            'mariage_religieux_lieu' => !empty($validated['lieu_mariage_religieux']) ? $validated['lieu_mariage_religieux'] : null,
            'est_marie' => $validated['statut_marital'] === 'Marié(e)',
            'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
            'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
            'est_divorce' => $validated['statut_marital'] === 'Divorcé(e)',
            'est_veuf' => $validated['statut_marital'] === 'Veuf(ve)',
            'dot_effectue' => $validated['statut_marital'] === 'Dote',
        ]);

        try {
            $tempPassword = '11111';
            Mail::to($user->email)->send(new SendCredentials($user, $identifier, $tempPassword));
            $user->credentials_sent_at = now();
            $user->save();
        } catch (\Exception $e) {
            logger()->warning('Send email SendCredentials failed for user id ' . $user->id . ': ' . $e->getMessage());
        }

        return redirect()
            ->route('bureau_conducteur.inscriptions')
            ->with('success', 'Membre ajouté avec succès');
    }

    public function edit($id)
    {
        $member = User::with('family', 'classe', 'fonctions', 'ville', 'sacrements')
            ->findOrFail($id);

        $auth = Auth::user();

        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        $member->setAttribute('fonction_ids', $member->fonctions->pluck('id')->values()->all());

        $fonctions = Fonction::select('id', 'nom', 'description')
            ->orderBy('nom')
            ->get();

        return Inertia::render('Pasteur/Members/EditMember', [
            'member' => $member,
            'family' => $member->family,
            'fonctions' => $fonctions,
        ]);
    }

    public function update(Request $request, $id)
    {
        $member = User::findOrFail($id);
        $auth = Auth::user();

        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $id,
            'telephone' => 'nullable|string|max:20',
            'telephone2' => 'nullable|string|max:20',
            'genre' => 'required|in:M,F',
            'date_naissance' => 'nullable|date',
            'statut_marital' => 'nullable|string|max:50|in:Célibataire,Marié(e),Divorcé(e),Veuf(ve),Dote',
            'date_mariage' => 'nullable|date',
            'lieu_mariage' => 'nullable|string|max:255',
            'employment_status' => 'nullable|string|in:TRAVAILLEUR,RETRAITE,ETUDIANT,SANS_EMPLOI',
            'profession' => 'nullable|string|max:255',
            'niveau_etude' => 'nullable|string|max:255',
            'fonction_ids'   => 'nullable|array',
            'fonction_ids.*' => 'integer|exists:fonctions,id',
            'relation' => 'nullable|string|max:255',
            'photo' => 'nullable',
            'baptise' => 'nullable|in:0,1',
            'date_bapteme' => 'nullable|date|required_if:baptise,1',
            'lieu_bapteme' => 'nullable|string|max:255|required_if:baptise,1',
            'premiere_communion' => 'nullable|in:0,1',
            'date_premiere_communion' => 'nullable|date|required_if:premiere_communion,1',
            'lieu_premiere_communion' => 'nullable|string|max:255|required_if:premiere_communion,1',
            'mariage_religieux' => 'nullable|in:0,1',
            'date_mariage_religieux' => 'nullable|date|required_if:mariage_religieux,1',
            'lieu_mariage_religieux' => 'nullable|string|max:255|required_if:mariage_religieux,1',
        ]);

        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $validated['photo_path'] = $request->file('photo')->store('photos/users', 'public');
        } elseif (is_string($request->input('photo')) && !empty($request->input('photo'))) {
            $validated['photo_path'] = $this->resolvePhotoPathFromInput($request->input('photo'));
        }

        $member->update([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'] ?? $member->email,
            'telephone' => $validated['telephone'] ?? $member->telephone,
            'telephone2' => $validated['telephone2'] ?? $member->telephone2,
            'genre' => $validated['genre'],
            'date_naissance' => $validated['date_naissance'] ?? $member->date_naissance,
            'employment_status' => $validated['employment_status'] ?? $member->employment_status,
            'profession' => $validated['profession'] ?? $member->profession,
            'niveau_etude' => $validated['niveau_etude'] ?? $member->niveau_etude,
            'relation' => $validated['relation'] ?? $member->relation,
            'photo_path' => $validated['photo_path'] ?? $member->photo_path,
            'profile_photo_url' => isset($validated['photo_path'])
                ? '/storage/' . ltrim($validated['photo_path'], '/')
                : $member->profile_photo_url,
        ]);

        $fonctionIds = array_filter(array_map('intval', $validated['fonction_ids'] ?? []));
        $member->fonctions()->sync($fonctionIds);
        if (!empty($fonctionIds)) {
            $member->update(['fonction_id' => $fonctionIds[0]]);
        }

        if ($member->sacrements) {
            $member->sacrements->update([
                'baptise' => (bool)($validated['baptise'] ?? false),
                'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
                'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
                'premiere_communion' => (bool)($validated['premiere_communion'] ?? false),
                'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
                'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
                'marie_religieusement' => (bool)($validated['mariage_religieux'] ?? false),
                'mariage_religieux_date' => !empty($validated['date_mariage_religieux']) ? $validated['date_mariage_religieux'] : null,
                'mariage_religieux_lieu' => !empty($validated['lieu_mariage_religieux']) ? $validated['lieu_mariage_religieux'] : null,
                'est_marie' => $validated['statut_marital'] === 'Marié(e)',
                'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
                'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
                'est_divorce' => $validated['statut_marital'] === 'Divorcé(e)',
                'est_veuf' => $validated['statut_marital'] === 'Veuf(ve)',
                'dot_effectue' => $validated['statut_marital'] === 'Dote',
            ]);
        } else {
            \App\Models\UserSacrement::create([
                'user_id' => $member->id,
                'baptise' => (bool)($validated['baptise'] ?? false),
                'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
                'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
                'premiere_communion' => (bool)($validated['premiere_communion'] ?? false),
                'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
                'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
                'marie_religieusement' => (bool)($validated['mariage_religieux'] ?? false),
                'mariage_religieux_date' => !empty($validated['date_mariage_religieux']) ? $validated['date_mariage_religieux'] : null,
                'mariage_religieux_lieu' => !empty($validated['lieu_mariage_religieux']) ? $validated['lieu_mariage_religieux'] : null,
                'est_marie' => $validated['statut_marital'] === 'Marié(e)',
                'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
                'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
                'est_divorce' => $validated['statut_marital'] === 'Divorcé(e)',
                'est_veuf' => $validated['statut_marital'] === 'Veuf(ve)',
                'dot_effectue' => $validated['statut_marital'] === 'Dote',
            ]);
        }

        return redirect()
            ->route('bureau_conducteur.members.show', $id)
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
