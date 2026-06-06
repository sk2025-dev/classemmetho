# Structure des Modèles et Migrations

## Vue d'ensemble

Cet ensemble de modèles et migrations gère complètement les produits, catégories, promotions, commandes et rendez-vous.

---

## Modèles créés

### 1. **Category** (`app/Models/Category.php`)
Gère les catégories de produits.

**Colonnes:**
- `id` - Identifiant
- `name` - Nom de la catégorie (unique)
- `slug` - Slug pour l'URL (unique)
- `description` - Description
- `image` - Image de la catégorie
- `is_active` - Statut actif/inactif
- `timestamps` - created_at, updated_at
- `soft_deletes` - deleted_at

**Relations:**
- `products()` - Relation 1:N avec les produits

**Utilisation:**
```php
$category = Category::where('slug', 'soins-capillaires')->first();
$products = $category->products;
```

---

### 2. **Product** (`app/Models/Product.php`)
Gère les produits.

**Colonnes:**
- `id` - Identifiant
- `category_id` - Référence à la catégorie (clé étrangère)
- `name` - Nom du produit
- `slug` - Slug pour l'URL (unique)
- `description` - Description
- `price` - Prix de vente (decimal 10,2)
- `cost` - Coût d'acquisition (decimal 10,2)
- `quantity` - Stock disponible
- `min_quantity` - Stock minimum avant alerte
- `image` - Image du produit
- `sku` - Code SKU (unique)
- `is_active` - Statut actif/inactif
- `timestamps` - created_at, updated_at
- `soft_deletes` - deleted_at

**Relations:**
- `category()` - Relation N:1 avec la catégorie
- `promotions()` - Relation 1:N avec les promotions
- `orderItems()` - Relation 1:N avec les articles de commande

**Méthodes utiles:**
```php
// Obtenir les promotions actives
$product->activePromotions();

// Vérifier le stock
$product->isOutOfStock();
$product->isLowStock();
```

---

### 3. **Promotion** (`app/Models/Promotion.php`)
Gère les promotions et réductions.

**Colonnes:**
- `id` - Identifiant
- `product_id` - Référence au produit (clé étrangère)
- `title` - Titre de la promotion
- `description` - Description
- `discount_type` - Type de réduction (percentage/fixed)
- `discount_value` - Montant de la réduction (decimal 10,2)
- `start_date` - Date de début
- `end_date` - Date de fin
- `quantity_limit` - Limite de quantité (nullable)
- `quantity_used` - Quantité utilisée
- `is_active` - Statut actif/inactif
- `timestamps` - created_at, updated_at
- `soft_deletes` - deleted_at

**Relations:**
- `product()` - Relation N:1 avec le produit

**Méthodes utiles:**
```php
// Vérifier si actif maintenant
$promotion->isActive();

// Calculer le prix réduit
$discountedPrice = $promotion->getDiscountedPrice($product->price);

// Obtenir le montant de réduction
$discount = $promotion->getDiscountAmount($product->price);
```

---

### 4. **Rdv** (`app/Models/Rdv.php`)
Gère les rendez-vous.

**Colonnes:**
- `id` - Identifiant
- `user_id` - Référence à l'utilisateur (nullable, clé étrangère)
- `client_name` - Nom du client
- `client_email` - Email du client
- `client_phone` - Téléphone du client
- `appointment_date` - Date/heure du rendez-vous
- `service` - Service demandé
- `notes` - Notes/commentaires
- `status` - Statut (pending/confirmed/completed/cancelled)
- `duration` - Durée en minutes
- `is_notified` - Notification envoyée
- `timestamps` - created_at, updated_at
- `soft_deletes` - deleted_at

**Relations:**
- `user()` - Relation N:1 avec l'utilisateur

**Méthodes utiles:**
```php
// Vérifier si passé ou à venir
$rdv->isPassed();
$rdv->isUpcoming();

// Requêtes utiles
Rdv::upcoming()->get();
Rdv::past()->get();

// Changer le statut
$rdv->confirm();
$rdv->complete();
$rdv->cancel();
```

---

### 5. **Order** (`app/Models/Order.php`)
Gère les commandes.

**Colonnes:**
- `id` - Identifiant
- `user_id` - Référence à l'utilisateur (nullable, clé étrangère)
- `order_number` - Numéro de commande (unique)
- `client_name` - Nom du client
- `client_email` - Email du client
- `client_phone` - Téléphone du client
- `shipping_address` - Adresse de livraison
- `billing_address` - Adresse de facturation
- `subtotal` - Sous-total (decimal 10,2)
- `tax` - Taxes (decimal 10,2)
- `shipping` - Frais de port (decimal 10,2)
- `discount` - Réduction (decimal 10,2)
- `total` - Total (decimal 10,2)
- `status` - Statut (pending/processing/shipped/delivered/cancelled/refunded)
- `payment_status` - Statut paiement (pending/paid/failed/refunded)
- `payment_method` - Méthode de paiement
- `notes` - Notes
- `shipped_at` - Date d'expédition
- `delivered_at` - Date de livraison
- `timestamps` - created_at, updated_at
- `soft_deletes` - deleted_at

