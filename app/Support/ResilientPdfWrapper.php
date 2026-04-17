<?php

namespace App\Support;

use Barryvdh\DomPDF\PDF;
use DOMDocument;
use Throwable;

class ResilientPdfWrapper extends PDF
{
    public function loadHTML(string $string, ?string $encoding = null): self
    {
        $string = $this->convertEntities($string);

        try {
            $this->dompdf->loadHtml($string, $encoding);
        } catch (Throwable $exception) {
            if (! $this->shouldFallbackToDomDocument($exception)) {
                throw $exception;
            }

            $this->loadHtmlWithDomDocument($string, $encoding);
        }

        $this->rendered = false;

        return $this;
    }

    private function shouldFallbackToDomDocument(Throwable $exception): bool
    {
        if (! class_exists(\Masterminds\HTML5\Parser\DOMTreeBuilder::class)) {
            return true;
        }

        return str_contains(
            $exception->getMessage(),
            'Masterminds\\HTML5\\Parser\\DOMTreeBuilder'
        );
    }

    private function loadHtmlWithDomDocument(string $html, ?string $encoding = null): void
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $document->preserveWhiteSpace = true;

        $html = $this->normalizeHtmlForDomDocument($html, $encoding);

        $previousUseInternalErrors = libxml_use_internal_errors(true);

        try {
            $document->loadHTML($html, LIBXML_NOWARNING | LIBXML_NOERROR);
            $this->dompdf->loadDOM($document);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousUseInternalErrors);
        }
    }

    private function normalizeHtmlForDomDocument(string $html, ?string $encoding = null): string
    {
        if (strncmp($html, "\xFE\xFF", 2) === 0) {
            $html = substr($html, 2);
            $encoding = 'UTF-16BE';
        } elseif (strncmp($html, "\xFF\xFE", 2) === 0) {
            $html = substr($html, 2);
            $encoding = 'UTF-16LE';
        } elseif (strncmp($html, "\xEF\xBB\xBF", 3) === 0) {
            $html = substr($html, 3);
            $encoding = 'UTF-8';
        }

        $encoding = $encoding ?: 'UTF-8';

        if (! in_array(strtoupper($encoding), ['UTF-8', 'UTF8'], true)) {
            $converted = mb_convert_encoding($html, 'UTF-8', $encoding);

            if ($converted !== false) {
                $html = $converted;
            }
        }

        return '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' . $html;
    }
}
