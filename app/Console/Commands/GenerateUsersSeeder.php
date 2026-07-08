<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateUsersSeeder extends Command
{
    protected $signature = 'generate:users-seeder {--chunk=200 : Nombre d\'entrées par bloc}';
    protected $description = 'Génère un fichier seeder à partir des utilisateurs existants en base';

    public function handle(): int
    {
        $chunk  = (int) $this->option('chunk');
        $total  = DB::table('users')->count();
        $output = database_path('seeders/UsersTableSeeder.php');

        $this->info("Génération du seeder pour {$total} utilisateurs (chunks de {$chunk})...");

        $header = <<<'PHP'
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('users')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

PHP;

        file_put_contents($output, $header);

        $bar = $this->output->createProgressBar((int) ceil($total / $chunk));
        $bar->start();

        DB::table('users')->orderBy('id')->chunk($chunk, function ($users) use ($output, $bar) {
            $rows = $users->map(function ($user) {
                return $this->toPhpArray((array) $user);
            })->implode(",\n            ");

            $block = "\n        DB::table('users')->insert([\n            {$rows},\n        ]);\n";
            file_put_contents($output, $block, FILE_APPEND);
            $bar->advance();
        });

        file_put_contents($output, "\n    }\n}\n", FILE_APPEND);

        $bar->finish();
        $this->newLine();
        $this->info("Seeder généré : {$output}");

        return self::SUCCESS;
    }

    private function toPhpArray(array $row): string
    {
        $pairs = [];
        foreach ($row as $key => $value) {
            $k = var_export($key, true);
            if ($value === null) {
                $v = 'null';
            } elseif (is_bool($value)) {
                $v = $value ? 'true' : 'false';
            } elseif (is_int($value) || is_float($value)) {
                $v = (string) $value;
            } else {
                $v = var_export((string) $value, true);
            }
            $pairs[] = "{$k} => {$v}";
        }

        return '[' . implode(', ', $pairs) . ']';
    }
}
