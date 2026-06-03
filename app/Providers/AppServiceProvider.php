<?php

namespace App\Providers;

use App\Models\ActeLiturgique;
use App\Models\Classe;
use App\Models\Family;
use App\Models\Inscription;
use App\Models\LoginHistory;
use App\Models\Notification;
use App\Support\ResilientPdfWrapper;
use App\Models\User;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->configureDompdfPublicPath();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDompdfPublicPath();
        $this->registerResilientPdfWrapper();

        // Enregistrer l'observer pour tracer les modifications
        User::observe(AuditObserver::class);
        Classe::observe(AuditObserver::class);
        Family::observe(AuditObserver::class);
        Inscription::observe(AuditObserver::class);
        Notification::observe(AuditObserver::class);
        LoginHistory::observe(AuditObserver::class);

        // Configuration Inertia pour le loading screen et les performances
        Inertia::version(fn() => md5_file(public_path('build/manifest.json')));

        // Passer les données partagées à toutes les pages Inertia
        Inertia::share([
            'app_name' => config('app.name'),
            'auth' => function () {
                return [
                    'user' => Auth::user() ? [
                        'id' => Auth::user()->id,
                        'name' => Auth::user()->name,
                        'prenom' => Auth::user()->prenom,
                        'nom' => Auth::user()->nom,
                        'email' => Auth::user()->email,
                        'code_membre' => Auth::user()->code_membre,
                        'identifier' => Auth::user()->identifier,
                        'role' => Auth::user()->role,
                    ] : null,
                ];
            },
            'flash' => function () {
                return [
                    'message' => session('message'),
                    'error' => session('error'),
                    'success' => session('success'),
                    'just_logged_in' => session('just_logged_in'),
                    'user_welcome_name' => session('user_welcome_name'),
                ];
            },
            'flashAnnouncements' => function () {
                $user = Auth::user();

                if (!$user) {
                    return [];
                }

                $query = ActeLiturgique::annonces()
                    ->with([
                        'family:id,nom',
                        'createur:id,prenom,nom',
                        'membre:id,prenom,nom',
                    ])
                    ->publiees()
                    ->where(function ($q) {
                        $q->whereNull('date_publication')
                            ->orWhere('date_publication', '<=', now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('date_expiration')
                            ->orWhere('date_expiration', '>=', now());
                    })
                    ->orderBy('est_principale', 'desc')
                    ->orderBy('date_publication', 'desc');

                // Meme logique de visibilite que les pages Index Annonce:
                // - membre_famille / responsable_famille: annonces de leur famille + annonces publiques
                // - autres roles (conducteur, pasteur, admin): flux global paroissial
                if (in_array($user->role, ['membre_famille', 'responsable_famille'], true) && $user->family_id) {
                    $query->where(function ($q) use ($user) {
                        $q->where('family_id', $user->family_id)
                            ->orWhereNull('family_id');
                    });
                }

                return $query
                    ->limit(5)
                    ->get();
            },
        ]);
    }

    /**
     * Configure a stable DomPDF public path for shared-hosting deployments
     * where Laravel may run from a subdirectory (e.g. /demo/classemetho).
     */
    private function configureDompdfPublicPath(): void
    {
        $candidates = [
            public_path(),
            base_path('public'),
            dirname(base_path()) . DIRECTORY_SEPARATOR . 'public',
            dirname(base_path()),
        ];

        foreach ($candidates as $candidate) {
            if (!is_string($candidate) || $candidate === '') {
                continue;
            }

            if (is_dir($candidate)) {
                config([
                    'dompdf.public_path' => $candidate,
                    'dompdf.chroot' => $candidate,
                ]);
                break;
            }
        }

        // Keep this config in place for older Dompdf behavior and shared-hosting quirks.
        if (!class_exists(\Masterminds\HTML5\Parser\DOMTreeBuilder::class)) {
            config([
                'dompdf.options.enable_html5_parser' => false,
                'dompdf.options.isHtml5ParserEnabled' => false,
            ]);
        }
    }

    private function registerResilientPdfWrapper(): void
    {
        $this->app->bind('dompdf.wrapper', function ($app) {
            return new ResilientPdfWrapper(
                $app['dompdf'],
                $app['config'],
                $app['files'],
                $app['view']
            );
        });
    }
}
