<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TodoController extends Controller
{
    /**
     * Affiche la liste des todos de l'utilisateur connecté
     */
    public function index()
    {
        $todos = Auth::user()->todos()->orderBy('created_at', 'desc')->get();

        return response()->json([
            'todos' => $todos
        ]);
    }

    /**
     * Crée une nouvelle todo
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        $todo = Auth::user()->todos()->create([
            'title' => $request->title,
            'description' => $request->description,
            'due_date' => $request->due_date,
            'priority' => $request->priority ?? 'medium',
        ]);

        return response()->json([
            'message' => 'Todo créée avec succès',
            'todo' => $todo
        ], 201);
    }

    /**
     * Affiche une todo spécifique
     */
    public function show(string $id)
    {
        $todo = Auth::user()->todos()->findOrFail($id);

        return response()->json([
            'todo' => $todo
        ]);
    }

    /**
     * Met à jour une todo
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'sometimes|boolean',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        $todo = Auth::user()->todos()->findOrFail($id);
        $todo->update($request->only(['title', 'description', 'completed', 'due_date', 'priority']));

        return response()->json([
            'message' => 'Todo mise à jour avec succès',
            'todo' => $todo
        ]);
    }

    /**
     * Supprime une todo
     */
    public function destroy(string $id)
    {
        $todo = Auth::user()->todos()->findOrFail($id);
        $todo->delete();

        return response()->json([
            'message' => 'Todo supprimée avec succès'
        ]);
    }
}
