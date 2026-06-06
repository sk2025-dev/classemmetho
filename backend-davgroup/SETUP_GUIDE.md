# Prochaines étapes - Installation et utilisation

## 1. Exécuter les migrations

Exécutez les migrations pour créer toutes les tables dans la base de données:

```bash
cd backend-davgroup
php artisan migrate
```

Cela créera les tables suivantes:
- `categories` - Catégories de produits
- `products` - Produits
- `promotions` - Promotions et réductions
- `rdvs` - Rendez-vous
- `orders` - Commandes
- `order_items` - Articles de commande

## 2. Remplir la base de données avec des données de test

```bash
php artisan db:seed
```

Cela exécutera tous les seeders et créera:
- 5 catégories
- 12 produits
- 5 promotions de test

## 3. Créer les contrôleurs API (recommandé)

Pour créer des contrôleurs API pour gérer les modèles:

```bash
php artisan make:controller Api/CategoryController --resource
php artisan make:controller Api/ProductController --resource
php artisan make:controller Api/PromotionController --resource
php artisan make:controller Api/RdvController --resource
php artisan make:controller Api/OrderController --resource
php artisan make:controller Api/OrderItemController --resource
```

## 4. Ajouter les routes API

Modifiez `routes/api.php`:

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\RdvController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Routes publiques
Route::apiResource('categories', CategoryController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('promotions', PromotionController::class);

// Routes pour les rendez-vous (peuvent être publiques ou protégées)
Route::apiResource('rdvs', RdvController::class);
Route::get('rdvs/upcoming', [RdvController::class, 'upcoming']);
Route::get('rdvs/past', [RdvController::class, 'past']);

// Routes pour les commandes (devraient être protégées)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('orders', OrderController::class);
    Route::post('orders/{order}/ship', [OrderController::class, 'ship']);
    Route::post('orders/{order}/deliver', [OrderController::class, 'deliver']);
    Route::post('orders/{order}/pay', [OrderController::class, 'pay']);
});
```

## 5. Créer des accesseurs et mutateurs (optionnel mais recommandé)

### Pour Product:
```php
// Dans le modèle Product
protected $appends = ['profit_margin', 'stock_status'];

public function getProfitMarginAttribute()
{
    if ($this->cost == 0) return 0;
    return round(($this->price - $this->cost) / $this->cost * 100, 2);
}

public function getStockStatusAttribute()
{
    if ($this->quantity <= 0) return 'out_of_stock';
    if ($this->quantity <= $this->min_quantity) return 'low_stock';
    return 'in_stock';
}
```

### Pour Order:
```php
// Dans le modèle Order
protected $appends = ['days_since_order', 'is_recent'];

public function getDaysSinceOrderAttribute()
{
    return $this->created_at->diffInDays(now());
}

public function getIsRecentAttribute()
{
    return $this->created_at->diffInDays(now()) <= 7;
}
```

## 6. Ajouter la validation (recommandé)

Créez des FormRequest pour valider les données:

```bash
php artisan make:request StoreProductRequest
php artisan make:request UpdateProductRequest
php artisan make:request StoreOrderRequest
php artisan make:request StoreRdvRequest
```

Exemple pour `StoreProductRequest`:
```php
public function rules(): array
{
    return [
        'category_id' => 'required|exists:categories,id',
        'name' => 'required|string|max:255',
        'slug' => 'required|string|unique:products,slug',
        'description' => 'nullable|string',
        'price' => 'required|numeric|min:0',
        'cost' => 'nullable|numeric|min:0',
        'quantity' => 'required|integer|min:0',
        'min_quantity' => 'required|integer|min:0',
        'sku' => 'required|string|unique:products,sku',
        'is_active' => 'boolean',
    ];
}
```

## 7. Créer des événements et listeners (optionnel)

Par exemple, pour envoyer une notification lors de la création d'une commande:

```bash
php artisan make:event OrderCreated
php artisan make:listener SendOrderConfirmation
```

## 8. Ajouter des relations supplémentaires

Si vous avez besoin de relations many-to-many (ex: produits dans plusieurs promotions), créez une table pivot:

```bash
php artisan make:migration create_product_promotion_table
```

## 9. Créer des requêtes utiles

Exemples de requêtes fréquentes à encapsuler dans des scopes:

```php
// Modèle Product
public function scopeActive($query)
{
    return $query->where('is_active', true);
}

public function scopeOutOfStock($query)
{
    return $query->where('quantity', '<=', 0);
}

public function scopeByCategory($query, $categoryId)
{
    return $query->where('category_id', $categoryId);
}

// Utilisation: Product::active()->byCategory(1)->get();
```

## 10. Tester avec Tinker

Testez vos modèles interactivement:

```bash
php artisan tinker
```

Alors:
```php
>>> $product = App\Models\Product::first();
>>> $product->category;
>>> $product->activePromotions()->get();
>>> $order = App\Models\Order::create([...]);
>>> $order->items()->create([...]);
```

## 11. Créer les migrations facultatives

Si vous voulez ajouter des colonnes supplémentaires à l'utilisateur (soft deletes):

```bash
php artisan make:migration add_soft_deletes_to_users_table
```

Contenu:
```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->softDeletes();
    });
}
```

## 12. Interface d'administration (optionnel)

Envisagez d'ajouter FilamentPHP, Nova, ou un autre admin panel pour gérer les produits:

```bash
composer require filament/filament
php artisan filament:install --scaffolding
```

---

## Récapitulatif des fichiers créés

### Migrations:
- ✅ `create_categories_table.php`
- ✅ `create_products_table.php`
- ✅ `create_promotions_table.php`
- ✅ `create_rdvs_table.php`
- ✅ `create_orders_table.php`
- ✅ `create_order_items_table.php`

### Modèles:
- ✅ `Category.php`
- ✅ `Product.php`
- ✅ `Promotion.php`
- ✅ `Rdv.php`
- ✅ `Order.php`
- ✅ `OrderItem.php`
- ✅ `User.php` (modifié)

### Seeders:
- ✅ `CategorySeeder.php`
- ✅ `ProductSeeder.php`
- ✅ `PromotionSeeder.php`
- ✅ `DatabaseSeeder.php` (modifié)

### Documentation:
- ✅ `DATABASE_STRUCTURE.md`
- ✅ `SETUP_GUIDE.md` (ce fichier)

---

## Commandes utiles

```bash
# Voir toutes les routes
php artisan route:list

# Réinitialiser complètement la base
php artisan migrate:fresh --seed

# Voir les modèles et leurs relations
php artisan tinker
>>> App\Models\Product::with('category', 'promotions')->get();

# Générer des données de test (si vous avez des factories)
php artisan tinker
>>> App\Models\Product::factory(50)->create();

# Voir l'état des migrations
php artisan migrate:status

# Faire une copie de la base avant les changements
# (recommandé en production)
```

---

## Support et documentation

Pour plus d'informations:
- [Documentation Laravel](https://laravel.com/docs)
- [Documentation Eloquent](https://laravel.com/docs/eloquent)
- [Migrations Laravel](https://laravel.com/docs/migrations)
