<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 5px 5px 0 0;
        }

        .content {
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
        }

        .credentials {
            background: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
            font-family: monospace;
        }

        .label {
            font-weight: bold;
            color: #667eea;
        }

        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>✅ Inscription Acceptée</h2>
        </div>
        <div class="content">
            <p>Bonjour {{ $user->prenom }} {{ $user->nom }},</p>

            <p>Nous sommes heureux de vous confirmer que votre inscription a été acceptée!</p>

            @if (isset($classe) && $classe)
            <p><strong>Classe :</strong> {{ $classe->nom ?? $classe }}</p>
            @endif

            <p>Voici vos identifiants de connexion :</p>

            <div class="credentials">
                <p><span class="label">Identifiant :</span> {{ $identifier }}</p>
                <p><span class="label">Mot de passe :</span> {{ $password }}</p>
            </div>

            <p><strong>Lien de connexion :</strong></p>
            <p><a href="{{ url('/login') }}" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Se connecter</a></p>

            <p><strong>Veuillez :</strong></p>
            <ul>
                <li>Vous connecter avec ces identifiants</li>
                <li>Modifier votre mot de passe lors de la première connexion</li>
                <li>Conserver cet email en lieu sûr</li>
            </ul>

            <p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <strong>⚠️ Sécurité :</strong> Ne partagez jamais vos identifiants. Notre équipe ne vous les demandera jamais par email.
            </p>

            <p>Bienvenue parmi nous!<br>L'équipe ClasseMéthO Jubilé</p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Veuillez ne pas répondre à cet email.</p>
        </div>
    </div>
</body>

</html>