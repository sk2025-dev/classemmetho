<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $query = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->whereIn('classe_id', $classIds)
            // ne pas mélanger les annonces dans les actes liturgiques
            ->whereNotIn('type_acte', [
                ActeLiturgique::TYPE_ANNOUNCE,
                ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ])
            ->latest();

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut')->toString());
        }

        $actes = $query->get();

        // récupérer également les annonces liées aux mêmes classes
        $annonces = ActeLiturgique::with(['createur', 'family', 'membre'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $columns = ['id', 'nom', 'prenom', 'classe_id', 'genre'];
        $optionalColumns = ['date_naissance', 'lieu_naissance', 'pere', 'mere'];
        foreach ($optionalColumns as $col) {
            if (Schema::hasColumn('users', $col)) {
                $columns[] = $col;
            }
        }

        $familyMembers = User::query()
            ->whereIn('classe_id', $classIds)
            ->with('classe', 'sacrements')
            ->select($columns)
            ->orderBy('prenom')
            ->orderBy('nom')
            ->get()
            ->map(function ($member) {
                if (!empty($member->date_naissance)) {
                    $member->date_naissance = $member->date_naissance->format('Y-m-d');
                }
                return $member;
            });

        $calendarStatuses = [
            ActeLiturgique::STATUT_VALIDEE,
            ActeLiturgique::STATUT_PUBLIEE,
            ActeLiturgique::STATUT_ARCHIVEE,
            ActeLiturgique::STATUT_CELEBRE,
            ActeLiturgique::STATUT_TERMINE,
        ];

        $calendarEvents = ActeLiturgique::with(['membre', 'classe'])
            ->whereIn('classe_id', $classIds)
            ->where('type_acte', ActeLiturgique::TYPE_MARIAGE)
            ->whereIn('statut', $calendarStatuses)
            ->whereNotNull('date_souhaitee')
            ->orderBy('date_souhaitee', 'asc')
            ->get()
            ->map(function (ActeLiturgique $acte) {
                $date = $acte->date_souhaitee;
                if (!$date) {
                    return null;
                }
                $details = (array) ($acte->details ?? []);
                return [
                    'id' => $acte->id,
                    'date' => $date->format('Y-m-d'),
                    'reference' => $acte->reference,
                    'statut' => $acte->statut,
                    'ceremonie_statut' => $details['ceremonie_statut'] ?? null,
                    'membre' => [
                        'id' => $acte->membre?->id,
                        'prenom' => $acte->membre?->prenom,
                        'nom' => $acte->membre?->nom,
                    ],
                    'classe' => [
                        'id' => $acte->classe?->id,
                        'nom' => $acte->classe?->nom,
                    ],
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('Conducteur/Liturgie/Index', [
            'actes' => $actes,
            'annonces' => $annonces,
            'familyMembers' => $familyMembers,
            'classes' => $user->getManagedClasses()->values(),
            'calendarEvents' => $calendarEvents,
        ]);
    }

    public function store(StoreActeLiturgiqueRequest $request)
    {
        $user = Auth::user();
        $payload = $request->validated();
        $payload['created_by'] = $user->id;
        $payload['conducteur_id'] = $user->id;
        $payload['statut'] = 'TRANSMISE_AU_PASTEUR';

        if (empty($payload['classe_id']) && $user->classe_id) {
            $payload['classe_id'] = $user->classe_id;
        }

        $acte = $this->service->create($payload, $user)->load(['membre', 'classe', 'historiques.acteur']);

        return response()->json([
            'success' => true,
            'message' => 'Acte créé et transmis au pasteur.',
            'acte' => $acte,
        ]);
    }

    public function transition(TransitionActeLiturgiqueRequest $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::whereIn('classe_id', $classIds)->findOrFail($id);

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

    public function decisionCeremonie(Request $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $payload = Validator::make($request->all(), [
            'statut' => ['required', 'in:CEREMONIE_TRANSMISE_AU_PASTEUR,CEREMONIE_REFUSEE_PAR_CONDUCTEUR'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        if (
            $payload['statut'] === 'CEREMONIE_REFUSEE_PAR_CONDUCTEUR'
            && empty(trim((string) ($payload['commentaire'] ?? '')))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Le motif du refus est obligatoire.',
            ], 422);
        }

        $acte = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->whereIn('classe_id', $classIds)
            ->findOrFail($id);

        if (strtolower((string) $acte->type_acte) !== 'mariage') {
            return response()->json([
                'success' => false,
                'message' => 'Cette validation de cérémonie concerne uniquement les mariages.',
            ], 422);
        }

        $details = (array) ($acte->details ?? []);
        if (($details['ceremonie_statut'] ?? null) !== 'CEREMONIE_SOUMISE_AU_CONDUCTEUR') {
            return response()->json([
                'success' => false,
                'message' => 'Aucune demande de date en attente du conducteur pour ce dossier.',
            ], 422);
        }

        $details['ceremonie_statut'] = $payload['statut'];
        $details['ceremonie_commentaire_conducteur'] = $payload['commentaire'] ?? null;
        $details['ceremonie_decision_conducteur_at'] = now()->toISOString();

        if ($payload['statut'] === 'CEREMONIE_TRANSMISE_AU_PASTEUR') {
            $details['ceremonie_transmise_pasteur_at'] = now()->toISOString();
        }

        $acte->update([
            'details' => $details,
            'conducteur_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => $payload['statut'] === 'CEREMONIE_TRANSMISE_AU_PASTEUR'
                ? 'La date choisie a ete transmise au pasteur.'
                : 'La demande de date a ete refusee.',
            'acte' => $acte->fresh(['membre', 'classe', 'historiques.acteur']),
        ]);
    }

    public function certificat(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])
            ->whereIn('classe_id', $classIds)
            ->findOrFail($id);
        $typeActe = strtolower((string) $acte->type_acte);
        $typesCertificat = ['bapteme', 'mariage'];
        $typesFiche = ['naissance', 'deces'];

        if (in_array($typeActe, $typesFiche, true)) {
            $validFicheStatuses = $typeActe === 'naissance'
                ? ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE']
                : ['VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'];

            if (!in_array($acte->statut, $validFicheStatuses, true)) {
                abort(422, "La fiche est disponible uniquement apres validation de la demande.");
            }
        } elseif (!in_array($acte->statut, ['CELEBRE', 'TERMINE'], true)) {
            abort(422, "Le certificat est disponible uniquement apres l'acte effectue.");
        }

        if (in_array($typeActe, $typesFiche, true)) {
            $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
            $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));
            $view = $typeActe === 'naissance' ? 'pdf.fiche-naissance' : 'pdf.fiche-demande';

            try {
                $pdf = Pdf::loadView($view, [
                    'acte' => $acte,
                    'logoDataUri' => $logoDataUri,
                    'methoDataUri' => $methoDataUri,
                ])->setPaper('a4', 'portrait');

                $filename = 'fiche-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

                return $pdf->download($filename);
            } catch (\Throwable $e) {
                Log::error('Echec generation fiche conducteur (certificat method)', [
                    'acte_id' => $acte->id,
                    'type_acte' => $typeActe,
                    'view' => $view,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

                return response()->json([
                    'error' => 'Erreur generation fiche',
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'view' => $view,
                    'acte_id' => $acte->id,
                ], 500);
            }
        }

        if (!in_array($typeActe, $typesCertificat, true)) {
            abort(422, 'Un certificat PDF est disponible uniquement pour les actes de baptême et mariage.');
        }

        $pasteurSignature = $acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)
            ? Storage::disk('public')->path($acte->pasteur->signature_path)
            : null;
        $conducteurSignature = $acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)
            ? Storage::disk('public')->path($acte->conducteur->signature_path)
            : null;

        $signaturePath = $pasteurSignature ?: $conducteurSignature;
        $signatureName = $pasteurSignature
            ? (trim(($acte->pasteur->prenom ?? '') . ' ' . ($acte->pasteur->nom ?? '')) ?: null)
            : (trim(($acte->conducteur->prenom ?? '') . ' ' . ($acte->conducteur->nom ?? '')) ?: null);
        $signatureRole = $pasteurSignature ? 'Pasteur Principal' : 'Conducteur';

        $qrUrl = $acte->reference
            ? url('/certificat/verification/' . $acte->reference)
            : url('/certificat/verification/' . $acte->id);
        $qrDataUri = $this->buildQrDataUri($qrUrl);
        if (empty($qrDataUri)) {
            $remote = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' . urlencode($qrUrl);
            $img = @file_get_contents($remote);
            if ($img !== false) {
                $qrDataUri = 'data:image/png;base64,' . base64_encode($img);
            } else {
                $qrDataUri = null;
            }
        }
        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $scanDataUri = $this->buildImageDataUri(public_path('images/scan.png'))
            ?? $this->buildImageDataUri(public_path('images/image.png'));

        try {
            $pdf = Pdf::loadView('pdf.acte-liturgique-certificat', [
                'acte' => $acte,
                'signaturePath' => $signaturePath,
                'signatureName' => $signatureName,
                'signatureRole' => $signatureRole,
                'qrDataUri' => $qrDataUri,
                'logoDataUri' => $logoDataUri,
                'scanDataUri' => $scanDataUri,
            ])->setPaper('a4', 'landscape');

            $filename = 'certificat-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

            return $pdf->download($filename);
        } catch (\Throwable $e) {
            Log::error('Echec generation certificat conducteur', [
                'acte_id' => $acte->id,
                'type_acte' => $typeActe,
                'view' => 'pdf.acte-liturgique-certificat',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'error' => 'Erreur generation certificat',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'view' => 'pdf.acte-liturgique-certificat',
                'acte_id' => $acte->id,
            ], 500);
        }
    }

    public function ficheConducteur(Request $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $requestedIds = array_filter(array_unique(array_map('intval', explode(',', $request->query('ids', '')))));
        if (!in_array($id, $requestedIds, true)) {
            $requestedIds[] = $id;
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));

        if (count($requestedIds) > 1) {
            $actes = ActeLiturgique::with([
                'createur.classe',
                'createur.family',
                'family.ville',
                'classe.conducteur',
                'conducteur',
                'pasteur',
                'membre.family',
                'membre.classe',
            ])
                ->whereNotIn('type_acte', [
                    ActeLiturgique::TYPE_ANNOUNCE,
                    ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
                ])
                ->whereIn('classe_id', $classIds)
                ->whereIn('id', $requestedIds)
                ->get();

            if ($actes->count() !== count($requestedIds)) {
                abort(404, 'Certaines demandes de fiche sont introuvables.');
            }

            try {
                $pdf = Pdf::loadView('pdf.fiche-acte-conducteur', [
                    'actes' => $actes,
                    'logoDataUri' => $logoDataUri,
                    'generatedBy' => $user,
                    'generatedAt' => now(),
                    'documentLabel' => 'Fiche du conducteur',
                ])->setPaper('a4', 'portrait');

                $filename = 'fiche-conducteur-' . ($actes->first()->reference ?: ('acte-' . $actes->first()->id)) . '.pdf';

                if ($request->query('preview')) {
                    return $pdf->stream($filename);
                }

                return $pdf->download($filename);
            } catch (\Throwable $e) {
                Log::error('Echec generation fiche-acte-conducteur (multi-actes)', [
                    'requested_ids' => $requestedIds,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

                return response()->json([
                    'error' => 'Erreur generation fiche conducteur',
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'view' => 'pdf.fiche-acte-conducteur',
                ], 500);
            }
        }

        $acte = ActeLiturgique::with([
            'createur.classe',
            'createur.family',
            'family.ville',
            'classe.conducteur',
            'conducteur',
            'pasteur',
            'membre.family',
            'membre.classe',
        ])
            ->whereNotIn('type_acte', [
                ActeLiturgique::TYPE_ANNOUNCE,
                ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ])
            ->whereIn('classe_id', $classIds)
            ->findOrFail($id);

        $view = $acte->type_acte === 'naissance'
            ? 'pdf.fiche-naissance'
            : ($acte->type_acte === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-acte-conducteur');

        $conducteurSignatureDataUri = null;
        if ($acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)) {
            $conducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->conducteur->signature_path));
        }
        $pasteurSignatureDataUri = null;
        if ($acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)) {
            $pasteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->pasteur->signature_path));
        }

        $pdfData = [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
            'conducteurSignatureDataUri' => $conducteurSignatureDataUri,
            'pasteurSignatureDataUri' => $pasteurSignatureDataUri,
            'generatedBy' => $user,
            'generatedAt' => now(),
            'documentLabel' => 'Fiche du conducteur',
        ];

        if ($acte->type_acte === 'naissance') {
            $pdfData['methoDataUri'] = $methoDataUri;
        }

        try {
            $pdf = Pdf::loadView($view, $pdfData)
                ->setPaper('a4', 'portrait');

            $filename = 'fiche-conducteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

            if ($request->query('preview')) {
                return $pdf->stream($filename);
            }

            return $pdf->download($filename);
        } catch (\Throwable $e) {
            Log::error('Echec generation fiche-conducteur (simple-acte)', [
                'acte_id' => $acte->id,
                'type_acte' => $acte->type_acte,
                'view' => $view,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'error' => 'Erreur generation fiche conducteur',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'view' => $view,
                'acte_id' => $acte->id,
            ], 500);
        }
    }

    public function envoyerFiche(Request $request)
    {
        $payload = $request->validate([
            'destinataire' => ['required', 'email'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:2000'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();
        $acteIds = array_filter(
            array_unique(array_map('intval', $payload['ids'] ?? [])),
        );

        if (empty($acteIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune demande valide sélectionnée.',
            ], 422);
        }

        $actes = ActeLiturgique::with([
            'createur.classe',
            'createur.family',
            'family.ville',
            'classe.conducteur',
            'conducteur',
            'pasteur',
            'membre.family',
            'membre.classe',
            'historiques.acteur',
        ])
            ->where('type_acte', ActeLiturgique::TYPE_MARIAGE)
            ->whereIn('classe_id', $classIds)
            ->whereIn('id', $acteIds)
            ->get();

        if ($actes->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune fiche de mariage trouvée pour votre classe.',
            ], 404);
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $pdf = Pdf::loadView('pdf.fiche-acte-conducteur', [
            'actes' => $actes,
            'logoDataUri' => $logoDataUri,
            'generatedBy' => $user,
            'generatedAt' => now(),
            'documentLabel' => 'Fiche finale des mariages',
        ])->setPaper('a4', 'portrait');

        $filename = 'fiche-finale-mariages-' . now()->format('Ymd-His') . '.pdf';
        $mailSubject = trim((string) ($payload['subject'] ?? '')) ?: 'Fiche finale des mariages';
        $mailMessage = trim((string) ($payload['message'] ?? ''))
            ?: "Bonjour,\n\nVeuillez trouver en pièce jointe la fiche finale des mariages.\n\nBien cordialement.";

        try {
            Mail::raw($mailMessage, function ($message) use ($payload, $mailSubject, $pdf, $filename) {
                $message
                    ->to($payload['destinataire'])
                    ->subject($mailSubject)
                    ->attachData($pdf->output(), $filename, [
                        'mime' => 'application/pdf',
                    ]);
            });
        } catch (\Throwable $e) {
            Log::error('Echec envoi fiche finale mariage (conducteur)', [
                'acte_ids' => $acteIds,
                'destinataire' => $payload['destinataire'] ?? null,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible d’envoyer l’email pour le moment.',
            ], 500);
        }

        $actes->each(function (ActeLiturgique $acte) use ($payload, $user) {
            $details = (array) ($acte->details ?? []);
            $details['fiche_conducteur_envoyee'] = true;
            $details['fiche_conducteur_envoyee_at'] = now()->toISOString();
            $details['fiche_conducteur_destinataire'] = $payload['destinataire'] ?? null;
            $details['fiche_conducteur_envoyee_par'] = $user->id;
            $acte->update(['details' => $details]);
        });

        $updatedActes = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->whereIn('id', $actes->pluck('id')->toArray())
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Fiche envoyée avec succès depuis l’application.',
            'actes' => $updatedActes,
        ]);
    }

    /**
     * Download a PDF sheet for the acte/prayer after pastor validation.
     */
    public function fiche(Request $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre', 'classe'])
            ->whereNotIn('type_acte', [
                ActeLiturgique::TYPE_ANNOUNCE,
                ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ])
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->findOrFail($id);

        // PDF disponible après transmission au pasteur ou validation
        if (!in_array($acte->statut, ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'], true)) {
            abort(403, 'La fiche PDF est disponible après transmission au pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $typeActe = strtolower((string) $acte->type_acte);
        $view = $typeActe === 'naissance'
            ? 'pdf.fiche-naissance'
            : ($typeActe === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande');

        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
                'acte' => $acte,
                'logoDataUri' => $logoDataUri,
            ])
                ->setPaper('a4', 'portrait');
        } catch (\Throwable $e) {
            Log::error('Echec generation fiche conducteur (vue principale)', [
                'acte_id' => $acte->id,
                'type_acte' => $typeActe,
                'view' => $view,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // TEMPORAIRE: retourner l'erreur directement pour debug en prod
            return response()->json([
                'error' => 'Erreur generation PDF',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'view' => $view,
                'acte_id' => $acte->id,
            ], 500);
        }

        $prefix = $acte->type_acte === 'priere' ? 'Priere' : 'Acte';
        $filename = "{$prefix}_{$acte->reference}.pdf";

        if ($request->query('preview')) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }

    private function generateQrCode(string $payload): ?string
    {
        if (!class_exists(\Endroid\QrCode\QrCode::class) || !class_exists(\Endroid\QrCode\Writer\PngWriter::class)) {
            return null;
        }

        try {
            $qr = new \Endroid\QrCode\QrCode(data: $payload);
            $writer = new \Endroid\QrCode\Writer\PngWriter();
            $result = $writer->write($qr);
            return $result->getDataUri();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function buildQrDataUri(string $payload): ?string
    {
        return $this->generateQrCode($payload);
    }

    private function buildImageDataUri(string $path): ?string
    {
        if (!file_exists($path)) {
            return null;
        }

        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        if ($data === false) {
            return null;
        }

        return 'data:image/' . $type . ';base64,' . base64_encode($data);
    }
}
