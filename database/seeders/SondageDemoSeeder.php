<?php

namespace Database\Seeders;

use App\Models\Classe;
use App\Models\Sondage;
use App\Models\SondageReponse;
use App\Models\User;
use App\Services\SondageService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SondageDemoSeeder extends Seeder
{
    public function run(): void
    {
        $classe = $this->ensureClasse();
        $conducteur = $this->ensureConducteur($classe);
        $participants = $this->ensureParticipants($classe);

        $survey = $this->seedMainSurvey($classe, $conducteur, $participants);
        $this->seedSecondarySurvey($classe, $conducteur, $participants);

        $this->command->info("Seeder sondage prêt. Sondage principal ID: {$survey->id}");
    }

    private function ensureClasse(): Classe
    {
        $existingClasse = Classe::query()
            ->orderBy('id')
            ->skip(7)
            ->first();

        if ($existingClasse) {
            if (empty($existingClasse->description) || !isset($existingClasse->status)) {
                $existingClasse->update([
                    'description' => $existingClasse->description ?: 'Classe de démonstration pour les sondages',
                    'status' => $existingClasse->status ?: 'active',
                ]);
            }

            return $existingClasse;
        }

        return Classe::query()->create([
            'nom' => 'Classe Demo Sondage',
            'description' => 'Classe de démonstration pour les sondages',
            'status' => 'active',
            'nombre_membres' => 0,
        ]);
    }

    private function ensureConducteur(Classe $classe): User
    {
        $conducteur = User::query()->updateOrCreate(
            ['email' => 'conducteur.sondage@classemetho.local'],
            [
                'nom' => 'Ndiaye',
                'prenom' => 'Samuel',
                'password' => Hash::make('password'),
                'role' => 'conducteur',
                'classe_id' => $classe->id,
                'must_change_password' => false,
                'email_verified_at' => now(),
            ],
        );

        $classe->update([
            'conducteur' => $conducteur->identifier,
            'nombre_membres' => max(
                (int) $classe->nombre_membres,
                (int) User::query()->where('classe_id', $classe->id)->count(),
            ),
        ]);

        return $conducteur;
    }

    private function ensureParticipants(Classe $classe): array
    {
        $profiles = [
            ['Awa', 'Diop', 'responsable_famille', 'F', 'TRAVAILLEUR', '1974-05-12'],
            ['Fatou', 'Sarr', 'responsable_famille', 'F', 'TRAVAILLEUR', '1982-09-03'],
            ['Moussa', 'Fall', 'responsable_famille', 'M', 'TRAVAILLEUR', '1978-01-24'],
            ['Marie', 'Sow', 'responsable_famille', 'F', 'SANS_EMPLOI', '1988-07-15'],
            ['Jean', 'Faye', 'responsable_famille', 'M', 'TRAVAILLEUR', '1971-11-08'],
            ['Deborah', 'Ba', 'responsable_famille', 'F', 'TRAVAILLEUR', '1991-03-27'],
            ['Esther', 'Diallo', 'responsable_famille', 'F', 'ETUDIANT', '2003-06-19'],
            ['Ruth', 'Seck', 'membre_famille', 'F', 'ETUDIANT', '2008-02-14'],
            ['David', 'Kane', 'membre_famille', 'M', 'ETUDIANT', '2006-10-30'],
            ['Noemie', 'Lo', 'membre_famille', 'F', 'TRAVAILLEUR', '1999-12-11'],
            ['Paul', 'Gueye', 'membre_famille', 'M', 'TRAVAILLEUR', '1995-04-05'],
            ['Lydia', 'Camara', 'membre_famille', 'F', 'SANS_EMPLOI', '2001-08-22'],
            ['Aminata', 'Ndao', 'responsable_famille', 'F', 'TRAVAILLEUR', '1985-01-18'],
            ['Ibrahima', 'Sy', 'responsable_famille', 'M', 'RETRAITE', '1962-04-09'],
            ['Khady', 'Mbaye', 'responsable_famille', 'F', 'TRAVAILLEUR', '1989-06-28'],
            ['Cheikh', 'Ndour', 'responsable_famille', 'M', 'TRAVAILLEUR', '1976-12-02'],
            ['Safiatou', 'Cisse', 'responsable_famille', 'F', 'SANS_EMPLOI', '1993-09-17'],
            ['Binta', 'Tall', 'membre_famille', 'F', 'ETUDIANT', '2010-05-25'],
            ['Mamadou', 'Ndiaye', 'membre_famille', 'M', 'TRAVAILLEUR', '1997-07-07'],
            ['Aissatou', 'Dieng', 'membre_famille', 'F', 'TRAVAILLEUR', '1990-11-13'],
            ['Ousmane', 'Barry', 'membre_famille', 'M', 'SANS_EMPLOI', '2004-01-29'],
            ['Ndeye', 'Wade', 'membre_famille', 'F', 'TRAVAILLEUR', '1987-10-21'],
            ['Abdou', 'Ly', 'membre_famille', 'M', 'TRAVAILLEUR', '1994-02-16'],
            ['Mariam', 'Seye', 'membre_famille', 'F', 'RETRAITE', '1959-08-04'],
        ];

        $users = [];

        foreach ($profiles as $index => [$prenom, $nom, $role, $genre, $employmentStatus, $dateNaissance]) {
            $email = Str::of($prenom)->lower()->ascii()
                ->append('.', Str::of($nom)->lower()->ascii(), '@demo.classemetho.local')
                ->value();

            $users[] = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'password' => Hash::make('password'),
                    'genre' => $genre,
                    'date_naissance' => $dateNaissance,
                    'role' => $role,
                    'employment_status' => $employmentStatus,
                    'profession' => $employmentStatus === 'TRAVAILLEUR' ? 'Actif' : null,
                    'classe_id' => $classe->id,
                    'must_change_password' => false,
                    'email_verified_at' => now(),
                ],
            );
        }

        $classe->update([
            'nombre_membres' => (int) User::query()->where('classe_id', $classe->id)->count(),
        ]);

        return $users;
    }

    private function seedMainSurvey(Classe $classe, User $conducteur, array $participants): Sondage
    {
        $questions = [
            [
                'id' => 'q-service-global',
                'type' => 'multiple',
                'title' => 'Comment évaluez-vous notre service global ?',
                'required' => true,
                'options' => ['Excellent', 'Bon', 'Moyen', 'Insuffisant', 'Très mauvais'],
            ],
            [
                'id' => 'q-information-claire',
                'type' => 'yes_no',
                'title' => 'Les informations communiquées ont-elles été claires ?',
                'required' => true,
                'options' => ['Oui', 'Non'],
            ],
            [
                'id' => 'q-organisation',
                'type' => 'rating',
                'title' => 'Quelle note donnez-vous à l’organisation ?',
                'required' => true,
                'options' => ['1', '2', '3', '4', '5'],
            ],
            [
                'id' => 'q-points-forts',
                'type' => 'checkbox',
                'title' => 'Quels points forts retenez-vous ?',
                'required' => false,
                'options' => ['Accueil', 'Ponctualité', 'Écoute', 'Prière', 'Organisation'],
            ],
            [
                'id' => 'q-amelioration',
                'type' => 'text',
                'title' => 'Qu’aimeriez-vous améliorer pour les prochaines rencontres ?',
                'required' => false,
                'options' => [],
            ],
        ];

        $survey = Sondage::query()->updateOrCreate(
            [
                'classe_id' => $classe->id,
                'titre' => 'Satisfaction de la classe - Mars 2026',
            ],
            [
                'created_by' => $conducteur->id,
                'description' => 'Sondage de démonstration pour visualiser des statistiques réalistes côté conducteur.',
                'objectif' => 'Mesurer la satisfaction, la clarté des informations et les pistes d’amélioration.',
                'audience' => 'Tous les membres',
                'date_echeance' => Carbon::parse('2026-04-15'),
                'anonymat' => true,
                'message_fin' => 'Merci pour votre participation.',
                'diffusion' => 'Lien partage',
                'questions' => $questions,
                'statut' => 'active',
                'published_at' => Carbon::parse('2026-03-01 09:00:00'),
            ],
        );

        $mainSurveyParticipants = collect([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 21, 23,
        ])
            ->map(fn (int $index) => $participants[$index])
            ->all();

        $mainSurveyAnswers = collect($mainSurveyParticipants)
            ->values()
            ->map(fn (User $participant, int $index) => $this->buildMainSurveyAnswers($participant, $index))
            ->all();

        $this->seedResponsesForSurvey(
            $survey,
            $mainSurveyParticipants,
            $mainSurveyAnswers,
            Carbon::parse('2026-03-01 18:00:00'),
        );

        $survey->update([
            'response_count' => $survey->responses()->count(),
        ]);

        return $survey;

        $mainSurveyParticipants = [
            $participants[0],
            $participants[1],
            $participants[2],
            $participants[3],
            $participants[4],
            $participants[5],
            $participants[13],
            $participants[7],
            $participants[8],
        ];

        $this->seedResponsesForSurvey($survey, $mainSurveyParticipants, [
            ['Excellent', 'Oui', '5', ['Accueil', 'Prière', 'Organisation'], 'Continuer avec le même niveau de préparation.'],
            ['Bon', 'Oui', '4', ['Accueil', 'Écoute'], 'Prévoir un peu plus de temps pour les échanges.'],
            ['Excellent', 'Oui', '5', ['Accueil', 'Ponctualité', 'Organisation'], 'Tout était fluide et bien coordonné.'],
            ['Moyen', 'Non', '3', ['Prière'], 'Mieux annoncer les horaires en avance.'],
            ['Bon', 'Oui', '4', ['Écoute', 'Prière'], 'Ajouter davantage de rappels pendant la semaine.'],
            ['Excellent', 'Oui', '5', ['Accueil', 'Ponctualité'], 'Très bonne ambiance générale.'],
            ['Insuffisant', 'Non', '2', ['Accueil'], 'Le démarrage a été un peu confus.'],
            ['Bon', 'Oui', '4', ['Organisation', 'Écoute'], 'Plus de supports écrits serait utile.'],
            ['Excellent', 'Oui', '5', ['Accueil', 'Prière', 'Écoute'], 'Belle dynamique dans la classe.'],
        ], Carbon::parse('2026-03-01 18:00:00'));

        $survey->update([
            'response_count' => $survey->responses()->count(),
        ]);

        return $survey;
    }

    private function seedSecondarySurvey(Classe $classe, User $conducteur, array $participants): void
    {
        $questions = [
            [
                'id' => 'q-format-rencontre',
                'type' => 'multiple',
                'title' => 'Quel format de rencontre préférez-vous ?',
                'required' => true,
                'options' => ['Présentiel', 'En ligne', 'Hybride'],
            ],
            [
                'id' => 'q-disponibilite',
                'type' => 'multiple',
                'title' => 'Quel moment vous convient le mieux ?',
                'required' => true,
                'options' => ['Matin', 'Après-midi', 'Soir'],
            ],
        ];

        $survey = Sondage::query()->updateOrCreate(
            [
                'classe_id' => $classe->id,
                'titre' => 'Organisation des rencontres - Avril 2026',
            ],
            [
                'created_by' => $conducteur->id,
                'description' => 'Petit sondage complémentaire pour enrichir la liste et les statistiques.',
                'objectif' => 'Ajuster le format et les horaires des prochaines rencontres.',
                'audience' => 'Tous les membres',
                'date_echeance' => Carbon::parse('2026-04-25'),
                'anonymat' => true,
                'message_fin' => 'Merci pour votre retour.',
                'diffusion' => 'Lien partage',
                'questions' => $questions,
                'statut' => 'active',
                'published_at' => Carbon::parse('2026-04-01 08:00:00'),
            ],
        );

        $secondarySurveyParticipants = collect([
            0, 1, 3, 4, 6, 7, 8, 10, 11, 13, 16, 18, 20, 23,
        ])
            ->map(fn (int $index) => $participants[$index])
            ->all();

        $secondarySurveyAnswers = collect($secondarySurveyParticipants)
            ->values()
            ->map(fn (User $participant, int $index) => $this->buildSecondarySurveyAnswers($participant, $index))
            ->all();

        $this->seedResponsesForSurvey(
            $survey,
            $secondarySurveyParticipants,
            $secondarySurveyAnswers,
            Carbon::parse('2026-04-02 10:00:00'),
        );

        $survey->update([
            'response_count' => $survey->responses()->count(),
        ]);

        return;

        $secondarySurveyParticipants = [
            $participants[0],
            $participants[1],
            $participants[13],
            $participants[3],
            $participants[4],
            $participants[23],
        ];

        $this->seedResponsesForSurvey($survey, $secondarySurveyParticipants, [
            ['Hybride', 'Soir'],
            ['Présentiel', 'Après-midi'],
            ['Présentiel', 'Soir'],
            ['Hybride', 'Soir'],
            ['En ligne', 'Matin'],
            ['Présentiel', 'Après-midi'],
        ], Carbon::parse('2026-04-02 10:00:00'));

        $survey->update([
            'response_count' => $survey->responses()->count(),
        ]);
    }

    private function seedResponsesForSurvey(Sondage $survey, array $participants, array $answersSet, Carbon $startAt): void
    {
        $survey->loadMissing('responses');
        $service = app(SondageService::class);
        $participantKeys = collect($participants)
            ->map(fn (User $participant) => $service->makeRespondentKey($survey->id, $participant))
            ->all();

        SondageReponse::query()
            ->where('sondage_id', $survey->id)
            ->whereNotIn('respondent_key', $participantKeys)
            ->delete();

        foreach ($answersSet as $index => $answers) {
            $participant = $participants[$index];
            $submittedAt = (clone $startAt)->addDays($index * 2)->addHours($index % 4);
            $questionIds = collect($survey->questions)->pluck('id')->values();

            $payload = [];
            foreach ($questionIds as $questionIndex => $questionId) {
                $payload[$questionId] = $answers[$questionIndex] ?? null;
            }

            SondageReponse::query()->updateOrCreate(
                [
                    'sondage_id' => $survey->id,
                    'respondent_key' => $service->makeRespondentKey($survey->id, $participant),
                ],
                [
                    'respondent_profile' => $service->buildAnonymousProfileSnapshot($participant),
                    'reponses' => $payload,
                    'submitted_at' => $submittedAt,
                ],
            );
        }
    }

    private function buildMainSurveyAnswers(User $participant, int $index): array
    {
        $status = strtoupper((string) $participant->employment_status);
        $age = Carbon::parse($participant->date_naissance)->age;

        $service = match (true) {
            $status === 'RETRAITE' => $index % 2 === 0 ? 'Excellent' : 'Bon',
            $status === 'ETUDIANT' => $index % 3 === 0 ? 'Bon' : 'Excellent',
            $status === 'SANS_EMPLOI' => $index % 2 === 0 ? 'Moyen' : 'Bon',
            $age >= 45 => $index % 4 === 0 ? 'Excellent' : 'Bon',
            default => $index % 5 === 0 ? 'Moyen' : 'Bon',
        };

        $clarity = match (true) {
            $status === 'SANS_EMPLOI' && $index % 2 === 0 => 'Non',
            $status === 'ETUDIANT' && $index % 4 === 0 => 'Non',
            $service === 'Moyen' => 'Non',
            default => 'Oui',
        };

        $rating = match ($service) {
            'Excellent' => $index % 3 === 0 ? '4' : '5',
            'Bon' => $clarity === 'Oui' ? '4' : '3',
            'Moyen' => '3',
            default => '2',
        };

        $strengths = match (true) {
            $status === 'RETRAITE' => ['PriÃ¨re', 'Ã‰coute', 'Accueil'],
            $status === 'ETUDIANT' => ['Accueil', 'Ã‰coute', 'Organisation'],
            $status === 'SANS_EMPLOI' => ['PriÃ¨re', 'Accueil'],
            $age >= 45 => ['PonctualitÃ©', 'Organisation', 'PriÃ¨re'],
            default => ['Accueil', 'PonctualitÃ©', 'Organisation'],
        };

        $improvement = match (true) {
            $status === 'RETRAITE' => 'Prendre plus de temps pour les temps de priere et les echanges.',
            $status === 'ETUDIANT' => 'Partager le programme plus tot et garder un format dynamique.',
            $status === 'SANS_EMPLOI' => 'Mieux rappeler les horaires et proposer un meilleur suivi.',
            $age >= 45 => 'Continuer dans cette dynamique avec un peu plus d\'anticipation.',
            default => 'Ajouter quelques rappels en semaine et garder cette organisation.',
        };

        if ($index % 6 === 0) {
            $strengths = array_values(array_unique([...$strengths, 'Organisation']));
        }

        return [
            $service,
            $clarity,
            $rating,
            array_slice($strengths, 0, 3),
            $improvement,
        ];
    }

    private function buildSecondarySurveyAnswers(User $participant, int $index): array
    {
        $status = strtoupper((string) $participant->employment_status);
        $age = Carbon::parse($participant->date_naissance)->age;

        $format = match (true) {
            $status === 'RETRAITE' => 'PrÃ©sentiel',
            $status === 'ETUDIANT' => $index % 2 === 0 ? 'Hybride' : 'En ligne',
            $status === 'SANS_EMPLOI' => 'Hybride',
            $age >= 45 => 'PrÃ©sentiel',
            default => $index % 3 === 0 ? 'Hybride' : 'PrÃ©sentiel',
        };

        $time = match (true) {
            $status === 'RETRAITE' => 'Matin',
            $status === 'ETUDIANT' => 'Soir',
            $status === 'SANS_EMPLOI' => $index % 2 === 0 ? 'AprÃ¨s-midi' : 'Matin',
            $age >= 45 => 'AprÃ¨s-midi',
            default => $index % 2 === 0 ? 'Soir' : 'AprÃ¨s-midi',
        };

        return [$format, $time];
    }
}
