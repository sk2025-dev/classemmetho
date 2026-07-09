<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Inscription;
use App\Models\Family;
use App\Models\Classe;
use App\Models\ClassTransferRequest;
use App\Services\TransferWorkflowService;
use App\Helpers\PhotoHelper;

use App\Models\Fonction; // <--- MODÈLE FONCTIONS CONSERVÉ
use App\Models\User;

use App\Http\Controllers\Controller;

// Importation des Form Requests pour la validation propre
use App\Http\Requests\Admin\StoreClasseRequest;
use App\Http\Requests\Admin\UpdateClasseRequest;
use App\Http\Requests\Admin\StoreMembreRequest;
use App\Http\Requests\Admin\UpdateMembreRequest;

class AdministrationController extends Controller
{
    /**
     * Trouver la fonction "président des conducteurs" de manière robuste (sans dépendre
     * de la présence exacte des accents).
     */
    private function getPresidentConducteursFonction(): ?Fonction
    {
        // On cherche "président des conducteurs" de façon tolérante
        // (accents, casse, espaces, variantes).
        $target = 'president des conducteurs';

        $normalize = function (string $value): string {
            $ascii = Str::ascii($value);
            $lower = strtolower($ascii);
            // garder uniquement lettres/chiffres/espaces
            $clean = preg_replace('/[^a-z0-9 ]+/', ' ', $lower) ?? '';
            // réduire les espaces multiples
            $clean = preg_replace('/\s+/', ' ', trim($clean)) ?? '';
            return $clean;
        };

        $targetNormalized = $normalize($target);

        $candidates = Fonction::query()
            ->whereNotNull('nom')
            ->get(['id', 'nom']);

        $exact = $candidates->first(function (Fonction $fonction) use ($normalize, $targetNormalized) {
            return $normalize((string) $fonction->nom) === $targetNormalized;
        });

        if ($exact) {
            return $exact;
        }

        // Fallback: contient "president" ET "conducteurs"
        return $candidates->first(function (Fonction $fonction) use ($normalize) {
            $n = $normalize((string) $fonction->nom);
            return str_contains($n, 'president') && str_contains($n, 'conducteurs');
        });
    }

