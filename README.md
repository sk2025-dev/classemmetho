# DAVGROUP

Projet web DAVGROUP avec un frontend React/Vite et un backend Laravel API.

## Structure

```txt
classemmetho_davgroup/
  frontend-davgroup/   # Application React séparée qui consomme l'API
  backend-davgroup/    # API Laravel séparée
  .gitignore
  README.md
```

## Installation Locale

Frontend source:

```bash
cd frontend-davgroup
npm install
```

Backend:

```bash
cd backend-davgroup
composer install
php artisan migrate
php artisan serve
```

Le backend sert uniquement l'API et la page Laravel par défaut.

## Variables D'environnement

Frontend:

```bash
cp frontend-davgroup/.env.example frontend-davgroup/.env
```

En local, le frontend tourne séparément et appelle l'API du backend sur http://127.0.0.1:8000/api.

Backend:

```bash
cp backend-davgroup/.env.example backend-davgroup/.env
php artisan key:generate
```

## Production

Le frontend React se compile avec `npm run build` dans `frontend-davgroup`.
Le backend Laravel doit etre deploye comme API indépendante avec `APP_ENV=production` et `APP_DEBUG=false`.
Le backend Laravel doit etre deploye avec `APP_ENV=production` et `APP_DEBUG=false`.

Les dossiers `node_modules/`, `vendor/`, `dist/`, `.env` et les caches ne doivent pas etre versionnes.
