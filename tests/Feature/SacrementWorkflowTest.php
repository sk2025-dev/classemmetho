<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureDataConsentValidated;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\ActeLiturgique;
use App\Models\CampagneSacrement;
use App\Models\ListeSacrement;
use App\Models\User;
use App\Models\UserSacrement;
use App\Services\ActeLiturgiqueService;
use App\Services\CampagneSacrementService;
use App\Services\SacrementWorkflowService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Isolated schema: historical project migrations include MySQL-only data repairs. */
class SacrementWorkflowTest extends TestCase
{
    private SacrementWorkflowService $workflow;

    private User $family;

    private User $member;

    private User $conductor;

    private User $bureau;

    private User $pastor;

    private User $admin;

    private CampagneSacrement $campaign;

    protected function setUp(): void
    {
        parent::setUp();
        \Inertia\Inertia::version('sacrements-test');
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->assertSame('sqlite', DB::connection()->getDriverName());
        $this->withoutMiddleware([EnsureDataConsentValidated::class, HandleInertiaRequests::class]);
        $this->travelTo(now()->setDate(2026, 9, 21)->setTime(12, 0));
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            foreach (['nom', 'prenom', 'role', 'email', 'telephone', 'telephone2', 'password', 'remember_token'] as $col) {
                $t->string($col)->nullable();
            }
            foreach (['family_id', 'classe_id', 'fonction_id'] as $col) {
                $t->unsignedBigInteger($col)->nullable();
            }
            $t->boolean('is_family_responsible')->default(false);
            $t->timestamps();
            $t->softDeletes();
        });
        Schema::create('classes', function (Blueprint $t) {
            $t->id();
            $t->string('nom');
            $t->timestamps();
        });
        Schema::create('families', function (Blueprint $t) {
            $t->id();
            $t->string('nom');
            $t->string('code_famille');
            $t->unsignedBigInteger('classe_id');
            $t->timestamps();
            $t->softDeletes();
        });
        Schema::create('actes_liturgiques', function (Blueprint $t) {
            $t->id();
            $t->string('reference')->unique();
            $t->string('type_acte');
            $t->string('statut');
            foreach (['membre_id', 'family_id', 'classe_id', 'conducteur_id', 'bureau_conducteur_id', 'pasteur_id', 'created_by'] as $col) {
                $t->unsignedBigInteger($col)->nullable();
            }
            foreach (['note_conducteur', 'note_pastorale', 'note_admin'] as $col) {
                $t->text($col)->nullable();
            }
            $t->json('details')->nullable();
            $t->timestamps();
            $t->softDeletes();
        });
        (require database_path('migrations/2026_09_19_120000_create_campagnes_sacrements_table.php'))->up();
        (require database_path('migrations/2026_09_21_120000_add_sacrement_workflow.php'))->up();
        (require database_path('migrations/2026_02_23_100001_create_actes_liturgiques_historiques_table.php'))->up();
        (require database_path('migrations/2026_02_23_100002_create_actes_liturgiques_pieces_jointes_table.php'))->up();
        Schema::create('notifications', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id');
            foreach (['channel', 'to', 'subject', 'body'] as $col) {
                $t->string($col);
            } $t->json('data');
            $t->timestamp('sent_at');
            $t->timestamps();
            $t->softDeletes();
        });
        Schema::create('user_sacrements', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->unique();
            $t->boolean('baptise')->default(false);
            $t->boolean('premiere_communion')->default(false);
            foreach (['bapteme', 'premiere_communion'] as $s) {
                $t->date($s.'_date')->nullable();
                $t->string($s.'_lieu')->nullable();
            } $t->timestamps();
        });
        Schema::create('fimeco_souscriptions', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('family_id');
            $t->unsignedBigInteger('classe_id')->nullable();
            $t->integer('annee');
            $t->integer('montant_souscrit');
        });
        Schema::create('cotisations', function (Blueprint $t) {
            $t->id();
            $t->string('nom');
            $t->unsignedBigInteger('classe_id')->nullable();
        });
        Schema::create('paiements', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('family_id');
            $t->unsignedBigInteger('cotisation_id');
            $t->integer('year');
            $t->integer('montant');
        });
        Schema::create('special_events', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('class_id');
            $t->boolean('is_parish');
            $t->date('start_date');
            $t->string('statut_realisation');
        });
        Schema::create('presences', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('membre_famille_id');
            $t->unsignedBigInteger('special_event_id');
            $t->string('statut');
            $t->boolean('justifiee')->default(false);
        });
        DB::table('classes')->insert([['id' => 1, 'nom' => 'Classe A'], ['id' => 2, 'nom' => 'Classe B']]);
        DB::table('families')->insert([['id' => 1, 'nom' => 'Famille A', 'code_famille' => 'A', 'classe_id' => 1], ['id' => 2, 'nom' => 'Famille B', 'code_famille' => 'B', 'classe_id' => 2]]);
        $this->family = $this->user('responsable_famille');
        $this->member = $this->user('membre_famille');
        $this->conductor = $this->user('conducteur');
        $this->bureau = $this->user('bureau_conducteur');
        $this->pastor = $this->user('pasteur');
        $this->admin = $this->user('admin');
        $this->workflow = app(SacrementWorkflowService::class);
        $this->campaign = app(CampagneSacrementService::class)->ouvrir(['annee' => 2026, 'titre' => 'Session 2026', 'date_ouverture' => '2026-09-01', 'date_fermeture' => '2026-09-30'], $this->admin->id);
    }

    private function user(string $role, int $family = 1, int $class = 1): User
    {
        $id = DB::table('users')->insertGetId(['nom' => $role, 'prenom' => 'Test', 'role' => $role, 'email' => uniqid().'@example.test', 'family_id' => $family, 'classe_id' => $class]);

        return User::findOrFail($id);
    }

    private function create(string $type = 'bapteme', ?User $member = null, bool $draft = false): ActeLiturgique
    {
        return $this->workflow->create(['membre_id' => ($member ?? $this->member)->id, 'type_acte' => $type, 'details' => ['telephone' => '0102030405'], 'brouillon' => $draft], $this->family);
    }

    private function close(): void
    {
        app(CampagneSacrementService::class)->fermer($this->campaign, $this->admin->id);
    }

    private function action(User $actor, array $actes, string $action, array $data = []): void
    {
        $this->workflow->action($actor, $this->campaign->id, array_map(fn ($a) => $a->id, $actes), $action, $data);
    }

    private function rejected(callable $fn, string $contains = ''): void
    {
        try {
            $fn();
            $this->fail('Expected workflow rejection');
        } catch (ValidationException $e) {
            if ($contains) {
                $this->assertStringContainsString($contains, $e->getMessage());
            }
        }
    }

    private function admit(ActeLiturgique $acte): ListeSacrement
    {
        $this->action($this->conductor, [$acte], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $this->workflow->decideList($this->pastor, $list->id, 'valider', '', 'pasteur');

        return $list;
    }

    public function test_complete_combined_path_and_archival_preserve_individual_sacraments(): void
    {
        $acte = $this->create('bapteme_premiere_communion');
        $list = $this->admit($acte);
        $this->assertSame('admis', $acte->fresh()->suivi_sacrement['etape']);
        $this->assertSame(0, UserSacrement::count());
        $details = ['date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur Test'];
        $this->action($this->pastor, [$acte], 'celebrer', $details + ['sacrement' => 'bapteme']);
        $this->assertSame('partiel', $acte->fresh()->suivi_sacrement['etape']);
        $this->assertTrue(UserSacrement::first()->baptise);
        $this->assertFalse(UserSacrement::first()->premiere_communion);
        $this->rejected(fn () => $this->action($this->pastor, [$acte], 'celebrer', $details + ['sacrement' => 'bapteme']));
        $this->action($this->pastor, [$acte], 'celebrer', $details + ['sacrement' => 'premiere_communion']);
        $this->action($this->admin, [$acte], 'archiver');
        $this->workflow->archiveCampaign($this->admin, $this->campaign->id);
        $this->assertNotNull($this->campaign->fresh()->archivee_at);
        $this->assertCount(2, $acte->fresh()->suivi_sacrement['celebrations']);
        $this->assertSame('validee', $list->fresh()->statut);
        $this->assertGreaterThan(6, $acte->historiques()->count());
        $this->rejected(fn () => $this->action($this->conductor, [$acte], 'valider'));
    }

    public function test_transmission_is_explicit_after_closure_and_requires_all_submitted_decisions(): void
    {
        $a = $this->create();
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$a], 'valider');
        $this->rejected(fn () => $this->workflow->transmit($this->conductor, $this->campaign->id), 'fermeture');
        $this->close();
        $this->assertSame(0, ListeSacrement::count());
        $this->rejected(fn () => $this->workflow->transmit($this->conductor, $this->campaign->id), 'tous les dossiers');
        $this->action($this->conductor, [$b], 'exclure', ['commentaire' => 'Assiduité à revoir']);
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->assertCount(1, $list->candidats);
        $this->rejected(fn () => $this->workflow->transmit($this->conductor, $this->campaign->id));
    }

    public function test_group_validation_is_atomic_and_detects_stale_selection(): void
    {
        $a = $this->create();
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$b], 'retourner', ['commentaire' => 'Pièce à compléter']);
        $this->rejected(fn () => $this->action($this->conductor, [$a, $b], 'valider'));
        $this->assertSame('soumis', $a->fresh()->suivi_sacrement['etape']);
        $this->action($this->family, [$b], 'corriger', ['details' => ['telephone' => '02']]);
        $this->rejected(fn () => $this->action($this->conductor, [$a, $b], 'valider', ['revisions' => [$a->id => 1, $b->id => 1]]));
        $this->action($this->conductor, [$a, $b], 'valider');
        foreach ([$a, $b] as $acte) {
            $this->assertSame($this->conductor->id, $acte->fresh()->suivi_sacrement['controle']['acteur_id']);
        }
    }

    public function test_returned_list_keeps_snapshot_and_resubmits_to_requesting_stage(): void
    {
        $a = $this->create();
        $this->action($this->conductor, [$a], 'valider');
        $this->close();
        $v1 = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $snapshot = $v1->candidats;
        $this->workflow->decideList($this->bureau, $v1->id, 'valider', '', 'bureau');
        $this->workflow->decideList($this->pastor, $v1->id, 'retourner', 'Compléter le dossier', 'pasteur');
        $this->action($this->conductor, [$a], 'retourner', ['commentaire' => 'Téléphone à corriger']);
        $this->action($this->family, [$a], 'corriger', ['details' => ['telephone' => '0304050607']]);
        $this->action($this->conductor, [$a], 'valider');
        $v2 = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->assertSame(2, $v2->version);
        $this->assertSame('pasteur', $v2->statut);
        $this->assertSame($snapshot, $v1->fresh()->candidats);
        $this->rejected(fn () => $this->workflow->decideList($this->pastor, $v1->id, 'valider', '', 'pasteur'));
    }

    public function test_member_has_no_module_actions_and_other_roles_cannot_initiate(): void
    {
        $this->actingAs($this->member)->get('/sacrements')->assertForbidden();
        foreach ([$this->member, $this->bureau, $this->pastor, $this->admin] as $user) {
            $this->actingAs($user)->post('/sacrements/dossiers', ['membre_id' => $this->member->id, 'type_acte' => 'bapteme', 'details' => ['telephone' => '01']])->assertForbidden();
        }
        $this->assertSame(0, ActeLiturgique::count());
    }

    public function test_conductor_can_register_class_member_and_manage_own_draft(): void
    {
        $candidate = $this->user('membre_famille', 2, 1);
        $acte = $this->workflow->create(['membre_id' => $candidate->id, 'type_acte' => 'bapteme', 'brouillon' => true], $this->conductor);
        $this->assertEquals(2, $acte->family_id);
        $this->assertTrue(\App\Support\SacrementAccess::reads($this->conductor, $acte));
        $this->action($this->conductor, [$acte], 'soumettre', ['details' => []]);
        $this->assertSame('soumis', $acte->fresh()->suivi_sacrement['etape']);
        $outside = $this->user('membre_famille', 2, 2);
        $this->actingAs($this->conductor)->post('/sacrements/dossiers', ['membre_id' => $outside->id, 'type_acte' => 'bapteme', 'details' => ['telephone' => '01']])->assertNotFound();
    }

    public function test_foreign_family_and_class_are_blocked_even_in_bulk(): void
    {
        $other = $this->user('membre_famille', 2, 2);
        $this->actingAs($this->family)->post('/sacrements/dossiers', ['membre_id' => $other->id, 'type_acte' => 'bapteme', 'details' => ['telephone' => '01']])->assertNotFound();
        $a = $this->create();
        $this->actingAs($this->user('conducteur', 2, 2))->post('/sacrements/actions', ['campagne_id' => $this->campaign->id, 'ids' => [$a->id], 'action' => 'valider', 'revisions' => [$a->id => 1]])->assertForbidden();
        $this->assertSame('soumis', $a->fresh()->suivi_sacrement['etape']);
    }

    public function test_duplicates_overlap_combined_and_archived_celebrations(): void
    {
        $a = $this->create();
        $this->rejected(fn () => $this->create('bapteme_premiere_communion'));
        $this->admit($a);
        $this->action($this->pastor, [$a], 'celebrer', ['sacrement' => 'bapteme', 'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur']);
        $this->action($this->admin, [$a], 'archiver');
        app(CampagneSacrementService::class)->reouvrir($this->campaign, ['date_ouverture' => '2026-09-21', 'date_fermeture' => '2026-09-30', 'motif_reouverture' => 'Complément'], $this->admin->id);
        $this->rejected(fn () => $this->create(), 'déjà reçu');
    }

    public function test_absence_and_partial_report_do_not_grant_missing_sacrament(): void
    {
        $a = $this->create('bapteme_premiere_communion');
        $this->admit($a);
        $this->action($this->pastor, [$a], 'celebrer', ['sacrement' => 'bapteme', 'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur']);
        $this->action($this->pastor, [$a], 'reporter', ['commentaire' => 'Communion reportée à la prochaine session']);
        $this->assertFalse(UserSacrement::first()->premiere_communion);
        $this->action($this->admin, [$a], 'archiver');
        $this->assertSame('reporte', $a->fresh()->suivi_sacrement['issue']);
    }

    public function test_indicators_use_family_fimeco_and_only_class_recorded_attendance(): void
    {
        $a = $this->create();
        DB::table('fimeco_souscriptions')->insert(['family_id' => 1, 'classe_id' => 1, 'annee' => 2026, 'montant_souscrit' => 10000]);
        DB::table('cotisations')->insert(['id' => 1, 'nom' => 'FIMECO', 'classe_id' => 1]);
        DB::table('paiements')->insert(['family_id' => 1, 'cotisation_id' => 1, 'year' => 2026, 'montant' => 4000]);
        foreach ([[1, 1, false, '2026-09-02'], [2, 1, false, '2026-09-03'], [3, 2, false, '2026-09-04'], [4, 1, true, '2026-09-05'], [5, 1, false, '2025-09-05']] as [$id,$class,$parish,$date]) {
            DB::table('special_events')->insert(['id' => $id, 'class_id' => $class, 'is_parish' => $parish, 'start_date' => $date, 'statut_realisation' => 'realisee']);
            DB::table('presences')->insert(['membre_famille_id' => $this->member->id, 'special_event_id' => $id, 'statut' => $id === 2 ? 'absent' : 'present', 'justifiee' => $id === 2]);
        }
        $this->action($this->conductor, [$a], 'valider');
        $control = $a->fresh()->suivi_sacrement['controle'];
        $this->assertSame(6000, $control['fimeco']['montant_restant']);
        $this->assertSame(2, $control['assiduite']['pointages']);
        $this->assertEquals(50, $control['assiduite']['taux']);
        $this->assertSame(1, $control['assiduite']['absences_justifiees']);
        $this->assertSame('controle', $a->fresh()->suivi_sacrement['etape']); // no automatic financial threshold
    }

    public function test_old_endpoints_cannot_bypass_workflow(): void
    {
        $a = $this->create();
        $this->actingAs($this->admin)->putJson('/admin/liturgie/'.$a->id, ['statut' => 'VALIDEE'])->assertUnprocessable();
        $this->actingAs($this->admin)->deleteJson('/admin/liturgie/'.$a->id)->assertUnprocessable();
        $this->actingAs($this->member)->get('/membre-famille/liturgie/'.$a->id.'/certificat')->assertForbidden();
        $this->rejected(fn () => app(ActeLiturgiqueService::class)->transitionStatut($a, 'VALIDEE', $this->admin));
        $this->assertSame('soumis', $a->fresh()->suivi_sacrement['etape']);
    }

    public function test_certificate_requires_actual_celebration_and_authorized_profile(): void
    {
        $a = $this->create();
        $this->admit($a);
        $path = '/sacrements/dossiers/'.$a->id.'/certificat/bapteme';
        $this->actingAs($this->family)->get($path)->assertUnprocessable();
        $this->action($this->pastor, [$a], 'celebrer', ['sacrement' => 'bapteme', 'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur']);
        $this->actingAs($this->family)->get($path)->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->actingAs($this->member)->get($path)->assertForbidden();
        $this->actingAs($this->user('responsable_famille', 2, 2))->get($path)->assertForbidden();
    }

    public function test_preparation_is_not_celebration_and_rectification_keeps_old_certificate(): void
    {
        $a = $this->create();
        $this->admit($a);
        $this->action($this->pastor, [$a], 'planifier', ['date' => '2026-10-01', 'lieu' => 'Temple', 'celebrant' => 'Pasteur', 'formation' => 'terminee']);
        $this->assertSame(0, UserSacrement::count());
        $this->assertSame('admis', $a->fresh()->suivi_sacrement['etape']);
        $this->action($this->pastor, [$a], 'celebrer', ['sacrement' => 'bapteme', 'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur']);
        $this->action($this->admin, [$a], 'archiver');
        $this->workflow->archiveCampaign($this->admin, $this->campaign->id);
        $this->action($this->pastor, [$a], 'rectifier', ['sacrement' => 'bapteme', 'date' => '2026-09-20', 'lieu' => 'Temple corrigé', 'celebrant' => 'Pasteur', 'commentaire' => 'Correction de la date du registre']);
        $suivi = $a->fresh()->suivi_sacrement;
        $this->assertSame('archive', $suivi['etape']);
        $this->assertSame('2026-09-21', $suivi['versions_certificats']['bapteme'][0]['date']);
        $this->assertSame(2, $suivi['celebrations']['bapteme']['version']);
        $this->assertSame('2026-09-20', UserSacrement::first()->bapteme_date->toDateString());
        $this->actingAs($this->family)->get('/sacrements/dossiers/'.$a->id.'/certificat/bapteme?version=1')->assertOk();
    }

    public function test_pastor_can_manage_followup_from_history_and_remain_on_dashboard(): void
    {
        $acte = $this->create('bapteme_premiere_communion');
        $this->admit($acte);
        $page = '/pasteur/liturgie';
        $revision = $acte->fresh()->suivi_sacrement['revision'];
        $payload = ['campagne_id' => $this->campaign->id, 'ids' => [$acte->id], 'revisions' => [$acte->id => $revision],
            'action' => 'planifier', 'date' => '2026-10-01', 'lieu' => 'Temple', 'celebrant' => 'Pasteur', 'formation' => 'en_cours', 'commentaire' => 'Cours du samedi'];
        $this->actingAs($this->bureau)->from($page)->post('/sacrements/actions', $payload)->assertForbidden();
        $this->actingAs($this->pastor)->from($page)->post('/sacrements/actions', $payload)
            ->assertSessionHasNoErrors()->assertRedirect($page);
        $history = ListeSacrement::withPastoralDecisions()->with('dossiers')->firstOrFail();
        $this->assertSame('en_cours', $history->dossiers->first()->suivi_sacrement['preparation']['formation']);
        $this->assertSame('2026-10-01', $history->dossiers->first()->suivi_sacrement['preparation']['date']);
        $this->assertSame('valider', $history->pastoralCandidates()[0]['decision_pastorale']['decision']);
        $this->assertSame(0, UserSacrement::count());

        $payload = array_replace($payload, ['action' => 'celebrer', 'sacrement' => 'bapteme', 'date' => '2026-09-21']);
        $this->actingAs($this->pastor)->from($page)->post('/sacrements/actions', $payload)->assertSessionHasErrors();
        $this->assertSame(0, UserSacrement::count());
        $payload['revisions'][$acte->id] = $acte->fresh()->suivi_sacrement['revision'];
        $this->actingAs($this->pastor)->from($page)->post('/sacrements/actions', $payload)
            ->assertSessionHasNoErrors()->assertRedirect($page);
        $history->refresh();
        $this->assertSame('partiel', $history->dossiers->first()->suivi_sacrement['etape']);
        $this->assertArrayHasKey('bapteme', $history->dossiers->first()->suivi_sacrement['celebrations']);
        $this->actingAs($this->pastor)->get('/sacrements/dossiers/'.$acte->id.'/certificat/bapteme')->assertOk();

        $payload = ['campagne_id' => $this->campaign->id, 'ids' => [$acte->id], 'revisions' => [$acte->id => $acte->fresh()->suivi_sacrement['revision']], 'action' => 'reporter', 'commentaire' => ''];
        $this->actingAs($this->pastor)->from($page)->post('/sacrements/actions', $payload)->assertSessionHasErrors();
        $payload['commentaire'] = 'Communion reportée à la prochaine session';
        $this->actingAs($this->pastor)->from($page)->post('/sacrements/actions', $payload)
            ->assertSessionHasNoErrors()->assertRedirect($page);
        $history->refresh();
        $this->assertSame('reporte', $history->dossiers->first()->suivi_sacrement['etape']);
        $this->assertSame('valider', $history->pastoralCandidates()[0]['decision_pastorale']['decision']);
    }

    public function test_pastor_can_plan_confirm_rectify_and_report_a_group_with_individual_records(): void
    {
        $a = $this->create('bapteme_premiere_communion');
        $b = $this->create('bapteme_premiere_communion', $this->user('membre_famille'));
        $this->action($this->conductor, [$a, $b], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $this->workflow->decideList($this->pastor, $list->id, 'valider', '', 'pasteur');
        $post = function ($action, $extra = []) use ($a, $b) {
            return $this->actingAs($this->pastor)->from('/pasteur/liturgie')->post('/sacrements/actions', array_replace([
                'campagne_id' => $this->campaign->id, 'ids' => [$a->id, $b->id], 'action' => $action,
                'revisions' => [$a->id => $a->fresh()->suivi_sacrement['revision'], $b->id => $b->fresh()->suivi_sacrement['revision']],
                'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur', 'sacrement' => 'bapteme',
            ], $extra));
        };
        $post('planifier', ['formation' => 'terminee'])->assertSessionHasNoErrors()->assertRedirect('/pasteur/liturgie');
        foreach ([$a, $b] as $acte) {
            $this->assertSame('terminee', $acte->fresh()->suivi_sacrement['preparation']['formation']);
        }
        $this->assertSame(0, UserSacrement::count());
        $post('celebrer', ['sacrement' => 'premiere_communion'])->assertSessionHasErrors();
        $this->assertSame(0, UserSacrement::count());
        $post('celebrer')->assertSessionHasNoErrors()->assertRedirect('/pasteur/liturgie');
        $this->assertSame(2, UserSacrement::where('baptise', true)->count());
        $references = [];
        foreach ([$a, $b] as $acte) {
            $this->assertSame('partiel', $acte->fresh()->suivi_sacrement['etape']);
            $references[] = $acte->fresh()->suivi_sacrement['celebrations']['bapteme']['reference'];
            $this->get('/sacrements/dossiers/'.$acte->id.'/certificat/bapteme')->assertOk();
        }
        $this->assertCount(2, array_unique($references));
        $post('rectifier', ['date' => '2026-09-20', 'commentaire' => 'Correction de la date commune'])->assertSessionHasNoErrors();
        foreach ([$a, $b] as $acte) {
            $suivi = $acte->fresh()->suivi_sacrement;
            $this->assertSame(2, $suivi['celebrations']['bapteme']['version']);
            $this->assertSame('2026-09-21', $suivi['versions_certificats']['bapteme'][0]['date']);
        }
        $post('reporter', ['commentaire' => 'Communion reportée à la prochaine session'])->assertSessionHasNoErrors();
        foreach ([$a, $b] as $acte) {
            $this->assertSame('reporte', $acte->fresh()->suivi_sacrement['etape']);
        }
        $this->assertSame(0, UserSacrement::where('premiere_communion', true)->count());
    }

    public function test_group_celebration_and_rectification_roll_back_on_stale_or_ineligible_candidate(): void
    {
        $a = $this->create();
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$a, $b], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $this->workflow->decideList($this->pastor, $list->id, 'valider', '', 'pasteur');
        $payload = ['campagne_id' => $this->campaign->id, 'ids' => [$a->id, $b->id], 'action' => 'celebrer',
            'revisions' => [$a->id => $a->fresh()->suivi_sacrement['revision'], $b->id => 0],
            'sacrement' => 'bapteme', 'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur'];
        $this->actingAs($this->pastor)->post('/sacrements/actions', $payload)->assertSessionHasErrors();
        $this->assertSame(0, UserSacrement::count());
        $this->assertSame('admis', $a->fresh()->suivi_sacrement['etape']);
        $this->action($this->pastor, [$a], 'celebrer', $payload);
        $payload['revisions'] = [$a->id => $a->fresh()->suivi_sacrement['revision'], $b->id => $b->fresh()->suivi_sacrement['revision']];
        $payload['action'] = 'rectifier';
        $payload['date'] = '2026-09-20';
        $payload['commentaire'] = 'Correction commune';
        $this->actingAs($this->bureau)->post('/sacrements/actions', $payload)->assertForbidden();
        $this->actingAs($this->pastor)->post('/sacrements/actions', $payload)->assertSessionHasErrors();
        $this->assertSame(1, $a->fresh()->suivi_sacrement['celebrations']['bapteme']['version']);
        $this->assertSame('2026-09-21', $a->fresh()->suivi_sacrement['celebrations']['bapteme']['date']);
        $this->assertSame('admis', $b->fresh()->suivi_sacrement['etape']);
    }

    public function test_mixed_group_can_confirm_and_rectify_each_candidates_sacraments_atomically(): void
    {
        $a = $this->create('bapteme_premiere_communion');
        $member = $this->user('membre_famille');
        UserSacrement::create(['user_id' => $member->id, 'baptise' => true, 'bapteme_date' => '2020-01-01', 'bapteme_lieu' => 'Temple']);
        $b = $this->create('premiere_communion', $member);
        $c = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$a, $b, $c], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $this->workflow->decideList($this->pastor, $list->id, 'valider', '', 'pasteur');
        $payload = ['campagne_id' => $this->campaign->id, 'ids' => [$a->id, $b->id, $c->id], 'action' => 'celebrer',
            'revisions' => collect([$a, $b, $c])->mapWithKeys(fn ($acte) => [$acte->id => $acte->fresh()->suivi_sacrement['revision']])->all(),
            'sacrements' => [$a->id => 'bapteme_premiere_communion', $b->id => 'premiere_communion'],
            'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur'];
        $this->actingAs($this->pastor)->post('/sacrements/actions', $payload)->assertSessionHasErrors();
        $this->assertSame(1, UserSacrement::count());
        // This invalid combined choice for a baptism-only dossier must undo earlier candidates too.
        $payload['sacrements'][$c->id] = 'bapteme_premiere_communion';
        $this->post('/sacrements/actions', $payload)->assertSessionHasErrors();
        $this->assertSame(1, UserSacrement::count());
        foreach ([$a, $b, $c] as $acte) {
            $this->assertSame('admis', $acte->fresh()->suivi_sacrement['etape']);
            $this->assertEmpty($acte->fresh()->suivi_sacrement['celebrations'] ?? []);
        }
        $payload['sacrements'][$c->id] = 'bapteme';
        $this->from('/pasteur/liturgie')->post('/sacrements/actions', $payload)->assertSessionHasNoErrors()->assertRedirect('/pasteur/liturgie');
        $this->assertSame(3, UserSacrement::where('baptise', true)->count());
        $this->assertSame(2, UserSacrement::where('premiere_communion', true)->count());
        foreach ([$a, $b, $c] as $acte) {
            $this->assertSame('celebre', $acte->fresh()->suivi_sacrement['etape']);
        }
        $this->assertCount(2, $a->fresh()->suivi_sacrement['celebrations']);
        $this->assertCount(1, $b->fresh()->suivi_sacrement['celebrations']);
        $payload['action'] = 'rectifier';
        $payload['sacrements'][$a->id] = 'bapteme';
        $payload['revisions'] = collect([$a, $b, $c])->mapWithKeys(fn ($acte) => [$acte->id => $acte->fresh()->suivi_sacrement['revision']])->all();
        $payload['commentaire'] = 'Correction du lieu commun';
        $payload['lieu'] = 'Temple du Jubilé';
        $this->post('/sacrements/actions', $payload)->assertSessionHasNoErrors();
        $this->assertSame(2, $a->fresh()->suivi_sacrement['celebrations']['bapteme']['version']);
        $this->assertSame(1, $a->fresh()->suivi_sacrement['celebrations']['premiere_communion']['version']);
        $this->assertSame(2, $b->fresh()->suivi_sacrement['celebrations']['premiere_communion']['version']);
        $this->assertSame(2, $c->fresh()->suivi_sacrement['celebrations']['bapteme']['version']);
    }

    public function test_first_communion_requires_recorded_baptism_and_can_finish_without_regranting_it(): void
    {
        $a = $this->create('premiere_communion', null, true);
        $this->assertSame('brouillon', $a->suivi_sacrement['etape']);
        $this->action($this->family, [$a], 'soumettre', ['details' => []]);
        $this->rejected(fn () => $this->action($this->conductor, [$a], 'valider'), 'Baptême à vérifier');
        $this->assertSame('soumis', $a->fresh()->suivi_sacrement['etape']);
        UserSacrement::create(['user_id' => $this->member->id, 'baptise' => true, 'bapteme_date' => '2020-01-01']);
        $this->admit($a);
        $this->action($this->pastor, [$a], 'celebrer', ['sacrement' => 'premiere_communion', 'date' => '2026-09-21', 'lieu' => 'Temple', 'celebrant' => 'Pasteur']);
        $this->assertSame('2020-01-01', UserSacrement::first()->bapteme_date->toDateString());
        $this->assertTrue(UserSacrement::first()->premiere_communion);
    }

    public function test_declared_baptism_is_recorded_only_after_conductor_validation(): void
    {
        $data = ['membre_id' => $this->member->id, 'type_acte' => 'premiere_communion', 'details' => ['bapteme_date' => '2020-01-01', 'bapteme_lieu' => 'Temple du Jubilé']];
        $this->actingAs($this->family)->post('/sacrements/dossiers', $data)->assertSessionHasNoErrors();
        $a = ActeLiturgique::firstOrFail();
        $this->assertSame('2020-01-01', $a->details['bapteme_date']);
        $this->assertFalse((bool) UserSacrement::where('user_id', $this->member->id)->value('baptise'));
        $this->action($this->conductor, [$a], 'valider');
        $record = UserSacrement::where('user_id', $this->member->id)->firstOrFail();
        $this->assertTrue($record->baptise);
        $this->assertSame('Temple du Jubilé', $record->bapteme_lieu);
        $this->assertEquals($this->conductor->id, $a->fresh()->suivi_sacrement['bapteme_verifie']['acteur_id']);
        $data['details']['bapteme_date'] = '2099-01-01';
        $this->actingAs($this->family)->post('/sacrements/dossiers', $data)->assertSessionHasErrors('details.bapteme_date');
    }

    public function test_pastor_individual_and_group_decisions_preserve_refused_candidates(): void
    {
        $a = $this->create();
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$a, $b], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $entries = collect([$a, $b])->map(fn ($acte) => ['id' => $acte->id, 'liste_id' => $list->id, 'revision' => $acte->fresh()->suivi_sacrement['revision']])->all();
        $path = '/sacrements/candidats/decision-pastorale';
        $this->actingAs($this->bureau)->post($path, ['candidats' => $entries, 'decision' => 'valider'])->assertForbidden();
        $stale = $entries;
        $stale[1]['revision'] = 0;
        $this->actingAs($this->pastor)->post($path, ['candidats' => $stale, 'decision' => 'valider'])->assertSessionHasErrors();
        $this->assertSame('transmis', $a->fresh()->suivi_sacrement['etape']);
        $this->actingAs($this->pastor)->post($path, ['candidats' => [$entries[0]], 'decision' => 'refuser', 'commentaire' => 'Préparation insuffisante'])->assertSessionHasNoErrors();
        $this->assertSame('pasteur', $list->fresh()->statut);
        $this->workflow->decideList($this->pastor, $list->id, 'valider', '', 'pasteur');
        $this->assertSame('refuse', $a->fresh()->suivi_sacrement['etape']);
        $this->assertSame('admis', $b->fresh()->suivi_sacrement['etape']);
    }

    public function test_pastor_can_admit_all_candidates_in_one_request(): void
    {
        $a = $this->create();
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$a, $b], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $entries = collect([$a, $b])->map(fn ($acte) => ['id' => $acte->id, 'liste_id' => $list->id, 'revision' => $acte->fresh()->suivi_sacrement['revision']])->all();
        $this->actingAs($this->pastor)->post('/sacrements/candidats/decision-pastorale', ['candidats' => $entries, 'decision' => 'valider'])->assertSessionHasNoErrors();
        $this->assertSame('validee', $list->fresh()->statut);
        $this->assertSame('admis', $a->fresh()->suivi_sacrement['etape']);
        $this->assertSame('admis', $b->fresh()->suivi_sacrement['etape']);
        $this->assertSame(0, UserSacrement::count());
    }

    public function test_pastoral_history_preserves_partial_decisions_and_archived_snapshots(): void
    {
        $a = $this->create();
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $c = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$a, $b, $c], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->refuseCandidate($this->bureau, $list->id, $c->id, 'Dossier incomplet');
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $this->assertSame(0, ListeSacrement::withPastoralDecisions()->count());
        $this->workflow->decidePastoralCandidates($this->pastor, [[
            'id' => $a->id, 'liste_id' => $list->id, 'revision' => $a->fresh()->suivi_sacrement['revision'],
        ]], 'refuser', 'Préparation à compléter');

        $history = ListeSacrement::withPastoralDecisions()->firstOrFail();
        $this->assertSame('pasteur', $history->statut);
        $partial = $history->pastoralCandidates();
        $this->assertCount(1, $partial);
        $this->assertSame($a->id, $partial[0]['id']);
        $this->assertSame('refuser', $partial[0]['decision_pastorale']['decision']);

        $this->workflow->decideList($this->pastor, $list->id, 'valider', 'Admission confirmée', 'pasteur');
        $beforeArchive = $list->fresh()->pastoralCandidates();
        $byId = collect($beforeArchive)->keyBy('id');
        $this->assertSame('refuser', $byId[$a->id]['decision_pastorale']['decision']);
        $this->assertSame('valider', $byId[$b->id]['decision_pastorale']['decision']);
        $this->assertSame('0102030405', $byId[$b->id]['details']['telephone']);
        $this->assertSame('Admission confirmée', $byId[$b->id]['decision_pastorale']['commentaire']);
        $this->assertNotEmpty($byId[$b->id]['decision_pastorale']['date']);
        $this->assertSame('Test pasteur', $byId[$b->id]['decision_pastorale']['acteur']);
        $this->assertFalse($byId->has($c->id));

        $this->campaign->update(['archivee_at' => now()]);
        $b->update(['liste_sacrement_id' => null, 'details' => ['telephone' => '9999999999']]);
        $archived = ListeSacrement::withPastoralDecisions()->with('campagne')->firstOrFail();
        $this->assertNotNull($archived->campagne->archivee_at);
        $this->assertSame($beforeArchive, $archived->pastoralCandidates());
    }

    public function test_pastoral_history_keeps_returned_versions_separate_from_later_admission(): void
    {
        $a = $this->create();
        $this->action($this->conductor, [$a], 'valider');
        $this->close();
        $first = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->bureau, $first->id, 'valider', '', 'bureau');
        $this->workflow->decideList($this->pastor, $first->id, 'retourner', 'Vérifier les contacts', 'pasteur');
        $this->action($this->conductor, [$a->fresh()], 'valider');
        $second = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->workflow->decideList($this->pastor, $second->id, 'valider', '', 'pasteur');
        $history = ListeSacrement::withPastoralDecisions()->orderBy('version')->get();
        $this->assertCount(2, $history);
        $this->assertSame('retourner', $history[0]->pastoralCandidates()[0]['decision_pastorale']['decision']);
        $this->assertSame('valider', $history[1]->pastoralCandidates()[0]['decision_pastorale']['decision']);
    }

    public function test_pastoral_admission_notifies_the_whole_chain_without_duplicates(): void
    {
        $a = $this->create();
        $outsider = $this->user('conducteur', 2, 2);
        $this->admit($a);
        $notifications = DB::table('notifications')->where('body', 'like', 'Admission validée par le pasteur :%')->get();
        foreach ([$this->family, $this->conductor, $this->bureau, $this->pastor] as $recipient) {
            $this->assertSame(1, $notifications->where('user_id', $recipient->id)->count());
        }
        $this->assertSame(0, $notifications->where('user_id', $outsider->id)->count());
        $this->assertSame(0, $notifications->where('user_id', $this->member->id)->count());
    }

    public function test_pastor_created_act_notifies_class_conductor_and_bureau(): void
    {
        $outsider = $this->user('conducteur', 2, 2);
        $this->conductor->update(['email' => null]);
        $acte = app(\App\Services\ActeLiturgiqueService::class)->create([
            'type_acte' => 'naissance', 'membre_id' => $this->member->id,
            'family_id' => 1, 'classe_id' => 1, 'created_by' => $this->pastor->id,
            'pasteur_id' => $this->pastor->id, 'statut' => 'VALIDEE', 'details' => [],
        ], $this->pastor);
        $this->assertSame('VALIDEE', $acte->statut);
        $recipients = DB::table('notifications')->where('subject', 'Décision pastorale sur un acte')->pluck('user_id')->all();
        $this->assertContains($this->conductor->id, $recipients);
        $this->assertContains($this->bureau->id, $recipients);
        $this->assertNotContains($outsider->id, $recipients);
    }

    public function test_individual_refusal_is_preserved_when_remaining_list_is_validated(): void
    {
        $a = $this->create();
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$a, $b], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $snapshot = $list->candidats;
        $path = '/sacrements/listes/'.$list->id.'/candidats/'.$a->id.'/refuser';
        $this->actingAs($this->conductor)->post($path, ['commentaire' => 'Motif'])->assertForbidden();
        $this->actingAs($this->bureau)->post($path, ['commentaire' => ''])->assertSessionHasErrors('commentaire');
        $this->actingAs($this->bureau)->post($path, ['commentaire' => 'Dossier incomplet'])->assertSessionHasNoErrors();
        $this->assertSame('refuse', $a->fresh()->suivi_sacrement['etape']);
        $this->assertSame('bureau', $list->fresh()->statut);
        $this->assertSame($snapshot, $list->fresh()->candidats);
        $this->workflow->decideList($this->bureau, $list->id, 'valider', '', 'bureau');
        $this->workflow->decideList($this->pastor, $list->id, 'valider', '', 'pasteur');
        $this->assertSame('refuse', $a->fresh()->suivi_sacrement['etape']);
        $this->assertSame('REFUSEE_PAR_BUREAU_CONDUCTEUR', $a->fresh()->statut);
        $this->assertSame('admis', $b->fresh()->suivi_sacrement['etape']);
    }

    public function test_bureau_can_validate_multiple_class_lists_atomically(): void
    {
        $a = $this->create();
        $otherConductor = $this->user('conducteur', 2, 2);
        $candidate = $this->user('membre_famille', 2, 2);
        $b = $this->workflow->create(['membre_id' => $candidate->id, 'type_acte' => 'bapteme'], $otherConductor);
        $this->action($this->conductor, [$a], 'valider');
        $this->action($otherConductor, [$b], 'valider');
        $this->close();
        $one = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $two = $this->workflow->transmit($otherConductor, $this->campaign->id);
        $payload = ['campagne_id' => $this->campaign->id, 'ids' => [$one->id, $two->id]];
        $this->actingAs($this->conductor)->post('/sacrements/listes/validation-groupee', $payload)->assertForbidden();
        $two->update(['statut' => 'pasteur']);
        $this->actingAs($this->bureau)->post('/sacrements/listes/validation-groupee', $payload)->assertSessionHasErrors();
        $this->assertSame('bureau', $one->fresh()->statut);
        $this->assertSame('TRANSMISE_AU_BUREAU_CONDUCTEUR', $a->fresh()->statut);
        $two->update(['statut' => 'bureau']);
        $this->actingAs($this->bureau)->post('/sacrements/listes/validation-groupee', $payload)->assertSessionHasNoErrors();
        $this->assertSame('pasteur', $one->fresh()->statut);
        $this->assertSame('pasteur', $two->fresh()->statut);
        $this->assertSame('TRANSMISE_AU_PASTEUR', $a->fresh()->statut);
        $this->assertSame('TRANSMISE_AU_PASTEUR', $b->fresh()->statut);
    }

    public function test_reopening_preserves_transmitted_lists_and_new_entries_wait_for_next_closure(): void
    {
        $a = $this->create();
        $v1 = $this->admit($a);
        $snapshot = $v1->candidats;
        app(CampagneSacrementService::class)->reouvrir($this->campaign, ['date_ouverture' => '2026-09-21', 'date_fermeture' => '2026-09-30', 'motif_reouverture' => 'Inscriptions complémentaires'], $this->admin->id);
        $b = $this->create('bapteme', $this->user('membre_famille'));
        $this->action($this->conductor, [$b], 'valider');
        $this->rejected(fn () => $this->workflow->transmit($this->conductor, $this->campaign->id), 'fermeture');
        $this->close();
        $v2 = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->assertSame($snapshot, $v1->fresh()->candidats);
        $this->assertCount(1, $v2->candidats);
        $this->assertSame($b->id, $v2->candidats[0]['id']);
    }

    public function test_president_function_can_validate_bureau_list_but_not_pastoral_decision(): void
    {
        $a = $this->create();
        $this->action($this->conductor, [$a], 'valider');
        $this->close();
        $list = $this->workflow->transmit($this->conductor, $this->campaign->id);
        $president = $this->user('conducteur');
        $president->setRelation('fonction', new \App\Models\Fonction(['nom' => 'Président des conducteurs']));
        $this->workflow->decideList($president, $list->id, 'valider', '', 'bureau');
        $this->expectException(HttpException::class);
        $this->workflow->decideList($president, $list->id, 'valider', '', 'pasteur');
    }

    public function test_index_renders_scoped_inertia_data_for_every_profile(): void
    {
        $a = $this->create();
        foreach ([$this->family, $this->conductor, $this->bureau, $this->pastor, $this->admin] as $user) {
            $response = $this->actingAs($user)->get('/sacrements', ['X-Inertia' => 'true', 'Accept' => 'text/html, application/xhtml+xml']);
            $response->assertOk()->assertJsonPath('component', 'Sacrements/Index');
            $response->assertJsonPath('props.dossiers.total', $user->role === 'bureau_conducteur' ? 0 : 1);
        }
        $this->actingAs($this->user('responsable_famille', 2, 2))->get('/sacrements', ['X-Inertia' => 'true'])->assertJsonPath('props.dossiers.total', 0);
    }

    public function test_family_can_upload_private_pieces_and_complete_after_closure(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $file = \Illuminate\Http\UploadedFile::fake()->create('justificatif.pdf', 10, 'application/pdf');
        $this->actingAs($this->family)->post('/sacrements/dossiers', ['membre_id' => $this->member->id, 'type_acte' => 'bapteme', 'details' => ['telephone' => '01'], 'pieces_jointes' => [$file]])->assertRedirect();
        $a = ActeLiturgique::first();
        $piece = $a->piecesJointes()->first();
        $this->actingAs($this->family)->get('/sacrements/pieces/'.$piece->id)->assertOk();
        $this->actingAs($this->member)->get('/sacrements/pieces/'.$piece->id)->assertForbidden();
        $this->action($this->conductor, [$a], 'retourner', ['commentaire' => 'Compléter les informations']);
        $this->close();
        $this->actingAs($this->family)->post('/sacrements/actions', ['campagne_id' => $this->campaign->id, 'ids' => [$a->id], 'action' => 'corriger', 'details' => ['telephone' => '02'], 'revisions' => [$a->id => $a->fresh()->suivi_sacrement['revision']]])->assertRedirect();
        $this->assertSame('soumis', $a->fresh()->suivi_sacrement['etape']);
    }

    public function test_historic_reprise_preserves_reference_and_requires_new_control(): void
    {
        $a = ActeLiturgique::create(['reference' => 'HIST-001', 'type_acte' => 'bapteme', 'statut' => 'VALIDEE',
            'membre_id' => $this->member->id, 'classe_id' => 1, 'created_by' => $this->family->id, 'details' => ['ancien_champ' => 'Conservé']]);
        $this->workflow->reprendre($this->admin, $this->campaign->id, [$a->id], 'Reprise du dossier en cours');
        $this->assertSame('HIST-001', $a->fresh()->reference);
        $this->assertSame('soumis', $a->fresh()->suivi_sacrement['etape']);
        $this->assertSame('VALIDEE', $a->fresh()->suivi_sacrement['reprise_statut_initial']);
        $this->action($this->conductor, [$a], 'retourner', ['commentaire' => 'Compléter le contact']);
        $this->action($this->family, [$a], 'corriger', ['details' => ['telephone' => '01']]);
        $this->assertSame('Conservé', $a->fresh()->details['ancien_champ']);
        $this->rejected(fn () => $this->workflow->reprendre($this->admin, $this->campaign->id, [$a->id], 'Deuxième reprise'));
    }

    public function test_drafts_are_private_and_can_be_cancelled_before_campaign_archival(): void
    {
        $a = $this->create('bapteme', null, true);
        $this->actingAs($this->conductor)->get('/sacrements', ['X-Inertia' => 'true'])->assertJsonPath('props.dossiers.total', 0);
        $this->close();
        $this->rejected(fn () => $this->action($this->family, [$a], 'soumettre', ['details' => ['telephone' => '01']]));
        $this->action($this->admin, [$a], 'annuler', ['commentaire' => 'Brouillon non soumis à la clôture']);
        $this->action($this->admin, [$a], 'archiver');
        $this->workflow->archiveCampaign($this->admin, $this->campaign->id);
        $this->assertNotNull($this->campaign->fresh()->archivee_at);
    }

    public function test_new_member_is_added_before_returning_to_sacrament_registration(): void
    {
        $this->mock(\App\Services\TransferWorkflowService::class)->shouldReceive('isTransferLocked')->andReturn(false);
        \Illuminate\Support\Facades\Mail::fake();
        Schema::table('users', function (Blueprint $t) {
            foreach (['identifier', 'code_membre', 'genre', 'employment_status', 'profession', 'niveau_etude', 'relation', 'photo_path', 'profile_photo_url'] as $col) {
                $t->string($col)->nullable();
            }
            $t->unsignedBigInteger('ville_id')->nullable();
            $t->date('date_naissance')->nullable();
            $t->timestamp('credentials_sent_at')->nullable();
        });
        Schema::create('fonction_user', function (Blueprint $t) {
            $t->unsignedBigInteger('user_id');
            $t->unsignedBigInteger('fonction_id');
            $t->timestamps();
        });
        Schema::table('user_sacrements', function (Blueprint $t) {
            foreach (['marie_religieusement', 'est_marie', 'est_divorce', 'est_veuf', 'dot_effectue'] as $col) {
                $t->boolean($col)->default(false);
            }
            foreach (['mariage_religieux_date', 'mariage_civil_date'] as $col) {
                $t->date($col)->nullable();
            }
            foreach (['mariage_religieux_lieu', 'mariage_civil_lieu'] as $col) {
                $t->string($col)->nullable();
            }
        });
        $data = ['nom' => 'NOUVEAU', 'prenom' => 'ENFANT', 'genre' => 'F', 'date_naissance' => '2015-03-04', 'statut_marital' => 'Célibataire'];
        $response = $this->actingAs($this->family)->postJson('/responsable-famille/members/store?family_id=1&sacrement=bapteme', $data);
        $response->assertOk();
        $member = User::where('nom', 'NOUVEAU')->firstOrFail();
        $this->assertSame(1, (int) $member->family_id);
        $this->assertSame(1, (int) $member->classe_id);
        $this->assertSame('membre_famille', $member->role);
        $this->assertSame(0, ActeLiturgique::count()); // membership first, no implicit baptism request
        $this->get($response->json('redirect_url'), ['X-Inertia' => 'true'])
            ->assertOk()->assertJsonPath('props.ouvrirInscription', true)
            ->assertJsonPath('props.membrePreselectionne', $member->id)
            ->assertJsonPath('props.inscriptionType', 'bapteme');
        $this->postJson('/responsable-famille/members/store?family_id=1&sacrement=bapteme', $data)->assertUnprocessable();
        $this->assertSame(1, User::where('nom', 'NOUVEAU')->count());
        $this->post('/sacrements/dossiers', ['membre_id' => $member->id, 'type_acte' => 'bapteme', 'details' => ['telephone' => '01']])->assertRedirect();
        $this->assertSame($member->id, ActeLiturgique::first()->membre_id);
    }

    public function test_member_creation_continuation_rejects_foreign_family_and_invalid_type(): void
    {
        $this->actingAs($this->family)->get('/responsable-famille/members/create?family_id=2&sacrement=bapteme')->assertForbidden();
        $this->postJson('/responsable-famille/members/store?family_id=2&sacrement=bapteme', [])->assertForbidden();
        $this->getJson('/responsable-famille/members/create?family_id=1&sacrement=invalid')->assertUnprocessable();
        $this->get('/sacrements?inscription=1&membre_id='.$this->user('membre_famille', 2, 2)->id, ['X-Inertia' => 'true'])
            ->assertOk()->assertJsonPath('props.membrePreselectionne', null);
    }

    public function test_family_locked_for_transfer_cannot_add_candidate_via_continuation(): void
    {
        $this->mock(\App\Services\TransferWorkflowService::class)->shouldReceive('isTransferLocked')->andReturn(true);
        $this->actingAs($this->family)->get('/responsable-famille/members/create?family_id=1&sacrement=bapteme')
            ->assertRedirectToRoute('responsable_famille.inscriptions')->assertSessionHas('error');
        $this->post('/responsable-famille/members/store?family_id=1&sacrement=bapteme', [])
            ->assertRedirectToRoute('responsable_famille.inscriptions')->assertSessionHas('error');
        $this->postJson('/responsable-famille/members/store?family_id=1&sacrement=bapteme', [])->assertUnprocessable();
    }

    public function test_contacts_are_prefilled_from_member_then_family_without_exposing_other_families(): void
    {
        Schema::table('families', function (Blueprint $t) {
            $t->string('telephone')->nullable();
            $t->string('telephone2')->nullable();
            $t->string('email')->nullable();
        });
        DB::table('families')->where('id', 1)->update(['telephone' => '0101010101', 'telephone2' => '0202020202', 'email' => 'famille@example.test']);
        DB::table('users')->where('id', $this->member->id)->update(['telephone' => '0303030303', 'telephone2' => '', 'email' => null]);
        $other = $this->user('membre_famille', 2, 2);
        DB::table('users')->where('id', $other->id)->update(['telephone' => '0999999999']);
        $response = $this->actingAs($this->family)->get('/sacrements?inscription=1&membre_id='.$this->member->id, ['X-Inertia' => 'true']);
        $response->assertOk();
        $members = collect($response->json('props.membres'));
        $contacts = $members->firstWhere('id', $this->member->id)['contacts'];
        $this->assertSame(['telephone' => '0303030303', 'telephone2' => '0101010101', 'email' => 'famille@example.test'], $contacts);
        $this->assertNull($members->firstWhere('id', $other->id));
        DB::table('users')->where('id', $this->member->id)->update(['telephone' => null]);
        $response = $this->get('/sacrements', ['X-Inertia' => 'true']);
        $contacts = collect($response->json('props.membres'))->firstWhere('id', $this->member->id)['contacts'];
        $this->assertSame('0101010101', $contacts['telephone']);
        $this->assertSame('0202020202', $contacts['telephone2']);
        $this->post('/sacrements/dossiers', ['membre_id' => $this->member->id, 'type_acte' => 'bapteme', 'details' => $contacts])->assertRedirect();
        $this->assertSame('0202020202', ActeLiturgique::first()->details['telephone2']);
        $this->assertSame('famille@example.test', ActeLiturgique::first()->details['email']);
    }

    public function test_campaign_bounds_reopening_and_archival_guards(): void
    {
        $a = $this->create();
        $this->rejected(fn () => $this->workflow->archiveCampaign($this->admin, $this->campaign->id));
        $this->travelTo(now()->setDate(2026, 10, 1));
        $this->rejected(fn () => $this->create('premiere_communion'), 'fermées');
        $this->action($this->conductor, [$a], 'valider');
        $this->workflow->transmit($this->conductor, $this->campaign->id);
        $this->rejected(fn () => $this->workflow->archiveCampaign($this->admin, $this->campaign->id));
    }
}
