<?php

namespace Tests\Unit;

use App\Models\Fonction;
use App\Models\User;
use App\Support\FimecoAccess;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class EnsureFimecoPointFocalTest extends TestCase
{
    public function test_user_with_function_and_classe_is_point_focal_of_their_own_classe(): void
    {
        $user = $this->userWith(role: 'membre_famille', classeId: 2);
        $user->setRelation('fonctions', new Collection([
            new Fonction(['nom' => 'Point Focal FIMECO']),
        ]));

        $this->assertTrue(FimecoAccess::isPointFocal($user));
        $this->assertSame(2, FimecoAccess::pointFocalClasseId($user));
    }

    public function test_user_with_function_but_without_classe_is_denied(): void
    {
        $user = $this->userWith(role: 'membre_famille', classeId: null);
        $user->setRelation('fonctions', new Collection([
            new Fonction(['nom' => 'Point Focal FIMECO']),
        ]));

        $this->assertFalse(FimecoAccess::isPointFocal($user));
        $this->assertNull(FimecoAccess::pointFocalClasseId($user));
    }

    public function test_user_without_function_is_denied_even_with_a_classe(): void
    {
        $this->assertFalse(FimecoAccess::isPointFocal($this->userWith(role: 'conducteur', classeId: 2)));
        $this->assertNull(FimecoAccess::pointFocalClasseId(null));
    }

    public function test_point_focal_is_scoped_and_does_not_grant_global_access(): void
    {
        $user = $this->userWith(role: 'membre_famille', classeId: 2);
        $user->setRelation('fonctions', new Collection([
            new Fonction(['nom' => 'Point Focal FIMECO']),
        ]));

        $this->assertFalse(FimecoAccess::canManage($user));
    }

    private function userWith(string $role, ?int $classeId): User
    {
        $user = new User(['role' => $role, 'classe_id' => $classeId]);
        $user->setRelation('fonction', null);
        $user->setRelation('fonctions', new Collection());

        return $user;
    }
}
