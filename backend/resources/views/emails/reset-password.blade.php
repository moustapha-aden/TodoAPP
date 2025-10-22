<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nouveau mot de passe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .password-box {
            background-color: #e5e7eb;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            border: 2px solid #4F46E5;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TodoApp</h1>
        <h2>Nouveau mot de passe</h2>
    </div>

    <div class="content">
        <p>Bonjour {{ $userName }},</p>

        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte TodoApp.</p>

        <p>Votre nouveau mot de passe temporaire est :</p>

        <div class="password-box">
            {{ $newPassword }}
        </div>

        <div class="warning">
            <p><strong>⚠️ Important :</strong></p>
            <ul>
                <li>Ce mot de passe temporaire expire dans 24 heures</li>
                <li>Connectez-vous immédiatement avec ce mot de passe</li>
                <li>Changez-le dès que possible dans les paramètres de votre profil</li>
                <li>Ne partagez jamais ce mot de passe avec qui que ce soit</li>
            </ul>
        </div>

        <p><strong>Instructions :</strong></p>
        <ol>
            <li>Ouvrez l'application TodoApp</li>
            <li>Connectez-vous avec votre email et le mot de passe ci-dessus</li>
            <li>Allez dans votre profil</li>
            <li>Modifiez votre mot de passe pour en choisir un nouveau</li>
        </ol>

        <p>Si vous n'avez pas demandé cette réinitialisation, contactez immédiatement le support.</p>

        <p>Cordialement,<br>L'équipe TodoApp</p>
    </div>

    <div class="footer">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
</body>
</html>
