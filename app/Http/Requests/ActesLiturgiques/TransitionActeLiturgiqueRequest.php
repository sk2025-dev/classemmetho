<?php

namespace App\Http\Requests\ActesLiturgiques;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionActeLiturgiqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', Rule::in([
                'EN_ATTENTE_CONDUCTEUR',
                'TRANSMISE_AU_BUREAU_CONDUCTEUR',
                'REFUSEE_PAR_BUREAU_CONDUCTEUR',
                'TRANSMISE_AU_PASTEUR',
                'VALIDEE',
                'CELEBRE',
                'TERMINE',
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
                'ARCHIVEE',
            ])],
            'commentaire' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $status = $this->input('statut');
            $comment = trim((string) $this->input('commentaire', ''));

            $refusStatuts = [
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_BUREAU_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
            ];

            if (in_array($status, $refusStatuts, true) && $comment === '') {
                $validator->errors()->add('commentaire', 'Le motif est obligatoire en cas de refus.');
            }
        });
    }
}
