<html>
    <head>
        @php
            $appBasePath = parse_url((string) config('app.url'), PHP_URL_PATH) ?: '';
            $appBasePath = $appBasePath === '/' ? '' : rtrim($appBasePath, '/');
        @endphp

        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <script>
            window.__APP_BASE_PATH__ = @json($appBasePath);
        </script>

        @viteReactRefresh
        @vite('resources/js/app.jsx')
        @inertiaHead

        <!-- Google Maps API Key -->
        <script>
            window.GOOGLE_MAPS_API_KEY = '{{ config("google_maps.api_key") }}';
        </script>
    </head>
    <body>

        @inertia
    </body>
</html>
