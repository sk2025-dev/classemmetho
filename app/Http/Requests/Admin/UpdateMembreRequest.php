<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMembreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id') ?? $this->route('user');

        return [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'genre' => ['nullable', 'in:M,F,Autre'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'date_naissance' => ['nullable', 'date'],
            'role' => ['nullable', 'string', 'max:50'],
            'profession' => ['nullable', 'string', 'max:255'],
            'relation' => ['nullable', 'string', 'max:100'],
            'fonction_id' => ['nullable', 'integer', 'exists:fonctions,id'],
            'classe_id' => ['nullable', 'integer', 'exists:classes,id'],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:5120'],
            'identifier' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('users', 'identifier')->ignore($userId),
            ],
        ];
    }
}
