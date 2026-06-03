<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;
use RuntimeException;

class Metho1JubileSqlImporter
{
    /**
     * Taille max des paquets MySQL pour l’import (octets). Doit rester ≤ max_allowed_packet global du serveur.
     */
    private const SESSION_MAX_ALLOWED_PACKET = 268_435_456; // 256 Mo

    /**
     * Exécute un dump phpMyAdmin complet via mysqli::multi_query (plusieurs instructions).
     *
     * @param  string|null  $connection  Nom de connexion Laravel (défaut : connexion par défaut)
     *
     * @throws RuntimeException
     */
    public static function importFromPath(string $absolutePath, ?string $connection = null): void
    {
        if (! is_readable($absolutePath)) {
            throw new RuntimeException("Fichier SQL introuvable ou illisible : {$absolutePath}");
        }

        $connection = $connection ?? (string) Config::get('database.default');
        $config = Config::get("database.connections.{$connection}");

        if (! in_array($config['driver'] ?? '', ['mysql', 'mariadb'], true)) {
            throw new RuntimeException('L\'import metho1_jubile nécessite une connexion MySQL ou MariaDB.');
        }

        if (! extension_loaded('mysqli')) {
            throw new RuntimeException('L\'extension mysqli est requise pour importer ce dump.');
        }

        $host = $config['host'] ?? '127.0.0.1';
        $port = (int) ($config['port'] ?? 3306);
        $database = $config['database'] ?? '';
        $username = $config['username'] ?? 'root';
        $password = $config['password'] ?? '';
        $socket = $config['unix_socket'] ?? '';

        $sql = file_get_contents($absolutePath);
        if ($sql === false) {
            throw new RuntimeException('Lecture du fichier SQL impossible.');
        }

        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $mysqli = mysqli_init();
        if ($mysqli === false) {
            throw new RuntimeException('mysqli_init a échoué.');
        }

        if (defined('MYSQLI_OPT_READ_TIMEOUT')) {
            $mysqli->options(MYSQLI_OPT_READ_TIMEOUT, 3600);
        }
        if (defined('MYSQLI_OPT_WRITE_TIMEOUT')) {
            $mysqli->options(MYSQLI_OPT_WRITE_TIMEOUT, 3600);
        }
        if (defined('MYSQLI_OPT_CONNECT_TIMEOUT')) {
            $mysqli->options(MYSQLI_OPT_CONNECT_TIMEOUT, 120);
        }

        if ($socket !== '' && $socket !== null) {
            $mysqli->real_connect(null, $username, $password, $database, null, $socket);
        } else {
            $mysqli->real_connect($host, $username, $password, $database, $port);
        }

        $mysqli->set_charset($config['charset'] ?? 'utf8mb4');

        $sessionPragmas = [
            'SET SESSION max_allowed_packet = '.self::SESSION_MAX_ALLOWED_PACKET,
            'SET SESSION net_read_timeout = 600',
            'SET SESSION net_write_timeout = 600',
            'SET SESSION wait_timeout = 28800',
            'SET SESSION interactive_timeout = 28800',
        ];

        foreach ($sessionPragmas as $pragma) {
            try {
                $mysqli->query($pragma);
            } catch (\mysqli_sql_exception $e) {
                // Certaines configs n’autorisent pas d’augmenter max_allowed_packet en session.
                if (! str_contains($e->getMessage(), 'max_allowed_packet')) {
                    throw $e;
                }
            }
        }

        try {
            $mysqli->multi_query($sql);
            do {
                if ($result = $mysqli->store_result()) {
                    $result->free();
                }
            } while ($mysqli->more_results() && $mysqli->next_result());
        } catch (\mysqli_sql_exception $e) {
            $hint = '';
            if ($mysqli->errno === 2006 || str_contains(strtolower($e->getMessage()), 'gone away')) {
                $hint = ' Augmentez max_allowed_packet dans my.cnf / my.ini (ex. max_allowed_packet=256M), redémarrez MySQL, puis réessayez.';
            }

            throw new RuntimeException($e->getMessage().$hint, (int) $e->getCode(), $e);
        } finally {
            $mysqli->close();
        }
    }
}
