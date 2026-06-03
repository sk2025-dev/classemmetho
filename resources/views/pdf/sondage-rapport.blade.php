<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport de sondage</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 12px;
            line-height: 1.45;
        }
        h1, h2, h3 {
            margin: 0 0 8px 0;
        }
        .muted {
            color: #64748b;
        }
        .section {
            margin-top: 24px;
        }
        .grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .grid th,
        .grid td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            vertical-align: top;
            text-align: left;
        }
        .grid th {
            background: #e2e8f0;
        }
        .pill {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 999px;
            background: #e2e8f0;
            margin-right: 6px;
            margin-bottom: 6px;
        }
        .meta {
            margin-top: 6px;
        }
        .meta div {
            margin-bottom: 4px;
        }
    </style>
</head>
<body>
    @php
        $formatPercentage = fn ($value) => number_format((float) ($value ?? 0), 2, '.', '');
    @endphp
    <h1>Rapport de sondage</h1>
    <div class="muted">{{ $scopeLabel ?? 'Sondage' }} - genere le {{ optional($generatedAt)->format('d/m/Y H:i') }}</div>

    <div class="section">
        <h2>{{ $survey['titre'] ?? 'Sondage' }}</h2>
        <div class="meta">
            <div><strong>Code :</strong> {{ $survey['code'] ?? 'Non renseigne' }}</div>
            <div><strong>Classe :</strong> {{ $survey['classe'] ?? 'Non renseignee' }}</div>
            <div><strong>Createur :</strong> {{ $survey['createur'] ?? 'Non renseigne' }}</div>
            <div><strong>Cible :</strong> {{ $survey['audience'] ?? 'Non renseignee' }}</div>
            <div><strong>Statut :</strong> {{ $survey['statut'] ?? 'Non renseigne' }}</div>
            <div><strong>Date de creation :</strong> {{ !empty($survey['dateCreation']) ? \Carbon\Carbon::parse($survey['dateCreation'])->format('d/m/Y') : 'Non definie' }}</div>
            <div><strong>Date de cloture :</strong> {{ !empty($survey['dateEcheance']) ? \Carbon\Carbon::parse($survey['dateEcheance'])->format('d/m/Y') : 'Non definie' }}</div>
            <div><strong>Participants :</strong> {{ $survey['participants'] ?? 0 }}</div>
            <div><strong>Reponses :</strong> {{ $survey['reponses'] ?? 0 }}</div>
            <div><strong>Taux de participation :</strong> {{ $formatPercentage($survey['tauxParticipation'] ?? 0) }}%</div>
        </div>
        @if(!empty($survey['description']))
            <div class="section">
                <strong>Description</strong>
                <div>{{ $survey['description'] }}</div>
            </div>
        @endif
        @if(!empty($survey['objectif']))
            <div class="section">
                <strong>Objectif</strong>
                <div>{{ $survey['objectif'] }}</div>
            </div>
        @endif
    </div>

    <div class="section">
        <h2>Repartition des profils</h2>
        @foreach(($profileStats ?? []) as $profileSection)
            <h3>{{ $profileSection['title'] ?? 'Profil' }}</h3>
            <table class="grid">
                <thead>
                    <tr>
                        <th>Valeur</th>
                        <th>Nombre</th>
                        <th>Pourcentage</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse(($profileSection['items'] ?? []) as $item)
                        <tr>
                            <td>{{ $item['label'] ?? 'Non renseigne' }}</td>
                            <td>{{ $item['count'] ?? 0 }}</td>
                            <td>{{ $formatPercentage($item['percentage'] ?? 0) }}%</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="3">Aucune donnee disponible.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        @endforeach
    </div>

    <div class="section">
        <h2>Analyse par question</h2>
        @foreach(($responseStats ?? []) as $question)
            <h3>{{ $question['title'] ?? 'Question' }}</h3>
            <div class="muted">
                Type : {{ $question['type'] ?? 'Non renseigne' }} |
                Reponses enregistrees : {{ $question['answersCount'] ?? 0 }}
            </div>

            @if(($question['type'] ?? null) !== 'text' && !empty($question['optionStats']))
                <table class="grid">
                    <thead>
                        <tr>
                            <th>Option</th>
                            <th>Nombre</th>
                            <th>Pourcentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($question['optionStats'] as $option)
                            <tr>
                                <td>{{ $option['label'] ?? 'Option' }}</td>
                                <td>{{ $option['count'] ?? 0 }}</td>
                                <td>{{ $formatPercentage($option['percentage'] ?? 0) }}%</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif

            @if(($question['type'] ?? null) === 'text' && !empty($question['textAnswers']))
                <table class="grid" style="margin-top: 10px;">
                    <thead>
                        <tr>
                            <th style="width: 80px;">Id</th>
                            <th>Option</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach(collect($question['textAnswers'])->values() as $index => $textAnswer)
                            <tr>
                                <td>#{{ $index + 1 }}</td>
                                <td>{{ $textAnswer }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        @endforeach
    </div>
</body>
</html>
