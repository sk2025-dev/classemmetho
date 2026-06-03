<?php

namespace App\Http\Requests\ActesLiturgiques;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActeLiturgiquePasteurRequest extends FormRequest
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
            'membre_id' => ['required', 'integer', 'exists:users,id'],
            'classe_id' => ['nullable', 'integer', 'exists:classes,id'],
            'date_souhaitee' => ['nullable', 'date'],
            'details' => ['nullable', 'array'],
        ];
    }
}
