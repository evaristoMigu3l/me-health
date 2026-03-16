import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { format } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';

// ─── TRANSLATIONS ───────────────────────────────────────────────────────────

const trans = (str: string, lang: 'en' | 'pt') => {
    const dict: Record<string, any> = {
        'Name': { pt: 'Nome' },
        'Preparation': { pt: 'Preparação' },
        'Dosage Unit': { pt: 'Unidade de Dosagem' },
        'Frequency': { pt: 'Frequência' },
        'Start Date': { pt: 'Data de Início' },
        'End Date': { pt: 'Data de Término' },
        'Status': { pt: 'Status' },
        'Self Prescribed': { pt: 'Auto-prescrito' },
        'Target Condition': { pt: 'Condição Alvo' },
        'Location': { pt: 'Local' },
        'Type': { pt: 'Tipo' },
        'Notes': { pt: 'Notas' },
        'Intensity (0-100)': { pt: 'Intensidade (0-100)' },
        'Severity': { pt: 'Gravidade' },
        'Date Started': { pt: 'Data de Início' },
        'Duration': { pt: 'Duração' },
        'Location/Place': { pt: 'Local/Lugar' },
        'Reading': { pt: 'Leitura' },
        'Unit': { pt: 'Unidade' },
        'Date/Time': { pt: 'Data/Hora' },
        'Condition': { pt: 'Condição' },
        'Treatment': { pt: 'Tratamento' },
        'Date of Diagnosis': { pt: 'Data do Diagnóstico' },
        'Doctor': { pt: 'Médico' },
        'Feeling': { pt: 'Sentimento' },
        'Hours': { pt: 'Horas' },
        'Quality': { pt: 'Qualidade' },
        'Category': { pt: 'Categoria' },
        'Activity': { pt: 'Atividade' },
        'Minutes': { pt: 'Minutos' },
        'Reason': { pt: 'Motivo' },
        'Length': { pt: 'Duração' },
        'Result': { pt: 'Resultado' },
        'Meal Type': { pt: 'Tipo de Refeição' },
        'Calories': { pt: 'Calorias' },
        'Carbs (g)': { pt: 'Carboidratos (g)' },
        'Protein (g)': { pt: 'Proteína (g)' },
        'Fat (g)': { pt: 'Gordura (g)' },
        'Yes': { pt: 'Sim' },
        'No': { pt: 'Não' },
        'Current': { pt: 'Atual' },
        'Completed': { pt: 'Concluído' },

        '=== MEDICATIONS ===': { pt: '=== MEDICAMENTOS ===' },
        '=== SYMPTOMS ===': { pt: '=== SINTOMAS ===' },
        '=== MEASUREMENTS ===': { pt: '=== MEDIÇÕES ===' },
        '=== DIAGNOSES ===': { pt: '=== DIAGNÓSTICOS ===' },
        '=== MOOD LOGS ===': { pt: '=== DIÁRIO DE HUMOR ===' },
        '=== SLEEP LOGS ===': { pt: '=== DIÁRIO DE SONO ===' },
        '=== ACTIVITIES ===': { pt: '=== ATIVIDADES ===' },
        '=== APPOINTMENTS ===': { pt: '=== CONSULTAS ===' },
        '=== EXAMS/INVESTIGATIONS ===': { pt: '=== EXAMES/INVESTIGAÇÕES ===' },
        '=== NUTRITION / FOOD ENTRIES ===': { pt: '=== NUTRIÇÃO / REFEIÇÕES ===' },

        'Medications': { pt: 'Medicamentos' },
        'Symptoms': { pt: 'Sintomas' },
        'Measurements': { pt: 'Medições' },
        'Diagnoses': { pt: 'Diagnósticos' },
        'Appointments': { pt: 'Consultas' },
        'Exams & Investigations': { pt: 'Exames & Investigações' },
        'Mood Log': { pt: 'Log de Humor' },
        'Sleep Log': { pt: 'Log de Sono' },
        'Activities': { pt: 'Atividades' },
        'Nutrition Log': { pt: 'Log de Nutrição' },

        'Me &amp; Health — Personal Health Report': { pt: 'Me &amp; Health — Relatório Pessoal de Saúde' },
        'Patient': { pt: 'Paciente' },
        'Generated': { pt: 'Gerado em' },
        'Date': { pt: 'Data' },
        'Prep': { pt: 'Prep' },
        'Freq': { pt: 'Freq' },
        'Export App Data': { pt: 'Exportar Dados do App' },
        'Export Health Data (CSV)': { pt: 'Exportar Dados de Saúde (CSV)' },
        'Export Health Report (PDF)': { pt: 'Exportar Relatório de Saúde (PDF)' }
    };
    return lang === 'pt' ? (dict[str]?.pt || str) : str;
};

