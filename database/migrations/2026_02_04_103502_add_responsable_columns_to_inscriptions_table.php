<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inscriptions', function (Blueprint $table) {
            // Données du responsable
            $table->string('responsable_nom')->nullable();
            $table->string('responsable_prenom')->nullable();
            $table->string('responsable_email')->nullable();
            $table->string('responsable_tel')->nullable();
            $table->string('responsable_telephone2')->nullable();
            $table->date('responsable_date_naissance')->nullable();
            $table->enum('responsable_genre', ['M', 'F'])->nullable();
            $table->string('responsable_lien_parente')->nullable();
            $table->string('responsable_profession')->nullable();
            $table->string('responsable_fonction')->nullable();
            $table->enum('responsable_statut_marital', ['celibataire', 'marie', 'divorce', 'veuf'])->nullable();
            $table->date('responsable_date_mariage')->nullable();
            $table->string('responsable_lieu_mariage')->nullable();
            $table->date('responsable_date_divorce')->nullable();
            $table->string('responsable_lieu_divorce')->nullable();
            $table->date('responsable_date_deces')->nullable();
            $table->string('responsable_lieu_deces')->nullable();

            // Données religieuses du responsable
            $table->boolean('responsable_baptise')->default(0);
            $table->date('responsable_date_bapteme')->nullable();
            $table->string('responsable_lieu_bapteme')->nullable();
            $table->boolean('responsable_premiere_communion')->default(0);
            $table->date('responsable_date_premiere_communion')->nullable();
            $table->string('responsable_lieu_premiere_communion')->nullable();
            $table->boolean('responsable_marie_religieusement')->default(0);
            $table->date('responsable_date_mariage_religieux')->nullable();
            $table->string('responsable_lieu_mariage_religieux')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('inscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'responsable_nom',
                'responsable_prenom',
                'responsable_email',
                'responsable_tel',
                'responsable_telephone2',
                'responsable_date_naissance',
                'responsable_genre',
                'responsable_lien_parente',
                'responsable_profession',
                'responsable_fonction',
                'responsable_statut_marital',
                'responsable_date_mariage',
                'responsable_lieu_mariage',
                'responsable_date_divorce',
                'responsable_lieu_divorce',
                'responsable_date_deces',
                'responsable_lieu_deces',
                'responsable_baptise',
                'responsable_date_bapteme',
                'responsable_lieu_bapteme',
                'responsable_premiere_communion',
                'responsable_date_premiere_communion',
                'responsable_lieu_premiere_communion',
                'responsable_marie_religieusement',
                'responsable_date_mariage_religieux',
                'responsable_lieu_mariage_religieux',
            ]);
        });
    }
};
