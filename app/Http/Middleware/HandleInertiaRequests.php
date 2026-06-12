<?php

namespace App\Http\Middleware;

use App\Helpers\PhotoHelper;
use App\Models\ActeLiturgique;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $basePath = parse_url((string) config('app.url'), PHP_URL_PATH) ?: '';
        $basePath = $basePath === '/' ? '' : rtrim($basePath, '/');

        return [
            ...parent::share($request),
            'app' => [
                'basePath' => $basePath,
            ],
            'csrf_token' => csrf_token(),
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'flashAnnouncements' => function () use ($request) {
                $user = $request->user();
                $userClasseId = $user?->classe_id;

                $userRole = $user?->role;

                return ActeLiturgique::query()
                    ->with(['membre:id,prenom,nom', 'family:id,nom', 'createur:id,prenom,nom,role'])
                    ->whereIn('statut', ['VALIDEE', 'PUBLIEE'])
                    ->where(function ($q) {
                        $q->where('est_annonce', true)
                            ->orWhereIn('type_acte', [
                                'annonce',
                                'annonce_liturgique',
                                'priere',
                                'grace',
                                'generale',
                                'mariage',
                                'deces',
                            ]);
                    })
                    ->where(function ($q) use ($userClasseId) {
                        // Flash info globaux (family_id null, classe_id null)
                        // OU flash info scoped pour la classe de l'utilisateur
                        $q->where(function ($inner) use ($userClasseId) {
                            $inner->whereNull('family_id')
                                  ->where(function ($inner2) use ($userClasseId) {
                                      $inner2->whereNull('classe_id');
                                      if ($userClasseId) {
                                          $inner2->orWhere('classe_id', $userClasseId);
                                      }
                                  });
                        })
                        ->orWhere(function ($inner) {
                            // Annonces avec family_id (liturgiques classiques)
                            $inner->whereNotNull('family_id')
                                  ->whereIn('statut', ['VALIDEE', 'PUBLIEE'])
                                  ->where(function ($inner2) {
                                      $inner2->where('est_annonce', true)
                                            ->orWhereIn('type_acte', [
                                                'annonce', 'annonce_liturgique',
                                                'priere', 'grace', 'generale',
                                                'mariage', 'deces',
                                            ]);
                                  });
                        });
                    })
                    // Ciblage par role : visible si pas de cible (legacy), cible "all", ou cible == role de l'utilisateur
                    ->where(function ($q) use ($userRole) {
                        $q->whereNull('target_role')
                          ->orWhere('target_role', 'all')
                          ->orWhere('target_role', $userRole);
                    })
                    ->latest()
                    ->limit(20)
                    ->get([
                        'id',
                        'type_acte',
                        'details',
                        'membre_id',
                        'family_id',
                        'classe_id',
                        'created_by',
                        'date_souhaitee',
                        'date_publication',
                        'created_at',
                        'statut',
                        'target_role',
                    ]);
            },
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'nom' => $request->user()->nom,
                    'prenom' => $request->user()->prenom,
                    'email' => $request->user()->email,
                    'telephone' => $request->user()->telephone,
                    'photo' => $request->user()->photo ?? null,
                    'profile_photo_url' => $request->user()->profile_photo_url
                        ?: PhotoHelper::getPhotoUrl(
                            $request->user()->photo_path,
                            $request->user()->prenom,
                            $request->user()->nom
                        ),
                    'role' => $request->user()->role,
                    'identifier' => $request->user()->identifier,
                    'code_membre' => $request->user()->code_membre,
                    'classe' => $request->user()->classe ? [
                        'id' => $request->user()->classe->id,
                        'nom' => $request->user()->classe->nom,
                    ] : null,
                    'fonction' => $request->user()->fonction ? [
                        'id' => $request->user()->fonction->id,
                        'nom' => $request->user()->fonction->nom,
                    ] : null,
                ] : null,
            ],
        ];
    }
}
