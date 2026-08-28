import React, { useState } from "react";
import { Instagram, Facebook, RotateCw } from "lucide-react";

// Format ID-1 (carte PVC standard : 85.6 x 54 mm)
const CARD_RATIO = "1.586 / 1";
const CARD_BG =
    "linear-gradient(160deg, #FBF3DC 0%, #F5E6BC 55%, #EFDCA0 100%)";

function TikTokIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M16.6 5.82c-1.1-.96-1.72-2.34-1.72-3.82h-3.4v13.4c0 1.6-1.3 2.9-2.9 2.9a2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .6.05.87.13V9.24a6.34 6.34 0 0 0-.87-.06A6.32 6.32 0 0 0 2.26 15.5a6.32 6.32 0 0 0 6.32 6.32 6.32 6.32 0 0 0 6.32-6.32V9.01a8.2 8.2 0 0 0 4.84 1.56V7.16c-1.02 0-2.02-.32-2.84-1.34" />
        </svg>
    );
}

function SocialBadge({ children, bg }) {
    return (
        <span
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow shrink-0"
            style={{ background: bg }}
        >
            {children}
        </span>
    );
}

function FlipHint({ label, className = "" }) {
    return (
        <div
            className={`absolute flex items-center gap-0.5 bg-emerald-900/10 hover:bg-emerald-900/20 text-emerald-900 text-[6px] sm:text-[8px] font-semibold px-1.5 py-0.5 rounded-full transition-colors leading-none ${className}`}
        >
            <RotateCw className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            {label}
        </div>
    );
}

/**
 * Carte de membre virtuelle, affichée à l'écran (pas de téléchargement).
 * Respecte le format d'une carte PVC standard (ID-1, ratio 85.6x54mm) :
 * logo en haut à gauche, photo en cercle à droite, QR code
 * visible sur la face avant, réseaux sociaux + nom de la classe en bas à
 * gauche, bande verte finale avec le thème/verset paramétrable. La carte
 * se retourne au clic pour afficher le QR code en grand au dos.
 * @param {object} props.carte - { membre, classe: {nom, logo_url, cachet_url}, signature_url, theme_texte, qr_code }
 */
