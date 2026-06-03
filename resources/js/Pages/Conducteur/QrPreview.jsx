import React, { useRef, useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import html2pdf from "html2pdf.js";
import { withBasePath } from "../../Utils/urlHelper";

const pageStyles = `
.qr-preview-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%);
    padding: 28px 16px 40px;
}
.qr-preview-container {
    max-width: 980px;
    margin: 0 auto;
}
.qr-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 18px;
}
.btn-back {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.35);
    padding: 0.62rem 1.1rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
}
.btn-back:hover { background: rgba(255, 255, 255, 0.3); }
.btn-print {
    border: none;
    border-radius: 12px;
    padding: 0.68rem 1.15rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
    font-weight: 700;
    font-size: 0.92rem;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(217, 119, 6, 0.25);
}
.btn-print:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
.qr-sheet {
    background: #fff;
    border-radius: 18px;
    padding: 28px;
    box-shadow: 0 24px 42px rgba(0, 0, 0, 0.15);
}
.qr-sheet h1 {
    margin: 0;
    color: #111827;
    font-size: 1.5rem;
}
.qr-sheet-subtitle {
    margin-top: 6px;
    color: #6b7280;
    font-size: 0.95rem;
}
.qr-core {
    margin-top: 24px;
    display: grid;
    grid-template-columns: 1fr 310px;
    gap: 22px;
    align-items: center;
}
.qr-instruction {
    border: 1px solid #fbbf24;
    background: #fffbeb;
    color: #78350f;
    border-radius: 14px;
    padding: 14px 16px;
    font-weight: 600;
    line-height: 1.5;
}
.qr-details {
    margin-top: 14px;
    color: #374151;
    display: grid;
    gap: 7px;
}
.qr-preview-box {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
}
.qr-preview-box img {
    width: 100%;
    max-width: 280px;
    height: auto;
}
.qr-url {
    margin-top: 12px;
    color: #6b7280;
    font-size: 0.8rem;
    word-break: break-all;
}

@media (max-width: 780px) {
    .qr-core {
        grid-template-columns: 1fr;
    }
    .qr-sheet {
        padding: 20px;
    }
}
`;

export default function QrPreview() {
    const { props } = usePage();
    const { event, scanUrl, qrCode } = props;
    const printableRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const handleDownloadPdf = async () => {
        if (!printableRef.current) return;

        setIsPrinting(true);
        try {
            const options = {
                margin: [0.4, 0.4, 0.4, 0.4],
                filename: `fiche_scan_qr_activite_${event?.id || "x"}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            };

            await html2pdf().set(options).from(printableRef.current).save();
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <>
            <Head title="Preview QR activité" />
            <style>{pageStyles}</style>

            <div className="qr-preview-page">
                <div className="qr-preview-container">
                    <div className="qr-preview-header">
                        <button
                            type="button"
                            className="btn-back"
                            onClick={() =>
                                router.visit(withBasePath("", "/conducteur/programmes"))
                            }
                        >
                            ← Retour aux activités
                        </button>

                        <button
                            type="button"
                            className="btn-print"
                            onClick={handleDownloadPdf}
                            disabled={isPrinting}
                        >
                            {isPrinting
                                ? "Generation PDF..."
                                : "Imprimer le scan"}
                        </button>
                    </div>

                    <div className="qr-sheet" ref={printableRef}>
                        <h1>{event?.title || "Activite"}</h1>
                        <p className="qr-sheet-subtitle">
                            Fiche de scan de presence
                        </p>

                        <div className="qr-core">
                            <div>
                                <div className="qr-instruction">
                                    Scannez puis entrez votre code membre pour
                                    marquer votre presence.
                                </div>

                                <div className="qr-details">
                                    <div>
                                        <strong>Date:</strong>{" "}
                                        {formatDate(event?.date)}
                                    </div>
                                    <div>
                                        <strong>Heure:</strong>{" "}
                                        {event?.time
                                            ? event.time.substring(0, 5)
                                            : "--:--"}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="qr-preview-box">
                                    <img src={qrCode} alt="QR code activite" />
                                </div>
                                <div className="qr-url">{scanUrl}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
