<?php

namespace App\Models;

// NOUVEL IMPORT : Ajout du trait HasApiTokens
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    // UTILISATION DU TRAIT : Permet d'accéder aux méthodes tokens(), createToken(), etc.
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Les attributs qui peuvent être assignés en masse.
     * C'est essentiel pour la méthode User::create() dans le contrôleur.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'photo', // Ajouté suite à vos requêtes précédentes
        'role',  // Rôle de l'utilisateur (admin, client, technicien)
        'status', // Statut de l'utilisateur (actif, inactif)
    ];

    /**
     * Les attributs qui doivent être cachés pour les tableaux.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Les attributs qui doivent être castés en types natifs.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed', // Assure que le mot de passe est toujours haché
    ];

    /**
     * Relation avec les todos de l'utilisateur
     */
    public function todos()
    {
        return $this->hasMany(Todo::class);
    }
}
