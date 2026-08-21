<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Rappel de cotisation</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
                    <tr>
                        <td style="background-color:#4f46e5; padding:24px 32px;">
                            <h1 style="margin:0; color:#ffffff; font-size:20px;">Rappel de cotisation</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px; color:#111827; font-size:14px; line-height:1.6;">
                            <p>Bonjour <strong>{{ $user->prenom }} {{ $user->nom }}</strong>,</p>
                            @if (!empty($customMessage))
                                <p>{!! nl2br(e($customMessage)) !!}</p>
                            @else
                                <p>Nous vous rappelons qu'il vous reste des cotisations à régulariser :</p>
                            @endif

                            <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; margin:16px 0; font-size:13px;">
                                <thead>
                                    <tr style="background-color:#f3f4f6; text-align:left;">
                                        <th style="padding:8px; border-bottom:1px solid #e5e7eb;">Cotisation</th>
                                        <th style="padding:8px; border-bottom:1px solid #e5e7eb; text-align:right;">Payé</th>
                                        <th style="padding:8px; border-bottom:1px solid #e5e7eb; text-align:right;">Reste dû</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($cotisationsDues as $c)
                                    <tr>
                                        <td style="padding:8px; border-bottom:1px solid #f3f4f6;">{{ $c['nom'] }}</td>
                                        <td style="padding:8px; border-bottom:1px solid #f3f4f6; text-align:right; color:#15803d;">{{ number_format($c['paye'], 0, ',', ' ') }}</td>
                                        <td style="padding:8px; border-bottom:1px solid #f3f4f6; text-align:right; color:#dc2626;">{{ number_format($c['du'], 0, ',', ' ') }}</td>
                                    </tr>
                                    @endforeach
                                </tbody>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
                                <tr>
                                    <td width="33%" style="background-color:#ecfdf5; border-radius:8px; padding:12px; text-align:center;">
                                        <div style="color:#15803d; font-weight:bold; font-size:15px;">{{ number_format($totalPaye ?? 0, 0, ',', ' ') }} F</div>
                                        <div style="color:#15803d; font-size:11px; text-transform:uppercase;">Payé</div>
                                    </td>
                                    <td width="4"></td>
                                    <td width="33%" style="background-color:#fef3c7; border-radius:8px; padding:12px; text-align:center;">
                                        <div style="color:#92400e; font-weight:bold; font-size:15px;">{{ number_format($totalDu, 0, ',', ' ') }} F</div>
                                        <div style="color:#92400e; font-size:11px; text-transform:uppercase;">Reste dû</div>
                                    </td>
                                    <td width="4"></td>
                                    <td width="33%" style="background-color:#eef2ff; border-radius:8px; padding:12px; text-align:center;">
                                        <div style="color:#4338ca; font-weight:bold; font-size:15px;">{{ number_format($totalAttendu ?? $totalDu, 0, ',', ' ') }} F</div>
                                        <div style="color:#4338ca; font-size:11px; text-transform:uppercase;">Total</div>
                                    </td>
                                </tr>
                            </table>

                            <p>Merci de bien vouloir régulariser votre situation auprès du trésorier de votre classe dès que possible.</p>

                            <p style="margin-top:24px;">Cordialement,<br><strong>L'équipe de la classe méthodiste</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px; background-color:#f9fafb; color:#9ca3af; font-size:11px; text-align:center;">
                            Cet email a été envoyé automatiquement. Merci de ne pas répondre directement à ce message.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
