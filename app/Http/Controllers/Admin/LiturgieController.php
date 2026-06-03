<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\UpdateActeLiturgiqueAdminRequest;
use App\Models\ActeLiturgique;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service)
    {
    }

    public function index(Request $request)
    {
        $query = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur', 'historiques.acteur'])
            ->latest();

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut')->toString());
        }

        if ($request->filled('type_acte')) {
            $query->where('type_acte', $request->string('type_acte')->toString());
        }

        $actes = $query->get();

        return Inertia::render('Admin/Liturgie/Index', [
            'actes' => $actes,
        ]);
    }

    public function store(StoreActeLiturgiqueRequest $request)
    {
        $user = Auth::user();
        $payload = $request->validated();
        $payload['created_by'] = $user->id;
        $payload['statut'] = $payload['statut'] ?? 'SOUMISE';

        $acte = $this->service->create($payload, $user);

        return response()->json([
            'success' => true,
            'message' => 'Acte liturgique créé.',
            'acte' => $acte,
        ]);
    }

    public function update(UpdateActeLiturgiqueAdminRequest $request, int $id)
    {
        $acte = ActeLiturgique::findOrFail($id);
        $acte->fill($request->validated());
        $acte->save();

        return response()->json([
            'success' => true,
            'message' => 'Acte liturgique mis à jour.',
            'acte' => $acte->fresh(),
        ]);
    }

    public function transition(TransitionActeLiturgiqueRequest $request, int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::findOrFail($id);

        $updated = $this->service->transitionStatut(
            $acte,
            $request->string('statut')->toString(),
            $user,
            $request->input('commentaire')
        );

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour.',
            'acte' => $updated,
        ]);
    }

    public function destroy(int $id)
    {
        $acte = ActeLiturgique::findOrFail($id);
        $acte->delete();

        return response()->json([
            'success' => true,
            'message' => 'Acte liturgique archivé (soft delete).',
        ]);
    }
}
