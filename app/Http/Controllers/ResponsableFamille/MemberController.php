<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Helpers\PhotoHelper;
use App\Models\Family;
use App\Models\User;
use App\Models\Fonction;
use App\Services\TransferWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendCredentials;

class MemberController extends Controller
{
    private function isTransferLocked(User|Family|null $record): bool
    {
        return app(TransferWorkflowService::class)->isTransferLocked($record);
    }

    public function show($id)
    {
        // Récupérer le membre (utilisateur) avec ses relations et sacrements
        $member = User::with('family', 'classe', 'fonctions', 'ville', 'sacrements')
            ->findOrFail($id);

        // S'assurer que l'utilisateur connecté est responsable de cette famille
        $auth = Auth::user();

        // Vérifier que le membre appartient à une famille dont l'utilisateur est responsable
        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        // Ajouter l'information de responsable
        $member->is_responsable = $member->id === $member->family->responsable_id;
        $member->profile_photo_url = $member->profile_photo_url
            ?: PhotoHelper::getPhotoUrl($member->photo_path, $member->prenom, $member->nom);

        return Inertia::render('ResponsableFamille/Members/ShowMember', [
            'member' => $member,
            'family' => $member->family,
            'auth' => $auth,
        ]);
    }

    public function create(Request $request)
    {
        $family = Family::findOrFail($request->query('family_id'));

        if ($this->isTransferLocked($family)) {
            return redirect()->route('responsable_famille.inscriptions')
                ->with('error', 'Aucune nouvelle action n\'est possible sur une famille en transfert ou archivee.');
        }

        return Inertia::render('ResponsableFamille/Members/CreateMember', [
            'family' => $family,
        ]);
    }

