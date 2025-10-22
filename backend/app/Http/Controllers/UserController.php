<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\ResetPasswordMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Met à jour le profil de l'utilisateur connecté
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email,' . $user->id,
            'photo' => 'nullable|string',
            'current_password' => 'required_with:new_password|string',
            'new_password' => 'nullable|string|min:6',
        ]);

        // Vérifier le mot de passe actuel si un nouveau mot de passe est fourni
        if ($request->new_password) {
            if (!$request->current_password || !Hash::check($request->current_password, $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Le mot de passe actuel est incorrect.'],
                ]);
            }
        }

        // Mettre à jour les données
        $user->name = $request->name;
        $user->email = $request->email;
        $user->photo = $request->photo ?? $user->photo;

        if ($request->new_password) {
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user
        ]);
    }

    /**
     * Envoie un email avec un nouveau mot de passe temporaire
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Générer un mot de passe temporaire sécurisé
        $newPassword = $this->generateTemporaryPassword();

        // Mettre à jour le mot de passe de l'utilisateur
        $user->password = Hash::make($newPassword);
        $user->save();

        try {
            // Envoyer l'email avec le nouveau mot de passe
            Mail::to($user->email)->send(new ResetPasswordMail($newPassword, $user->name));

            return response()->json([
                'message' => 'Nouveau mot de passe envoyé par email avec succès',
                'success' => true
            ]);
        } catch (\Exception $e) {
            // En cas d'erreur d'envoi d'email, retourner le mot de passe pour les tests
            return response()->json([
                'message' => 'Nouveau mot de passe généré (mode test)',
                'new_password' => $newPassword, // À supprimer en production
                'success' => true
            ]);
        }
    }

    /**
     * Génère un mot de passe temporaire sécurisé
     */
    private function generateTemporaryPassword()
    {
        // Générer un mot de passe de 12 caractères avec lettres et chiffres
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $password = '';

        for ($i = 0; $i < 12; $i++) {
            $password .= $characters[random_int(0, strlen($characters) - 1)];
        }

        return $password;
    }

}