export default function CarteVirtuelle({ carte }) {
    const [flipped, setFlipped] = useState(false);

    if (!carte) return null;

    const {
        membre,
        classe,
        qr_code: qrCode,
        signature_url: signatureUrl,
        theme_texte: themeTexte,
    } = carte;

    const toggleFlip = () => setFlipped((prev) => !prev);
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFlip();
        }
    };

    return (
        <div
            className="w-full max-w-md mx-auto"
            style={{ perspective: "1600px" }}
        >
            <div
                role="button"
                tabIndex={0}
                aria-label="Retourner la carte"
                onClick={toggleFlip}
                onKeyDown={handleKeyDown}
                className="relative w-full cursor-pointer outline-none"
                style={{
                    aspectRatio: CARD_RATIO,
                    display: "grid",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1)",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {/* Face avant */}
                <div
                    className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-black/10"
                    style={{
                        gridArea: "1 / 1",
                        backfaceVisibility: "hidden",
                        background: CARD_BG,
                        fontFamily: "inherit",
                    }}
                >
                    <div className="relative w-full h-full flex flex-col">
                        <FlipHint
                            label="QR en grand"
                            className="top-1 right-1 sm:top-1.5 sm:right-1.5"
                        />

                        {/* En-tête : logo + numéro de carte */}
                        <div className="flex items-start justify-between gap-1.5 px-2.5 sm:px-3.5 pt-1.5 sm:pt-2 shrink-0">
                            <div className="flex items-center min-w-0">
                                {classe?.logo_url ? (
                                    <img
                                        src={classe.logo_url}
                                        alt={classe?.nom ? `Classe ${classe.nom}` : ""}
                                        className="h-14 sm:h-20 w-auto max-w-[75%] object-contain shrink-0 mix-blend-multiply"
                                    />
                                ) : (
                                    <div className="min-w-0 leading-none">
                                        <div className="text-emerald-800 font-black text-[7px] sm:text-[9px] uppercase tracking-widest">
                                            Classe
                                        </div>
                                        <div className="text-emerald-800 font-black text-sm sm:text-xl uppercase leading-tight truncate">
                                            {classe?.nom}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {membre?.code_membre && (
                                <div className="shrink-0 bg-red-700 text-white text-[9px] sm:text-sm font-bold px-2 py-1 rounded shadow leading-none mt-3 sm:mt-5">
                                    N° : {membre.code_membre}
                                </div>
                            )}
                        </div>

                        {/* Bande dorée : identité + photo */}
                        <div
                            className="relative flex items-center px-2.5 sm:px-3.5 py-1 sm:py-1.5 mt-4 sm:mt-6 shrink-0"
                            style={{
                                background:
                                    "linear-gradient(90deg, #C9A227 0%, #D9B84A 55%, #C9A227 100%)",
                            }}
                        >
                            <div className="flex-1 min-w-0 pr-16 sm:pr-24">
                                <div className="text-white font-black uppercase text-[10px] sm:text-sm leading-tight truncate drop-shadow-sm">
                                    {membre?.nom}
                                </div>
                                <div className="text-white font-extrabold uppercase text-[10px] sm:text-sm leading-tight truncate drop-shadow-sm">
                                    {membre?.prenom}
                                </div>
                                {membre?.titre && (
                                    <div className="text-black font-semibold text-[7px] sm:text-[10px] leading-tight truncate">
                                        {membre.titre}
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-2 sm:right-3 -top-3.5 -bottom-3.5 sm:-top-5 sm:-bottom-5 flex items-center">
                                <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-full shadow-lg overflow-hidden bg-white shrink-0">
                                    {membre?.photo_url ? (
                                        <img
                                            src={membre.photo_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Téléphone */}
                        {membre?.telephone && (
                            <div className="px-2.5 sm:px-3.5 pt-0.5 sm:pt-1 shrink-0">
                                <div className="text-emerald-800 font-black text-[10px] sm:text-sm tracking-wide leading-tight">
                                    {membre.telephone}
                                </div>
                            </div>
                        )}

                        {/* Corps : réseaux sociaux, QR code, cachet + signature */}
                        <div className="flex-1 flex items-end justify-between gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 min-h-0">
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-1">
                                    <SocialBadge bg="radial-gradient(circle at 30% 30%, #f9ce34, #ee2a7b 55%, #6228d7)">
                                        <Instagram className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                    </SocialBadge>
                                    <SocialBadge bg="#111827">
                                        <TikTokIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                                    </SocialBadge>
                                    <SocialBadge bg="#1877F2">
                                        <Facebook className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                    </SocialBadge>
                                </div>
                                {classe?.nom && (
                                    <div className="text-emerald-900 font-bold text-[5.5px] sm:text-[8px] uppercase tracking-wide truncate">
                                        Classe {classe.nom}
                                    </div>
                                )}
                            </div>

                            {qrCode && (
                                <div className="shrink-0">
                                    <img
                                        src={qrCode}
                                        alt="QR code"
                                        className="w-8 h-8 sm:w-12 sm:h-12 rounded bg-white p-0.5 border border-emerald-900/20"
                                    />
                                </div>
                            )}

                            {(classe?.cachet_url || signatureUrl) && (
                                <div className="relative flex flex-col items-center shrink-0 w-16 sm:w-28 -mt-5 sm:-mt-10">
                                    {classe?.cachet_url && (
                                        <img
                                            src={classe.cachet_url}
                                            alt="Cachet"
                                            className="w-16 h-16 sm:w-28 sm:h-28 object-contain opacity-90 mix-blend-multiply"
                                        />
                                    )}
                                    {signatureUrl && (
                                        <img
                                            src={signatureUrl}
                                            alt="Signature"
                                            className="w-16 h-7 sm:w-28 sm:h-12 object-contain -mt-0.5"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bande finale : thème / verset */}
                        {themeTexte && (
                            <div
                                className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-center shrink-0"
                                style={{ background: "#0F3D24" }}
                            >
                                <p
                                    className="text-white text-[5.5px] sm:text-[8px] font-semibold italic leading-snug"
                                    style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {themeTexte}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Face arrière : QR code en grand */}
                <div
                    className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-black/10"
                    style={{
                        gridArea: "1 / 1",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: CARD_BG,
                        fontFamily: "inherit",
                    }}
                >
                    <div className="relative w-full h-full flex flex-col items-center justify-between px-4 py-2.5 sm:py-3.5">
                        <FlipHint
                            label="Voir la carte"
                            className="top-1 right-1 sm:top-1.5 sm:right-1.5"
                        />
                        {classe?.nom && (
                            <div className="text-emerald-800 font-black text-[8px] sm:text-xs uppercase tracking-widest shrink-0">
                                Classe {classe.nom}
                            </div>
                        )}
                        <div className="flex-1 min-h-0 flex items-center justify-center w-full">
                            {qrCode ? (
                                <img
                                    src={qrCode}
                                    alt="QR code"
                                    className="h-full max-h-full aspect-square rounded-lg bg-white p-2 border-2 sm:border-4 border-emerald-900 shadow-lg object-contain"
                                />
                            ) : (
                                <div className="h-full aspect-square rounded-lg bg-white/60 border-2 sm:border-4 border-emerald-900/30" />
                            )}
                        </div>
                        <div className="text-center shrink-0">
                            <div className="text-emerald-900 font-extrabold text-[9px] sm:text-sm leading-tight">
                                {membre?.prenom} {membre?.nom}
                            </div>
                            {membre?.code_membre && (
                                <div className="text-emerald-700 font-semibold text-[7px] sm:text-xs leading-tight">
                                    N° : {membre.code_membre}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