    public function store(Request $request)
    {
        $familyId = $request->query('family_id');
        $family = Family::findOrFail($familyId);

        if ($this->isTransferLocked($family)) {
            return redirect()->route('responsable_famille.inscriptions')
                ->with('error', 'Aucune nouvelle action n\'est possible sur une famille en transfert ou archivee.');
        }

        // Validation avec messages personnalisés
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
                'fonction_id' => 'nullable|exists:fonctions,id',
                'fonction_ids' => 'nullable|array|max:10',
                'fonction_ids.*' => 'integer|exists:fonctions,id',
                'relation' => 'nullable|string|max:255',
                'photo' => 'nullable',
                // Sacrements
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
                'date_mariage.date' => 'La date de mariage doit être valide',
                'lieu_mariage.string' => 'Le lieu de mariage doit être un texte valide',
                'profession.max' => 'La profession ne doit pas dépasser 255 caractères',
                'fonction_id.exists' => 'La fonction sélectionnée n\'existe pas',
                'fonction_ids.max' => 'Vous pouvez sélectionner au maximum 10 fonctions',
                'fonction_ids.*.exists' => 'Une des fonctions sélectionnées n\'existe pas',
                'photo.image' => 'Le fichier doit être une image valide',
                'photo.mimes' => 'L\'image doit être au format JPEG, PNG ou GIF',
                'photo.max' => 'L\'image ne doit pas dépasser 5MB',
                'date_bapteme.required_if' => 'La date du baptême est obligatoire si vous avez coché le baptême',
                'date_premiere_communion.required_if' => 'La date de la première communion est obligatoire si vous avez coché',
                'date_mariage_religieux.required_if' => 'La date du mariage religieux est obligatoire si vous avez coché',
            ]
        );

        if (empty($validated['email'])) {
            $validated['email'] = null;
        }

        // Handle photo upload
        $photoPath = null;
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $photoPath = $request->file('photo')->store('photos/users', 'public');
        } elseif (is_string($request->input('photo')) && !empty($request->input('photo'))) {
            $photoPath = $this->resolvePhotoPathFromInput($request->input('photo'));
        }

        // Ensure identifier is generated so DB non-null constraint is satisfied
        $identifier = User::generateIdentifier($validated['nom'], $validated['prenom'], $validated['date_naissance'] ?? null);

        $resolvedFonctionIds = $this->resolveFonctionIds($validated);

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
            'family_id' => $familyId,
            'classe_id' => $family->classe_id,
            'ville_id' => $family->ville_id,
            'fonction_id' => $resolvedFonctionIds[0] ?? null,
            'photo_path' => $photoPath,
            'profile_photo_url' => $photoPath ? '/storage/' . ltrim($photoPath, '/') : null,
        ]);

        $user->fonctions()->sync($resolvedFonctionIds);

        // Create sacrament record for this user
        \App\Models\UserSacrement::create([
            'user_id' => $user->id,
            // Sacrements religieux
            'baptise' => (bool)($validated['baptise'] ?? false),
            'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
            'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
            'premiere_communion' => (bool)($validated['premiere_communion'] ?? false),
            'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
            'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
            'marie_religieusement' => (bool)($validated['mariage_religieux'] ?? false),
            'mariage_religieux_date' => !empty($validated['date_mariage_religieux']) ? $validated['date_mariage_religieux'] : null,
            'mariage_religieux_lieu' => !empty($validated['lieu_mariage_religieux']) ? $validated['lieu_mariage_religieux'] : null,
            // Statut matrimonial civil (mappé depuis les champs du formulaire)
            'est_marie' => $validated['statut_marital'] === 'Marié(e)',
            'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
            'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
            'est_divorce' => $validated['statut_marital'] === 'Divorcé(e)',
            'est_veuf' => $validated['statut_marital'] === 'Veuf(ve)',
            'dot_effectue' => $validated['statut_marital'] === 'Dote',
        ]);

        // Envoyer les identifiants par e-mail (mot de passe temporaire '11111') via queue
        try {
            $tempPassword = '11111';
            Mail::to($user->email)->send(new SendCredentials($user, $identifier, $tempPassword));
            $user->credentials_sent_at = now();
            $user->save();
        } catch (\Exception $e) {
            // Ne pas bloquer la création de l'utilisateur si l'envoi échoue
            logger()->warning('Send email SendCredentials failed for user id ' . $user->id . ': ' . $e->getMessage());
        }

        return redirect()
            ->route('responsable_famille.inscriptions', ['family_id' => $familyId])
            ->with('success', 'Membre ajouté avec succès');
    }

    public function edit($id)
    {
        // Récupérer le membre avec ses relations et sacrements
        $member = User::with('family', 'classe', 'fonctions', 'ville', 'sacrements')
            ->findOrFail($id);

        // S'assurer que l'utilisateur connecté est responsable de cette famille
        $auth = Auth::user();

        // Vérifier que le membre appartient à une famille dont l'utilisateur est responsable
        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        // Récupérer les fonctions disponibles
        if ($this->isTransferLocked($member)) {
            return redirect()->route('responsable_famille.inscriptions')
                ->with('error', 'Aucune modification n\'est possible sur cet ancien membre ou sur un transfert en cours.');
        }

        $fonctions = Fonction::select('id', 'nom', 'description')
            ->orderBy('nom')
            ->get();
        $member->profile_photo_url = $member->profile_photo_url
            ?: PhotoHelper::getPhotoUrl($member->photo_path, $member->prenom, $member->nom);
        $member->setAttribute(
            'fonction_ids',
            $member->fonctions()->pluck('fonctions.id')->values()->all()
        );

        return Inertia::render('ResponsableFamille/Members/EditMember', [
            'member' => $member,
            'family' => $member->family,
            'fonctions' => $fonctions,
        ]);
    }

    public function update(Request $request, $id)
    {
        $member = User::findOrFail($id);
        $auth = Auth::user();

        // Vérifier que l'utilisateur connecté est responsable de cette famille
        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        // Validation avec messages personnalisés
        if ($this->isTransferLocked($member)) {
            return redirect()->route('responsable_famille.inscriptions')
                ->with('error', 'Aucune modification n\'est possible sur cet ancien membre ou sur un transfert en cours.');
        }

        $validated = $request->validate(
            [
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
                'fonction_id' => 'nullable|exists:fonctions,id',
                'fonction_ids' => 'nullable|array|max:10',
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
            ]
        );

        // Enregistrer les anciennes valeurs pour l'audit
        $oldData = $member->only([
            'nom',
            'prenom',
            'email',
            'telephone',
            'telephone2',
            'genre',
            'date_naissance',
            'profession',
            'fonction_id',
            'relation',
            'photo_path'
        ]);

        // Handle photo upload
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $photoPath = $request->file('photo')->store('photos/users', 'public');
            $validated['photo_path'] = $photoPath;
        } elseif (is_string($request->input('photo')) && !empty($request->input('photo'))) {
            $validated['photo_path'] = $this->resolvePhotoPathFromInput($request->input('photo'));
        }

        // Mettre à jour l'utilisateur (colonnes qui existent dans users)
        $resolvedFonctionIds = $this->resolveFonctionIds($validated, $member->fonction_id);

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
            'fonction_id' => $resolvedFonctionIds[0] ?? $member->fonction_id,
            'relation' => $validated['relation'] ?? $member->relation,
            'photo_path' => $validated['photo_path'] ?? $member->photo_path,
            'profile_photo_url' => isset($validated['photo_path'])
                ? '/storage/' . ltrim($validated['photo_path'], '/')
                : $member->profile_photo_url,
        ]);

        $member->fonctions()->sync($resolvedFonctionIds);

        // Enregistrer les modifications dans l'audit
        $newData = $member->only([
            'nom',
            'prenom',
            'email',
            'telephone',
            'telephone2',
            'genre',
            'date_naissance',
            'statut_marital',
            'date_mariage',
            'lieu_mariage',
            'profession',
            'fonction_id',
            'relation',
            'photo_path'
        ]);

        $changes = [];
        foreach ($oldData as $key => $value) {
            if ($oldData[$key] != $newData[$key]) {
                $changes[$key] = [
                    'old' => $oldData[$key],
                    'new' => $newData[$key]
                ];
            }
        }

        // Mettre à jour les sacrements (relation hasOne)
        if ($member->sacrements) {
            $member->sacrements->update([
                // Sacrements religieux
                'baptise' => (bool)($validated['baptise'] ?? false),
                'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
                'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
                'premiere_communion' => (bool)($validated['premiere_communion'] ?? false),
                'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
                'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
                'marie_religieusement' => (bool)($validated['mariage_religieux'] ?? false),
                'mariage_religieux_date' => !empty($validated['date_mariage_religieux']) ? $validated['date_mariage_religieux'] : null,
                'mariage_religieux_lieu' => !empty($validated['lieu_mariage_religieux']) ? $validated['lieu_mariage_religieux'] : null,
                // Statut matrimonial civil (mappé depuis les champs du formulaire)
                'est_marie' => $validated['statut_marital'] === 'Marié(e)',
                'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
                'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
                'est_divorce' => $validated['statut_marital'] === 'Divorcé(e)',
                'est_veuf' => $validated['statut_marital'] === 'Veuf(ve)',
                'dot_effectue' => $validated['statut_marital'] === 'Dote',
            ]);
        } else {
            // Créer le record de sacrements s'il n'existe pas
            \App\Models\UserSacrement::create([
                'user_id' => $member->id,
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
                'est_marie' => $validated['statut_marital'] === 'Marié(e)',
                'mariage_civil_date' => !empty($validated['date_mariage']) ? $validated['date_mariage'] : null,
                'mariage_civil_lieu' => !empty($validated['lieu_mariage']) ? $validated['lieu_mariage'] : null,
                'est_divorce' => $validated['statut_marital'] === 'Divorcé(e)',
                'est_veuf' => $validated['statut_marital'] === 'Veuf(ve)',
                'dot_effectue' => $validated['statut_marital'] === 'Dote',
            ]);
        }

        return redirect()
            ->route('responsable_famille.members.show', $id)
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

    private function resolveFonctionIds(array $validated, ?int $fallbackFonctionId = null): array
    {
        $fonctionIds = [];

        if (array_key_exists('fonction_ids', $validated) && is_array($validated['fonction_ids'])) {
            $fonctionIds = $validated['fonction_ids'];
        } elseif (array_key_exists('fonction_id', $validated) && !empty($validated['fonction_id'])) {
            $fonctionIds = [$validated['fonction_id']];
        } elseif ($fallbackFonctionId) {
            $fonctionIds = [$fallbackFonctionId];
        }

        return collect($fonctionIds)
            ->filter(fn ($id) => !is_null($id) && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->take(10)
            ->all();
    }
}
