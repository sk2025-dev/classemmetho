<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Fiche Formations Validées</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #111827;
            font-size: 12px;
            margin: 0;
            padding: 20px;
        }

        .header {
            border-bottom: 2px solid #1f2937;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
        }

        .header-table td {
            border: none;
            vertical-align: top;
            padding: 0;
        }

        .logo-cell {
            width: 72px;
            text-align: center;
        }

        .logo {
            width: 62px;
            height: 62px;
            object-fit: contain;
        }

        .header-content {
            padding: 0 10px;
        }

        .title {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px;
        }

        .meta {
            color: #4b5563;
            font-size: 11px;
            margin: 2px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #d1d5db;
            padding: 7px 6px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #f3f4f6;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
        }

        .small {
            font-size: 10px;
            color: #4b5563;
        }

        .footer {
            margin-top: 16px;
            font-size: 11px;
            color: #374151;
        }
    </style>
</head>

<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if(file_exists(public_path('images/metho.jpg')))
                    <img src="{{ public_path('images/metho.jpg') }}" alt="Logo METHO" class="logo">
                    @endif
                </td>
                <td class="header-content">
                    <h1 class="title">Fiche des demandes de formation validées</h1>
                    <div class="meta">Destination: Secretariat</div>
                    <div class="meta">Générée le: {{ $generatedAt->format('d/m/Y H:i') }}</div>
                    <div class="meta">Pasteur: {{ trim(($pasteur->prenom ?? '') . ' ' . ($pasteur->nom ?? '')) ?: 'N/A' }}</div>
                    <div class="meta">Nombre total de membres: {{ $formations->count() }}</div>
                </td>
                <td class="logo-cell">
                    @if(file_exists(public_path('images/logo.png')))
                    <img src="{{ public_path('images/logo.png') }}" alt="Logo Eglise" class="logo">
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Membre</th>
                <th>Famille</th>
                <th>Classe</th>
                <th>Contact conjoint</th>
                <th>Date demande</th>
                <th>Message</th>
            </tr>
        </thead>
        <tbody>
            @foreach($formations as $index => $formation)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>
                    {{ trim(($formation->membre->prenom ?? '') . ' ' . ($formation->membre->nom ?? '')) ?: '-' }}
                    <div class="small">ID: {{ $formation->membre_id }}</div>
                </td>
                <td>{{ $formation->family->nom ?? '-' }}</td>
                <td>{{ $formation->classe->nom ?? '-' }}</td>
                <td>{{ $formation->conjoint_contact ?: '-' }}</td>
                <td>{{ optional($formation->created_at)->format('d/m/Y') ?: '-' }}</td>
                <td>{{ $formation->message ?: '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Cette fiche regroupe tous les membres ayant une demande de formation validée et peut être déposée au secrétariat.
    </div>
</body>

</html>