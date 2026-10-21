export function canFollowUp(row, action) {
    const suivi = row.dossier?.suivi_sacrement;
    if (!suivi || row.decision_pastorale?.decision !== 'valider') return false;
    if (action === 'rectifier') return Object.keys(suivi.celebrations || {}).length > 0;
    return !row.list.campagne?.archivee_at && ['admis', 'partiel'].includes(suivi.etape);
}

export function candidateSacrements(row, action) {
    return ['bapteme', 'premiere_communion', 'bapteme_premiere_communion'].filter(type => {
        const suivi = row.dossier?.suivi_sacrement || {};
        if (action === 'rectifier') return !!suivi.celebrations?.[type];
        if (type === 'bapteme_premiere_communion') return row.type === type && !suivi.celebrations?.bapteme && !suivi.celebrations?.premiere_communion;
        if (row.type !== type && row.type !== 'bapteme_premiere_communion') return false;
        if (suivi.celebrations?.[type]) return false;
        return type !== 'premiere_communion' || row.type !== 'bapteme_premiere_communion' || !!suivi.celebrations?.bapteme;
    });
}

export function groupProblem(rows, action) {
    if (!rows.length) return 'Sélectionnez au moins un candidat.';
    if (rows.length > 100) return 'Sélectionnez au maximum 100 candidats par opération.';
    if (new Set(rows.map(row => String(row.list.campagne_id))).size > 1) return 'Filtrez une campagne pour traiter ses candidats ensemble, toutes classes confondues.';
    if (!rows.every(row => canFollowUp(row, action))) return 'Cette action ne s’applique pas à tous les dossiers sélectionnés. Ajustez la sélection selon leur état.';
    if (['celebrer', 'rectifier'].includes(action) && rows.some(row => !candidateSacrements(row, action).length)) return 'Un candidat ne possède aucun sacrement disponible pour cette action.';
    return '';
}
