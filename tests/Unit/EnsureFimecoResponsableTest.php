<?php

namespace Tests\Unit;

use App\Models\Fonction;
use App\Models\User;
use App\Support\FimecoAccess;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class EnsureFimecoResponsableTest extends TestCase
{
    public function test_admin_can_access_the_global_fimeco_module(): void
    {
        $this->assertTrue(FimecoAccess::canManage($this->userWith(role: 'admin')));
    }

    public function test_user_with_fimeco_function_can_access_the_global_module(): void
    {
        $user = $this->userWith(role: 'membre_famille');
        $user->setRelation('fonctions', new Collection([
            new Fonction(['nom' => 'Responsable FIMECO']),
        ]));

        $this->assertTrue(FimecoAccess::canManage($user));
    }

    public function test_user_without_fimeco_function_is_denied(): void
    {
        $this->assertFalse(FimecoAccess::canManage($this->userWith(role: 'conducteur')));
        $this->assertFalse(FimecoAccess::canManage(null));
    }

    private function userWith(string $role): User
    {
        $user = new User(['role' => $role]);
        $user->setRelation('fonction', null);
        $user->setRelation('fonctions', new Collection());

        return $user;
    }
}
