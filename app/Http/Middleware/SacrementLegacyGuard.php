<?php

namespace App\Http\Middleware;

use App\Models\ActeLiturgique;
use App\Services\CampagneSacrementService;
use App\Support\SacrementAccess;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Keep historic liturgy endpoints from bypassing the list workflow. */
class SacrementLegacyGuard
{
    public function handle(Request $request, Closure $next)
    {
        $route = $request->route();
        if (! $request->user() || ! $route || ! str_contains($route->uri(), 'liturgie')) {
            return $next($request);
        }
        $type = $request->input('type_acte', $request->input('type'));
        $acte = null;
        $id = $route->parameter('id');
        if (is_numeric($id)) {
            $acte = ActeLiturgique::find($id);
        }
        $batch = $request->input('ids', []);
        if (is_string($batch)) {
            $batch = explode(',', $batch);
        }
        $managedBatch = is_array($batch) && $batch !== [] && ActeLiturgique::whereIn('id', array_filter($batch, 'is_numeric'))->whereNotNull('campagne_id')->exists();
        $gated = $managedBatch || str_contains($route->uri(), '/bapteme/') || in_array($type, CampagneSacrementService::TYPES_GATED, true)
            || ($acte && in_array($acte->type_acte, CampagneSacrementService::TYPES_GATED, true));
        if (! $gated) {
            return $next($request);
        }
        abort_unless(SacrementAccess::allowed($request->user()), 403, 'Ce module est réservé au responsable de famille et aux intervenants de validation.');
        if ($acte) {
            abort_unless(SacrementAccess::reads($request->user(), $acte), 403);
        }
        if (! $request->isMethod('GET')) {
            throw ValidationException::withMessages(['workflow' => 'Utilisez le module Baptême et première communion pour cette action.']);
        }
        if (! $managedBatch && $acte && ! $acte->campagne_id) {
            return $next($request);
        } // Historic records stay readable.

        return redirect()->route('sacrements.index', $acte ? ['campagne_id' => $acte->campagne_id] : []);
    }
}
