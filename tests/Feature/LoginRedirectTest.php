<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureDataConsentValidated;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase;
use Inertia\Inertia;

class LoginRedirectTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // These checks exercise session authentication and routing without database fixtures.
        $this->withoutMiddleware([HandleInertiaRequests::class, EnsureDataConsentValidated::class]);
        Inertia::version('login-redirect-test');
    }

    public function test_authenticated_profiles_leave_login_for_their_dashboard(): void
    {
        foreach ([
            'admin' => 'admin.dashboard',
            'conducteur' => 'conducteur.dashboard',
            'pasteur' => 'pasteur.dashboard',
            'responsable_famille' => 'responsable_famille.dashboard',
            'membre_famille' => 'membre_famille.dashboard',
        ] as $role => $destination) {
            $user = new User(['role' => $role]);
            $user->id = 123;
            $this->actingAs($user)->get('/login')->assertRedirectToRoute('dashboard');
            $this->get('/dashboard')->assertRedirectToRoute($destination);
            $this->assertAuthenticatedAs($user);
        }
    }

    public function test_authenticated_user_cannot_restart_login_from_an_old_form(): void
    {
        $user = new User(['role' => 'admin']);
        $user->id = 123;
        $this->actingAs($user)->post('/login', [])->assertRedirectToRoute('dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_guest_still_sees_login_form(): void
    {
        $this->get('/login', ['X-Inertia' => 'true'])
            ->assertOk()->assertJsonPath('component', 'login');
        $this->assertGuest();
    }
}
