<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .credentials { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #667eea; }
        .credential-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #667eea; width: 150px; }
        .value { font-family: monospace; background: #f0f0f0; padding: 5px 10px; border-radius: 3px; flex: 1; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>✅ Votre Compte a été Créé</h2>
        </div>
        <div class="content">
            <p>Bonjour {{ $user->nom }} {{ $user->prenom }},</p>

            <p>Votre inscription a été acceptée et votre compte a été créé avec succès!</p>

            <p><strong>Voici vos informations de connexion :</strong></p>

            <div class="credentials">
                <div class="credential-row">
                    <span class="label">Code membre :</span>
                    <span class="value">{{ $user->code_membre ?? $identifier }}</span>
                </div>
                <div class="credential-row">
                    <span class="label">Mot de passe temporaire :</span>
                    <span class="value">{{ $tempPassword }}</span>
                </div>
                <div class="credential-row">
                    <span class="label">Adresse email :</span>
                    <span class="value">{{ $user->email }}</span>
                </div>
            </div>

            <p><strong>Étapes à suivre :</strong></p>
            <ol>
                <li>Accédez au formulaire de connexion</li>
                <li>Entrez votre <strong>code membre</strong> et votre <strong>mot de passe temporaire</strong></li>
                <li>Après la première connexion, vous serez invité à créer un nouveau mot de passe</li>
                <li>Utilisez ce nouveau mot de passe pour les connexions futures</li>
            </ol>

            <div class="warning">
                <strong>⚠️ Informations de Sécurité :</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Ne partagez jamais votre code membre ni votre mot de passe avec quiconque</li>
                    <li>Notre équipe ne vous demandera jamais votre code membre ou votre mot de passe par email</li>
                    <li>Changez votre mot de passe lors de la première connexion</li>
                    <li>Utilisez un mot de passe fort (au moins 8 caractères)</li>
                </ul>
            </div>

            <p>Si vous avez des questions ou des problèmes de connexion, veuillez contacter notre équipe support.</p>

            <p>Bienvenue sur ClasseMéthO Jubilé!<br>L'équipe</p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Veuillez ne pas répondre à cet email.</p>
        </div>
    </div>
</body>
</html>
