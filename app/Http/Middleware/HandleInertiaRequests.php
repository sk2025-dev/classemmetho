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
        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'flashAnnouncements' => fn() => ActeLiturgique::query()
                ->with(['membre:id,prenom,nom', 'family:id,nom'])
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
                ->latest()
                ->limit(20)
                ->get([
                    'id',
                    'type_acte',
                    'details',
                    'membre_id',
                    'family_id',
                    'date_souhaitee',
                    'date_publication',
                    'created_at',
                    'statut',
                ]),
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
                    'classe' => $request->user()->classe ? [
                        'id' => $request->user()->classe->id,
                        'nom' => $request->user()->classe->nom,
                    ] : null,
                ] : null,
            ],
        ];
    }
}
