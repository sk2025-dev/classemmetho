import { withBasePath } from '../../../Utils/urlHelper';

const types = { bapteme: 'Baptême', premiere_communion: 'Première communion', bapteme_premiere_communion: 'Baptême et première communion' };
export const exportHeaders = ['Référence', 'Candidat', 'Classe', 'Contact', 'Sacrement', 'Année', 'Version de liste', 'État'];
export function exportRows(rows, { history = false } = {}) {
    return rows.map(row => {
        const values = [
        row.reference || '', row.nom || '', row.list.classe?.nom || '',
        row.details?.telephone || '', types[row.type] || row.type || '',
        row.list.campagne?.annee || '', row.list.version || '',
        row.decision_pastorale ? ({ valider: 'Admission validée', refuser: 'Refusé', retourner: 'Correction demandée' }[row.decision_pastorale.decision] || '')
            : row.pending ? 'En attente' : ({ refuse: 'Refusé', admis: 'Admis par le pasteur', celebre: 'Célébré', partiel: 'Célébration partielle', archive: 'Archivé' }[row.dossier?.suivi_sacrement?.etape] || 'Déjà traité'),
        ];
        if (history) values.push(row.decision_pastorale?.date ? new Date(row.decision_pastorale.date).toLocaleString('fr-FR') : '', row.decision_pastorale?.acteur || '');
        return values;
    });
}
const loadLogo = path => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = withBasePath('', path);
});
export async function downloadSacrements(format, rows, { history = false } = {}) {
    const years = [...new Set(rows.map(row => row.list.campagne?.annee).filter(Boolean))].sort().join(' / ');
    const title = `Inscription cours de baptême et première communion${years ? ` — ${years}` : ''}`;
    const stamp = new Date().toLocaleString('fr-FR');
    const filename = `${history ? 'historique-' : ''}inscriptions-bapteme-communion-${new Date().toISOString().slice(0, 10)}`;
    const headers = history ? [...exportHeaders, 'Date de décision', 'Pasteur'] : exportHeaders;
    const data = exportRows(rows, { history });
    const subtitle = `${history ? 'Historique des décisions - ' : ''}${rows.length} inscription(s) affichée(s) - Export du ${stamp}`;
    if (format === 'pdf') {
        const [{ default: JsPDF }, { default: autoTable }, left, right] = await Promise.all([
            import('jspdf'), import('jspdf-autotable'), loadLogo('/images/metho.jpg'), loadLogo('/images/logo.png'),
        ]);
        const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const width = doc.internal.pageSize.getWidth();
        const logo = (img, x) => { if (img) { const scale = Math.min(23 / img.width, 20 / img.height); doc.addImage(img, x, 10, img.width * scale, img.height * scale); } };
        logo(left, 12); logo(right, width - 35);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 64, 175);
        doc.text(doc.splitTextToSize(title.replace(' — ', ' - '), width - 85), width / 2, 18, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
        doc.text(subtitle, 12, 37);
        autoTable(doc, { head: [headers], body: data, startY: 42, margin: { left: 12, right: 12, bottom: 16 },
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            headStyles: { fillColor: [30, 64, 175], textColor: 255 }, alternateRowStyles: { fillColor: [248, 250, 252] },
            didDrawPage: () => { doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, width - 25, doc.internal.pageSize.getHeight() - 8); },
        });
        doc.save(`${filename}.pdf`);
        return;
    }
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Jubilé de Cocody';
    const sheet = workbook.addWorksheet(history ? 'Historique' : 'Inscriptions', { views: [{ state: 'frozen', ySplit: 4 }] });
    const lastColumn = history ? 'J' : 'H';
    sheet.mergeCells(`A1:${lastColumn}1`); sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { bold: true, size: 15, color: { argb: 'FF1E40AF' } };
    sheet.getRow(1).height = 30;
    sheet.mergeCells(`A2:${lastColumn}2`); sheet.getCell('A2').value = subtitle;
    sheet.addRow([]); sheet.addRow(headers);
    data.forEach(row => sheet.addRow(row.map(value => String(value))));
    [25, 30, 22, 23, 35, 12, 17, 25, ...(history ? [23, 30] : [])].forEach((width, i) => { sheet.getColumn(i + 1).width = width; });
    sheet.getColumn(4).numFmt = '@';
    sheet.getRow(4).eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }; });
    sheet.autoFilter = { from: 'A4', to: `${lastColumn}4` };
    sheet.eachRow((row, index) => { if (index >= 4) { row.alignment = { vertical: 'middle', wrapText: true }; row.height = 30; } });
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a'); link.href = url; link.download = `${filename}.xlsx`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
