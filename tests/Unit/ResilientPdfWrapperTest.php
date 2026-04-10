<?php

namespace Tests\Unit;

use App\Support\ResilientPdfWrapper;
use Dompdf\Dompdf;
use Error;
use Illuminate\Config\Repository;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Filesystem\Filesystem;
use PHPUnit\Framework\TestCase;

class ResilientPdfWrapperTest extends TestCase
{
    public function test_it_falls_back_to_dom_document_when_html5_parser_is_missing(): void
    {
        $dompdf = new class extends Dompdf
        {
            public bool $loadDomCalled = false;

            public function loadHtml($str, $encoding = null)
            {
                throw new Error('Class "Masterminds\\HTML5\\Parser\\DOMTreeBuilder" not found');
            }

            public function loadDOM($doc, $quirksmode = false)
            {
                $this->loadDomCalled = true;

                return parent::loadDOM($doc, $quirksmode);
            }
        };

        $pdf = new ResilientPdfWrapper(
            $dompdf,
            new Repository(['dompdf' => ['convert_entities' => false]]),
            new Filesystem(),
            $this->createMock(ViewFactory::class)
        );

        $pdf->loadHTML('<html><body><h1>Certificat</h1></body></html>');

        $this->assertTrue($dompdf->loadDomCalled);
        $this->assertSame('html', $dompdf->getDom()->documentElement->nodeName);
    }

    public function test_it_rethrows_unrelated_pdf_errors(): void
    {
        $dompdf = new class extends Dompdf
        {
            public function loadHtml($str, $encoding = null)
            {
                throw new Error('Unexpected PDF error');
            }
        };

        $pdf = new ResilientPdfWrapper(
            $dompdf,
            new Repository(['dompdf' => ['convert_entities' => false]]),
            new Filesystem(),
            $this->createMock(ViewFactory::class)
        );

        $this->expectException(Error::class);
        $this->expectExceptionMessage('Unexpected PDF error');

        $pdf->loadHTML('<html><body><p>Test</p></body></html>');
    }
}
