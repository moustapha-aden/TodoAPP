<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Gère l'inscription d'un nouvel utilisateur.
     */
    public function register(Request $request)
    {
        // 1. Validation des données
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        // 2. Création de l'utilisateur
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            // Laravel 10+ gère le hachage via le cast, mais Hash::make est plus explicite ici
            'password' => Hash::make($request->password),
            'role' => 'user', // Rôle par défaut
            'status' => 'active', // Statut par défaut
            'photo' => $request->photo ?? null,
        ]);

        // 3. Réponse JSON
        return response()->json([
            'message' => 'Utilisateur créé avec succès !',
            'user' => $user
        ], 201);
    }

    /**
     * Gère la connexion et la génération du token Sanctum.
     */
    public function login(Request $request)
    {
        // 1. Validation des données
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // 2. Trouver l'utilisateur
        $user = User::where('email', $request->email)->first();

        // 3. Vérification des identifiants
        if (!$user || !Hash::check($request->password, $user->password)) {
            // Lève une exception de validation personnalisée pour un statut 401
            throw ValidationException::withMessages([
                'message' => ['Email ou mot de passe incorrect.'],
            ])->status(401);
        }

        // 4. Suppression des anciens tokens (optionnel, pour plus de sécurité)
        $user->tokens()->delete();

        // 5. Génération du token Sanctum (sans expiration)
        // Les tokens sont généralement nommés pour identifier leur client (ex: 'mobile', 'web', 'admin-token')
        $token = $user->createToken('auth-token')->plainTextToken;

        // 6. Réponse JSON
        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user,
            // C'est le token que votre application front-end doit enregistrer !
            'token' => $token,
        ], 200);
    }

    /**
     * Gère la déconnexion et la révocation des tokens.
     */
    public function logout(Request $request)
    {
        // Supprime le token actuel utilisé pour cette requête
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie et token révoqué.'
        ], 200);
    }
}
