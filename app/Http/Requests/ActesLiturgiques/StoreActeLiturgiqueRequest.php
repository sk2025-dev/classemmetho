<?php

namespace App\Http\Requests\ActesLiturgiques;

use App\Services\ProgrammeObsequesService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActeLiturgiqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalise le programme d'obsèques (lignes structurées) avant validation,
     * pour que le service qui persiste `details` reçoive des lignes propres.
     */
    protected function prepareForValidation(): void
    {
        $details = $this->input('details');

        if (is_array($details) && isset($details['programme_evenements']) && is_array($details['programme_evenements'])) {
            $details['programme_evenements'] = app(ProgrammeObsequesService::class)
                ->normalize($details['programme_evenements']);
            $this->merge(['details' => $details]);
        }
    }

    /**
     * Les règles imbriquées `details.programme_evenements.*` amènent Laravel à
     * ne conserver, dans `validated()['details']`, que la clé `programme_evenements`
     * et à supprimer `nom_defunt`, `lien_familial`, `sexe_defunt`, etc.
     * On restitue donc le tableau `details` complet (déjà normalisé dans
     * prepareForValidation()) après validation.
     */
    public function validated($key = null, $default = null)
    {
        $data = parent::validated();

        $fullDetails = (array) $this->input('details', []);
        if ($fullDetails !== []) {
            $data['details'] = array_merge($fullDetails, $data['details'] ?? []);
        }

        return data_get($data, $key, $default);
    }

    public function rules(): array
    {
        return array_merge(
            app(ProgrammeObsequesService::class)->rules('details.programme_evenements'),
            [
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
            ]
        );
    }

    public function messages(): array
    {
        return app(ProgrammeObsequesService::class)->messages('details.programme_evenements');
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
                // Le membre concerne est deja l'un des conjoints
                'mariage' => [],
                'naissance' => ['nom_enfant', 'date_naissance'],
                // Le membre concerne est deja le defunt
                'deces' => ['date_deces'],
            ];

            foreach (($requiredByType[$type] ?? []) as $field) {
                if (!array_key_exists($field, $details) || $details[$field] === null || $details[$field] === '') {
                    $validator->errors()->add("details.{$field}", "Le champ {$field} est obligatoire pour le type {$type}.");
                }
            }

            // Décès : si la famille déclare disposer d'un programme d'obsèques,
            // au moins une étape doit être renseignée.
            if (
                $type === 'deces'
                && ($details['programme_obseques'] ?? null) === 'oui'
                && empty($details['programme_evenements'])
            ) {
                $validator->errors()->add(
                    'details.programme_evenements',
                    "Ajoutez au moins une étape au programme d'obsèques, ou indiquez que vous n'en disposez pas encore."
                );
            }

            if ($type === 'naissance') {
                $nomPere = trim((string) ($details['nom_pere'] ?? ''));
                $nomMere = trim((string) ($details['nom_mere'] ?? ''));
                $parents = trim((string) ($details['parents'] ?? ''));
                $lien = trim((string) ($details['lien_enfant'] ?? ''));

                if ($lien === 'Pere' && $nomMere === '') {
                    $validator->errors()->add(
                        'details.nom_mere',
                        'Le nom de la mere est obligatoire quand le lien avec l\'enfant est Pere.'
                    );
                    return;
                }

                if ($lien === 'Mere' && $nomPere === '') {
                    $validator->errors()->add(
                        'details.nom_pere',
                        'Le nom du pere est obligatoire quand le lien avec l\'enfant est Mere.'
                    );
                    return;
                }

                if ($nomPere === '' && $nomMere === '' && $parents === '') {
                    $validator->errors()->add(
                        'details.nom_pere',
                        'Renseignez au moins un parent (nom du pere ou nom de la mere).'
                    );
                }
            }
        });
    }
}
