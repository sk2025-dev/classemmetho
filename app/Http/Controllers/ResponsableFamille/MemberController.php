<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\User;
use App\Models\Fonction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function show($id)
    {
        // Récupérer le membre (utilisateur) avec ses relations et sacrements
        $member = User::with('family', 'classe', 'fonction', 'ville', 'sacrements')
            ->findOrFail($id);

        // S'assurer que l'utilisateur connecté est responsable de cette famille
        $auth = Auth::user();

        // Vérifier que le membre appartient à une famille dont l'utilisateur est responsable
        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        // Ajouter l'information de responsable
        $member->is_responsable = $member->id === $member->family->responsable_id;

        return Inertia::render('ResponsableFamille/Members/ShowMember', [
            'member' => $member,
            'family' => $member->family,
            'auth' => $auth,
        ]);
    }

    public function create(Request $request)
    {
        $family = Family::findOrFail($request->query('family_id'));

        return Inertia::render('ResponsableFamille/Members/CreateMember', [
            'family' => $family,
        ]);
    }

    public function store(Request $request)
    {
        try {
            \Log::info('Store member - request data received:', $request->all());

            $familyId = $request->query('family_id');
            $family = Family::findOrFail($familyId);

            // Vérifier que l'utilisateur authentifié est le responsable de cette famille
            $auth = Auth::user();
            if ($family->responsable_id !== $auth->id) {
                abort(403, 'Vous n\'êtes pas autorisé à créer des membres pour cette famille');
            }

            // Convertir les strings vides en null pour les champs optionnels
            $input = $request->all();
            if (isset($input['fonction_id']) && $input['fonction_id'] === '') {
                $input['fonction_id'] = null;
            }
            $request->merge($input);

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
                'profession' => 'nullable|string|max:255',
                'fonction_id' => 'nullable|exists:fonctions,id',
                'relation' => 'nullable|string|max:255',
                'photo' => 'nullable|image|mimes:jpeg,png,gif|max:5120',
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
                'photo.image' => 'Le fichier doit être une image valide',
                'photo.mimes' => 'L\'image doit être au format JPEG, PNG ou GIF',
                'photo.max' => 'L\'image ne doit pas dépasser 5MB',
                'date_bapteme.required_if' => 'La date du baptême est obligatoire si vous avez coché le baptême',
                'date_premiere_communion.required_if' => 'La date de la première communion est obligatoire si vous avez coché',
                'date_mariage_religieux.required_if' => 'La date du mariage religieux est obligatoire si vous avez coché',
            ]
        );

        // Auto-generate email if not provided
        if (empty($validated['email'])) {
            $baseEmail = strtolower($validated['prenom'] . '.' . $validated['nom']) . '@famille.local';
            $email = $baseEmail;
            $counter = 1;

            while (User::where('email', $email)->exists()) {
                $email = strtolower($validated['prenom'] . '.' . $validated['nom']) . $counter . '@famille.local';
                $counter++;
            }

            $validated['email'] = $email;
        }

        // Handle photo upload
        $photoPath = null;
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $photoPath = $request->file('photo')->store('members/photos', 'public');
        }

        // Générer l'identifiant
        $identifier = User::generateIdentifier(
            $validated['nom'],
            $validated['prenom'],
            $validated['date_naissance'] ?? null
        );

        $user = User::create([
            'identifier' => $identifier,
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'telephone' => $validated['telephone'] ?? null,
            'telephone2' => $validated['telephone2'] ?? null,
            'genre' => $validated['genre'],
            'date_naissance' => $validated['date_naissance'] ?? null,
            'profession' => $validated['profession'] ?? null,
            'relation' => $validated['relation'] ?? null,
            'password' => bcrypt('11111'),
            'role' => 'membre_famille',
            'family_id' => $familyId,
            'classe_id' => $family->classe_id,
            'ville_id' => $family->ville_id,
            'fonction_id' => $validated['fonction_id'] ?? null,
            'photo_path' => $photoPath,
        ]);

        // Helper function to properly convert "0"/"1" strings to boolean using filter_var
        $toBool = function($value) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        };

        // Create sacrament record for this user with proper boolean conversion from strings "0"/"1"
        \App\Models\UserSacrement::create([
            'user_id' => $user->id,
            // Sacrements religieux - use filter_var to properly convert "0"/"1" strings
            'baptise' => isset($validated['baptise']) ? $toBool($validated['baptise']) : false,
            'bapteme_date' => !empty($validated['date_bapteme']) ? $validated['date_bapteme'] : null,
            'bapteme_lieu' => !empty($validated['lieu_bapteme']) ? $validated['lieu_bapteme'] : null,
            'premiere_communion' => isset($validated['premiere_communion']) ? $toBool($validated['premiere_communion']) : false,
            'premiere_communion_date' => !empty($validated['date_premiere_communion']) ? $validated['date_premiere_communion'] : null,
            'premiere_communion_lieu' => !empty($validated['lieu_premiere_communion']) ? $validated['lieu_premiere_communion'] : null,
            'marie_religieusement' => isset($validated['marie_religieusement']) ? $toBool($validated['marie_religieusement']) : false,
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

        // Si c'est une requête AJAX/axios, retourner JSON
        if ($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'message' => 'Membre ajouté avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'telephone' => $user->telephone,
                    'genre' => $user->genre,
                    'date_naissance' => $user->date_naissance,
                    'profession' => $user->profession,
                    'relation' => $user->relation,
                    'fonction_id' => $user->fonction_id,
                ]
            ], 201);
        }

        return redirect()
            ->route('responsable-famille.inscriptions', ['family_id' => $familyId])
            ->with('success', 'Membre ajouté avec succès');
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Erreur de validation
            \Log::warning('Validation error in store:', $e->errors());
            if ($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            // Autres erreurs
            \Log::error('Error in store:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            if ($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'ajout du membre',
                    'error' => $e->getMessage()
                ], 500);
            }
            return redirect()->back()->with('error', 'Erreur lors de l\'ajout du membre: ' . $e->getMessage());
        }
    }

    public function edit($id)
    {
        // Récupérer le membre avec ses relations et sacrements
        $member = User::with('family', 'classe', 'fonction', 'ville', 'sacrements')
            ->findOrFail($id);

        // S'assurer que l'utilisateur connecté est responsable de cette famille
        $auth = Auth::user();

        // Vérifier que le membre appartient à une famille dont l'utilisateur est responsable
        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        // Récupérer les fonctions disponibles
        $fonctions = Fonction::select('id', 'nom', 'description')
            ->orderBy('nom')
            ->get();

        $memberData = $member->toArray();
        $memberData['statut_marital'] = $member->sacrements
            ? ($member->sacrements->est_marie ? 'Marié(e)' : ($member->sacrements->est_divorce ? 'Divorcé(e)' : ($member->sacrements->est_veuf ? 'Veuf(ve)' : ($member->sacrements->dot_effectue ? 'Dote' : 'Célibataire'))))
            : 'Célibataire';

        if ($member->sacrements) {
            $memberData['sacrements'] = $member->sacrements->toArray();
        }

        return Inertia::render('ResponsableFamille/Members/EditMember', [
            'member' => $memberData,
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
                'profession' => 'nullable|string|max:255',
                'fonction_id' => 'nullable|exists:fonctions,id',
                'relation' => 'nullable|string|max:255',
                'photo' => 'nullable|image|mimes:jpeg,png,gif|max:5120',
                'baptise' => 'nullable|in:0,1',
                'date_bapteme' => 'nullable|date|required_if:baptise,1',
                'lieu_bapteme' => 'nullable|string|max:255|required_if:baptise,1',
                'premiere_communion' => 'nullable|in:0,1',
                'date_premiere_communion' => 'nullable|date|required_if:premiere_communion,1',
                'lieu_premiere_communion' => 'nullable|string|max:255|required_if:premiere_communion,1',
                'marie_religieusement' => 'nullable|in:0,1',
                'date_mariage_religieux' => 'nullable|date|required_if:marie_religieusement,1',
                'lieu_mariage_religieux' => 'nullable|string|max:255|required_if:marie_religieusement,1',
            ]
        );

        // Enregistrer les anciennes valeurs pour l'audit
        $oldData = $member->only([
            'nom', 'prenom', 'email', 'telephone', 'telephone2', 'genre', 'date_naissance',
            'profession', 'fonction_id', 'relation', 'photo_path'
        ]);

        // Handle photo upload
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $photoPath = $request->file('photo')->store('members/photos', 'public');
            $validated['photo_path'] = $photoPath;
        }

        // Mettre à jour l'utilisateur (colonnes qui existent dans users)
        $member->update([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'] ?? $member->email,
            'telephone' => $validated['telephone'] ?? $member->telephone,
            'telephone2' => $validated['telephone2'] ?? $member->telephone2,
            'genre' => $validated['genre'],
            'date_naissance' => $validated['date_naissance'] ?? $member->date_naissance,
            'profession' => $validated['profession'] ?? $member->profession,
            'fonction_id' => $validated['fonction_id'] ?? $member->fonction_id,
            'relation' => $validated['relation'] ?? $member->relation,
            'photo_path' => $validated['photo_path'] ?? $member->photo_path,
        ]);

        // Enregistrer les modifications dans l'audit
        $newData = $member->only([
            'nom', 'prenom', 'email', 'telephone', 'telephone2', 'genre', 'date_naissance',
            'statut_marital', 'date_mariage', 'lieu_mariage', 'profession',
            'fonction_id', 'relation', 'photo_path'
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
}
