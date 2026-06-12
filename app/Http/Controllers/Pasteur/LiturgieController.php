<?php

namespace App\Http\Controllers\Pasteur;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiquePasteurRequest;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        $annonceTypes = [
            ActeLiturgique::TYPE_ANNOUNCE,
            ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ActeLiturgique::TYPE_PRIERE,
            ActeLiturgique::TYPE_GRACE,
            ActeLiturgique::TYPE_FELICITATIONS,
            ActeLiturgique::TYPE_GENERALE,
        ];

        $actes = ActeLiturgique::with([
            'membre.family',
            'classe',
            'family',
            'historiques.acteur',
        ])
            ->where('statut', 'TRANSMISE_AU_PASTEUR')
            ->where(function ($q) {
                $q->where('est_annonce', false)
                    ->orWhereNull('est_annonce');
            })
            ->whereNotIn('type_acte', $annonceTypes)
            ->where(function ($q) {
                $q->whereNull('details->ceremonie_statut')
                    ->orWhere('details->ceremonie_statut', '<>', 'CEREMONIE_TRANSMISE_AU_PASTEUR');
            })
            ->latest()
            ->paginate(10, ['*'], 'actes_page');

        $historique = ActeLiturgiqueHistorique::with([
            'acte.membre.family',
            'acte.classe',
            'acte.family',
        ])
            ->whereHas('acte', function ($q) use ($annonceTypes) {
                $q->where(function ($sub) {
                    $sub->where('est_annonce', false)
                        ->orWhereNull('est_annonce');
                })->whereNotIn('type_acte', $annonceTypes);
            })
            ->where(function ($q) use ($user) {
                $q->where('acteur_id', $user->id)
                    ->orWhereHas('acte', function ($sub) use ($user) {
                        $sub->where('pasteur_id', $user->id);
                    });
            })
            ->whereIn('statut_nouveau', ['VALIDEE', 'REFUSEE_PAR_PASTEUR', 'CELEBRE', 'TERMINE'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $acte = $item->acte;
                return [
                    'id' => $acte?->id,
                    'type_acte' => $acte?->type_acte,
                    'membre' => $acte?->membre,
                    'classe' => $acte?->classe,
                    'classe_id' => $acte?->classe_id,
                    'family' => $acte?->family ?? $acte?->membre?->family,
                    'family_id' => $acte?->family_id ?? $acte?->membre?->family_id,
                    'reference' => $acte?->reference,
                    'date_souhaitee' => $acte?->date_souhaitee,
                    'details' => $acte?->details,
                    'statut' => $item->statut_nouveau,
                    'note_pastorale' => $item->commentaire,
                    'validated_at' => optional($item->created_at)->toISOString(),
                ];
            })
            ->values();

        $columns = ['id', 'nom', 'prenom', 'classe_id', 'genre'];
        $optionalColumns = ['date_naissance', 'lieu_naissance', 'pere', 'mere'];
        foreach ($optionalColumns as $col) {
            if (Schema::hasColumn('users', $col)) {
                $columns[] = $col;
            }
        }

        // Trouver la famille du pasteur : via son family_id ou via responsable_id
        $familyId = $user->family_id;
        if (!$familyId) {
            $famille = \App\Models\Family::where('responsable_id', $user->id)->first();
            $familyId = $famille?->id;
        }

        $familyMembers = $familyId
            ? User::query()
                ->where('family_id', $familyId)
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
                })
            : collect();

        // Load announcements from all families
        $annonces = ActeLiturgique::with([
            'createur.family',
            'family',
            'classe',
            'membre.family',
            'conducteur',
        ])
            ->annonces()
            ->where('statut', 'TRANSMISE_AU_PASTEUR')
            ->orderBy('created_at', 'desc')
            ->get();

        // Load announcement history
        $annoncesHistorique = ActeLiturgiqueHistorique::with([
            'acte.createur.family',
            'acte.family',
            'acte.classe',
            'acte.membre.family',
            'acte.conducteur',
        ])
            ->whereHas('acte', function ($q) {
                $q->annonces();
            })
            ->where('acteur_id', $user->id)
            ->whereIn('statut_nouveau', ['VALIDEE', 'REFUSEE_PAR_PASTEUR', 'PUBLIEE', 'ARCHIVEE'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $acte = $item->acte;
                return [
                    'id' => $acte?->id,
                    'type_acte' => $acte?->type_acte,
                    'type_annonce' => $acte?->type_annonce,
                    'message' => $acte?->details?->contenu ?? $acte?->message,
                    'createur' => $acte?->createur,
                    'family' => $acte?->family ?? $acte?->membre?->family ?? $acte?->createur?->family,
                    'famille' => $acte?->family ?? $acte?->membre?->family ?? $acte?->createur?->family,
                    'family_id' => $acte?->family_id ?? $acte?->membre?->family_id ?? $acte?->createur?->family_id,
                    'classe' => $acte?->classe,
                    'classe_id' => $acte?->classe_id,
                    'membre' => $acte?->membre,
                    'conducteur' => $acte?->conducteur,
                    'reference' => $acte?->reference,
                    'statut' => $item->statut_nouveau,
                    'commentaire' => $item->commentaire,
                    'validated_at' => optional($item->created_at)->toISOString(),
                ];
            })
            ->values();

        $calendarStatuses = [
            ActeLiturgique::STATUT_VALIDEE,
            ActeLiturgique::STATUT_PUBLIEE,
            ActeLiturgique::STATUT_ARCHIVEE,
            ActeLiturgique::STATUT_CELEBRE,
            ActeLiturgique::STATUT_TERMINE,
        ];

        $calendarEvents = ActeLiturgique::with(['membre', 'classe'])
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
                    'details' => $details,
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

        $mesDemandes = ActeLiturgique::with(['membre:id,prenom,nom', 'classe:id,nom'])
            ->where('created_by', $user->id)
            ->where(function ($q) use ($annonceTypes) {
                $q->where('est_annonce', false)
                  ->orWhereNull('est_annonce');
            })
            ->whereNotIn('type_acte', $annonceTypes)
            ->latest()
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'reference'     => $a->reference,
                'type_acte'     => $a->type_acte,
                'statut'        => $a->statut,
                'date_souhaitee'=> optional($a->date_souhaitee)->format('d/m/Y'),
                'created_at'    => optional($a->created_at)->format('d/m/Y'),
                'membre'        => $a->membre ? ['prenom' => $a->membre->prenom, 'nom' => $a->membre->nom] : null,
                'classe'        => $a->classe ? ['nom' => $a->classe->nom] : null,
                'can_download'  => in_array($a->statut, ['VALIDEE', 'CELEBRE', 'TERMINE']),
            ])
            ->values();

        return Inertia::render('Pasteur/Liturgie/Index', [
            'actes' => $actes,
            'historique' => $historique,
            'familyMembers' => $familyMembers,
            'annonces' => $annonces,
            'annoncesHistorique' => $annoncesHistorique,
            'calendarEvents' => $calendarEvents,
            'mesDemandes' => $mesDemandes,
        ]);
    }

    public function store(StoreActeLiturgiquePasteurRequest $request)
    {
        $user = Auth::user();
        $payload = $request->validated();

        $member = User::query()
            ->where('id', $payload['membre_id'])
            ->where('family_id', $user->family_id)
            ->firstOrFail();

        $payload['classe_id'] = $payload['classe_id'] ?? $member->classe_id;
        $payload['details'] = $payload['details'] ?? [];
        $payload['created_by'] = $user->id;
        $payload['pasteur_id'] = $user->id;
        $payload['statut'] = 'VALIDEE';

        $acte = $this->service->create($payload, $user)->load(['membre', 'classe', 'historiques.acteur']);

        return response()->json([
            'success' => true,
            'message' => 'Acte cree et valide par le pasteur.',
            'acte' => $acte,
        ]);
    }

    public function transition(TransitionActeLiturgiqueRequest $request, int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::findOrFail($id);

        $extraDetails = null;
        $statut = $request->string('statut')->toString();
        // For marriage requests, the pastor validates the dossier with VALIDEE.
        // The ceremony date itself is handled later via decisionCeremonie().

        try {
            $updated = $this->service->transitionStatut(
                $acte,
                $statut,
                $user,
                $request->input('commentaire'),
                $extraDetails
            );
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Decision pastorale enregistree.',
            'acte' => $updated,
        ]);
    }

    public function decisionCeremonie(Request $request, int $id)
    {
        $user = Auth::user();

        $payload = Validator::make($request->all(), [
            'statut' => ['required', 'in:CEREMONIE_VALIDEE_PAR_PASTEUR,CEREMONIE_REFUSEE_PAR_PASTEUR'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        if (
            $payload['statut'] === 'CEREMONIE_REFUSEE_PAR_PASTEUR'
            && empty(trim((string) ($payload['commentaire'] ?? '')))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Le motif du refus est obligatoire.',
            ], 422);
        }

        $acte = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->findOrFail($id);

        if (strtolower((string) $acte->type_acte) !== 'mariage') {
            return response()->json([
                'success' => false,
                'message' => 'Cette validation de cérémonie concerne uniquement les mariages.',
            ], 422);
        }

        $details = (array) ($acte->details ?? []);
        if (($details['ceremonie_statut'] ?? null) !== 'CEREMONIE_TRANSMISE_AU_PASTEUR') {
            return response()->json([
                'success' => false,
                'message' => 'Aucune demande de date en attente du pasteur pour ce dossier.',
            ], 422);
        }

        $details['ceremonie_statut'] = $payload['statut'];
        $details['ceremonie_commentaire_pasteur'] = $payload['commentaire'] ?? null;
        $details['ceremonie_decision_pasteur_at'] = now()->toISOString();

        if ($payload['statut'] === 'CEREMONIE_VALIDEE_PAR_PASTEUR') {
            $details['ceremonie_validee_pasteur_at'] = now()->toISOString();
        }

        $acte->update([
            'details' => $details,
            'pasteur_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => $payload['statut'] === 'CEREMONIE_VALIDEE_PAR_PASTEUR'
                ? 'La date de cérémonie a ete validée par le pasteur.'
                : 'La demande de date a ete refusee par le pasteur.',
            'acte' => $acte->fresh(['membre', 'classe', 'family', 'historiques.acteur']),
        ]);
    }

    public function certificat(int $id)
    {
        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'bureauConducteur', 'pasteur', 'historiques.acteur'])
            ->findOrFail($id);

        $typeActe = strtolower((string) $acte->type_acte);
        $typesCertificat = ['bapteme', 'mariage'];
        $typesFiche = ['naissance', 'deces'];

        // Le pasteur ne doit pas pouvoir télécharger les certificats des membres
        // de sa propre famille pour éviter tout conflit d'intérêts.
        $user = Auth::user();
        if ($user->family_id && $acte->membre && $acte->membre->family_id === $user->family_id) {
            abort(403, 'Accès interdit aux certificats de membres de votre famille.');
        }

        $details = (array) ($acte->details ?? []);
        $dateValidatedMarriage = $typeActe === 'mariage'
            && in_array($details['ceremonie_statut'] ?? null, [
                'CEREMONIE_VALIDEE_PAR_PASTEUR',
                'CEREMONIE_VALIDE_PAR_PASTEUR',
            ], true);
        $validatedByPastorStatuses = ['VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'];
        $isValidatedByPastor = in_array($acte->statut, $validatedByPastorStatuses, true) && !empty($acte->pasteur_id);

        if (in_array($typeActe, $typesFiche, true)) {
            if (!$isValidatedByPastor) {
                abort(422, "La fiche est disponible uniquement apres validation par le pasteur.");
            }
        } elseif ($typeActe === 'bapteme') {
            if (!$isValidatedByPastor) {
                abort(422, "Le certificat de baptême est disponible uniquement apres validation par le pasteur.");
            }
            $ficheSentFlag = $details['fiche_bapteme_envoyee'] ?? null;
            $isFicheSent = $ficheSentFlag === true || $ficheSentFlag === 1
                || (is_string($ficheSentFlag) && in_array(strtolower(trim($ficheSentFlag)), ['1', 'true'], true));
            if (!$isFicheSent) {
                abort(422, "Le certificat de baptême est disponible uniquement après l'envoi de la fiche liste baptêmes.");
            }
        } elseif ($typeActe === 'mariage') {
            if (!$dateValidatedMarriage) {
                abort(422, "Le certificat de mariage est disponible uniquement après validation de la date de cérémonie.");
            }
        } elseif (!$isValidatedByPastor) {
            abort(422, "Le certificat est disponible uniquement apres validation par le pasteur.");
        }

        if (in_array($typeActe, $typesFiche, true)) {
            $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
            $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));
            $conducteurSignatureDataUri = null;
            if ($acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)) {
                $conducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->conducteur->signature_path));
            }
            $bureauConducteurSignatureDataUri = null;
            if ($acte->bureauConducteur?->signature_path && Storage::disk('public')->exists($acte->bureauConducteur->signature_path)) {
                $bureauConducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->bureauConducteur->signature_path));
            }
            $pasteurSignatureDataUri = null;
            if ($acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)) {
                $pasteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->pasteur->signature_path));
            }
            $view = $typeActe === 'naissance'
                ? 'pdf.fiche-naissance'
                : ($typeActe === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande');

            try {
                $pdf = Pdf::loadView($view, [
                    'acte' => $acte,
                    'logoDataUri' => $logoDataUri,
                    'methoDataUri' => $methoDataUri,
                    'conducteurSignatureDataUri' => $conducteurSignatureDataUri,
                    'signatureBureauConducteurDataUri' => $bureauConducteurSignatureDataUri,
                    'bureauConducteurSignatureDataUri' => $bureauConducteurSignatureDataUri,
                    'pasteurSignatureDataUri' => $pasteurSignatureDataUri,
                ])->setPaper('a4', 'portrait');
            } catch (\Throwable $e) {
                Log::error('Pdf fiche generation failed', [
                    'acte_id' => $acte->id,
                    'view' => $view,
                    'type_acte' => $typeActe,
                    'error_message' => $e->getMessage(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine(),
                ]);
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'view' => $view,
                    'acte_id' => $acte->id,
                ], 500);
            }

            $filename = 'fiche-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

            return $pdf->download($filename);
        }

        if (!in_array($typeActe, $typesCertificat, true)) {
            abort(422, 'Un certificat PDF est disponible uniquement pour les actes de baptême et mariage.');
        }

        $pasteurSignature = $acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)
            ? Storage::disk('public')->path($acte->pasteur->signature_path)
            : null;
        $certificateConducteur = $this->resolveCertificateConducteur($acte);

        $conducteurSignatureDataUri = null;
        if ($certificateConducteur?->signature_path && Storage::disk('public')->exists($certificateConducteur->signature_path)) {
            $conducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($certificateConducteur->signature_path));
        }
        $pasteurSignatureDataUri = $pasteurSignature
            ? $this->buildImageDataUri($pasteurSignature)
            : null;
        $signaturePath = $pasteurSignature;
        $signatureName = trim(($acte->pasteur->prenom ?? '') . ' ' . ($acte->pasteur->nom ?? '')) ?: null;
        $signatureRole = 'Pasteur';

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
                'signaturePasteurDataUri' => $pasteurSignatureDataUri,
                'signatureConducteurDataUri' => $conducteurSignatureDataUri,
                'conducteurName' => trim(($certificateConducteur->prenom ?? '') . ' ' . ($certificateConducteur->nom ?? '')) ?: null,
                'qrDataUri' => $qrDataUri,
                'logoDataUri' => $logoDataUri,
                'scanDataUri' => $scanDataUri,
            ])->setPaper('a4', 'landscape');
        } catch (\Throwable $e) {
            Log::error('Pdf certificat generation failed', [
                'acte_id' => $acte->id,
                'view' => 'pdf.acte-liturgique-certificat',
                'type_acte' => $typeActe,
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'view' => 'pdf.acte-liturgique-certificat',
                'acte_id' => $acte->id,
            ], 500);
        }

        $filename = 'certificat-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

        return $pdf->download($filename);
    }

    public function ficheConducteur(Request $request, int $id)
    {
        $requestedIds = array_filter(array_unique(array_map('intval', explode(',', $request->query('ids', '')))));
        if (!in_array($id, $requestedIds, true)) {
            $requestedIds[] = $id;
        }

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
                ->where(function ($q) {
                    $q->where('est_annonce', false)
                        ->orWhereNull('est_annonce');
                })
                ->whereNotIn('type_acte', ActeLiturgique::ANNOUNCE_TYPES)
                ->whereIn('id', $requestedIds)
                ->get();

            if ($actes->count() !== count($requestedIds)) {
                abort(404, 'Certaines demandes de fiche sont introuvables.');
            }

            $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

            try {
                $pdf = Pdf::loadView('pdf.fiche-acte-conducteur', [
                    'actes' => $actes,
                    'logoDataUri' => $logoDataUri,
                    'generatedBy' => $actes->first()->conducteur ?? $actes->first()->classe?->conducteur,
                    'generatedAt' => $actes->first()->updated_at ?? now(),
                    'documentLabel' => 'Fiche recue du conducteur',
                ])->setPaper('a4', 'portrait');
            } catch (\Throwable $e) {
                $firstActe = $actes->first();
                Log::error('Pdf fiche-acte-conducteur generation failed', [
                    'acte_id' => $firstActe->id,
                    'view' => 'pdf.fiche-acte-conducteur',
                    'actes_count' => $actes->count(),
                    'error_message' => $e->getMessage(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine(),
                ]);
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'view' => 'pdf.fiche-acte-conducteur',
                    'acte_id' => $firstActe->id,
                ], 500);
            }

            $filename = 'fiche-conducteur-' . ($actes->first()->reference ?: ('acte-' . $actes->first()->id)) . '.pdf';

            if ($request->query('preview')) {
                return $pdf->stream($filename);
            }

            return $pdf->download($filename);
        }

        $acte = ActeLiturgique::with([
            'createur.classe',
            'createur.family',
            'family.ville',
            'classe.conducteur',
            'conducteur',
            'bureauConducteur',
            'pasteur',
            'membre.family',
            'membre.classe',
        ])
            ->where(function ($q) {
                $q->where('est_annonce', false)
                    ->orWhereNull('est_annonce');
            })
            ->whereNotIn('type_acte', ActeLiturgique::ANNOUNCE_TYPES)
            ->findOrFail($id);

        if (!in_array($acte->statut, ['TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'], true)) {
            abort(403, 'La fiche du conducteur est disponible apres transmission au pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $typeActe = strtolower((string) $acte->type_acte);
        $view = $typeActe === 'naissance' || $typeActe === 'deces'
            ? ($typeActe === 'naissance' ? 'pdf.fiche-naissance' : 'pdf.fiche-deces')
            : 'pdf.fiche-acte-conducteur';

        $bureauSig = null;
        if ($acte->bureauConducteur?->signature_path && Storage::disk('public')->exists($acte->bureauConducteur->signature_path)) {
            $bureauSig = $this->buildImageDataUri(Storage::disk('public')->path($acte->bureauConducteur->signature_path));
        }

        $pdfData = [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
            'generatedBy' => $acte->conducteur ?? $acte->classe?->conducteur,
            'generatedAt' => $acte->updated_at ?? now(),
            'documentLabel' => 'Fiche recue du conducteur',
            'signatureBureauConducteurDataUri' => $bureauSig,
            'bureauConducteurSignatureDataUri' => $bureauSig,
        ];

        if ($typeActe === 'naissance') {
            $pdfData['methoDataUri'] = $this->buildImageDataUri(public_path('images/metho.jpg'));
        }

        try {
            $pdf = Pdf::loadView($view, $pdfData)
                ->setPaper('a4', 'portrait');
        } catch (\Throwable $e) {
            Log::error('Pdf fiche-conducteur (single acte) generation failed', [
                'acte_id' => $acte->id,
                'view' => $view,
                'type_acte' => $typeActe,
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'view' => $view,
                'acte_id' => $acte->id,
            ], 500);
        }

        $filename = 'fiche-conducteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

        if ($request->query('preview')) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }

    public function fiche(Request $request, int $id)
    {
        $requestedIds = array_values(array_filter(array_map(
            'intval',
            explode(',', (string) $request->query('ids', ''))
        )));

        if (!empty($requestedIds)) {
            $actes = ActeLiturgique::with([
                'createur',
                'family',
                'conducteur',
                'pasteur',
                'membre.family',
                'membre.classe',
                'classe',
            ])
                ->where(function ($q) {
                    $q->where('est_annonce', false)
                        ->orWhereNull('est_annonce');
                })
                ->whereNotIn('type_acte', ActeLiturgique::ANNOUNCE_TYPES)
                ->where('type_acte', ActeLiturgique::TYPE_MARIAGE)
                ->whereIn('id', $requestedIds)
                ->orderBy('created_at')
                ->get();

            if ($actes->count() !== count($requestedIds)) {
                abort(404, 'Certaines demandes de mariage sont introuvables.');
            }

            $validFicheStatuses = ['TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'];
            foreach ($actes as $marriageActe) {
                if (!in_array($marriageActe->statut, $validFicheStatuses, true)) {
                    abort(403, 'La fiche finale des mariages est disponible apres transmission de la demande.');
                }
            }

            $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

            try {
                $pdf = Pdf::loadView('pdf.fiche-pasteur_mariage', [
                    'actes' => $actes,
                    'logoDataUri' => $logoDataUri,
                    'documentLabel' => 'Fiche finale des mariages',
                    'generatedAt' => now(),
                ])->setPaper('a4', 'portrait');
            } catch (\Throwable $e) {
                $firstActe = $actes->first();
                Log::error('Pdf fiche-pasteur_mariage generation failed', [
                    'acte_id' => $firstActe->id,
                    'view' => 'pdf.fiche-pasteur_mariage',
                    'actes_count' => $actes->count(),
                    'error_message' => $e->getMessage(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine(),
                ]);
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'view' => 'pdf.fiche-pasteur_mariage',
                    'acte_id' => $firstActe->id,
                ], 500);
            }

            $filename = 'fiche-pasteur-mariage-' . now()->format('Ymd-His') . '.pdf';

            if ($request->query('preview')) {
                return $pdf->stream($filename);
            }

            return $pdf->download($filename);
        }

        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'bureauConducteur', 'pasteur', 'membre', 'classe'])
            ->findOrFail($id);

        $typeActe = strtolower((string) $acte->type_acte);
        $validFicheStatuses = ['VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'];
        if (!in_array($acte->statut, $validFicheStatuses, true) || empty($acte->pasteur_id)) {
            abort(403, 'La fiche du pasteur est disponible apres validation par le pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $conducteurSignatureDataUri = null;
        if ($acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)) {
            $conducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->conducteur->signature_path));
        }
        $bureauConducteurSignatureDataUri = null;
        if ($acte->bureauConducteur?->signature_path && Storage::disk('public')->exists($acte->bureauConducteur->signature_path)) {
            $bureauConducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->bureauConducteur->signature_path));
        }
        $pasteurSignatureDataUri = null;
        if ($acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)) {
            $pasteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->pasteur->signature_path));
        }

        $view = $typeActe === 'naissance'
            ? 'pdf.fiche-naissance'
            : ($typeActe === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande');

        try {
            $pdf = Pdf::loadView($view, [
                'acte' => $acte,
                'logoDataUri' => $logoDataUri,
                'conducteurSignatureDataUri' => $conducteurSignatureDataUri,
                'signatureBureauConducteurDataUri' => $bureauConducteurSignatureDataUri,
                'bureauConducteurSignatureDataUri' => $bureauConducteurSignatureDataUri,
                'pasteurSignatureDataUri' => $pasteurSignatureDataUri,
            ])->setPaper('a4', 'portrait');
        } catch (\Throwable $e) {
            Log::error('Pdf fiche (pasteur) generation failed', [
                'acte_id' => $acte->id,
                'view' => $view,
                'type_acte' => $typeActe,
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'view' => $view,
                'acte_id' => $acte->id,
            ], 500);
        }

        $filename = 'fiche-pasteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

        if ($request->query('preview')) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
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

        $user = $request->user();

        $acteIds = array_filter(
            array_unique(array_map('intval', $payload['ids'] ?? [])),
        );

        $query = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->where('type_acte', ActeLiturgique::TYPE_MARIAGE);

        if (!empty($acteIds)) {
            $query->whereIn('id', $acteIds);
        }

        $actes = $query->get()->filter(function (ActeLiturgique $acte) {
            $details = (array) ($acte->details ?? []);
            $statut = strtoupper(trim((string) ($acte->statut ?? '')));
            $ceremonyStatut = strtoupper(trim((string) ($details['ceremonie_statut'] ?? '')));
            $ficheSentFlag = $details['fiche_pasteur_envoyee'] ?? null;

            $isFicheMarkedAsSent = false;
            if ($ficheSentFlag === true || $ficheSentFlag === 1) {
                $isFicheMarkedAsSent = true;
            } elseif (is_string($ficheSentFlag)) {
                $normalizedSentFlag = strtolower(trim($ficheSentFlag));
                $isFicheMarkedAsSent = in_array($normalizedSentFlag, ['1', 'true'], true);
            }

            $globallyEligible = in_array($statut, [
                'VALIDEE',
                'PUBLIEE',
                'ARCHIVEE',
                'CELEBRE',
                'TERMINE',
            ], true);

            $ceremonyEligible = in_array($ceremonyStatut, [
                'CEREMONIE_VALIDEE_PAR_PASTEUR',
                'CEREMONIE_VALIDE_PAR_PASTEUR',
            ], true);

            return ($globallyEligible || $ceremonyEligible)
                && !$isFicheMarkedAsSent;
        })->values();

        if ($actes->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune fiche en attente d’envoi.',
            ], 422);
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        try {
            $pdf = Pdf::loadView('pdf.fiche-pasteur_mariage', [
                'actes' => $actes,
                'logoDataUri' => $logoDataUri,
                'documentLabel' => 'Fiche finale des mariages',
                'generatedAt' => now(),
            ])->setPaper('a4', 'portrait');
        } catch (\Throwable $e) {
            Log::error('Echec generation PDF fiche finale (pasteur)', [
                'acte_ids' => $actes->pluck('id')->toArray(),
                'destinataire' => $payload['destinataire'] ?? null,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible de generer la fiche PDF pour le moment.',
            ], 500);
        }

        $filename = 'fiche-finale-mariages-pasteur-' . now()->format('Ymd-His') . '.pdf';
        $mailSubject = trim((string) ($payload['subject'] ?? '')) ?: 'Fiche finale des mariages';
        $mailMessage = trim((string) ($payload['message'] ?? ''))
            ?: "Bonjour,\n\nVeuillez trouver en piece jointe la fiche finale des mariages.\n\nBien cordialement.";

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
            Log::error('Echec envoi email fiche finale (pasteur)', [
                'acte_ids' => $actes->pluck('id')->toArray(),
                'destinataire' => $payload['destinataire'] ?? null,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'envoyer l\'email pour le moment.',
            ], 500);
        }

        $actes->each(function (ActeLiturgique $acte) use ($payload, $user) {
            $details = (array) ($acte->details ?? []);
            $details['fiche_pasteur_envoyee'] = true;
            $details['fiche_pasteur_envoyee_at'] = now()->toISOString();
            $details['fiche_pasteur_destinataire'] = $payload['destinataire'] ?? null;
            $details['fiche_pasteur_envoyee_par'] = $user->id;
            $acte->update(['details' => $details]);
        });

        $updatedActes = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->whereIn('id', $actes->pluck('id')->toArray())
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'La fiche finale a ete envoyee par email.',
            'actes' => $updatedActes,
        ]);
    }

    public function ficheBaptemeList(Request $request)
    {
        $actes = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->where('type_acte', ActeLiturgique::TYPE_BAPTEME)
            ->whereIn('statut', ['TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE'])
            ->orderBy('created_at', 'asc')
            ->get();

        if ($actes->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune demande de baptême disponible.',
            ], 422);
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        $pdf = Pdf::loadView('pdf.fiche-pasteur-bapteme', [
            'actes' => $actes,
            'logoDataUri' => $logoDataUri,
            'documentLabel' => 'Fiche finale des baptêmes',
            'generatedAt' => now(),
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('liste-baptemes-' . now()->format('Ymd') . '.pdf');
    }

    public function envoyerFicheBapteme(Request $request)
    {
        $payload = $request->validate([
            'destinataire' => ['required', 'email'],
            'subject'      => ['nullable', 'string', 'max:255'],
            'message'      => ['nullable', 'string', 'max:2000'],
            'ids'          => ['required', 'array', 'min:1'],
            'ids.*'        => ['integer'],
        ]);

        $user = $request->user();

        $acteIds = array_filter(
            array_unique(array_map('intval', $payload['ids'] ?? [])),
        );

        $actes = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->where('type_acte', ActeLiturgique::TYPE_BAPTEME)
            ->whereIn('id', $acteIds)
            ->get()
            ->filter(function (ActeLiturgique $acte) {
                $details = (array) ($acte->details ?? []);
                $ficheSentFlag = $details['fiche_bapteme_envoyee'] ?? null;

                $isSent = false;
                if ($ficheSentFlag === true || $ficheSentFlag === 1) {
                    $isSent = true;
                } elseif (is_string($ficheSentFlag)) {
                    $isSent = in_array(strtolower(trim($ficheSentFlag)), ['1', 'true'], true);
                }

                $statut = strtoupper(trim((string) ($acte->statut ?? '')));
                $eligible = in_array($statut, ['TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'], true);

                return $eligible && !$isSent;
            })->values();

        if ($actes->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune fiche de baptême en attente d\'envoi.',
            ], 422);
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        try {
            $pdf = Pdf::loadView('pdf.fiche-pasteur-bapteme', [
                'actes' => $actes,
                'logoDataUri' => $logoDataUri,
                'documentLabel' => 'Fiche finale des baptêmes',
                'generatedAt' => now(),
            ])->setPaper('a4', 'landscape');
        } catch (\Throwable $e) {
            Log::error('Echec generation PDF fiche bapteme (pasteur)', [
                'acte_ids' => $actes->pluck('id')->toArray(),
                'error'    => $e->getMessage(),
                'file'     => $e->getFile(),
                'line'     => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible de générer la fiche PDF pour le moment.',
            ], 500);
        }

        $filename     = 'fiche-finale-baptemes-pasteur-' . now()->format('Ymd-His') . '.pdf';
        $mailSubject  = trim((string) ($payload['subject'] ?? '')) ?: 'Fiche finale des baptêmes';
        $mailMessage  = trim((string) ($payload['message'] ?? ''))
            ?: "Bonjour,\n\nVeuillez trouver en pièce jointe la fiche finale des baptêmes.\n\nBien cordialement.";

        try {
            Mail::raw($mailMessage, function ($message) use ($payload, $mailSubject, $pdf, $filename) {
                $message
                    ->to($payload['destinataire'])
                    ->subject($mailSubject)
                    ->attachData($pdf->output(), $filename, ['mime' => 'application/pdf']);
            });
        } catch (\Throwable $e) {
            Log::error('Echec envoi email fiche bapteme (pasteur)', [
                'acte_ids'    => $actes->pluck('id')->toArray(),
                'destinataire' => $payload['destinataire'] ?? null,
                'error'       => $e->getMessage(),
                'file'        => $e->getFile(),
                'line'        => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'envoyer l\'email pour le moment.',
            ], 500);
        }

        $actes->each(function (ActeLiturgique $acte) use ($payload, $user) {
            $details = (array) ($acte->details ?? []);
            $details['fiche_bapteme_envoyee']       = true;
            $details['fiche_bapteme_envoyee_at']    = now()->toISOString();
            $details['fiche_bapteme_destinataire']  = $payload['destinataire'] ?? null;
            $details['fiche_bapteme_envoyee_par']   = $user->id;
            $acte->update(['details' => $details]);
        });

        $updatedActes = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->whereIn('id', $actes->pluck('id')->toArray())
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'La fiche finale des baptêmes a été envoyée par email.',
            'actes'   => $updatedActes,
        ]);
    }

    private function buildQrDataUri(string $payload): ?string
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

    public function fichePriere(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'bureauConducteur', 'pasteur', 'membre.classe', 'classe', 'historiques.acteur'])
            ->where('est_annonce', true)
            ->findOrFail($id);

        $logoDataUri   = $this->buildImageDataUri(public_path('images/logo.png'));
        $methoDataUri  = $this->buildImageDataUri(public_path('images/metho.jpg'));

        $conducteurSignatureDataUri = null;
        if ($acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)) {
            $conducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->conducteur->signature_path));
        }

        $bureauSignatureDataUri = null;
        if ($acte->bureauConducteur?->signature_path && Storage::disk('public')->exists($acte->bureauConducteur->signature_path)) {
            $bureauSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->bureauConducteur->signature_path));
        }

        $pasteurSignatureDataUri = null;
        if ($acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)) {
            $pasteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->pasteur->signature_path));
        }

        $pdf = Pdf::loadView('pdf.fiche-demande', [
            'acte'                             => $acte,
            'logoDataUri'                      => $logoDataUri,
            'methoDataUri'                     => $methoDataUri,
            'signatureConducteurDataUri'       => $conducteurSignatureDataUri,
            'signatureBureauConducteurDataUri' => $bureauSignatureDataUri,
            'signaturePasteurDataUri'          => $pasteurSignatureDataUri,
        ])->setPaper('a4', 'portrait');

        $ref = $acte->reference ?? $acte->id;
        return $pdf->download("Fiche-Priere_{$ref}.pdf");
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

    private function resolveCertificateConducteur(ActeLiturgique $acte): ?User
    {
        $firstConducteurValidator = $acte->historiques
            ->filter(function ($history) {
                $role = strtolower((string) ($history?->acteur?->role ?? ''));
                $newStatus = strtoupper((string) ($history?->statut_nouveau ?? ''));

                return $role === 'conducteur'
                    && in_array($newStatus, ['EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR'], true);
            })
            ->sortBy('created_at')
            ->first()?->acteur;

        return $firstConducteurValidator ?: $acte->conducteur;
    }
}
