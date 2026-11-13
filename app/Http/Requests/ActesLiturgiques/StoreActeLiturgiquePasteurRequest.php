<?php

namespace App\Http\Requests\ActesLiturgiques;

use Carbon\Carbon;
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
            'pieces_jointes' => ['nullable', 'array', 'max:5'],
            'pieces_jointes.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $details = (array) $this->input('details', []);
            $type = $this->input('type_acte');

            // Validation des dates : ne pas accepter de dates futures pour les événements passés
            if ($type === 'naissance' && !empty($details['date_naissance'])) {
                $dateNaissance = Carbon::parse($details['date_naissance']);
                if ($dateNaissance->gt(now())) {
                    $validator->errors()->add('details.date_naissance', 'La date de naissance ne peut pas être dans le futur.');
                }
            }

            if ($type === 'deces' && !empty($details['date_deces'])) {
                $dateDeces = Carbon::parse($details['date_deces']);
                if ($dateDeces->gt(now())) {
                    $validator->errors()->add('details.date_deces', 'La date de décès ne peut pas être dans le futur.');
                }
            }
        });
    }
}
