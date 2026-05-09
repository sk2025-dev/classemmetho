<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserSacrement;
use App\Models\Family;
use App\Jobs\SendCredentialsEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use App\Traits\GeneratesIdentifier;
use Carbon\Carbon;

class ExcelImportController extends Controller
{
    /**
     * Traite l'upload et l'import du fichier Excel
     */
    public function import(Request $request)
    {
        try {
            // Valider le fichier
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls',
            ]);

            // Sauvegarder le fichier temporairement (le disque 'local' pointe déjà vers storage/app/private)
            $filePath = $request->file('file')->store('temp_excel');
            $fullPath = storage_path('app/private/' . $filePath);

            if (!file_exists($fullPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le fichier n\'a pas pu être sauvegardé.',
                ], 400);
            }

            // Charger le fichier et vérifier les feuilles disponibles
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($fullPath);
            $sheetNames = $spreadsheet->getSheetNames();

            \Log::info('Excel Import: Feuilles trouvées à la position: ' . $fullPath);
            \Log::info('Excel Import: Feuilles disponibles: ' . json_encode($sheetNames));

            // Trouver les feuilles de manière flexible (insensible à la casse, variantes FR/EN)
            $familiesSheet = $this->findSheetByName($sheetNames,
                'families', 'Families', 'familles', 'Familles', 'famille', 'Famille'
            );
            $usersSheet = $this->findSheetByName($sheetNames,
                'users', 'Users', 'membres', 'Membres', 'membre', 'Membre', 'members', 'Members'
            );
            $sacrementSheet = $this->findSheetByName($sheetNames,
                'sacrements', 'users_sacrements', 'Users Sacraments',
                'Sacrements', 'UserSacrements', 'sacrament', 'Sacrament'
            );

            // Lire les 3 feuilles Excel
            $familiesData = $familiesSheet ? $this->readExcelSheet($fullPath, $familiesSheet) : [];
            $usersData = $usersSheet ? $this->readExcelSheet($fullPath, $usersSheet) : [];
            $sacrementData = $sacrementSheet ? $this->readExcelSheet($fullPath, $sacrementSheet) : [];

            \Log::info('Excel Import: Données lues', [
                'familiesRows' => count($familiesData),
                'usersRows' => count($usersData),
                'sacrementRows' => count($sacrementData),
            ]);

            if (empty($familiesData) && empty($usersData) && empty($sacrementData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le fichier Excel ne contient pas les feuilles requises. Feuilles trouvées: ' . implode(', ', $sheetNames) . '. Noms acceptés — Familles: "Familles" ou "Families" | Membres: "Membres", "Membre" ou "Users" | Sacrements: "Sacrements" (optionnel)',
                ], 400);
            }

            // Importer les données
            $result = $this->importData($familiesData, $usersData, $sacrementData);

            // Supprimer le fichier temporaire
            Storage::delete($filePath);

            $summary = implode(' | ', array_filter([
                $result['families']['created'] ? "{$result['families']['created']} famille(s) créée(s)" : null,
                $result['families']['updated'] ? "{$result['families']['updated']} famille(s) mise(s) à jour" : null,
                $result['users']['created']    ? "{$result['users']['created']} membre(s) créé(s)" : null,
                $result['users']['updated']    ? "{$result['users']['updated']} membre(s) mis à jour" : null,
                $result['sacraments']['created'] ? "{$result['sacraments']['created']} sacrement(s) traité(s)" : null,
            ]));

            return response()->json($this->sanitizeForJson([
                'success' => true,
                'message' => $summary ?: 'Import terminé — aucune donnée nouvelle',
                'data'    => $result,
            ]));
        } catch (\Throwable $e) {
            \Log::error('Erreur import-excel', [
                'message' => $e->getMessage(),
                'type' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json($this->sanitizeForJson([
                'success' => false,
                'message' => 'Erreur lors de l\'import: ' . $e->getMessage(),
            ]), 400);
        }
    }

    /**
     * Cherche une feuille par nom de manière flexible
     */
    private function findSheetByName($sheetNames, ...$variations)
    {
        foreach ($sheetNames as $actualName) {
            $normalizedActual = strtolower(preg_replace('/[\s_-]/', '', $actualName));

            foreach ($variations as $variation) {
                $normalizedVariation = strtolower(preg_replace('/[\s_-]/', '', $variation));
                if ($normalizedActual === $normalizedVariation) {
                    return $actualName;
                }
            }
        }

        return null;
    }

    /**
     * Lit une feuille Excel en évaluant les formules
     */
    private function readExcelSheet($filePath, $sheetName)
    {
        try {
            if (!file_exists($filePath) || !is_readable($filePath)) {
                throw new \Exception("Le fichier n'existe pas ou n'est pas lisible: $filePath");
            }

            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
            $worksheet = null;

            try {
                $worksheet = $spreadsheet->getSheetByName($sheetName);
            } catch (\Exception $e) {
                return [];
            }

            if ($worksheet === null) {
                return [];
            }

            $rows = [];
            // Créer un évaluateur pour les formules Excel
            try {
                $evaluator = \PhpOffice\PhpSpreadsheet\Calculation\Calculation::getInstance($spreadsheet);
            } catch (\Exception $e) {
                $evaluator = null;
            }

            // Lire les en-têtes
            $headers = [];
            foreach ($worksheet->getRowIterator(1, 1) as $row) {
                $cellIterator = $row->getCellIterator();
                foreach ($cellIterator as $cell) {
                    $value = $this->getCellValue($cell, $evaluator);
                    if ($value !== null && $value !== '') {
                        $headers[] = strtolower(trim((string)$value));
                    }
                }
            }

            if (empty($headers)) {
                return [];
            }

            // Lire les données
            foreach ($worksheet->getRowIterator(2) as $row) {
                $rowData = [];
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);

                $colIndex = 0;
                foreach ($cellIterator as $cell) {
                    if ($colIndex < count($headers)) {
                        $value = $this->getCellValue($cell, $evaluator);
                        if ($value !== null&& $value !== '') {
                            $rowData[$headers[$colIndex]] = $value;
                        }
                        $colIndex++;
                    }
                }

                if (!empty(array_filter($rowData))) {
                    $rows[] = $rowData;
                }
            }

            return $rows;
        } catch (\Throwable $e) {
            throw new \Exception("Erreur lors de la lecture de la feuille '$sheetName': " . $e->getMessage());
        }
    }

    /**
     * Obtient la valeur d'une cellule, en évaluant les formules si nécessaire
     */
    private function getCellValue($cell, $evaluator)
    {
        $value = $cell->getValue();

        // Si c'est une formule, l'évaluer
        if (is_string($value) && strpos($value, '=') === 0 && $evaluator) {
            try {
                $value = $evaluator->calculate($cell);
            } catch (\Exception $e) {
                \Log::warning("Impossible d'évaluer la formule: " . $e->getMessage());
                $value = null;
            }
        }

        // Nettoyer les chaînes pour garantir un UTF-8 valide
        if (is_string($value)) {
            $value = $this->toUtf8($value);
        }

        return $value;
    }

    /**
     * Supprime les accents pour générer des identifiants ASCII purs.
     */
    private function stripAccents(string $value): string
    {
        $accents = [
            'À','Á','Â','Ã','Ä','Å','à','á','â','ã','ä','å',
            'È','É','Ê','Ë','è','é','ê','ë',
            'Ì','Í','Î','Ï','ì','í','î','ï',
            'Ò','Ó','Ô','Õ','Ö','ò','ó','ô','õ','ö',
            'Ù','Ú','Û','Ü','ù','ú','û','ü',
            'Ý','ý','ÿ','Ñ','ñ','Ç','ç',
            // Variantes avec tréma/cédille encodées Windows-1252
            'Ã','ã','Ã‰','Ã©','Ã ','Ã¨','Ã¢','Ã®','Ã´','Ã»',
        ];
        $ascii = [
            'A','A','A','A','A','A','a','a','a','a','a','a',
            'E','E','E','E','e','e','e','e',
            'I','I','I','I','i','i','i','i',
            'O','O','O','O','O','o','o','o','o','o',
            'U','U','U','U','u','u','u','u',
            'Y','y','y','N','n','C','c',
            'A','a','E','e','a','e','a','i','o','u',
        ];

        $value = str_replace($accents, $ascii, $value);

        // Supprimer tout caractère non ASCII restant
        return preg_replace('/[^\x20-\x7E]/', '', $value);
    }

    /**
     * Convertit une chaîne en UTF-8 valide, supprime les octets invalides.
     */
    private function toUtf8(string $value): string
    {
        if (!mb_check_encoding($value, 'UTF-8')) {
            // Essayer Windows-1252 en premier (Excel FR)
            $try = mb_convert_encoding($value, 'UTF-8', 'Windows-1252');
            $value = mb_check_encoding($try, 'UTF-8') ? $try
                   : mb_convert_encoding($value, 'UTF-8', 'ISO-8859-1');
        }

        // Supprimer les octets invalides restants
        $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');

        // Supprimer caractères de contrôle
        $cleaned = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);

        return trim($cleaned ?? $value);
    }

    /**
     * Nettoie récursivement un tableau pour garantir que toutes les chaînes
     * sont en UTF-8 valide avant json_encode.
     */
    private function sanitizeForJson(mixed $data): mixed
    {
        if (is_string($data)) {
            return $this->toUtf8($data);
        }
        if (is_array($data)) {
            return array_map(fn($v) => $this->sanitizeForJson($v), $data);
        }
        return $data;
    }

    /**
     * Importe les données depuis les 3 feuilles Excel
     */
    private function importData($familiesData, $usersData, $sacrementData)
    {
        // Pré-charger toutes les classes, villes et fonctions en mémoire
        $this->classeCache   = \App\Models\Classe::all()->keyBy(fn($c) => strtolower(trim($c->nom)))->all();
        $this->villeCache    = \App\Models\Ville::all()->keyBy(fn($v) => strtolower(trim($v->nom)))->all();
        $this->fonctionCache = \App\Models\Fonction::all()->keyBy(fn($f) => strtolower(trim($f->nom)))->all();

        $result = [
            'families' => ['created' => 0, 'updated' => 0, 'skipped' => 0],
            'users' => ['created' => 0, 'updated' => 0, 'skipped' => 0, 'duplicates' => []],
            'sacraments' => ['created' => 0, 'updated' => 0, 'skipped' => 0],
        ];

        DB::beginTransaction();

        try {

            $familyMap = [];

            // 1. Importer les familles
            foreach ($familiesData as $index => $row) {
                $row = $this->normalizeFamilyRow($row);
                $familyImport = $this->importFamilyRow($row, $index + 1, $result);
                if ($familyImport) {
                    $familyCode = $row['family_code'] ?? null;
                    if ($familyCode) {
                        $familyMap[$familyCode] = $familyImport->id;
                    }
                }
            }

            // 2. Importer les utilisateurs
            $userCodeToId = [];
            $usersCreated = [];

            foreach ($usersData as $index => $row) {
                $row = $this->normalizeUserRow($row);
                $userCodeTemp = trim($row['user_code'] ?? '');
                $user = $this->importUserRow($row, $index + 1, $familyMap, $result);

                if ($user) {
                    if ($userCodeTemp) {
                        $userCodeToId[$userCodeTemp] = $user->id;
                    }
                    $usersCreated[] = $user;
                }
            }

            // 3. Importer les sacrements
            foreach ($sacrementData as $index => $row) {
                $this->importSacrementRow($row, $index + 1, $userCodeToId, $result);
            }

            // 3.5 Mettre à jour nom + responsable_id + ville_id des familles
            foreach ($familyMap as $code => $familyId) {
                $responsable = \App\Models\User::where('family_id', $familyId)
                    ->where('is_family_responsible', true)
                    ->first();
                if ($responsable) {
                    \App\Models\Family::where('id', $familyId)->update([
                        'nom'            => $responsable->nom,
                        'responsable_id' => $responsable->id,
                    ]);
                }
            }

            // 4. Envoyer les emails
            foreach ($usersCreated as $user) {
                $this->sendUserCredentialsEmail($user);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $result;
    }

    /**
     * Normalise les noms de colonnes du fichier réel (IDFAMILLE, CHEF_FAMILLE…)
     * vers le format standard (family_code, nom_famille…).
     */
    private function normalizeFamilyRow(array $row): array
    {
        $map = [
            'idfamille'          => 'family_code',
            'id_famille'         => 'family_code',
            'chef_famille'       => 'nom_famille',
            'nomfinal'           => 'nom_famille',
            'nom_famille'        => 'nom_famille',
            'telephone_chef'     => 'telephone',
            'lieu_residence'     => 'adresse',
            'classes'            => 'classe',
            'classe_methodiste'  => 'classe',
            'classe_methodique'  => 'classe',
        ];

        $normalized = [];
        foreach ($row as $key => $value) {
            $target = $map[$key] ?? $key;
            // Ne pas écraser une clé standard déjà présente
            if (!isset($normalized[$target])) {
                $normalized[$target] = $value;
            }
        }

        // Normaliser le code famille en majuscule
        if (!empty($normalized['family_code'])) {
            $normalized['family_code'] = strtoupper(trim($normalized['family_code']));
        }

        // Si CLASSES contient plusieurs valeurs séparées par virgule, prendre la première
        if (!empty($normalized['classe']) && str_contains((string)$normalized['classe'], ',')) {
            $normalized['classe'] = trim(explode(',', $normalized['classe'])[0]);
        }

        return $normalized;
    }

    /**
     * Normalise les noms de colonnes de la feuille Membres (variantes FR/EN/majuscule)
     * vers les clés standard attendues par importUserRow.
     */
    private function normalizeUserRow(array $row): array
    {
        $map = [
            // Identifiant famille
            'idfamille'              => 'family_code',
            'id_famille'             => 'family_code',
            'famille_code'           => 'family_code',
            'code_famille'           => 'family_code',
            'family_id'              => 'family_code',

            // Code membre
            'code_membre'            => 'user_code',
            'users_code'             => 'user_code',
            'id_membre'              => 'user_code',
            'idmembre'               => 'user_code',
            'identifier'             => 'user_code',

            // Prénom — PRENOMS (pluriel dans le fichier)
            'prenoms'                => 'prenom',
            'prénoms'                => 'prenom',
            'prénom'                 => 'prenom',
            'firstname'              => 'prenom',
            'first_name'             => 'prenom',

            // Genre
            'sexe'                   => 'genre',

            // Date naissance
            'datenaissance'          => 'date_naissance',
            'date_de_naissance'      => 'date_naissance',
            'naissance'              => 'date_naissance',

            // Téléphone
            'tel'                    => 'telephone',
            'mobile'                 => 'telephone',
            'tel2'                   => 'telephone2',
            'telephone_2'            => 'telephone2',

            // Responsable de famille
            'responsable_'            => 'is_family_responsible',
            'responsable'             => 'is_family_responsible',
            'is_responsable'          => 'is_family_responsible',
            'responsable_famille'     => 'is_family_responsible',
            'responsible_famille'     => 'is_family_responsible',

            // Relation / lien de filiation
            'lien_filiation'         => 'relation',
            'lien_parente'           => 'relation',
            'lien'                   => 'relation',

            // Profession
            'metier'                 => 'profession',

            // Fonction dans l'église
            'fonction_ec'            => 'fonction',
            'fonction_eglise'        => 'fonction',
            'fonction_église'        => 'fonction',

            // Classe méthodique
            'classe_meth'            => 'classe',
            'classe_methodique'      => 'classe',
            'classe_méthodique'      => 'classe',
            'classe_methodiste'      => 'classe',
            'classe_méthodiste'      => 'classe',

            // Statut actif
            'membre_act'             => 'membre_actif',
            'membre_actif'           => 'membre_actif',
            'actif'                  => 'membre_actif',

            // Décédé
            'decede'                 => 'is_deceased',
            'décédé'                 => 'is_deceased',

            // Statut marital
            'situation_m'              => 'statut_marital',
            'situation_maritale'       => 'statut_marital',
            'statut_marital'           => 'statut_marital',
            'situation_matrimoniale'   => 'statut_marital',

            // Rôle
            'type'                   => 'role',
            'est_conduct'            => 'est_conducteur',

            // Lieu de naissance
            'lieu_naissance'         => 'lieu_naissance',
            'lieu_de_naissance'      => 'lieu_naissance',

            // Numéro CNI
            'numero_cni'             => 'numero_cni',
            'cni'                    => 'numero_cni',
            'num_cni'                => 'numero_cni',

            // Hors communauté
            'hors_communaute'        => 'hors_communaute',
            'hors_communauté'        => 'hors_communaute',

            // Retrait
            'retrait'                => 'retrait',
            'date_retrait'           => 'date_retrait',
            'commentaire_retrait'    => 'commentaire_retrait',
        ];

        $normalized = [];
        foreach ($row as $key => $value) {
            $target = $map[$key] ?? $key;
            if (!isset($normalized[$target])) {
                $normalized[$target] = $value;
            }
        }

        // Normaliser le code famille en majuscule
        if (!empty($normalized['family_code'])) {
            $normalized['family_code'] = strtoupper(trim($normalized['family_code']));
        }

        return $normalized;
    }

    /**
     * Importe une ligne de famille (upsert par code_famille)
     */
    private function importFamilyRow($row, $lineNumber, &$result)
    {
        if (empty($row['family_code']) || empty($row['nom_famille'])) {
            $result['families']['skipped']++;
            return null;
        }

        // Sauter les familles en attente de validation
        if (isset($row['statut_validation']) && strtoupper(trim($row['statut_validation'])) === 'EN_ATTENTE') {
            $result['families']['skipped']++;
            return null;
        }

        $familyCode = strtoupper(trim($row['family_code']));
        $familyName = trim($row['nom_famille']);

        $familyData = [
            'nom'        => $familyName,
            'adresse'    => $row['adresse'] ?? null,
            'quartier'   => $row['quartier'] ?? null,
            'telephone'  => $row['telephone'] ?? null,
            'telephone2' => $row['telephone2'] ?? null,
            'classe_id'  => $this->getClasseId($row['classe'] ?? null),
            'ville_id'   => $this->getVilleId($row['ville'] ?? null),
        ];

        $family = Family::updateOrCreate(
            ['code_famille' => $familyCode],
            $familyData
        );

        if ($family->wasRecentlyCreated) {
            $result['families']['created']++;
        } else {
            $result['families']['updated']++;
        }

        return $family;
    }

    /**
     * Importe une ligne d'utilisateur
     */
    private function importUserRow($row, $lineNumber, $familyMap, &$result)
    {
        $userCode = $row['user_code'] ?? null;

        // Le nom est obligatoire — le prénom peut être vide (nom seul dans certains fichiers)
        if (empty($row['nom'])) {
            $result['users']['skipped']++;
            return null;
        }

        $firstName = trim($row['nom']);
        $lastName  = trim($row['prenom'] ?? '');
        $userCode  = !empty($userCode) ? trim($userCode) : null;

        $familyId = $familyMap[$row['family_code'] ?? ''] ?? null;
        $family   = $familyId ? Family::find($familyId) : null;

        $plainPassword = '11111';
        $dateNaissance = $this->parseExcelDate($row['date_naissance'] ?? null);
        $identifier    = GeneratesIdentifier::generateIdentifier(
            $this->stripAccents($firstName),
            $this->stripAccents($lastName),
            $dateNaissance
        );
        $rawEmail     = isset($row['email']) ? trim((string) $row['email']) : '';
        $hasRealEmail = $rawEmail !== '';
        $email        = $hasRealEmail ? $rawEmail : null;

        $isResponsible = in_array(strtolower((string)($row['is_family_responsible'] ?? '')), ['oui', 'yes', '1', 'true']);
        $isDeceased    = in_array(strtolower((string)($row['is_deceased'] ?? '')), ['oui', 'yes', '1', 'true']);
        $isActif       = !in_array(strtolower((string)($row['membre_actif'] ?? 'oui')), ['non', 'no', '0', 'false']);

        // Rôle : conducteur si est_conducteur=Oui, sinon responsable si responsable=Oui
        $isConducteur = in_array(strtolower((string)($row['est_conducteur'] ?? '')), ['oui', 'yes', '1', 'true']);
        if ($isConducteur) {
            $role = 'conducteur';
        } elseif ($isResponsible) {
            $role = 'responsable_famille';
        } else {
            $role = $this->mapRole($row['role'] ?? 'membre_famille');
        }

        // Classe : priorité à CLASSE_METH du membre, sinon classe de la famille
        $classeId = $this->getClasseId($row['classe'] ?? null) ?? $family?->classe_id;

        $userData = [
            'identifier'            => $identifier,
            'nom'                   => $firstName,
            'prenom'                => $lastName,
            'genre'                 => $row['genre'] ?? null,
            'date_naissance'        => $dateNaissance,
            'telephone'             => $row['telephone'] ?? null,
            'telephone2'            => $row['telephone2'] ?? null,
            'profession'            => $row['profession'] ?? null,
            'employment_status'     => $this->determineEmploymentStatus($row['profession'] ?? null),
            'role'                  => $role,
            'family_id'             => $familyId,
            'classe_id'             => $classeId,
            'ville_id'              => $family?->ville_id,
            'fonction_id'           => $this->getFonctionId($row['fonction'] ?? null),
            'relation'              => $row['relation'] ?? null,
            'statut_marital'        => $row['statut_marital'] ?? null,
            'lieu_naissance'        => $row['lieu_naissance'] ?? null,
            'numero_cni'            => $row['numero_cni'] ?? null,
            'hors_communaute'       => in_array(strtolower((string)($row['hors_communaute'] ?? '')), ['oui', 'yes', '1', 'true']),
            'retrait'               => in_array(strtolower((string)($row['retrait'] ?? '')), ['oui', 'yes', '1', 'true']),
            'date_retrait'          => $this->parseExcelDate($row['date_retrait'] ?? null),
            'commentaire_retrait'   => $row['commentaire_retrait'] ?? null,
            'status'                => $isActif ? 'active' : 'inactive',
            'is_family_responsible' => $isResponsible,
            'is_deceased'           => $isDeceased,
            'email'                 => $email,
            'password'              => Hash::make($plainPassword, ['rounds' => 4]),
        ];

        if (!empty($userCode)) {
            $userData['code_membre'] = $userCode;
        }

        // Upsert : cherche d'abord par email, puis par code_membre, sinon crée
        $matchKey = null;
        if ($hasRealEmail) {
            $matchKey = ['email' => $email];
        } elseif (!empty($userCode)) {
            $matchKey = ['code_membre' => $userCode];
        }

        if ($matchKey) {
            $user = User::updateOrCreate($matchKey, $userData);
        } else {
            // Pas d'identifiant unique fiable → vérifier nom+prenom avant de créer
            $existing = User::where('nom', $firstName)->where('prenom', $lastName)->first();
            if ($existing) {
                $existing->update($userData);
                $user = $existing;
            } else {
                $user = User::create($userData);
            }
        }

        if ($user) {
            $this->importSacrementFromMemberRow($row, $user->id);

            $user->plain_password = $plainPassword;
            $user->send_credentials = $hasRealEmail;

            \Log::info('Import User créé avec succès', [
                'user_id' => $user->id,
                'identifier' => $user->identifier,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'classe_id' => $user->classe_id,
                'ville_id' => $user->ville_id,
                'family_id' => $user->family_id,
            ]);

            if ($user->wasRecentlyCreated) {
                $result['users']['created']++;
            } else {
                $result['users']['updated']++;
            }
            return $user;
        } else {
            $result['users']['skipped']++;
            return null;
        }
    }

    /**
     * Gère les colonnes de sacrement présentes directement dans la feuille Membres
     */
    private function importSacrementFromMemberRow(array $row, int $userId): void
    {
        $sacrementMap = [
            'baptise'                    => 'baptise',
            'date_bapteme'               => 'bapteme_date',
            'lieu_bapteme'               => 'bapteme_lieu',
            'premiere_communion'         => 'premiere_communion',
            'date_premiere_communion'    => 'premiere_communion_date',
            'lieu_premiere_communion'    => 'premiere_communion_lieu',
            'marie_religieusement'       => 'marie_religieusement',
            'date_mariage_religieux'     => 'mariage_religieux_date',
            'lieu_mariage_religieux'     => 'mariage_religieux_lieu',
            'est_marie'                  => 'est_marie',
            'date_mariage'               => 'mariage_civil_date',
            'lieu_mariage'               => 'mariage_civil_lieu',
        ];

        $data = ['user_id' => $userId];
        $hasData = false;

        foreach ($sacrementMap as $rowKey => $dbCol) {
            if (!isset($row[$rowKey]) || $row[$rowKey] === null || $row[$rowKey] === '') {
                continue;
            }
            $val = $row[$rowKey];
            if (is_string($val)) {
                if (in_array(strtolower($val), ['oui', 'yes', '1', 'true'])) {
                    $val = true;
                } elseif (in_array(strtolower($val), ['non', 'no', '0', 'false'])) {
                    $val = false;
                }
            }
            $data[$dbCol] = $val;
            $hasData = true;
        }

        if ($hasData) {
            \App\Models\UserSacrement::updateOrCreate(['user_id' => $userId], $data);
        }
    }

    /**
     * Importe une ligne de sacrement
     */
    private function importSacrementRow($row, $lineNumber, $userCodeToId, &$result)
    {
        if (empty($row['user_code'])) {
            \Log::warning('Sacrement: user_code manquant à la ligne ' . $lineNumber);
            $result['sacraments']['skipped']++;
            return;
        }

        $userCode = trim($row['user_code']);
        $userId = $userCodeToId[$userCode] ?? null;

        \Log::info('Import Sacrement', [
            'line' => $lineNumber,
            'user_code' => $userCode,
            'user_id_found' => $userId,
            'available_codes' => array_keys($userCodeToId),
        ]);

        if (!$userId) {
            \Log::warning('Sacrement: user_code non trouvé', [
                'user_code' => $userCode,
                'line' => $lineNumber,
                'available' => array_keys($userCodeToId),
            ]);
            $result['sacraments']['skipped']++;
            return;
        }

        $sacrementColumns = [
            'baptise',
            'bapteme_date',
            'bapteme_lieu',
            'premiere_communion',
            'premiere_communion_date',
            'premiere_communion_lieu',
            'marie_religieusement',
            'mariage_religieux_date',
            'mariage_religieux_lieu',
            'est_marie',
            'mariage_civil_date',
            'mariage_civil_lieu',
            'dot_effectue',
            'dot_date',
            'dot_lieu',
            'est_veuf',
            'deces_conjoint_date',
            'deces_conjoint_lieu',
            'est_divorce',
            'divorce_date',
            'divorce_lieu',
        ];

        $sacrementDataRow = ['user_id' => $userId];
        $hasSacrementData = false;

        foreach ($sacrementColumns as $col) {
            if (isset($row[$col]) && $row[$col] !== null && $row[$col] !== '') {
                if (is_string($row[$col]) && in_array(strtolower($row[$col]), ['oui', 'yes', '1', 'true'])) {
                    $sacrementDataRow[$col] = true;
                } elseif (is_string($row[$col]) && in_array(strtolower($row[$col]), ['non', 'no', '0', 'false'])) {
                    $sacrementDataRow[$col] = false;
                } else {
                    $sacrementDataRow[$col] = $row[$col];
                }
                $hasSacrementData = true;
            }
        }

        if ($hasSacrementData) {
            \Log::info('Sauvegarde sacrement', [
                'user_id' => $userId,
                'data' => $sacrementDataRow,
            ]);

            UserSacrement::updateOrCreate(
                ['user_id' => $userId],
                $sacrementDataRow
            );
            $result['sacraments']['created']++;

            \Log::info('Sacrement créé/mis à jour', [
                'user_id' => $userId,
                'line' => $lineNumber,
            ]);
        } else {
            \Log::info('Pas de données de sacrement à la ligne ' . $lineNumber, [
                'user_id' => $userId,
                'user_code' => $userCode,
            ]);
            $result['sacrements']['skipped']++;
        }
    }

    /**
     * Récupère l'ID de la classe par son nom
     */
    private array $classeCache   = [];
    private array $villeCache    = [];
    private array $fonctionCache = [];

    private function getClasseId($classeName): ?int
    {
        if (empty($classeName)) return null;
        $key = strtolower(trim((string)$classeName));
        if (isset($this->classeCache[$key])) {
            return $this->classeCache[$key]->id;
        }
        $classe = \App\Models\Classe::firstOrCreate(['nom' => trim($classeName)]);
        $this->classeCache[$key] = $classe;
        return $classe->id;
    }

    private function getVilleId($villeName): ?int
    {
        if (empty($villeName)) return null;
        $key = strtolower(trim((string)$villeName));
        return $this->villeCache[$key]?->id
            ?? \App\Models\Ville::where('nom', trim($villeName))->value('id');
    }

    private function getFonctionId($fonctionName): ?int
    {
        if (empty($fonctionName)) return null;
        $key = strtolower(trim((string)$fonctionName));
        if (isset($this->fonctionCache[$key])) {
            return $this->fonctionCache[$key]->id;
        }
        $fonction = \App\Models\Fonction::firstOrCreate(['nom' => trim($fonctionName)]);
        $this->fonctionCache[$key] = $fonction;
        return $fonction->id;
    }

    /**
     * Envoie les identifiant et mot de passe à l'utilisateur par email
     */
    private function sendUserCredentialsEmail($user)
    {
        try {
            if (!isset($user->plain_password)) {
                return;
            }
            if (!isset($user->send_credentials) || !$user->send_credentials) {
                return;
            }

            $email = trim((string) ($user->email ?? ''));
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                \Log::warning('Envoi identifiants: email invalide', [
                    'user_id' => $user->id,
                    'email' => $email,
                ]);
                return;
            }

            SendCredentialsEmail::dispatch(
                $user->id,
                (string) $user->code_membre,
                (string) $user->plain_password
            );
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'envoi des identifiants:', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Mappe les valeurs de rôle depuis Excel vers les valeurs acceptées par l'enum
     */
    private function determineEmploymentStatus(?string $profession): string
    {
        if (empty(trim((string) $profession))) {
            return 'SANS_EMPLOI';
        }

        $p = strtolower(trim($this->stripAccents($profession)));

        $etudiantKeywords = ['eleve', 'etudiant', 'etudiante', 'lyceen', 'lyceenne', 'collegien', 'collegienne', 'ecolier', 'ecoliere', 'scolaire', 'ecole', 'classe'];
        foreach ($etudiantKeywords as $kw) {
            if (str_contains($p, $kw)) return 'ETUDIANT';
        }

        $retraiteKeywords = ['retraite', 'pensionnaire', 'pension'];
        foreach ($retraiteKeywords as $kw) {
            if (str_contains($p, $kw)) return 'RETRAITE';
        }

        $sansEmploiKeywords = ['sans emploi', 'sans-emploi', 'chomeur', 'chomeuse', 'menagere', 'menager', 'au foyer', 'femme foyer', 'non actif', 'inactive', 'inactif'];
        foreach ($sansEmploiKeywords as $kw) {
            if (str_contains($p, $kw)) return 'SANS_EMPLOI';
        }

        return 'TRAVAILLEUR';
    }

    private function mapRole($roleValue)
    {
        if (empty($roleValue)) {
            return 'membre_famille';
        }

        $roleValue = strtolower(trim($roleValue));

        $roleMap = [
            'admin' => 'admin',
            'pasteur' => 'pasteur',
            'conducteur' => 'conducteur',
            'responsable_famille' => 'responsable_famille',
            'membre_famille' => 'membre_famille',
        ];

        return $roleMap[$roleValue] ?? 'membre_famille';
    }

    /**
     * Convertit une date depuis Excel vers le format Y-m-d
     * Gère les numéros sériels Excel ainsi que les chaînes de date
     */
    private function parseExcelDate($dateValue)
    {
        if (empty($dateValue)) {
            return null;
        }

        try {
            // Si c'est un nombre (numéro sériel Excel), le convertir
            if (is_numeric($dateValue)) {
                // PhpSpreadsheet a une classe pour convertir les numéros sériels Excel
                $date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateValue);
                return $date->format('Y-m-d');
            }

            // Si c'est une chaîne, essayer de la parser
            if (is_string($dateValue)) {
                // Essayer différents formats courants
                $patterns = [
                    'Y-m-d',
                    'd/m/Y',
                    'm/d/Y',
                    'd-m-Y',
                    'Y/m/d',
                    'd.m.Y',
                ];

                foreach ($patterns as $pattern) {
                    $date = \Carbon\Carbon::createFromFormat($pattern, $dateValue);
                    if ($date) {
                        return $date->format('Y-m-d');
                    }
                }

                // Si aucun format ne correspond, laisser Carbon essayer
                $date = Carbon::parse($dateValue);
                return $date->format('Y-m-d');
            }

            return null;
        } catch (\Exception $e) {
            \Log::warning('Impossible de parser la date: ' . $dateValue . ' - Erreur: ' . $e->getMessage());
            return null;
        }
    }

}