**Relations:**
- `user()` - Relation N:1 avec l'utilisateur
- `items()` - Relation 1:N avec les articles de commande

**Méthodes utiles:**
```php
// Générer numéro de commande
$orderNumber = Order::generateOrderNumber();

// Recalculer le total
$order->recalculateTotal()->save();

// Changer le statut
$order->markAsPaid();
$order->markAsShipped();
$order->markAsDelivered();
$order->cancel();

// Vérifier
$order->canBeModified();
$order->isPaid();
```

---

### 6. **OrderItem** (`app/Models/OrderItem.php`)
Gère les articles d'une commande.

**Colonnes:**
- `id` - Identifiant
- `order_id` - Référence à la commande (clé étrangère)
- `product_id` - Référence au produit (clé étrangère)
- `quantity` - Quantité
- `unit_price` - Prix unitaire (decimal 10,2)
- `discount` - Réduction (decimal 10,2)
- `total` - Total (decimal 10,2)

**Relations:**
- `order()` - Relation N:1 avec la commande
- `product()` - Relation N:1 avec le produit

**Méthodes utiles:**
```php
// Recalculer le total
$item->recalculateTotal()->save();
```

---

## Migrations

### Fichiers créés/modifiés:

1. **2026_06_02_164821_create_categories_table.php**
2. **2026_06_02_164821_create_products_table.php**
3. **2026_06_02_164822_create_promotions_table.php**
4. **2026_06_02_164822_create_rdvs_table.php**
5. **2026_06_02_164823_create_orders_table.php**
6. **2026_06_02_164823_create_order_items_table.php**

### Comment exécuter les migrations:

```bash
php artisan migrate
```

Pour annuler:
```bash
php artisan migrate:rollback
```

---

## Seeders

Des seeders ont été créés pour remplir la base avec des données de test:

### 1. **CategorySeeder**
Crée 5 catégories de base (Soins Capillaires, Cosmétiques, SPA, Accessoires, Coiffage)

### 2. **ProductSeeder**
Crée 12 produits de test répartis dans les 5 catégories

### 3. **PromotionSeeder**
Crée 5 promotions de test avec différents états

### Comment exécuter les seeders:

```bash
# Tous les seeders
php artisan db:seed

# Seul le CategorySeeder
php artisan db:seed --class=CategorySeeder

# Seul le ProductSeeder
php artisan db:seed --class=ProductSeeder

# Seul le PromotionSeeder
php artisan db:seed --class=PromotionSeeder
```

---

## Relations entre les modèles

```
User (1) ──── (N) Order
  │
  └─── (1) ──── (N) Rdv

Category (1) ──── (N) Product
  │
  └─── (N) ──── (1) Promotion

Product (1) ──── (N) OrderItem
  │
  └─── (1) ──── (N) Promotion

Order (1) ──── (N) OrderItem
```

---

## Exemples d'utilisation

### Récupérer les produits d'une catégorie avec leurs promotions actives:
```php
$category = Category::find(1);
$productsWithPromos = $category->products->map(function ($product) {
    return [
        'product' => $product,
        'promotions' => $product->activePromotions()->get(),
    ];
});
```

### Créer une commande avec des articles:
```php
$order = Order::create([
    'user_id' => auth()->id(),
    'order_number' => Order::generateOrderNumber(),
    'client_name' => 'Jean Dupont',
    'client_email' => 'jean@example.com',
    'client_phone' => '06 12 34 56 78',
    'shipping_address' => '123 Rue de la Paix, 75000 Paris',
]);

// Ajouter des articles
$product = Product::find(1);
$order->items()->create([
    'product_id' => $product->id,
    'quantity' => 2,
    'unit_price' => $product->price,
    'total' => $product->price * 2,
]);

// Recalculer le total
$order->recalculateTotal();
$order->tax = $order->subtotal * 0.20; // TVA 20%
$order->total = $order->subtotal + $order->tax + $order->shipping - $order->discount;
$order->save();
```

### Gérer les rendez-vous:
```php
// Créer un rendez-vous
$rdv = Rdv::create([
    'client_name' => 'Marie Dupont',
    'client_email' => 'marie@example.com',
    'client_phone' => '06 98 76 54 32',
    'appointment_date' => now()->addDay(),
    'service' => 'Coiffage',
    'duration' => '60',
]);

// Récupérer les rendez-vous à venir
$upcomingRdvs = Rdv::upcoming()->get();

// Confirmer un rendez-vous
$rdv->confirm();
```

---

## Notes importantes

- Toutes les tables (sauf OrderItem) utilisent **soft deletes** pour les suppressions logiques
- Les modèles **Product**, **Promotion**, **Order**, et **Rdv** ont un champ `is_active` pour contrôler leur visibilité
- Les **ordres** génèrent automatiquement un numéro unique au format `ORD-YYYYMMDD-XXXXXX`
- Les **relations** sont bien définies avec les bonnes règles de suppression (cascade, restrict, set null)
- Les **promotions** peuvent être de deux types : pourcentage ou montant fixe
- Les **commandes** gardent une trace de toutes les transactions (statut, paiement, dates)

