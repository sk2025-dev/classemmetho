<?php

/**
 * Fichier à placer sur le serveur : ~/demo/index.php
 * (racine web https://emjubilecocody.org/demo/)
 *
 * Laravel vit dans le sous-dossier classemetho/
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$laravelRoot = __DIR__.'/classemetho';

if (file_exists($maintenance = $laravelRoot.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelRoot.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $laravelRoot.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
