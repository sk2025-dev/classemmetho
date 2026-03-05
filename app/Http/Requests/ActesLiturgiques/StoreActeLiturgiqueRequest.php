<?php

namespace App\Http\Requests\ActesLiturgiques;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActeLiturgiqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type_acte' => ['required', Rule::in([
                'bapteme',
                'premiere_communion',
                'bapteme_premiere_communion',
                'confirmation',
                'mariage',
                'naissance',
                'deces',
            ])],
            'membre_id' => ['nullable', 'integer', 'exists:users,id'],
            'classe_id' => ['nullable', 'integer', 'exists:classes,id'],
            'date_souhaitee' => ['nullable', 'date'],
            'details' => ['required', 'array'],
            'pieces_jointes' => ['nullable', 'array', 'max:5'],
            'pieces_jointes.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'note_conducteur' => ['nullable', 'string'],
            'note_pastorale' => ['nullable', 'string'],
            'note_admin' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $details = (array) $this->input('details', []);
            $type = $this->input('type_acte');

            $requiredByType = [
                // baptême form does not include a generic "date" field anymore,
                // frontend only sends date_souhaitee / details specific keys, so
                // we no longer force a missing key here. keep the entry in case
                // we want to add other requirements later.
                'bapteme' => [],
                'premiere_communion' => ['date', 'lieu'],
                'bapteme_premiere_communion' => ['date', 'lieu'],
                'confirmation' => ['confirmand', 'date', 'lieu'],
                'mariage' => ['conjoint_1', 'conjoint_2', 'date', 'lieu', 'type_mariage'],
                'naissance' => ['nom_enfant', 'date_naissance', 'parents'],
                'deces' => ['nom_defunt', 'date_deces', 'lien_familial'],
            ];

            foreach (($requiredByType[$type] ?? []) as $field) {
                if (!array_key_exists($field, $details) || $details[$field] === null || $details[$field] === '') {
                    $validator->errors()->add("details.{$field}", "Le champ {$field} est obligatoire pour le type {$type}.");
                }
            }
        });
    }
}
