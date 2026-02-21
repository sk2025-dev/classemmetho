<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class PhoneValidationTest extends TestCase
{
    /**
     * Test la fonction formatPhone
     * Les numéros doivent être stockés sans le préfixe "225" et sans zéro au début
     */
    public function test_format_phone_removes_225_prefix()
    {
        // Test avec préfixe 225
        $formatter = new PhoneFormatter();
        
        $this->assertEquals('102030405', $formatter->formatPhone('225102030405'));
        $this->assertEquals('102030405', $formatter->formatPhone('02250102030405'));
    }

    public function test_format_phone_removes_leading_zero()
    {
        $formatter = new PhoneFormatter();
        
        $this->assertEquals('102030405', $formatter->formatPhone('0102030405'));
        $this->assertEquals('702030405', $formatter->formatPhone('0702030405'));
    }

    public function test_format_phone_keeps_10_digits()
    {
        $formatter = new PhoneFormatter();
        
        $this->assertEquals('7102030405', $formatter->formatPhone('7102030405'));
        $this->assertEquals('1234567890', $formatter->formatPhone('1234567890'));
    }

    public function test_format_phone_removes_non_digits()
    {
        $formatter = new PhoneFormatter();
        
        $this->assertEquals('102030405', $formatter->formatPhone('0102-030-405'));
        $this->assertEquals('102030405', $formatter->formatPhone('+225 0102 030 405'));
        $this->assertEquals('102030405', $formatter->formatPhone('(0102) 030-405'));
    }

    /**
     * Test la validation du format de téléphone
     */
    public function test_valid_phone_formats()
    {
        $validator = new PhoneValidator();
        
        // Format 1: 10 chiffres sans 0
        $this->assertTrue($validator->isValidPhone('7102030405'));
        $this->assertTrue($validator->isValidPhone('5102030405'));
        
        // Format 2: 11 chiffres avec 0 au début
        $this->assertTrue($validator->isValidPhone('07102030405'));
        $this->assertTrue($validator->isValidPhone('05102030405'));
        
        // Format 3: 12 chiffres avec 225
        $this->assertTrue($validator->isValidPhone('225102030405'));
        $this->assertTrue($validator->isValidPhone('2257102030405'));
    }

    public function test_valid_phone_formats_with_special_chars()
    {
        $validator = new PhoneValidator();
        
        $this->assertTrue($validator->isValidPhone('0102-030-405'));
        $this->assertTrue($validator->isValidPhone('+225 7102 030 405'));
        $this->assertTrue($validator->isValidPhone('(07) 10-20-30-405'));
    }

    public function test_invalid_phone_formats()
    {
        $validator = new PhoneValidator();
        
        // Trop court
        $this->assertFalse($validator->isValidPhone('010203'));
        
        // Trop long
        $this->assertFalse($validator->isValidPhone('02250102030405678'));
        
        // Vide
        $this->assertFalse($validator->isValidPhone(''));
        $this->assertFalse($validator->isValidPhone(null));
        
        // Mauvais format
        $this->assertFalse($validator->isValidPhone('ABC1234567'));
    }

    /**
     * Scénarios de test réalistes
     */
    public function test_real_world_scenarios()
    {
        $formatter = new PhoneFormatter();
        $validator = new PhoneValidator();
        
        // Scénario 1: Utilisateur tape 0102030405
        $input1 = '0102030405';
        $this->assertTrue($validator->isValidPhone($input1));
        $formatted1 = $formatter->formatPhone($input1);
        $this->assertEquals('102030405', $formatted1);
        
        // Scénario 2: Utilisateur tape 7102030405
        $input2 = '7102030405';
        $this->assertTrue($validator->isValidPhone($input2));
        $formatted2 = $formatter->formatPhone($input2);
        $this->assertEquals('7102030405', $formatted2);
        
        // Scénario 3: Utilisateur tape 225102030405
        $input3 = '225102030405';
        $this->assertTrue($validator->isValidPhone($input3));
        $formatted3 = $formatter->formatPhone($input3);
        $this->assertEquals('102030405', $formatted3);
        
        // Scénario 4: Utilisateur tape +225 7 10 20 30 405
        $input4 = '+225 7 10 20 30 405';
        $this->assertTrue($validator->isValidPhone($input4));
        $formatted4 = $formatter->formatPhone($input4);
        $this->assertEquals('7102030405', $formatted4);
    }
}

/**
 * Helper class for phone formatting
 * (En production, ce code sera dans RegistrationController)
 */
class PhoneFormatter
{
    public function formatPhone($phone)
    {
        if (!$phone) return '';

        // Supprimer tous les caractères non-numériques
        $cleaned = preg_replace('/\D/', '', $phone);

        // Si commence par 225, enlever le préfixe pour avoir juste 10 chiffres
        if (str_starts_with($cleaned, '225')) {
            $cleaned = substr($cleaned, 3);
        }

        // Retourner les 10 chiffres sans préfixe
        return $cleaned;
    }
}

/**
 * Helper class for phone validation
 * (En production, ce code sera dans RegistrationController)
 */
class PhoneValidator
{
    public function isValidPhone($phone)
    {
        if (!$phone) return false;

        // Supprimer tous les caractères non-numériques
        $cleaned = preg_replace('/\D/', '', $phone);

        // Accepter: 10 chiffres (0XXXXXXXXX) ou 12 chiffres (225XXXXXXXXX)
        if (strlen($cleaned) === 10 && !str_starts_with($cleaned, '0')) {
            // 10 chiffres sans zéro au début
            return true;
        }

        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '225')) {
            // 225 + 9 chiffres
            return true;
        }

        if (strlen($cleaned) === 11 && str_starts_with($cleaned, '0')) {
            // 0 + 10 chiffres
            return true;
        }

        return false;
    }
}
