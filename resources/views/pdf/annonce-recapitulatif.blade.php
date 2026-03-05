@php
$typeLabels = [
    'priere' => 'Demande de prière',
    'grace' => 'Action de grâce',
    'deces' => 'Avis de décès',
    'felicitations' => 'Félicitations',
    'generale' => 'Annonce générale',
    'annonce' => 'Annonce paroissiale',
    'annonce_liturgique' => 'Annonce liturgique',
];

$typeColors = [
    'priere' => '#5b3faf',
    'grace' => '#f59e0b',
    'deces' => '#6b7280',
    'felicitations' => '#ec4899',
    'generale' => '#10b981',
    'annonce' => '#0ea5e9',
    'annonce_liturgique' => '#6366f1',
];

$typeEmojis = [
    'priere' => '🙏',
    'grace' => '🙌',
    'deces' => '⚰️',
    'felicitations' => '🎉',
    'generale' => '📢',
    'annonce' => '📣',
    'annonce_liturgique' => '🕊️',
];

$typeLabel = $typeLabels[$acte->type_acte] ?? 'Annonce';
$typeColor = $typeColors[$acte->type_acte] ?? '#10b981';
$typeEmoji = $typeEmojis[$acte->type_acte] ?? '📣';

$statusLabels = [
    'SOUMISE' => 'Soumise',
    'EN_ATTENTE_CONDUCTEUR' => 'Validation conducteur',
    'TRANSMISE_AU_PASTEUR' => 'Transmise au pasteur',
    'VALIDEE' => 'Validée',
    'REFUSEE_PAR_PASTEUR' => 'Refusée',
    'PUBLIEE' => 'Publiée',
    'ARCHIVEE' => 'Archivée',
];
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fiche annonce {{ $acte->reference }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4 portrait;
            margin: 0;
        }

        body {
            font-family: 'Work Sans', 'Outfit', sans-serif;
            background: #f5f5f7;
            color: #1f2933;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 32px 40px;
            background: #fff;
            margin: 16px auto;
            border-radius: 24px;
            box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 28px;
            border-bottom: 1px solid rgba(59, 130, 246, 0.15);
        }

        .page-header .title {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.4px;
        }

        .page-header .subtitle {
            font-size: 14px;
            color: #475569;
            margin-top: 6px;
        }

        .badge-emoji {
            width: 58px;
            height: 58px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
        }

        .badge-type {
            margin-top: 12px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 700;
            color: #111827;
        }

        .badge-type .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: {{ $typeColor }};
        }

        .timeline {
            margin-top: 18px;
            display: flex;
            gap: 12px;
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.2px;
        }

        .timeline span {
            padding: 6px 14px;
            border-radius: 999px;
            background: #f0f6ff;
        }

        .content {
            padding: 32px 0;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 18px;
            margin-bottom: 28px;
        }

        .card {
            background: #fff;
            border-radius: 16px;
            padding: 18px 20px;
            border: 1px solid #ebe8e2;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
        }

        .card .label {
            font-size: 10px;
            color: #9ca3af;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            margin-bottom: 6px;
            font-weight: 600;
        }

        .card .value {
            font-size: 15px;
            font-weight: 600;
            color: #1f2933;
        }

        .message-panel {
            background: linear-gradient(180deg, rgba(239, 246, 255, 0.9), #fff);
            border-radius: 18px;
            padding: 24px;
            border: 1px dashed rgba(37, 99, 235, 0.4);
            margin-bottom: 28px;
        }

        .message-panel .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
        }

        .message-panel .header .dot {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            background: {{ $typeColor }};
            display: inline-flex;
        }

        .message-panel .header .title {
            font-size: 13px;
            color: #374151;
            font-weight: 700;
        }

        .message-panel .body {
            font-size: 14px;
            line-height: 1.8;
            color: #111827;
            white-space: pre-line;
        }

        .footer {
            border-top: 1px solid rgba(15, 23, 42, 0.1);
            padding-top: 24px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
        }

        .signatures {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            width: 100%;
        }

        .signature {
            border-top: 1px solid #d1d5db;
            padding-top: 6px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }

        .signature strong {
            display: block;
            font-size: 13px;
            color: #111827;
            margin-bottom: 4px;
        }

        .stamp {
            padding: 14px 20px;
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.4);
            text-align: center;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            color: {{ $typeColor }};
            border-style: dashed;
        }

        .stamp .text {
            font-weight: 700;
            margin-bottom: 6px;
        }

        .stamp .date {
            font-size: 10px;
            color: #475569;
        }

        .meta {
            font-size: 11px;
            color: #9ca3af;
        }
    </style>
