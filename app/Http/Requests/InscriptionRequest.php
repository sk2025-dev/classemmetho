<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'in:famille,conducteur'],

            // Responsable (champ obligatoires pour type=famille)
            'name' => ['required_if:type,famille', 'string', 'max:255'],
            'prenom' => ['required_if:type,famille', 'string', 'max:255'],
            'email' => ['required_if:type,famille', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'telephone' => ['required_if:type,famille', 'string', 'max:50'],
            'date_naissance' => ['required_if:type,famille', 'date'],
            'genre' => ['required_if:type,famille', 'string', 'max:20'],
            'profession' => ['required_if:type,famille', 'string', 'max:255'],
            'statutMarital' => ['required_if:type,famille', 'string', 'max:50'],

            // Optional / meta
            'role' => ['nullable', 'string', 'max:50'],
            'classe_id' => ['nullable', 'integer', 'exists:classes,id'],

            // Famille and members
            'famille' => ['required_if:type,famille', 'array'],
            'famille.nom' => ['required_if:type,famille', 'string', 'max:255'],
            'famille.adresse' => ['nullable', 'string', 'max:500'],
            'famille.quartier' => ['required_if:type,famille', 'string', 'max:255'],
            'famille.ville' => ['required_if:type,famille', 'string', 'max:255'],
            'famille.telephone' => ['required_if:type,famille', 'string', 'max:50'],

            'membres' => ['nullable', 'array'],
            'membres.*.nom' => ['required_with:membres', 'string', 'max:255'],
            'membres.*.prenom' => ['required_with:membres', 'string', 'max:255'],
            'membres.*.relation' => ['required_with:membres', 'string', 'max:100'],

            'consentement' => ['required_if:type,famille', 'accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            // Famille
            'famille.nom.required_if' => 'Le nom de la famille est requis.',
            'famille.quartier.required_if' => 'Le quartier est requis.',
            'famille.ville.required_if' => 'La ville est requise.',
            'famille.telephone.required_if' => 'Le téléphone de la famille est requis.',

            // Responsable
            'name.required_if' => 'Le nom du responsable est requis.',
            'prenom.required_if' => 'Le prénom du responsable est requis.',
            'email.required_if' => 'L\'email est requis.',
            'email.unique' => 'Cet email est déjà utilisé.',
            'email.email' => 'Le format de l\'email est invalide.',
            'telephone.required_if' => 'Le téléphone du responsable est requis.',
            'date_naissance.required_if' => 'La date de naissance est requise.',
            'genre.required_if' => 'Le genre est requis.',
            'profession.required_if' => 'La profession est requise.',
            'statutMarital.required_if' => 'Le statut marital est requis.',

            // Membres
            'membres.*.nom.required_with' => 'Le nom du membre est requis.',
            'membres.*.prenom.required_with' => 'Le prénom du membre est requis.',
            'membres.*.relation.required_with' => 'La relation / lien filial est requise pour chaque membre.',
        ];
    }
}
