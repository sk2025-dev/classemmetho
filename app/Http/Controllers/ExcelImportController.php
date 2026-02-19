<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserSacrement;
use App\Models\Family;
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

            // Trouver les feuilles de manière flexible (insensible à la casse et aux caractères spéciaux)
            $familiesSheet = $this->findSheetByName($sheetNames, 'families', 'Families');
            $usersSheet = $this->findSheetByName($sheetNames, 'users', 'Users');
            $sacrementSheet = $this->findSheetByName($sheetNames, 'sacrements', 'users_sacrements', 'Users Sacraments');

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
                    'message' => 'Le fichier Excel ne contient pas les feuilles requises. Feuilles trouvées: ' . implode(', ', $sheetNames) . '. Feuilles attendues: Families, Users, Users Sacraments',
                ], 400);
            }

            // Importer les données
            $result = $this->importData($familiesData, $usersData, $sacrementData);

            // Supprimer le fichier temporaire
            Storage::delete($filePath);

            return response()->json([
                'success' => true,
                'message' => 'Import réussi',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'import: ' . $e->getMessage(),
            ], 400);
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
        } catch (\Exception $e) {
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

        return $value;
    }

    /**
     * Importe les données depuis les 3 feuilles Excel
     */
    private function importData($familiesData, $usersData, $sacrementData)
    {
        $result = [
            'families' => ['created' => 0, 'updated' => 0, 'skipped' => 0, 'duplicates' => []],
            'users' => ['created' => 0, 'updated' => 0, 'skipped' => 0, 'duplicates' => []],
            'sacraments' => ['created' => 0, 'updated' => 0, 'skipped' => 0],
        ];

        DB::beginTransaction();

        try {

            $familyMap = [];

            // 1. Importer les familles
            foreach ($familiesData as $index => $row) {
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
                $userCodeTemp = trim($row['user_code'] ?? $row['users_code'] ?? '');
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
     * Importe une ligne de famille
     */
    private function importFamilyRow($row, $lineNumber, &$result)
    {
        if (empty($row['family_code']) || empty($row['nom_famille'])) {
            $result['families']['skipped']++;
            return null;
        }

        $familyCode = trim($row['family_code']);
        $familyName = trim($row['nom_famille']);

        $existingFamily = Family::where('nom', $familyName)->first();

        if ($existingFamily) {
            $result['families']['duplicates'][] = [
                'line' => $lineNumber,
                'code' => $familyCode,
                'nom' => $familyName,
                'message' => "Famille '{$familyName}' existe déjà (ID: {$existingFamily->id})"
            ];
            $result['families']['skipped']++;
            return null;
        }

        $familyData = [
            'nom' => $familyName,
            'adresse' => $row['adresse'] ?? null,
            'quartier' => $row['quartier'] ?? null,
            'telephone' => $row['telephone'] ?? null,
            'telephone2' => $row['telephone2'] ?? null,
            'classe_id' => $this->getClasseId($row['classe'] ?? null),
            'ville_id' => $this->getVilleId($row['ville'] ?? null),
        ];

        $family = Family::create($familyData);

        if ($family) {
            $result['families']['created']++;
            return $family;
        }

        $result['families']['skipped']++;
        return null;
    }

    /**
     * Importe une ligne d'utilisateur
     */
    private function importUserRow($row, $lineNumber, $familyMap, &$result)
    {
        $userCode = $row['user_code'] ?? $row['users_code'] ?? null;

        if (empty($userCode) || empty($row['nom']) || empty($row['prenom'])) {
            $result['users']['skipped']++;
            return null;
        }

        $userCode = trim($userCode);
        $firstName = trim($row['nom']);
        $lastName = trim($row['prenom']);

        $existingUser = User::where('nom', $firstName)->where('prenom', $lastName)->first();

        if ($existingUser) {
            $result['users']['duplicates'][] = [
                'line' => $lineNumber,
                'code' => $userCode,
                'nom' => $firstName,
                'prenom' => $lastName,
                'message' => "Utilisateur '{$firstName} {$lastName}' existe déjà (ID: {$existingUser->id})"
            ];
            $result['users']['skipped']++;
            return null;
        }

        $familyId = $familyMap[$row['family_code']] ?? null;
        $family = $familyId ? Family::find($familyId) : null;

        \Log::info('Import User: Cherche famille', [
            'family_code' => $row['family_code'] ?? null,
            'family_id' => $familyId,
            'family_found' => $family ? true : false,
            'family_classe_id' => $family?->classe_id,
            'family_ville_id' => $family?->ville_id,
        ]);

        $plainPassword = '11111';
        $dateNaissance = $this->parseExcelDate($row['date_naissance'] ?? null);
        $identifier = GeneratesIdentifier::generateIdentifier($firstName, $lastName, $dateNaissance);

        $isResponsible = in_array(strtolower($row['is_family_responsible'] ?? ''), ['oui', 'yes', '1', 'true']);
        $role = $isResponsible ? 'responsable_famille' : $this->mapRole($row['role'] ?? 'membre_famille');

        \Log::info('Import User: Détermination du rôle', [
            'is_family_responsible' => $row['is_family_responsible'] ?? null,
            'is_responsible_boolean' => $isResponsible,
            'role_from_excel' => $row['role'] ?? null,
            'final_role' => $role,
        ]);

        $userData = [
            'identifier' => $identifier,
            'nom' => $firstName,
            'prenom' => $lastName,
            'genre' => $row['genre'] ?? null,
            'date_naissance' => $dateNaissance,
            'telephone' => $row['telephone'] ?? null,
            'telephone2' => $row['telephone2'] ?? null,
            'profession' => $row['profession'] ?? null,
            'role' => $role,
            'family_id' => $familyId,
            'classe_id' => $family?->classe_id,
            'ville_id' => $family?->ville_id,
            'fonction_id' => $this->getFonctionId($row['fonction'] ?? null),
            'relation' => $row['relation'] ?? null,
            'is_family_responsible' => $isResponsible,
            'email' => $row['email'] ?? null,
            'password' => Hash::make($plainPassword),
            'statut' => 'actif',
        ];

        $user = User::create($userData);

        if ($user) {
            $user->plain_password = $plainPassword;

            \Log::info('Import User créé avec succès', [
                'user_id' => $user->id,
                'identifier' => $user->identifier,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'classe_id' => $user->classe_id,
                'ville_id' => $user->ville_id,
                'family_id' => $user->family_id,
            ]);

            $result['users']['created']++;
            return $user;
        } else {
            \Log::error('Impossibilité de créer l\'utilisateur', [
                'nom' => $firstName,
                'prenom' => $lastName,
                'line' => $lineNumber,
            ]);
            $result['users']['skipped']++;
            return null;
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
    private function getClasseId($classeName)
    {
        if (empty($classeName)) {
            return null;
        }

        $classe = \App\Models\Classe::where('nom', trim($classeName))->first();
        return $classe?->id;
    }

    /**
     * Récupère l'ID de la ville par son nom
     */
    private function getVilleId($villeName)
    {
        if (empty($villeName)) {
            return null;
        }

        $ville = \App\Models\Ville::where('nom', trim($villeName))->first();
        return $ville?->id;
    }

    /**
     * Récupère l'ID de la fonction par son nom
     */
    private function getFonctionId($fonctionName)
    {
        if (empty($fonctionName)) {
            return null;
        }

        $fonction = \App\Models\Fonction::where('nom', trim($fonctionName))->first();
        return $fonction?->id;
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

            if (class_exists(\App\Mail\SendCredentials::class)) {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(
                    new \App\Mail\SendCredentials($user, $user->identifier, $user->plain_password)
                );
            } else {
                \Illuminate\Support\Facades\Mail::raw(
                    "Bienvenue!\n\nVoici vos identifiants de connexion:\n\n"
                    . "Identifiant: " . $user->identifier . "\n"
                    . "Mot de passe: " . $user->plain_password . "\n\n"
                    . "Veuillez changer votre mot de passe après votre première connexion.",
                    function ($message) use ($user) {
                        $message->to($user->email)
                                ->subject('Vos identifiants de connexion');
                    }
                );
            }
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