    public function index()
    {
        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 1: CHARGER TOUTES LES DONNÉES DE BASE
        // ═══════════════════════════════════════════════════════════════

        $transferService = app(TransferWorkflowService::class);

        // Utilisateurs avec relations
        $allUsers = User::with([
            'family',
            'family.classe',
            'family.responsable',
            'family.ville',
            'classe',
            'ville',
            'fonction',
            'sacrements',
        ])->get();
        $allUsers = $transferService->hydrateUsersTransferState($allUsers)->values();
        $totalUsersCount = $allUsers->count();

        $completedTransfers = ClassTransferRequest::with('sourceClass:id,nom')
            ->whereIn('statut', ['TERMINEE', 'completed'])
            ->where(function ($query) use ($allUsers) {
                $query->whereIn('membre_id', $allUsers->pluck('id')->all());

                $familyIds = $allUsers->pluck('family_id')->filter()->unique()->values()->all();
                if (!empty($familyIds)) {
                    $query->orWhereIn('famille_id', $familyIds);
                }
            })
            ->orderByDesc('date_validation_accueil')
            ->orderByDesc('updated_at')
            ->get();

        $completedTransfersByUserId = $completedTransfers
            ->filter(fn (ClassTransferRequest $transfer) => !empty($transfer->membre_id))
            ->unique('membre_id')
            ->keyBy('membre_id');

        $completedTransfersByFamilyId = $completedTransfers
            ->filter(fn (ClassTransferRequest $transfer) => !empty($transfer->famille_id))
            ->unique('famille_id')
            ->keyBy('famille_id');

        // Classes
        $classes = Classe::all();

        // Fonctions
        $fonctions = Fonction::all();

        // Inscriptions
        $allInscriptions = Inscription::with(['admin'])->get();

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 2: FORMATER LES INSCRIPTIONS
        // ═══════════════════════════════════════════════════════════════

        $inscriptionsFormatted = $allInscriptions->map(function ($item) {
            // A. Déterminer le NOM à afficher
            if ($item->type === 'family') {
                $nomAffiche = $item->data['famille']['nom'] ?? "Famille inconnue";
                $nbMembres = count($item->data['membres'] ?? []) + 1; // +1 pour le responsable
            } else {
                // Individuel
                $nomAffiche = ($item->prenom ?? '') . ' ' . ($item->nom ?? '');
                $nbMembres = 1;
            }

            // B. Déterminer le RESPONSABLE
            $responsable = "N/A";
            if ($item->responsable_nom && $item->responsable_prenom) {
                $responsable = $item->responsable_nom . ' ' . $item->responsable_prenom;
            }

            // C. Déterminer la CLASSE
            $nomClasse = "Non assignée";
            $classeId = $item->data['famille']['classe_id'] ?? null;
            if ($classeId) {
                try {
                    $classeModel = \App\Models\Classe::find($classeId);
                    $nomClasse = $classeModel?->nom ?? "Non assignée";
                } catch (\Exception $e) {
                    $nomClasse = "Non assignée";
                }
            }

            // D. Calculer le STATUT ADMIN (Logique Métier -> Affichage UI)
            $uiStatus = "En attente";
            if ($item->status === 'rejete') {
                $uiStatus = "Rejeté";
            } elseif ($item->admin_id) {
                $uiStatus = "Approuvé";
            }

            return [
                'id' => $item->id,
                'classe' => $nomClasse,
                'famille' => $nomAffiche,
                'responsable' => $responsable,
                'membres' => $nbMembres,
                'date_de_creation' => $item->created_at->format('d/m/Y'),
                'statut' => $uiStatus,
                'type' => $item->type,
            ];
        });

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 2: FORMATER LES CLASSES AVEC STATISTIQUES
        // ═══════════════════════════════════════════════════════════════

        $classesFormatted = Classe::all()->map(function ($c) use ($allUsers) {
            // Compter les utilisateurs de cette classe
            $usersInClasse = $allUsers->filter(function ($u) use ($c) {
                return $u->classe_id === $c->id;
            });

            // Récupérer les conducteurs assignés à cette classe
            $conducteursInClasse = $allUsers->filter(function ($u) use ($c) {
                return $u->classe_id === $c->id && $u->role === 'conducteur';
            })->pluck('id')->toArray();

            return [
                'id' => $c->id,
                'nom' => $c->nom,
                'description' => $c->description ?? '',
                'commune' => $c->commune,
                'conducteur' => $c->conducteur,
                'contact' => $c->contact,
                'familles' => $c->familles,
                'status' => $c->status ?? 'active',
                'created_at' => $c->created_at ? $c->created_at->toISOString() : null,
                'updated_at' => $c->updated_at ? $c->updated_at->toISOString() : null,
                'membres_count' => $usersInClasse->count(),
                'conducteurs_ids' => $conducteursInClasse,
            ];
        });

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 4: FORMATER LES FONCTIONS AVEC STATISTIQUES
        // ═══════════════════════════════════════════════════════════════

        $fonctionsFormatted = $fonctions->map(function ($f) use ($allUsers) {
            // Compter les utilisateurs avec cette fonction
            $usersInFonction = $allUsers->filter(function ($u) use ($f) {
                return $u->fonction_id === $f->id;
            });

            return [
                'id' => $f->id,
                'nom' => $f->nom,
                'description' => $f->description,
                'niveau' => $f->niveau,
                'membres_count' => $usersInFonction->count(),
            ];
        });

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 5: FORMATER LES UTILISATEURS
        // ═══════════════════════════════════════════════════════════════

        $membersFormatted = $allUsers->map(function ($m) use ($completedTransfersByUserId, $completedTransfersByFamilyId) {
            // Charger les sacrements s'ils existent
            $sacrements = $m->sacrements;
            $originFamilyCode = $m->getRelation('computedOriginFamilyTransferRequest')?->family?->code_famille;
            $familyCodeHistory = collect([
                $originFamilyCode,
                $m->family?->code_famille,
            ])->filter()->unique()->values()->all();
            $latestMemberTransfer = $completedTransfersByUserId->get($m->id);
            $latestFamilyTransfer = $m->family_id
                ? $completedTransfersByFamilyId->get($m->family_id)
                : null;
            $ancienneClasse = $latestMemberTransfer?->sourceClass?->nom
                ?? $latestFamilyTransfer?->sourceClass?->nom
                ?? $m->getRelation('computedOriginFamilyTransferRequest')?->sourceClass?->nom;

            if ($ancienneClasse === $m->classe?->nom) {
                $ancienneClasse = null;
            }

            // Déterminer le statut marital
            $statut_marital = 'Célibataire';
            if ($sacrements) {
                if ($sacrements->est_marie) $statut_marital = 'Marié(e)';
                else if ($sacrements->est_divorce) $statut_marital = 'Divorcé(e)';
                else if ($sacrements->est_veuf) $statut_marital = 'Veuf(ve)';
                else if ($sacrements->dot_effectue) $statut_marital = 'Dote';
            }

            return [
                'id' => $m->id,
                'nom' => $m->nom,
                'prenom' => $m->prenom,
                'telephone' => $m->telephone,
                'telephone2' => $m->telephone2,
                'date_naissance' => $m->date_naissance ? $m->date_naissance->format('Y-m-d') : null,
                'email' => $m->email,
                'genre' => $m->genre,
                'identifiant' => $m->identifier,
                'classe_id' => $m->classe_id,
                'fonction_id' => $m->fonction_id,
                'photo' => $m->profile_photo_url ?: PhotoHelper::getPhotoUrl($m->photo_path, $m->prenom, $m->nom),
                'profil_photo' => $m->profile_photo_url ?: PhotoHelper::getPhotoUrl($m->photo_path, $m->prenom, $m->nom),
                'profile_photo_url' => $m->profile_photo_url ?: PhotoHelper::getPhotoUrl($m->photo_path, $m->prenom, $m->nom),
                'role' => $m->role ?? 'utilisateur',
                'statut' => $m->statut ?? ($m->status ?? null),
                'is_active' => (($m->statut ?? null) === 'actif' || ($m->status ?? null) === 'active') ? 1 : 0,
                'created_at' => $m->created_at ? $m->created_at->format('d/m/Y') : null,
                'updated_at' => ($m->updated_at ?? $m->created_at) ? ($m->updated_at ?? $m->created_at)->format('d/m/Y H:i') : null,
                'fonction' => $m->fonction?->nom,
                'classe' => $m->classe?->nom,
                'ancienne_classe' => $ancienneClasse,
                'ville_id' => $m->ville_id,
                'famille_ville_id' => $m->family?->ville_id,
                'ville' => $m->ville?->nom
                    ?? $m->family?->ville?->nom
                    ?? ($m->family?->ville_id ? ('Ville ID: ' . $m->family->ville_id) : null),
                'famille' => $m->family?->nom,
                'code_famille' => $m->family?->code_famille,
                'ancienne_famille_code' => $originFamilyCode,
                'nouvelle_famille_code' => count($familyCodeHistory) > 1 ? $m->family?->code_famille : null,
                'code_famille_historique' => $familyCodeHistory,

                	// Champs de transfert (hydrate par TransferWorkflowService)
                	'transfer_status' => $m->transfer_status ?? null,
                	'transfer_label' => $m->transfer_label ?? null,
                	'transfer_history_label' => count($familyCodeHistory) > 1 ? 'Nouveau membre' : null,
                	'transfer_locked' => (bool) ($m->transfer_locked ?? false),
                'code_membre' => $m->code_membre,
                'is_deceased' => (bool) $m->is_deceased,
                'deceased_at' => $m->deceased_at?->format('Y-m-d'),

                // === CHAMPS SUPPLÉMENTAIRES POUR LA MODIFICATION ===
                'profession'        => $m->profession,
                'employment_status' => $m->employment_status,
                'relation' => $m->relation,
                'famille_nom' => $m->family?->nom,
                'statut_marital' => $statut_marital,
                'date_mariage' => $sacrements?->mariage_civil_date ? $sacrements->mariage_civil_date->format('Y-m-d') : null,
                'lieu_mariage' => $sacrements?->mariage_civil_lieu,

                // === SACREMENTS RELIGIEUX ===
                'baptise' => (bool) $sacrements?->baptise,
                'date_bapteme' => $sacrements?->bapteme_date ? $sacrements->bapteme_date->format('Y-m-d') : null,
                'lieu_bapteme' => $sacrements?->bapteme_lieu,

                'premiere_communion' => (bool) $sacrements?->premiere_communion,
                'date_premiere_communion' => $sacrements?->premiere_communion_date ? $sacrements->premiere_communion_date->format('Y-m-d') : null,
                'lieu_premiere_communion' => $sacrements?->premiere_communion_lieu,

                'marie_religieusement' => (bool) $sacrements?->marie_religieusement,
                'date_mariage_religieux' => $sacrements?->mariage_religieux_date ? $sacrements->mariage_religieux_date->format('Y-m-d') : null,
                'lieu_mariage_religieux' => $sacrements?->mariage_religieux_lieu,

                'dot_effectue' => (bool) $sacrements?->dot_effectue,
                'adresse'              => $m->family?->adresse,
                'quartier'             => $m->family?->quartier,
                'lieu_naissance'       => $m->lieu_naissance,
                'numero_cni'           => $m->numero_cni,
                'hors_communaute'      => (bool) $m->hors_communaute,
                'retrait'              => (bool) $m->retrait,
                'date_retrait'         => $m->date_retrait?->format('Y-m-d'),
                'commentaire_retrait'  => $m->commentaire_retrait,
            ];
        });

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 6: GROUPER LES UTILISATEURS (COMPATIBILITÉ)
        // ═══════════════════════════════════════════════════════════════

        $membersByFamily = [];
        $membersByFamilyCode = [];
        $membersByResponsible = [];

        foreach ($membersFormatted as $memberData) {
            if ($memberData['famille']) {
                $familyName = $memberData['famille'];
                if (!isset($membersByFamily[$familyName])) {
                    $membersByFamily[$familyName] = [];
                }
                $membersByFamily[$familyName][] = $memberData;
            }

            if ($memberData['code_famille']) {
                $familyCode = $memberData['code_famille'];
                if (!isset($membersByFamilyCode[$familyCode])) {
                    $membersByFamilyCode[$familyCode] = [];
                }
                $membersByFamilyCode[$familyCode][] = $memberData;
            }

            $responsableName = $memberData['role'] === 'responsable_famille' ?
                ($memberData['prenom'] . ' ' . $memberData['nom']) : "N/A";

            if (!isset($membersByResponsible[$responsableName])) {
                $membersByResponsible[$responsableName] = [];
            }
            $membersByResponsible[$responsableName][] = $memberData;
        }

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 7: GROUPER LES UTILISATEURS PAR FONCTION
        // ═══════════════════════════════════════════════════════════════

        $usersByFonction = [];
        foreach ($membersFormatted as $member) {
            if (!empty($member['fonction'])) {
                $fonctionName = $member['fonction'];
                if (!isset($usersByFonction[$fonctionName])) {
                    $usersByFonction[$fonctionName] = [];
                }
                $usersByFonction[$fonctionName][] = $member;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 8: CRÉER LES LISTES DE SÉLECTION
        // ═══════════════════════════════════════════════════════════════

        $availableClasses = $classes->map(function ($c) {
            return [
                'id' => $c->id,
                'value' => $c->id,
                'label' => $c->nom,
                'nom' => $c->nom,
            ];
        })->prepend([
            'id' => null,
            'value' => null,
            'label' => 'Toutes les classes',
            'nom' => 'Toutes les classes',
        ]);

        $availableFonctions = $fonctions->map(function ($f) {
            return [
                'id' => $f->id,
                'value' => $f->id,
                'label' => $f->nom,
                'nom' => $f->nom,
            ];
        })->prepend([
            'id' => null,
            'value' => null,
            'label' => 'Toutes les fonctions',
            'nom' => 'Toutes les fonctions',
        ]);

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 9: CRÉER LES FAMILLES FORMATÉES
        // ═══════════════════════════════════════════════════════════════

        $famillesFormatted = Family::with(['responsable', 'ville', 'classe'])->get()->map(function ($f) use ($membersByFamily) {
            return [
                'id' => $f->id,
                'nom' => $f->nom,
                'code_famille' => $f->code_famille,
                'responsable' => $f->responsable
                    ? trim(($f->responsable->prenom ?? "") . " " . ($f->responsable->nom ?? ""))
                    : null,
                'responsable_code' => $f->responsable?->code_membre,
                'classe_id' => $f->classe_id,
                'classe_nom' => $f->classe?->nom,
                'contact' => $f->contact,
                'telephone' => $f->telephone,
                'telephone2' => $f->telephone2,
                'email' => $f->email,
                'adresse' => $f->adresse,
                'quartier' => $f->quartier,
                'ville' => $f->ville?->nom,
                'status' => $f->status ?? ($f->deleted_at ? 'supprimée' : 'active'),
                'created_at' => $f->created_at?->format('d/m/Y'),
                'updated_at' => $f->updated_at?->format('d/m/Y'),
                'membres_count' => count($membersByFamily[$f->nom] ?? []),
            ];
        });

        // ═══════════════════════════════════════════════════════════════
        // ÉTAPE 10: ASSEMBLER ET RETOURNER LES DONNÉES
        // ═══════════════════════════════════════════════════════════════

        $dataByType = [
            // Inscriptions groupées par statut
            'inscrites' => $inscriptionsFormatted->where('statut', 'En attente')->values(),
            'approuvees' => $inscriptionsFormatted->where('statut', 'Approuvé')->values(),
            'rejetees' => $inscriptionsFormatted->where('statut', 'Rejeté')->values(),
            'attente' => [],

            // Classes et fonctions avec statistiques
            'classes' => $classesFormatted,
            'fonctions' => $fonctionsFormatted,

            // Utilisateurs et groupements
            'membres' => $membersFormatted,
            'familles' => $famillesFormatted,
            'usersByFonction' => $usersByFonction,

            // Totaux
            'total_members' => $totalUsersCount,
        ];

        return Inertia::render('Admin/Administration', [
            'dataByType' => $dataByType,
            'membersByFamily' => $membersByFamily,
            'membersByFamilyCode' => $membersByFamilyCode,
            'membersByResponsible' => $membersByResponsible,
            'membres' => $membersFormatted,
            'availableClasses' => $availableClasses,
            'availableFonctions' => $availableFonctions,
            'total_users_count' => $totalUsersCount,  // ✅ Total global des personnes
        ]);
    }

    /**
     * Récupérer les détails d'une inscription spécifique
     */
    public function getInscriptionDetails($id)
    {
        $inscription = Inscription::with(['admin'])->findOrFail($id);

        // Formatage similaire à la méthode index
        if ($inscription->type === 'family') {
            $nomAffiche = $inscription->data['famille']['nom'] ?? "Famille inconnue";
            $nbMembres = count($inscription->data['membres'] ?? []) + 1;
        } else {
            $nomAffiche = ($inscription->prenom ?? '') . ' ' . ($inscription->nom ?? '');
            $nbMembres = 1;
        }

        $responsable = "N/A";
        if ($inscription->responsable_nom && $inscription->responsable_prenom) {
            $responsable = $inscription->responsable_nom . ' ' . $inscription->responsable_prenom;
        }

        // Récupérer la classe depuis le JSON
        $nomClasse = "Non assignée";
        $classeId = $inscription->data['famille']['classe_id'] ?? null;
        if ($classeId) {
            try {
                $classeModel = \App\Models\Classe::find($classeId);
                $nomClasse = $classeModel?->nom ?? "Non assignée";
            } catch (\Exception $e) {
                $nomClasse = "Non assignée";
            }
        }

        $uiStatus = "En attente";
        if ($inscription->status === 'rejete') {
            $uiStatus = "Rejeté";
        } elseif ($inscription->admin_id) {
            $uiStatus = "Approuvé";
        }

        // Informations supplémentaires pour le modal
        $membresDetails = [];
        if ($inscription->type === 'family' && isset($inscription->data['membres'])) {
            $membresDetails = array_map(function ($membre) {
                return [
                    'nom' => $membre['nom'] ?? null,
                    'prenom' => $membre['prenom'] ?? null,
                    'telephone' => $membre['telephone'] ?? null,
                    'email' => $membre['email'] ?? null,
                    'genre' => $membre['genre'] ?? null,
                    'date_naissance' => $membre['date_naissance'] ?? null,
                    'relation' => $membre['lien_parente'] ?? null,
                ];
            }, $inscription->data['membres']);
        }

        return response()->json([
            'id' => $inscription->id,
            'classe' => $nomClasse,
            'famille' => $nomAffiche,
            'responsable' => $responsable,
            'membres' => $nbMembres,
            'date_de_creation' => $inscription->created_at->format('d/m/Y'),
            'statut' => $uiStatus,
            'type' => $inscription->type,
            'type_affichage' => $inscription->type === 'family' ? 'Famille' : 'Individuel',
            'membres_details' => $membresDetails,
            'email' => $inscription->responsable_email ?? null,
            'telephone' => $inscription->responsable_tel ?? null,
            'adresse' => $inscription->data['famille']['adresse'] ?? null,
            'created_at' => $inscription->created_at->format('d/m/Y H:i'),
            'updated_at' => $inscription->updated_at->format('d/m/Y H:i'),
        ]);
    }

    public function storeMembre(StoreMembreRequest $request)
    {
        $validated = $request->validated();

        $userData = [
            'identifier' => $validated['identifier'] ?? \App\Traits\GeneratesIdentifier::generateIdentifier(
                $validated['nom'],
                $validated['prenom'],
                $validated['date_naissance'] ?? null
            ),
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'genre' => $validated['genre'] ?? null,
            'telephone' => $validated['telephone'] ?? null,
            'email' => $validated['email'] ?? null,
            'date_naissance' => $validated['date_naissance'] ?? null,
            'role' => $validated['role'] ?? 'membre_famille',
            'profession' => $validated['profession'] ?? null,
            'relation' => $validated['relation'] ?? null,
            'fonction_id' => $validated['fonction_id'] ?? null,
            'classe_id' => $validated['classe_id'] ?? null,
            'family_id' => $validated['family_id'] ?? null,
            'statut' => 'actif',
            'password' => Hash::make('11111'),
        ];

        if ($request->hasFile('photo')) {
            $userData['photo_path'] = $request->file('photo')->store('photos/users', 'public');
        }

        User::create($userData);

        return back()->with('success', 'Membre créé avec succès.');
    }

    public function updateMembre(UpdateMembreRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validated();

        $user->nom = $validated['nom'] ?? $user->nom;
        $user->prenom = $validated['prenom'] ?? $user->prenom;
        $user->genre = $validated['genre'] ?? $user->genre;
        $user->telephone = $validated['telephone'] ?? $user->telephone;
        $user->email = $validated['email'] ?? $user->email;
        $user->date_naissance = $validated['date_naissance'] ?? $user->date_naissance;
        $user->role = $validated['role'] ?? $user->role;
        $user->profession = $validated['profession'] ?? $user->profession;
        $user->relation = $validated['relation'] ?? $user->relation;
        $user->fonction_id = $validated['fonction_id'] ?? $user->fonction_id;
        $user->classe_id = $validated['classe_id'] ?? $user->classe_id;
        $user->family_id = $validated['family_id'] ?? $user->family_id;

        if ($request->hasFile('photo')) {
            if ($user->photo_path) {
                Storage::disk('public')->delete($user->photo_path);
            }
            $user->photo_path = $request->file('photo')->store('photos/users', 'public');
        }

        $user->save();

        return back()->with('success', 'Membre modifié avec succès.');
    }

    /**
     * Désigner un membre comme "président des conducteurs".
     * Règle: il n'y en a qu'un seul à la fois (on le retire des autres).
     */
    public function assignPresidentConducteurs($id)
    {
        try {
            $user = User::findOrFail($id);
            $presidentFonction = $this->getPresidentConducteursFonction();

            if (!$presidentFonction) {
                // Pour debug: on log les fonctions candidates.
                $possible = Fonction::query()
                    ->whereNotNull('nom')
                    ->get(['id', 'nom']);
                Log::warning('President conducteurs fonction introuvable', [
                    'member_id' => $id,
                    'possible_fonctions_count' => $possible->count(),
                    'possible_fonctions_all' => $possible
                        ->map(fn (Fonction $f) => [
                            'id' => $f->id,
                            'nom' => $f->nom,
                        ])
                        ->values()
                        ->all(),
                ]);
                return back()->with('error', "Fonction 'président des conducteurs' introuvable.");
            }

            $presidentFonctionId = (int) $presidentFonction->id;

            DB::transaction(function () use ($user, $presidentFonctionId) {
                // Retirer la fonction des autres utilisateurs (pivot + fonction principale).
                DB::table('fonction_user')
                    ->where('fonction_id', $presidentFonctionId)
                    ->where('user_id', '!=', $user->id)
                    ->delete();

                User::where('fonction_id', $presidentFonctionId)
                    ->where('id', '!=', $user->id)
                    ->update(['fonction_id' => null]);

                // Assigner au membre sélectionné (pivot + fonction principale).
                $user->fonctions()->syncWithoutDetaching([$presidentFonctionId]);
                $user->fonction_id = $presidentFonctionId;
                $user->save();
            });

            return back()->with('success', 'Président des conducteurs mis à jour.');
        } catch (\Throwable $e) {
            Log::error('assignPresidentConducteurs failed', [
                'member_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Une erreur est survenue lors de la désignation du président des conducteurs.');
        }
    }

    /**
     * Retirer la fonction "président des conducteurs" d'un membre.
     */
    public function unassignPresidentConducteurs($id)
    {
        try {
            $user = User::findOrFail($id);
            $presidentFonction = $this->getPresidentConducteursFonction();

            if (!$presidentFonction) {
                return back()->with('error', "Fonction 'président des conducteurs' introuvable.");
            }

            $presidentFonctionId = (int) $presidentFonction->id;

            DB::transaction(function () use ($user, $presidentFonctionId) {
                // Retirer la fonction du pivot.
                $user->fonctions()->detach($presidentFonctionId);

                // Retirer la fonction principale si c'est elle.
                if ((int) $user->fonction_id === $presidentFonctionId) {
                    $user->fonction_id = null;
                    $user->save();
                }
            });

            return back()->with('success', 'Président des conducteurs mis à jour.');
        } catch (\Throwable $e) {
            Log::error('unassignPresidentConducteurs failed', [
                'member_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Une erreur est survenue lors de la suppression du président des conducteurs.');
        }
    }

    public function destroyMembre($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return back()->with('success', 'Membre supprimé avec succès.');
    }
}
