<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'lieu_naissance')) {
                $table->string('lieu_naissance')->nullable()->after('date_naissance');
            }
            if (!Schema::hasColumn('users', 'numero_cni')) {
                $table->string('numero_cni')->nullable()->after('lieu_naissance');
            }
            if (!Schema::hasColumn('users', 'hors_communaute')) {
                $table->boolean('hors_communaute')->default(false)->after('numero_cni');
            }
            if (!Schema::hasColumn('users', 'retrait')) {
                $table->boolean('retrait')->default(false)->after('hors_communaute');
            }
            if (!Schema::hasColumn('users', 'date_retrait')) {
                $table->date('date_retrait')->nullable()->after('retrait');
            }
            if (!Schema::hasColumn('users', 'commentaire_retrait')) {
                $table->text('commentaire_retrait')->nullable()->after('date_retrait');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'lieu_naissance',
                'numero_cni',
                'hors_communaute',
                'retrait',
                'date_retrait',
                'commentaire_retrait',
            ]);
        });
    }
};