</head>

<body>
    <div class="page">
        <div class="page-header">
            <div>
                <div class="title">{{ $typeLabel }}</div>
                <div class="subtitle">
                    Étape 3/3 · Conducteur → Pasteur → Publication
                </div>
                <div class="timeline">
                    <span>Type</span>
                    <span>Détails</span>
                    <span style="background: {{ $typeColor }}1a; color: {{ $typeColor }};">Confirmation</span>
                </div>
            </div>
            <div class="header-right">
                <div class="badge-emoji">{{ $typeEmoji }}</div>
                <div class="badge-type">
                    <span class="dot"></span>
                    {{ strtoupper($typeLabel) }}
                </div>
            </div>
        </div>

        <div class="content">
            <div class="grid-3">
                <div class="card">
                    <div class="label">Référence</div>
                    <div class="value">{{ $acte->reference }}</div>
                </div>
                <div class="card">
                    <div class="label">Statut</div>
                    <div class="value">{{ $statusLabels[$acte->statut] ?? $acte->statut }}</div>
                </div>
                <div class="card">
                    <div class="label">Conducteur</div>
                    <div class="value">
                        {{ $acte->conducteur->prenom ?? '—' }} {{ $acte->conducteur->nom ?? '' }}
                    </div>
                </div>
                <div class="card">
                    <div class="label">Famille / Membre</div>
                    <div class="value">
                        @if($acte->membre)
                            {{ $acte->membre->prenom }} {{ $acte->membre->nom }}
                        @else
                            Famille {{ $acte->family?->nom ?? '—' }}
                        @endif
                    </div>
                </div>
                <div class="card">
                    <div class="label">Date souhaitée</div>
                    <div class="value">
                        {{ optional($acte->date_souhaitee)->format('d/m/Y') ?? '—' }}
                    </div>
                </div>
                <div class="card">
                    <div class="label">Publication</div>
                    <div class="value">
                        {{ optional($acte->date_publication)->format('d/m/Y') ?? '—' }}
                    </div>
                </div>
            </div>

            <div class="message-panel">
                <div class="header">
                    <div class="dot"></div>
                    <div class="title">Message de l'annonce</div>
                </div>
                <div class="body">
                    {{ $acte->details['contenu'] ?? $acte->message ?? 'Pas de message fourni.' }}
                </div>
            </div>

            <div class="grid-3">
                <div class="card">
                    <div class="label">Demande validée</div>
                    <div class="value">
                        {{ $acte->updated_at->format('d/m/Y H:i') }}
                    </div>
                </div>
                <div class="card">
                    <div class="label">Pasteur validateur</div>
                    <div class="value">
                        {{ $acte->pasteur?->prenom ?? '—' }} {{ $acte->pasteur?->nom ?? '' }}
                    </div>
                </div>
                <div class="card">
                    <div class="label">Ville église</div>
                    <div class="value">{{ $acte->family?->ville ?? '—' }}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="signatures">
                <div class="signature">
                    <strong>Conducteur</strong>
                    <span>{{ $acte->conducteur?->prenom ?? '—' }} {{ $acte->conducteur?->nom ?? '' }}</span>
                </div>
                <div class="signature">
                    <strong>Pasteur</strong>
                    <span>{{ $acte->pasteur?->prenom ?? '—' }} {{ $acte->pasteur?->nom ?? '' }}</span>
                </div>
                <div class="signature">
                    <strong>Famille</strong>
                    <span>{{ $acte->family?->nom ?? '—' }}</span>
                </div>
            </div>
            <div>
                <div class="stamp">
                    <div class="text">Annonce validée</div>
                    <div class="date">Fiche générée le {{ now()->format('d/m/Y') }}</div>
                </div>
                <div class="meta">Généré automatiquement · Église Méthodiste</div>
            </div>
        </div>
    </div>
</body>

</html>