// ─── JSON APP BACKUP ────────────────────────────────────────────────────────

export async function exportAppDataAsJSON(data: object, lang: 'en' | 'pt' = 'en'): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    const fileName = `mehealth_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, json, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: trans('Export App Data', lang) });
}

// ─── CSV ────────────────────────────────────────────────────────────────────

function toCSV(headers: string[], rows: (string | number | undefined)[][]): string {
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

export async function exportAllHealthDataAsCSV(healthData: any, lang: 'en' | 'pt' = 'en'): Promise<void> {
    const sections: string[] = [];

    if (healthData.medications?.length) {
        sections.push(trans('=== MEDICATIONS ===', lang));
        sections.push(toCSV(
            ['Name', 'Preparation', 'Dosage Unit', 'Frequency', 'Start Date', 'End Date', 'Status', 'Self Prescribed', 'Target Condition', 'Location', 'Type', 'Notes'].map(h => trans(h, lang)),
            healthData.medications.map((m: any) => [m.name, trans(m.preparation, lang), m.dosageUnit, m.frequency, m.startDate, m.endDate, trans(m.status, lang), m.selfPrescribed ? trans('Yes', lang) : trans('No', lang), m.targetCondition, m.location, trans(m.type, lang), m.notes])
        ));
    }

    if (healthData.symptoms?.length) {
        sections.push('\n' + trans('=== SYMPTOMS ===', lang));
        sections.push(toCSV(
            ['Name', 'Intensity (0-100)', 'Severity', 'Date Started', 'Duration', 'Location/Place', 'Notes'].map(h => trans(h, lang)),
            healthData.symptoms.map((s: any) => [s.name, s.intensity, trans(s.intensityLabel, lang), s.dateStarted, s.duration, s.place, s.notes])
        ));
    }

    if (healthData.measurements?.length) {
        sections.push('\n' + trans('=== MEASUREMENTS ===', lang));
        sections.push(toCSV(
            ['Type', 'Reading', 'Unit', 'Date/Time', 'Notes'].map(h => trans(h, lang)),
            healthData.measurements.map((m: any) => [trans(m.type, lang), m.reading, m.unit, m.dateTime, m.notes])
        ));
    }

    if (healthData.diagnoses?.length) {
        sections.push('\n' + trans('=== DIAGNOSES ===', lang));
        sections.push(toCSV(
            ['Condition', 'Status', 'Treatment', 'Date of Diagnosis', 'Doctor', 'Notes'].map(h => trans(h, lang)),
            healthData.diagnoses.map((d: any) => [d.condition, trans(d.status, lang), d.treatment, d.dateOfDiagnosis, d.diagnosingDoctor, d.notes])
        ));
    }

    if (healthData.moodLogs?.length) {
        sections.push('\n' + trans('=== MOOD LOGS ===', lang));
        sections.push(toCSV(
            ['Feeling', 'Date/Time', 'Notes'].map(h => trans(h, lang)),
            healthData.moodLogs.map((m: any) => [trans(m.feeling, lang), m.dateTime, m.notes])
        ));
    }

    if (healthData.sleepLogs?.length) {
        sections.push('\n' + trans('=== SLEEP LOGS ===', lang));
        sections.push(toCSV(
            ['Date/Time', 'Hours', 'Quality', 'Notes'].map(h => trans(h, lang)),
            healthData.sleepLogs.map((s: any) => [s.dateTime, s.hours, trans(s.quality, lang), s.notes])
        ));
    }

    if (healthData.activities?.length) {
        sections.push('\n' + trans('=== ACTIVITIES ===', lang));
        sections.push(toCSV(
            ['Category', 'Activity', 'Hours', 'Minutes', 'Date/Time', 'Notes'].map(h => trans(h, lang)),
            healthData.activities.map((a: any) => [trans(a.category, lang), a.specificActivity, a.durationHours, a.durationMinutes, a.dateTime, a.notes])
        ));
    }

    if (healthData.appointments?.length) {
        sections.push('\n' + trans('=== APPOINTMENTS ===', lang));
        sections.push(toCSV(
            ['Reason', 'Type', 'Doctor', 'Location', 'Date/Time', 'Duration (min)'].map(h => trans(h, lang)),
            healthData.appointments.map((a: any) => [a.reason, trans(a.type, lang), a.doctorName, a.location, a.dateTime, a.durationMinutes])
        ));
    }

    if (healthData.investigations?.length) {
        sections.push('\n' + trans('=== EXAMS/INVESTIGATIONS ===', lang));
        sections.push(toCSV(
            ['Type', 'Status', 'Date/Time', 'Result', 'Notes'].map(h => trans(h, lang)),
            healthData.investigations.map((i: any) => [trans(i.type, lang), trans(i.status, lang), i.dateTime, i.result, i.notes])
        ));
    }

    if (healthData.foodEntries?.length) {
        sections.push('\n' + trans('=== NUTRITION / FOOD ENTRIES ===', lang));
        sections.push(toCSV(
            ['Name', 'Meal Type', 'Calories', 'Carbs (g)', 'Protein (g)', 'Fat (g)', 'Date/Time', 'Notes'].map(h => trans(h, lang)),
            healthData.foodEntries.map((f: any) => [f.name, trans(f.type, lang), f.calories, f.carbs, f.protein, f.fat, f.dateTime, f.notes])
        ));
    }

    const csv = sections.join('\n');
    const fileName = `mehealth_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: trans('Export Health Data (CSV)', lang) });
}

