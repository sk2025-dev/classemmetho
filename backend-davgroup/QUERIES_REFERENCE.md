# Requêtes courantes - Références rapides

## Produits

### Récupérer tous les produits actifs avec leur catégorie
```php
$products = Product::active()
    ->with('category')
    ->get();
```

### Récupérer les produits avec stock faible
```php
$lowStockProducts = Product::where('quantity', '<=', 'min_quantity')
    ->get();
```

### Récupérer les produits d'une catégorie
```php
$categoryProducts = Category::find(1)
    ->products()
    ->active()
    ->get();
```

### Obtenir un produit avec ses promotions actives
```php
$product = Product::with('activePromotions')
    ->find(1);
```

### Rechercher un produit par nom
```php
$products = Product::where('name', 'like', '%shampooing%')
    ->active()
    ->get();
```

### Produits avec prix entre deux montants
```php
$products = Product::whereBetween('price', [10, 30])
    ->get();
```

---

## Promotions

### Récupérer toutes les promotions actives actuellement
```php
$activePromos = Promotion::where('is_active', true)
    ->where('start_date', '<=', now())
    ->where('end_date', '>=', now())
    ->with('product')
    ->get();
```

### Obtenir les promotions pour un produit
```php
$promos = Product::find(1)
    ->promotions()
    ->get();
```

### Promotions qui vont commencer bientôt (dans les 7 jours)
```php
$upcoming = Promotion::where('start_date', '>', now())
    ->where('start_date', '<=', now()->addDays(7))
    ->get();
```

### Promotions expirées
```php
$expired = Promotion::where('end_date', '<', now())
    ->get();
```

### Vérifier si la limite de quantité est atteinte
```php
$promos = Promotion::where('quantity_limit', '<=', 'quantity_used')
    ->get();
```

---

## Rendez-vous

### Récupérer les rendez-vous à venir (non annulés)
```php
$upcoming = Rdv::where('appointment_date', '>', now())
    ->where('status', '!=', 'cancelled')
    ->orderBy('appointment_date')
    ->get();
```

### Rendez-vous d'un utilisateur
```php
$userRdvs = User::find(1)
    ->rdvs()
    ->upcoming()
    ->get();
```

### Rendez-vous du jour
```php
$todayRdvs = Rdv::whereDate('appointment_date', today())
    ->where('status', '!=', 'cancelled')
    ->orderBy('appointment_date')
    ->get();
```

### Rendez-vous non confirmés depuis plus de 2 jours
```php
$notConfirmed = Rdv::where('status', 'pending')
    ->where('appointment_date', '<', now()->addDays(2))
    ->get();
```

### Créer un rendez-vous
```php
$rdv = Rdv::create([
    'user_id' => auth()->id(),
    'client_name' => 'Marie Dupont',
    'client_email' => 'marie@example.com',
    'client_phone' => '06 12 34 56 78',
    'appointment_date' => now()->addDay(2)->setTime(14, 30),
    'service' => 'Coiffage',
    'duration' => 60,
    'status' => 'pending',
]);
```

### Obtenir les statistiques des rendez-vous
```php
$stats = [
    'pending' => Rdv::where('status', 'pending')->count(),
    'confirmed' => Rdv::where('status', 'confirmed')->count(),
    'completed' => Rdv::where('status', 'completed')->count(),
    'cancelled' => Rdv::where('status', 'cancelled')->count(),
];
```

---

## Commandes

### Récupérer toutes les commandes
```php
$orders = Order::with('user', 'items.product')
    ->orderBy('created_at', 'desc')
    ->get();
```

### Commandes d'un utilisateur
```php
$userOrders = User::find(1)
    ->orders()
    ->with('items.product')
    ->orderBy('created_at', 'desc')
    ->get();
```

### Commandes en attente de paiement
```php
$unpaid = Order::where('payment_status', 'pending')
    ->get();
```

### Commandes non livrées
```php
$pending = Order::whereNotIn('status', ['delivered', 'cancelled'])
    ->get();
```

### Commandes du mois en cours
```php
$thisMonth = Order::whereMonth('created_at', now()->month)
    ->whereYear('created_at', now()->year)
    ->get();
```

### Créer une commande
```php
$order = Order::create([
    'user_id' => auth()->id(),
    'order_number' => Order::generateOrderNumber(),
    'client_name' => 'Jean Dupont',
    'client_email' => 'jean@example.com',
    'client_phone' => '06 98 76 54 32',
    'shipping_address' => '123 Rue de la Paix, 75000 Paris',
    'status' => 'pending',
    'payment_status' => 'pending',
]);
```

