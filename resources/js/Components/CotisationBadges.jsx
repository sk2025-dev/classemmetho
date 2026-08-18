import React from "react";
import { Check, Clock } from "lucide-react";

/**
 * Affiche le détail des cotisations d'un membre (nom + montant), une pastille
 * par cotisation : verte si intégralement payée, ambre sinon.
 */
export default function CotisationBadges({ cotisations = [] }) {
    if (cotisations.length === 0) {
        return <span className="text-gray-300 italic text-xs">—</span>;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {cotisations.map((c, idx) => {
                const paye = c.du === 0;
                return (
                    <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            paye
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                        }`}
                        title={
                            paye
                                ? `${c.nom} : payé (${c.paye.toLocaleString()})`
                                : `${c.nom} : ${c.paye.toLocaleString()} payé sur ${c.montant.toLocaleString()}`
                        }
                    >
                        {paye ? (
                            <Check className="w-3 h-3" />
                        ) : (
                            <Clock className="w-3 h-3" />
                        )}
                        {c.nom} · {c.montant.toLocaleString()}
                    </span>
                );
            })}
        </div>
    );
}
