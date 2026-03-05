<?php

namespace App\Providers;

use App\Models\ActeLiturgique;
use App\Models\Classe;
use App\Models\Family;

use App\Models\Inscription;
use App\Models\LoginHistory;
use App\Models\Notification;
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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Enregistrer l'observer pour tracer les modifications
        User::observe(AuditObserver::class);
        Classe::observe(AuditObserver::class);
        Family::observe(AuditObserver::class);
        Inscription::observe(AuditObserver::class);
        Notification::observe(AuditObserver::class);
        LoginHistory::observe(AuditObserver::class);

        // Configuration Inertia pour le loading screen et les performances
        Inertia::version(fn () => md5_file(public_path('build/manifest.json')));

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

                if ($user->family_id) {
                    $query->where(function ($q) use ($user) {
                        $q->where('family_id', $user->family_id)
                            ->orWhereNull('family_id');
                    });
                } else {
                    $query->whereNull('family_id');
                }

                return $query
                    ->limit(5)
                    ->get([
                        'id',
                        'type_acte',
                        'details',
                        'date_publication',
                        'family_id',
                        'est_principale',
                    ]);
            },
        ]);
    }
}
