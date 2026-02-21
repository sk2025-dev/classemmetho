<?php

namespace App\Http\Middleware;

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
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'nom' => $request->user()->nom,
                    'prenom' => $request->user()->prenom,
                    'email' => $request->user()->email,
                    'telephone' => $request->user()->telephone,
                    'photo' => $request->user()->photo ?? null,
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
