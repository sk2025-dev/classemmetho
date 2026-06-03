<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Documentation API - {{ config('app.name') }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: white;
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .back-link {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .back-link:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }

        .container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .docs-frame {
            width: 100%;
            height: calc(100vh - 120px);
            border: none;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            background: white;
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: calc(100vh - 120px);
            background: white;
            border-radius: 1rem;
            color: #6b7280;
            font-size: 1.1rem;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .header {
                padding: 1rem;
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }

            .container {
                padding: 1rem;
            }

            .docs-frame {
                height: calc(100vh - 140px);
                border-radius: 0.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Documentation API - {{ config('app.name') }}</h1>
        <a href="{{ url('/') }}" class="back-link">← Retour à l'accueil</a>
    </div>

    <div class="container">
        <div class="loading" id="loading">
            <div class="loading-spinner"></div>
            Chargement de la documentation...
        </div>
        <iframe
            src="{{ url('/docs/api') }}"
            class="docs-frame"
            id="docs-frame"
            style="display: none;"
            onload="hideLoading()"
        ></iframe>
    </div>

    <script>
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('docs-frame').style.display = 'block';
        }

        // Auto-resize iframe if needed
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'resize') {
                const iframe = document.getElementById('docs-frame');
                if (iframe && event.data.height) {
                    iframe.style.height = event.data.height + 'px';
                }
            }
        });
    </script>
</body>
</html>
