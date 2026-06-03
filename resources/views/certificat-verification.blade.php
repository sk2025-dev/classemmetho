<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Verification certificat</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
        .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; max-width: 560px; }
        .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .row { margin: 6px 0; }
        .muted { color: #6b7280; }
    </style>
</head>
<body>
    <div class="box">
        <div class="title">Verification du certificat</div>
        @if($acte)
            <div class="row"><strong>Reference:</strong> {{ $acte->reference ?? ('ACTE-' . $acte->id) }}</div>
            <div class="row"><strong>Type:</strong> {{ $acte->type_acte ?? '-' }}</div>
            <div class="row"><strong>Membre:</strong> {{ trim(($acte->membre->prenom ?? '') . ' ' . ($acte->membre->nom ?? '')) }}</div>
            <div class="row"><strong>Classe:</strong> {{ $acte->classe->nom ?? ($acte->classe_id ?? '-') }}</div>
            <div class="row"><strong>Statut:</strong> {{ $acte->statut ?? '-' }}</div>
        @else
            <div class="row muted">Aucun certificat trouve pour la reference: {{ $reference }}</div>
        @endif
    </div>
</body>
</html>