### Ajouter des articles à une commande
```php
$product = Product::find(1);
$order->items()->create([
    'product_id' => $product->id,
    'quantity' => 2,
    'unit_price' => $product->price,
    'total' => $product->price * 2,
]);

// Recalculer le total
$order->recalculateTotal();
$order->tax = $order->subtotal * 0.20;
$order->total = $order->subtotal + $order->tax + $order->shipping - $order->discount;
$order->save();
```

### Marquer une commande comme payée
```php
$order->markAsPaid()->save();
```

### Marquer une commande comme expédiée
```php
$order->markAsShipped()->save();
```

### Marquer une commande comme livrée
```php
$order->markAsDelivered()->save();
```

### Annuler une commande
```php
$order->cancel()->save();
```

### Obtenir le montant total des commandes d'un mois
```php
$totalMonthly = Order::whereMonth('created_at', 6)
    ->where('payment_status', 'paid')
    ->sum('total');
```

---

## Catégories

### Récupérer toutes les catégories actives
```php
$categories = Category::where('is_active', true)
    ->with('products')
    ->get();
```

### Catégories avec leur nombre de produits
```php
$categories = Category::withCount('products')
    ->get();
```

### Créer une catégorie
```php
$category = Category::create([
    'name' => 'Coiffure',
    'slug' => Str::slug('Coiffure'),
    'description' => 'Produits de coiffure',
    'is_active' => true,
]);
```

---

## Analyses et rapports

### Revenu total par statut de paiement
```php
$revenue = Order::where('payment_status', 'paid')
    ->selectRaw('SUM(total) as total')
    ->first();
```

### Produits les plus vendus
```php
$topProducts = OrderItem::selectRaw('product_id, COUNT(*) as sales_count, SUM(quantity) as total_quantity')
    ->groupBy('product_id')
    ->orderBy('total_quantity', 'desc')
    ->with('product')
    ->limit(10)
    ->get();
```

### Moyenne de valeur par commande
```php
$avgOrder = Order::where('payment_status', 'paid')
    ->avg('total');
```

### Nombre de commandes par jour
```php
$ordersByDay = Order::selectRaw('DATE(created_at) as date, COUNT(*) as count')
    ->groupBy('date')
    ->orderBy('date', 'desc')
    ->limit(30)
    ->get();
```

### Taux de conversion (commandes / visites estimées)
```php
// Supposant que vous avez une table visits
$conversionRate = Order::count() / Visit::count() * 100;
```

### Rendez-vous par service
```php
$rdvsByService = Rdv::selectRaw('service, COUNT(*) as count')
    ->groupBy('service')
    ->get();
```

### Revenus par catégorie de produit
```php
$revenueByCategory = OrderItem::selectRaw('
    c.id,
    c.name,
    SUM(oi.total) as revenue,
    COUNT(oi.id) as items_sold
')
    ->from('order_items', 'oi')
    ->join('products', 'p', 'oi.product_id', '=', 'p.id')
    ->join('categories', 'c', 'p.category_id', '=', 'c.id')
    ->groupBy('c.id', 'c.name')
    ->orderBy('revenue', 'desc')
    ->get();
```

---

## Paginaation et filtrage

### Produits avec pagination
```php
$products = Product::active()
    ->with('category')
    ->paginate(15);
```

### Filtrages multiples
```php
$query = Product::query();

if (request('category')) {
    $query->where('category_id', request('category'));
}

if (request('search')) {
    $query->where('name', 'like', '%' . request('search') . '%');
}

if (request('min_price')) {
    $query->where('price', '>=', request('min_price'));
}

if (request('max_price')) {
    $query->where('price', '<=', request('max_price'));
}

$products = $query->paginate(15);
```

---

## Gestion des erreurs

### Récupérer ou créer un produit
```php
$product = Product::firstOrCreate(
    ['sku' => 'PROD-001'],
    [
        'category_id' => 1,
        'name' => 'Produit Test',
        'slug' => 'produit-test',
        'price' => 19.99,
        'quantity' => 100,
    ]
);
```

### Récupérer ou échouer
```php
$product = Product::findOrFail($id); // Lève une exception 404
```

### Vérifier l'existence
```php
if (Product::where('sku', 'PROD-001')->exists()) {
    // ...
}
```

---

## Transactions (ACID)

### Créer une commande avec transaction
```php
\DB::transaction(function () {
    $order = Order::create([...]);
    
    foreach ($products as $product) {
        $order->items()->create([...]);
        $product->decrement('quantity');
    }
});
```

---

## Performance

### Requête optimisée avec eager loading
```php
// ✅ Bon - Charge les relations efficacement
$orders = Order::with('user', 'items.product')
    ->get();

// ❌ Mauvais - N+1 query problem
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->user->name; // Requête supplémentaire pour chaque commande
}
```

### Utiliser uniquement les colonnes nécessaires
```php
$products = Product::select('id', 'name', 'price', 'category_id')
    ->get();
```

