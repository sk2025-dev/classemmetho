<?php

namespace App\Exceptions;

use Exception;

/**
 * Exception lancée quand une contrainte UNIQUE est violée
 * Fournit des messages clairs à l'utilisateur sur le doublon
 */
class UniqueConstraintViolationException extends Exception
{
    protected $field;
    protected $value;
    protected $table;
    protected $humanMessage;

    public function __construct(
        string $field,
        string $value,
        string $table,
        string $humanMessage = null,
        string $message = '',
        int $code = 0,
        ?Exception $previous = null
    ) {
        $this->field = $field;
        $this->value = $value;
        $this->table = $table;
        $this->humanMessage = $humanMessage ?? $this->generateDefaultMessage($field, $value, $table);

        parent::__construct($message ?: $this->humanMessage, $code, $previous);
    }

    /**
     * Générer un message par défaut selon le champ
     */
    private function generateDefaultMessage(string $field, string $value, string $table): string
    {
        $messages = [
            'email' => "Cet email est déjà utilisé dans la base de données.",
            'telephone' => "Ce numéro de téléphone est déjà enregistré.",
            'identifier' => "Cet identifiant est déjà pris.",
            'nom' => "Ce nom est déjà utilisé dans {$table}.",
        ];

        return $messages[$field] ?? "La valeur '$value' existe déjà pour le champ '$field'.";
    }

    public function getField(): string
    {
        return $this->field;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getTable(): string
    {
        return $this->table;
    }

    public function getHumanMessage(): string
    {
        return $this->humanMessage;
    }

    /**
     * Retourner un tableau pour la réponse JSON
     */
    public function toArray(): array
    {
        return [
            'field' => $this->field,
            'value' => $this->value,
            'table' => $this->table,
            'message' => $this->humanMessage,
            'type' => 'UniqueConstraintViolation',
        ];
    }
}
