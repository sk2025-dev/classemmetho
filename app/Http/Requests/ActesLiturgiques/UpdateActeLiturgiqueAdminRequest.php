<?php

namespace App\Http\Requests\ActesLiturgiques;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateActeLiturgiqueAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type_acte' => ['sometimes', Rule::in([
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
            'details' => ['sometimes', 'array'],
            'note_conducteur' => ['nullable', 'string'],
            'note_pastorale' => ['nullable', 'string'],
            'note_admin' => ['nullable', 'string'],
        ];
    }
}
