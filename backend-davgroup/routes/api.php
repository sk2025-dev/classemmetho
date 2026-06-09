<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RdvController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BeautyServiceController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'DAVGROUP API',
        'endpoints' => [
            'GET /api/categories',
            'GET /api/products',
            'GET /api/products/{id}',
            'POST /api/login',
            'POST /api/logout',
            'GET /api/user',
            'GET /api/rdv',
            'POST /api/rdv',
        ],
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/beauty-services', [BeautyServiceController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/rdv', [RdvController::class, 'index']);
    Route::post('/rdv', [RdvController::class, 'store']);
    Route::post('/beauty-services', [BeautyServiceController::class, 'store']);
    Route::match(['put', 'post'], '/beauty-services/{beautyService}', [BeautyServiceController::class, 'update']);
    Route::delete('/beauty-services/{beautyService}', [BeautyServiceController::class, 'destroy']);
});
