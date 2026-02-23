<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\User;
use App\Models\Fonction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendCredentials;

class MemberController extends Controller
{
    public function show($id)
    {
        // Récupérer le membre (utilisateur) avec ses relations et sacrements
        $member = User::with('family', 'classe', 'fonction', 'ville', 'sacrements')
            ->findOrFail($id);

        // S'assurer que l'utilisateur connecté est pasteur de cette famille
        $auth = Auth::user();

        // Vérifier que le membre appartient à la famille du pasteur
        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        // Ajouter l'information de pasteur
        $member->is_pasteur = $member->id === $auth->id;

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
                'prenom.required' => 'Le prénom est obligatoire',
                'email.unique' => 'Cette adresse email est déjà utilisée',
                'photo.image' => 'Le fichier doit être une image valide',
                'photo.max' => 'L\'image ne doit pas dépasser 5MB',
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

        // Ensure identifier is generated
        $identifier = User::generateIdentifier($validated['nom'], $validated['prenom'], $validated['date_naissance'] ?? null);

        \Log::info('Pasteur MemberController store - données validées', [
            'fonction_id' => $validated['fonction_id'],
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
        ]);

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
            'family_id' => $family->id,
            'classe_id' => $family->classe_id,
            'ville_id' => $family->ville_id,
            'fonction_id' => $validated['fonction_id'] ?? null,
            'photo_path' => $photoPath,
        ]);

        // Create sacrament record
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

        // Envoyer les identifiants
        try {
            $tempPassword = '11111';
            Mail::to($user->email)->send(new SendCredentials($user, $identifier, $tempPassword));
            $user->credentials_sent_at = now();
            $user->save();
        } catch (\Exception $e) {
            logger()->warning('Send email SendCredentials failed for user id ' . $user->id . ': ' . $e->getMessage());
        }

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
            ->route('pasteur.inscriptions')
            ->with('success', 'Membre ajouté avec succès');
    }

    public function edit($id)
    {
        // Récupérer le membre avec ses relations
        $member = User::with('family', 'classe', 'fonction', 'ville', 'sacrements')
            ->findOrFail($id);

        // S'assurer que l'utilisateur connecté est pasteur de cette famille
        $auth = Auth::user();

        // Vérifier que le membre appartient à la famille du pasteur
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

        return Inertia::render('Pasteur/Members/EditMember', [
            'member' => $memberData,
            'family' => $member->family,
            'fonctions' => $fonctions,
        ]);
    }

    public function update(Request $request, $id)
    {
        $member = User::findOrFail($id);
        $auth = Auth::user();

        // Vérifier que l'utilisateur connecté est pasteur de cette famille
        if ($member->family_id !== $auth->family_id) {
            return abort(403, 'Accès non autorisé');
        }

        // Validation
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
            'mariage_religieux' => 'nullable|in:0,1',
            'date_mariage_religieux' => 'nullable|date|required_if:mariage_religieux,1',
            'lieu_mariage_religieux' => 'nullable|string|max:255|required_if:mariage_religieux,1',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $validated['photo_path'] = $request->file('photo')->store('members/photos', 'public');
        }

        // Mettre à jour les infos du membre
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

        // Mettre à jour les sacrements
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
            ->route('pasteur.members.show', $id)
            ->with('success', 'Modifications sauvegardées avec succès');
    }
}
