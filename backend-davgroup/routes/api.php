<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RdvController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/rdv', [RdvController::class, 'index']);
    Route::post('/rdv', [RdvController::class, 'store']);
});
