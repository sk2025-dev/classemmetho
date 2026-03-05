import React, { useState } from "react";

// Données des différents types d'actes
const contentData = {
    bapteme: {
        title: "Certificat de Baptême",
        text: "Pour avoir reçu le sacrement saint du baptême au sein de notre communauté paroissiale, marquant son entrée dans la famille de Dieu.",
    },
    mariage: {
        title: "Certificat de Mariage",
        text: "Pour avoir uni leurs liens par le sacrement du mariage, témoignant de leur amour et de leur engagement devant Dieu et l’Assemblée.",
    },
    funerailles: {
        title: "Certificat de Funérailles",
        text: "Pour avoir accompagné avec dignité et prière le défunt vers la maison du Père, en présence de ses proches et de la communauté.",
    },
    remerciement: {
        title: "Certificat de Remerciement",
        text: "Pour exprimer notre profonde gratitude envers le généreux soutien et les prières offerts pour la vie de notre paroisse.",
    },
};

/**
 * Certificate component used for previewing a liturgical certificate.
 * Props:
 * - initialType: one of 'bapteme'|'mariage'|'funerailles'|'remerciement'
 * - recipientName (optional) : string
 * - date (optional) : formatted date string
 * - logoUrl, qrUrl, stampUrl (optional) : urls for images
 */
export default function Certificate({
    initialType = "bapteme",
    recipientName = "Nom et Prénom",
    date = new Date().toLocaleDateString(),
    logoUrl = "",
    scanUrl = "",
    qrUrl = "",
    stampUrl = "",
}) {
    const [actType, setActType] = useState(initialType);
    const currentData = contentData[actType];

    return (
        <>
            {/* Styles intégrés pour l'aperçu */}
            <style>
                {`
          body {
            background-color: #e0e0e0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: 'Lato', sans-serif;
          }
          .controls {
            background: #333;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .controls select {
            padding: 8px;
            font-size: 1rem;
            border-radius: 4px;
          }
          .certificate {
            background-color: #ffffff;
            width: 100%;
            max-width: 850px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            padding: 5px;
          }
          .border-frame {
            border: 15px solid #0f2c5c;
            padding: 5px;
          }
          .border-inner {
            border: 3px solid #c5a059;
            padding: 40px 50px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
          }
          .logo-container {
            width: 80px;
            text-align: left;
          }
          .logo-img {
            width: 80px;
            height: auto;
            object-fit: contain;
          }
          .title-container {
            flex: 1;
          }
          h1 {
            font-family: 'Cinzel', serif;
            font-size: 2.5rem;
            color: #0f2c5c;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            line-height: 1.1;
          }
          .qr-container {
            width: 80px;
            text-align: right;
          }
          .qr-img {
            width: 70px;
            height: 70px;
            border: 1px solid #ddd;
            padding: 2px;
            background: white;
          }
          
          .subtitle {
            font-family: 'Lato', sans-serif;
            font-size: 0.9rem;
            color: #c5a059;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
            font-weight: 700;
          }
          .recipient-name {
            font-family: 'Great Vibes', cursive;
            font-size: 3.5rem;
            color: #0f2c5c;
            margin: 10px 0 30px 0;
            line-height: 1;
          }
          .body-text {
            font-size: 1.1rem;
            color: #555;
            line-height: 1.8;
            margin-bottom: 50px;
            min-height: 60px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 20px;
            margin-top: 40px;
          }
          .footer-left {
            width: 30%;
            text-align: left;
            padding-bottom: 10px;
          }
          .footer-center {
            width: 30%;
            text-align: center;
          }
          .footer-right {
            width: 30%;
            text-align: right;
            height: 120px;
            position: relative;
            display: flex;
            justify-content: flex-end;
            align-items: center;
          }
          .stamp-real-img {
            width: 110px;
            height: auto;
            opacity: 0.85;
            transform: rotate(-15deg);
            position: absolute;
            bottom: 0;
            right: 0;
            z-index: 10;
          }
          .date-display {
            font-weight: bold;
            color: #333;
            font-size: 1rem;
            line-height: 1.5;
          }
        `}
            </style>

            {/* Google fonts (diapo only) */}
            <link
                href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Lato:wght@300;400;700&display=swap"
                rel="stylesheet"
            />

            <div className="controls">
                <label>
                    <strong>Type d'acte :</strong>
                </label>
                <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                >
                    <option value="bapteme">Baptême</option>
                    <option value="mariage">Mariage</option>
                    <option value="funerailles">Obsèques</option>
                    <option value="remerciement">Remerciement</option>
                </select>
            </div>

            <div className="certificate">
                <div className="border-frame">
                    <div className="border-inner">
                        <div className="header">
                            <div className="logo-container">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        className="logo-img"
                                        alt="Logo"
                                    />
                                ) : (
                                    <div className="note">Logo</div>
                                )}
                            </div>
                            <div className="title-container">
                                <h1>{currentData.title}</h1>
                            </div>
                            <div className="qr-container">
                                {scanUrl ? (
                                    <img
                                        src={scanUrl}
                                        className="qr-img"
                                        alt="Scan"
                                    />
                                ) : qrUrl ? (
                                    <img
                                        src={qrUrl}
                                        className="qr-img"
                                        alt="QR Code"
                                    />
                                ) : (
                                    <div className="note">QR</div>
                                )}
                            </div>
                        </div>

                        <div className="subtitle">
                            Ce certificat est fièrement décerné à
                        </div>
                        <div className="recipient-name">{recipientName}</div>
                        <div className="body-text">{currentData.text}</div>

                        <div className="footer">
                            <div className="footer-left">
                                <div className="date-display">
                                    Fait le : {date}
                                </div>
                            </div>
                            <div className="footer-center"></div>
                            <div className="footer-right">
                                {stampUrl && (
                                    <img
                                        src={stampUrl}
                                        className="stamp-real-img"
                                        alt="Signature du pasteur"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