// ─── PDF ────────────────────────────────────────────────────────────────────

export async function exportAllHealthDataAsPDF(healthData: any, userName: string, lang: 'en' | 'pt' = 'en'): Promise<void> {
    const locale = lang === 'pt' ? ptBR : enUS;
    const section = (title: string, rows: string) =>
        rows ? `<div class="section"><h2>${trans(title, lang)}</h2>${rows}</div>` : '';

    const table = (headers: string[], rows: string[][]) => `
        <table>
            <thead><tr>${headers.map(h => `<th>${trans(h, lang)}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;

    const safeDate = (d: string) => { try { return format(new Date(d), 'PP', { locale }); } catch { return d; } };
    const safeDateTime = (d: string) => { try { return format(new Date(d), 'PPp', { locale }); } catch { return d; } };

    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #1f2937; padding: 24px; }
        h1 { color: #0f766e; font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
        .section { margin-bottom: 32px; }
        h2 { color: #0f766e; font-size: 16px; border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #0f766e; color: white; text-align: left; padding: 8px; }
        td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
    </style></head><body>
        <h1>${trans('Me &amp; Health — Personal Health Report', lang)}</h1>
        <p class="subtitle">${trans('Patient', lang)}: ${userName || 'User'} &nbsp;|&nbsp; ${trans('Generated', lang)}: ${format(new Date(), 'PPP', { locale })}</p>

        ${healthData.medications?.length ? section('Medications', table(
        ['Name', 'Prep', 'Freq', 'Start Date', 'End Date', 'Status', 'Notes'],
        healthData.medications.map((m: any) => {
            // Determine actual status based on end date
            let actualStatus = m.status || 'Current';
            if (m.endDate && new Date(m.endDate).getTime() < new Date().getTime()) {
                actualStatus = 'Completed';
            }
            return [m.name, trans(m.preparation, lang), m.frequency, safeDate(m.startDate), m.endDate ? safeDate(m.endDate) : '—', trans(actualStatus, lang), m.notes || '—'];
        })
    )) : ''}

        ${healthData.symptoms?.length ? section('Symptoms', table(
        ['Name', 'Severity', 'Intensity (0-100)', 'Date Started', 'Location', 'Notes'],
        healthData.symptoms.map((s: any) => [s.name, trans(s.intensityLabel, lang), s.intensity, safeDate(s.dateStarted), s.place || '—', s.notes || '—'])
    )) : ''}

        ${healthData.measurements?.length ? section('Measurements', table(
        ['Type', 'Reading', 'Unit', 'Date/Time', 'Notes'],
        healthData.measurements.map((m: any) => [trans(m.type, lang), m.reading, m.unit, safeDateTime(m.dateTime), m.notes || '—'])
    )) : ''}

        ${healthData.diagnoses?.length ? section('Diagnoses', table(
        ['Condition', 'Status', 'Treatment', 'Date', 'Doctor', 'Notes'],
        healthData.diagnoses.map((d: any) => [d.condition, trans(d.status, lang), d.treatment || '—', safeDate(d.dateOfDiagnosis), d.diagnosingDoctor || '—', d.notes || '—'])
    )) : ''}

        ${healthData.appointments?.length ? section('Appointments', table(
        ['Reason', 'Type', 'Doctor', 'Location', 'Date', 'Length'],
        healthData.appointments.map((a: any) => [a.reason || '—', trans(a.type, lang), a.doctorName || '—', a.location || '—', safeDateTime(a.dateTime), `${a.durationMinutes}m`])
    )) : ''}
    
        ${healthData.investigations?.length ? section('Exams & Investigations', table(
        ['Type', 'Status', 'Result', 'Date/Time', 'Notes'],
        healthData.investigations.map((i: any) => [trans(i.type, lang), trans(i.status, lang), i.result || '—', safeDateTime(i.dateTime), i.notes || '—'])
    )) : ''}

        ${healthData.moodLogs?.length ? section('Mood Log', table(
        ['Feeling', 'Date/Time', 'Notes'],
        healthData.moodLogs.map((m: any) => [trans(m.feeling, lang), safeDateTime(m.dateTime), m.notes || '—'])
    )) : ''}

        ${healthData.sleepLogs?.length ? section('Sleep Log', table(
        ['Date/Time', 'Hours', 'Quality', 'Notes'],
        healthData.sleepLogs.map((s: any) => [safeDateTime(s.dateTime), s.hours, trans(s.quality, lang) || '—', s.notes || '—'])
    )) : ''}

        ${healthData.activities?.length ? section('Activities', table(
        ['Category', 'Activity', 'Length', 'Date/Time', 'Notes'],
        healthData.activities.map((a: any) => [trans(a.category, lang), a.specificActivity, `${a.durationHours}h ${a.durationMinutes}m`, safeDateTime(a.dateTime), a.notes || '—'])
    )) : ''}
    
        ${healthData.foodEntries?.length ? section('Nutrition Log', table(
        ['Meal Type', 'Name', 'Calories', 'Date/Time', 'Notes'],
        healthData.foodEntries.map((f: any) => [trans(f.type, lang), f.name, f.calories, safeDateTime(f.dateTime), f.notes || '—'])
    )) : ''}
    </body></html>`;

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const fileName = `mehealth_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    const dest = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: dest });
    await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: trans('Export Health Report (PDF)', lang) });
}
