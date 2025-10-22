<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Routes d'authentification (publiques)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes de mot de passe oublié (publiques)
Route::post('/forgot-password', [UserController::class, 'forgotPassword']);



// Routes protégées par Sanctum
Route::middleware('auth:sanctum')->group(function () {
    // Profil utilisateur
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Mise à jour du profil
    Route::put('/user/update', [UserController::class, 'update']);

    // Routes pour les todos
    Route::apiResource('todos', TodoController::class);

    // Route de déconnexion
    Route::post('/logout', [AuthController::class, 'logout']);
});
