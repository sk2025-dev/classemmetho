@php
    use Carbon\Carbon;

    /** @var array $programmeEvenements  Lignes { date_debut, date_fin, heure, heure_fin, libelle, lieu } */
    $programmeEvenements = $programmeEvenements ?? [];
    $programmeClos = ($programmeClos ?? false) === true;
    $avecTitre = $avecTitre ?? true;
    $avecFallback = $avecFallback ?? false;

    $fmtDate = function ($iso) {
        if (empty($iso)) {
            return '';
        }
        try {
            return Carbon::parse($iso)->locale('fr')->isoFormat('D MMMM YYYY');
        } catch (\Throwable $e) {
            return (string) $iso;
        }
    };
    $fmtHeure = function ($h) {
        if (empty($h)) {
            return '';
        }
        try {
            return Carbon::createFromFormat('H:i', substr((string) $h, 0, 5))->format('H\hi');
        } catch (\Throwable $e) {
            return (string) $h;
        }
    };

    $titreProgramme = 'PROGRAMME DES OBSÈQUES' . ($programmeClos ? '' : ' (provisoire)');

    $lignesProgramme = [];
    foreach ($programmeEvenements as $ev) {
        $d1 = $fmtDate($ev['date_debut'] ?? null);
        $d2 = !empty($ev['date_fin']) && (($ev['date_fin'] ?? null) !== ($ev['date_debut'] ?? null))
            ? $fmtDate($ev['date_fin'])
            : null;
        $hd = $fmtHeure($ev['heure'] ?? null);
        $hf = $fmtHeure($ev['heure_fin'] ?? null);
        $lignesProgramme[] = [
            'date' => $d2 ? ('du ' . $d1 . ' au ' . $d2) : $d1,
            'heure' => $hd && $hf ? ($hd . ' - ' . $hf) : ($hd !== '' ? $hd : '-'),
            'libelle' => $ev['libelle'] ?? '',
            'lieu' => $ev['lieu'] ?? '-',
        ];
    }
@endphp

@if(count($lignesProgramme))
    <div class="notice-block" style="margin-top:8px">
        @if($avecTitre)
            <p class="notice-paragraph" style="font-weight:700;margin-bottom:6px">{{ $titreProgramme }}</p>
        @endif
        <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
                <tr>
                    <th style="text-align:left;border-bottom:1px solid #999;padding:5px 6px">Date</th>
                    <th style="text-align:left;border-bottom:1px solid #999;padding:5px 6px">Heure</th>
                    <th style="text-align:left;border-bottom:1px solid #999;padding:5px 6px">Désignation</th>
                    <th style="text-align:left;border-bottom:1px solid #999;padding:5px 6px">Lieu</th>
                </tr>
            </thead>
            <tbody>
                @foreach($lignesProgramme as $ligne)
                    <tr>
                        <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5">{{ $ligne['date'] }}</td>
                        <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5">{{ $ligne['heure'] }}</td>
                        <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5">{{ $ligne['libelle'] }}</td>
                        <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5">{{ $ligne['lieu'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        @if(!$programmeClos)
            <p style="margin-top:7px;font-style:italic;font-size:10px;color:#6b7280">
                Programme provisoire, susceptible d'être modifié.
            </p>
        @endif
    </div>
@elseif($avecFallback)
    <p class="notice-paragraph">Le programme des obsèques sera communiqué ultérieurement.</p>
@endif
