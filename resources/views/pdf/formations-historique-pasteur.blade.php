<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Historique des validations de formations</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 10px;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }

        .header h1 {
            margin: 0 0 5px 0;
            font-size: 18px;
            color: #0047ab;
        }

        .header p {
            margin: 3px 0;
            font-size: 9px;
            color: #666;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        thead {
            background-color: #0047ab;
            color: white;
            font-weight: bold;
        }

        th {
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
            font-size: 9px;
        }

        td {
            padding: 6px 8px;
            border: 1px solid #ddd;
            vertical-align: top;
        }

        tbody tr:nth-child(odd) {
            background-color: #f9f9f9;
        }

        tbody tr:hover {
            background-color: #f0f0f0;
        }

        .statut-validee {
            background-color: #d4edda;
            color: #155724;
            padding: 3px 6px;
            border-radius: 3px;
            font-weight: bold;
        }

        .statut-refusee {
            background-color: #f8d7da;
            color: #721c24;
            padding: 3px 6px;
            border-radius: 3px;
            font-weight: bold;
        }

        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 8px;
            color: #999;
        }

        .reference {
            font-weight: bold;
            color: #0047ab;
        }

        .date-cell {
            font-size: 8px;
        }

        .comment-cell {
            font-size: 8px;
            max-width: 100px;
            word-wrap: break-word;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Historique des Validations de Formations</h1>
        <p><strong>Pasteur:</strong> {{ $pasteur->prenom }} {{ $pasteur->nom }}</p>
        <p><strong>Généré le:</strong> {{ $generatedAt->format('d/m/Y à H:i') }}</p>
        <p><strong>Total formations validées/refusées:</strong> {{ $historique->count() }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 8%;">Référence</th>
                <th style="width: 12%;">Membre</th>
                <th style="width: 12%;">Famille</th>
                <th style="width: 10%;">Classe</th>
                <th style="width: 12%;">Nom du Conjoint</th>
                <th style="width: 12%;">Contact Conjoint</th>
                <th style="width: 12%;">Tél Conjoint</th>
                <th style="width: 8%;">Statut</th>
                <th style="width: 8%;">Date</th>
                <th style="width: 8%;">Commentaire</th>
            </tr>
        </thead>
        <tbody>
            @foreach($historique as $entry)
            @php
            $formation = $entry->formation;
            $membre = $formation->membre;
            $famille = $formation->family;
            $classe = $formation->classe;
            @endphp
            <tr>
                <td class="reference">{{ $formation->reference }}</td>
                <td>
                    <strong>{{ $membre->prenom ?? 'N/A' }} {{ $membre->nom ?? 'N/A' }}</strong><br />
                    <small>{{ $membre->email ?? '' }}</small>
                </td>
                <td>
                    {{ $famille->nom ?? 'N/A' }}<br />
                    <small>{{ $famille->adresse ?? '' }}</small>
                </td>
                <td>{{ $classe->nom ?? 'N/A' }}</td>
                <td>{{ $formation->conjoint_nom ?? 'N/A' }}</td>
                <td>{{ $formation->conjoint_contact ?? 'N/A' }}</td>
                <td>{{ $formation->conjoint_phone ?? 'N/A' }}</td>
                <td>
                    @if($entry->statut_nouveau === 'VALIDEE')
                    <span class="statut-validee">✓ VALIDÉE</span>
                    @else
                    <span class="statut-refusee">✗ REFUSÉE</span>
                    @endif
                </td>
                <td class="date-cell">{{ optional($entry->created_at)->format('d/m/Y') }}</td>
                <td class="comment-cell">{{ $entry->commentaire ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Ce document contient l'historique complet des validations/refus de demandes de formation.</p>
        <p>Document confidentiel - À usage interne uniquement</p>
    </div>
</body>

</html>