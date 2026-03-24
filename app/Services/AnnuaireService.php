<?php

namespace App\Services;

use App\Models\User;
use App\Models\Family;
use App\Models\Classe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Exports\AnnuaireExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Schema;

class AnnuaireService
{
    public function getAnnuaireData(Request $request, string $roleScope = 'admin'): array
    {
        $query = $this->buildAnnuaireQuery($request, $roleScope);

        $data = $query->paginate(25);

        return [
            'data' => $data,
            'stats' => $this->getStats($request, $roleScope),
            'classes' => Classe::where('status', 'active')->get(['id', 'nom']),
            'roles' => User::where('role', '!=', 'admin')->distinct()->pluck('role')->filter(),
        ];
    }

    protected function buildAnnuaireQuery(Request $request, string $roleScope)
    {
        $usersColumns = Schema::getColumnListing('users');
        $hasStatus = in_array('status', $usersColumns, true);
        $hasIsActive = in_array('is_active', $usersColumns, true);
        $identifierColumn = in_array('identifiant', $usersColumns, true)
            ? 'identifiant'
            : (in_array('identifier', $usersColumns, true) ? 'identifier' : null);

        $selectColumns = [
            'id',
            'prenom',
            'nom',
            'email',
            'telephone',
            'telephone2',
            'genre',
            'date_naissance',
            'profession',
            'role',
            'fonction_id',
            'classe_id',
            'family_id',
            'created_at',
            'updated_at',
            'code_membre',
            'profile_photo_url',
        ];

        if ($identifierColumn) {
            $selectColumns[] = $identifierColumn;
        }
        if ($hasStatus) {
            $selectColumns[] = 'status';
        }
        if ($hasIsActive) {
            $selectColumns[] = 'is_active';
        }

        $query = User::with(['classe', 'fonction', 'family'])
            ->select($selectColumns)
            ->where('role', '!=', 'admin');

        // Scope par rôle
        $authUserId = Auth::id();

        switch ($roleScope) {
            case 'conducteur':
                if ($authUserId !== null) {
                    $query->whereHas('classe.conducteur', fn($q) => $q->where('id', $authUserId));
                }
                break;
            case 'responsable_famille':
                if ($authUserId !== null) {
                    $query->whereHas('family', fn($q) => $q->where('responsable_id', $authUserId));
                }
                break;
        }

        // Filtres
        if ($search = $request->get('search')) {
            $query->where(
                fn($q) => $q
                    ->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telephone', 'like', "%{$search}%")
                    ->when(
                        $identifierColumn,
                        fn($inner) => $inner->orWhere($identifierColumn, 'like', "%{$search}%")
                    )
            );
        }

        if ($request->filled('classe')) {
            $query->where('classe_id', $request->classe);
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('statut')) {
            if ($hasIsActive) {
                $query->where('is_active', $request->boolean('statut'));
            } elseif ($hasStatus) {
                $query->where('status', $request->boolean('statut') ? 'active' : 'inactive');
            }
        }

        $query->orderBy('nom')
            ->orderBy('prenom')
            ->latest();

        return $query;
    }

    public function search(array $filters, string $roleScope): array
    {
        $query = $this->buildAnnuaireQuery(request()->merge($filters), $roleScope);

        $data = $query->paginate(25)->through(fn($user) => $this->formatUser($user));

        return [
            'data' => $data,
            'stats' => $this->getStats(request()->merge($filters), $roleScope),
            'pagination' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ]
        ];
    }

    public function getStats(Request $request, string $roleScope): array
    {
        $usersColumns = Schema::getColumnListing('users');
        $hasStatus = in_array('status', $usersColumns, true);
        $hasIsActive = in_array('is_active', $usersColumns, true);

        $stats = [
            'total_users' => User::count(),
            'active_users' => $hasIsActive
                ? User::where('is_active', true)->count()
                : ($hasStatus ? User::where('status', 'active')->count() : User::count()),
            'classes_count' => Classe::where('status', 'active')->count(),
            'families_count' => Family::count(),
        ];

        // Par rôle
        $stats['by_role'] = User::selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role');

        return $stats;
    }

    protected function formatUser(User $user): array
    {
        $isActive = isset($user->is_active)
            ? (bool) $user->is_active
            : ((isset($user->status) && $user->status === 'active') ? true : null);

        return [
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'full_name' => trim("{$user->prenom} {$user->nom}"),
            'email' => $user->email,
            'telephone' => $user->telephone,
            'role' => $user->role,
            'is_active' => $isActive,
            'classe' => $user->classe?->nom,
            'fonction' => $user->fonction?->nom,
            'family_code' => $user->family?->code_famille,
            'profile_photo_url' => $user->profile_photo_url,
            'created_at_formatted' => $user->created_at?->format('d/m/Y'),
        ];
    }

    public function exportData(array $filters, string $roleScope)
    {
        $query = $this->buildAnnuaireQuery(request()->merge($filters), $roleScope);
        $users = $query->get();

        return $users->map(fn($user) => $this->formatUser($user))->toArray();
    }

    public function generateExcel($data)
    {
        return app('excel')->download(new AnnuaireExport($data), 'annuaire-paroisse.xlsx');
    }

    public function generatePDF($data)
    {
        $pdf = Pdf::loadView('exports.annuaire-pdf', ['data' => $data]);
        return $pdf->download('annuaire-paroisse.pdf');
    }
}
