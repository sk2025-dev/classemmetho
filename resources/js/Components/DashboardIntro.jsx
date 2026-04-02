import React from "react";

export default function DashboardIntro({
    title,
    familyName = null,
    classeLabel = null,
}) {
    const details = [];

    if (familyName) {
        details.push(
            <>
                Famille: <strong>{familyName}</strong>
            </>,
        );
    }

    if (classeLabel) {
        details.push(
            <>
                Classe Methodiste: <strong>{classeLabel}</strong>
            </>,
        );
    }

    return (
        <div className="mb-10">
            <h2 className="dashboard-title">{title}</h2>
            {details.length > 0 && (
                <p className="dashboard-meta">
                    {details.map((detail, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && " - "}
                            {detail}
                        </React.Fragment>
                    ))}
                </p>
            )}
            <div className="animated-text-container">
                <p className="animated-text">
                    Bienvenue sur la plateforme de gestion des classes
                    methodistes du Jubile
                </p>
            </div>
        </div>
    );
}
