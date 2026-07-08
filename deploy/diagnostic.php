<?php

/**
 * Diagnostic hébergement mutualisé — à placer dans ~/demo/diagnostic.php
 * Ouvrir : https://emjubilecocody.org/demo/diagnostic.php
 * SUPPRIMER ce fichier après résolution du problème.
 */

header('Content-Type: text/plain; charset=utf-8');

$demoRoot = __DIR__;
$laravelRoot = $demoRoot.'/classemetho';

function loadEnvFile(string $path): array
{
    if (! is_file($path)) {
        return [];
    }

    $env = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (! str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }
        $env[$key] = $value;
    }

    return $env;
}

echo "=== Diagnostic Classemetho /demo ===\n";
echo 'Date: '.date('c')."\n";
echo 'PHP: '.PHP_VERSION."\n\n";

$checks = [
    'demo/index.php' => $demoRoot.'/index.php',
    'demo/.htaccess' => $demoRoot.'/.htaccess',
    'demo/build/manifest.json' => $demoRoot.'/build/manifest.json',
    'classemetho/artisan' => $laravelRoot.'/artisan',
    'classemetho/vendor/autoload.php' => $laravelRoot.'/vendor/autoload.php',
    'classemetho/bootstrap/app.php' => $laravelRoot.'/bootstrap/app.php',
    'classemetho/.env (utilisé par Laravel)' => $laravelRoot.'/.env',
    'demo/.env (ignoré si classemetho/.env existe)' => $demoRoot.'/.env',
    'classemetho/storage/framework/sessions' => $laravelRoot.'/storage/framework/sessions',
    'classemetho/storage/logs' => $laravelRoot.'/storage/logs',
];

foreach ($checks as $label => $path) {
    $ok = file_exists($path);
    $extra = '';
    if ($ok && is_file($path)) {
        $extra = ' ('.number_format(filesize($path)).' o)';
    } elseif ($ok && is_dir($path)) {
        $extra = is_writable($path) ? ' (writable)' : ' (NOT writable)';
    }
    echo ($ok ? '[OK] ' : '[MANQUANT] ').$label.$extra."\n";
    if (! $ok) {
        echo "      → $path\n";
    }
}

$envPath = is_file($laravelRoot.'/.env') ? $laravelRoot.'/.env' : (is_file($demoRoot.'/.env') ? $demoRoot.'/.env' : null);
$env = $envPath ? loadEnvFile($envPath) : [];

if (is_file($laravelRoot.'/.env') && is_file($demoRoot.'/.env')) {
    $hashLaravel = md5_file($laravelRoot.'/.env');
    $hashDemo = md5_file($demoRoot.'/.env');
    if ($hashLaravel !== $hashDemo) {
        echo "\n[ATTENTION] demo/.env et classemetho/.env sont DIFFÉRENTS.\n";
        echo "Laravel utilise UNIQUEMENT classemetho/.env — mettez à jour celui-ci.\n";
    }
}

echo "\n--- Variables .env critiques (classemetho/.env) ---\n";
if ($envPath) {
    echo "Fichier lu : $envPath\n";
    foreach (['APP_URL', 'APP_KEY', 'APP_DEBUG', 'SESSION_DRIVER', 'CACHE_STORE', 'DB_HOST', 'DB_DATABASE', 'DB_USERNAME'] as $key) {
        $val = $env[$key] ?? '(non défini)';
        if ($key === 'APP_KEY' && $val !== '(non défini)') {
            $val = 'défini';
        }
        echo "$key = $val\n";
    }
    echo 'DB_PASSWORD = '.(isset($env['DB_PASSWORD']) && $env['DB_PASSWORD'] !== '' ? 'défini ('.strlen($env['DB_PASSWORD']).' caractères)' : 'VIDE')."\n";
} else {
    echo "[ERREUR] Aucun .env trouvé\n";
}

echo "\n--- Test MySQL direct (sans Laravel) ---\n";
if ($env) {
    $host = $env['DB_HOST'] ?? 'localhost';
    $port = $env['DB_PORT'] ?? '3306';
    $db = $env['DB_DATABASE'] ?? '';
    $user = $env['DB_USERNAME'] ?? '';
    $pass = $env['DB_PASSWORD'] ?? '';

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $tables = (int) $pdo->query('SHOW TABLES')->rowCount();
        echo "MySQL: connexion OK — {$tables} table(s) dans {$db}\n";
        if ($tables === 0) {
            echo "[ATTENTION] Base vide → importez le dump SQL ou lancez php artisan migrate --force\n";
        }
    } catch (Throwable $e) {
        echo 'MySQL: ERREUR → '.$e->getMessage()."\n";
        echo "→ Vérifiez DB_USERNAME / DB_PASSWORD dans le panneau LWS (Bases MySQL)\n";
        echo "→ Réinitialisez le mot de passe MySQL si besoin, puis mettez à jour classemetho/.env\n";
    }
}

echo "\n--- Test artisan ---\n";
if (is_file($laravelRoot.'/artisan')) {
    passthru('cd '.escapeshellarg($laravelRoot).' && php artisan --version 2>&1');
    echo "\n";
    passthru('cd '.escapeshellarg($laravelRoot).' && php artisan db:show 2>&1');
}

echo "\n--- Test bootstrap Laravel ---\n";
if (is_file($laravelRoot.'/vendor/autoload.php')) {
    try {
        require $laravelRoot.'/vendor/autoload.php';
        /** @var \Illuminate\Foundation\Application $app */
        $app = require $laravelRoot.'/bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        echo "Bootstrap OK\n";
        echo 'public_path: '.$app->publicPath()."\n";
        echo 'SESSION_DRIVER: '.config('session.driver')."\n";
        echo 'CACHE_STORE: '.config('cache.default')."\n";
        $manifest = $app->publicPath().'/build/manifest.json';
        echo 'manifest: '.(is_file($manifest) ? 'OK' : 'MANQUANT')."\n";

        echo "\n--- Simulation page d'accueil (/) ---\n";
        $httpKernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
        $request = \Illuminate\Http\Request::create('/', 'GET');
        $response = $httpKernel->handle($request);
        echo 'HTTP '.$response->getStatusCode()."\n";
        $httpKernel->terminate($request, $response);
    } catch (Throwable $e) {
        echo 'ERREUR: '.$e->getMessage()."\n";
        echo $e->getFile().':'.$e->getLine()."\n";
    }
}

echo "\n--- Dernière erreur Laravel ---\n";
$log = $laravelRoot.'/storage/logs/laravel.log';
if (is_file($log)) {
    $content = file_get_contents($log);
    if (preg_match_all('/\[(\d{4}-\d{2}-\d{2}[^\]]+)\] production\.ERROR: (.+?)(?=\n\[|\z)/s', $content, $matches, PREG_SET_ORDER)) {
        $last = end($matches);
        echo '['.$last[1]."]\n".$last[2]."\n";
    } else {
        $lines = file($log);
        echo implode('', array_slice($lines, -25));
    }
} else {
    echo "(aucun log)\n";
}

echo "\n=== Fin ===\n";
