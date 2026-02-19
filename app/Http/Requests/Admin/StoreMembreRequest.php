<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMembreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'nullable|email|unique:users,email',
            'telephone' => 'nullable|string|max:20',
            'date_naissance' => 'nullable|date',
            'genre' => 'nullable|in:M,F,Autre',
            'profession' => 'nullable|string|max:100',
            'relation' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:admin,chef_de_famille,membre_famille,responsable_classe',
            'fonction_id' => 'nullable|exists:fonctions,id',
            'classe_id' => 'nullable|exists:classes,id',
            'family_id' => 'nullable|exists:families,id',
            'identifier' => 'nullable|string|unique:users,identifier',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'email.unique' => 'Cet email est déjà utilisé.',
            'email.email' => 'L\'email doit être valide.',
            'photo.image' => 'La photo doit être une image.',
            'photo.mimes' => 'La photo doit être un fichier JPEG, PNG, JPG ou GIF.',
            'photo.max' => 'La photo ne doit pas dépasser 2 MB.',
        ];
    }
}
