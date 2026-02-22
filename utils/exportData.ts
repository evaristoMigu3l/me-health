import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { format } from 'date-fns';

// ─── JSON APP BACKUP ────────────────────────────────────────────────────────

export async function exportAppDataAsJSON(data: object): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    const fileName = `mehealth_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, json, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: 'Export App Data' });
}

// ─── CSV ────────────────────────────────────────────────────────────────────

function toCSV(headers: string[], rows: (string | number | undefined)[][]): string {
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

export async function exportAllHealthDataAsCSV(healthData: any): Promise<void> {
    const sections: string[] = [];

    if (healthData.medications?.length) {
        sections.push('=== MEDICATIONS ===');
        sections.push(toCSV(
            ['Name', 'Preparation', 'Dosage Unit', 'Frequency', 'Start Date', 'End Date', 'Status', 'Notes'],
            healthData.medications.map((m: any) => [m.name, m.preparation, m.dosageUnit, m.frequency, m.startDate, m.endDate, m.status, m.notes])
        ));
    }

    if (healthData.symptoms?.length) {
        sections.push('\n=== SYMPTOMS ===');
        sections.push(toCSV(
            ['Name', 'Intensity', 'Severity', 'Date Started', 'Duration', 'Notes'],
            healthData.symptoms.map((s: any) => [s.name, s.intensity, s.intensityLabel, s.dateStarted, s.duration, s.notes])
        ));
    }

    if (healthData.measurements?.length) {
        sections.push('\n=== MEASUREMENTS ===');
        sections.push(toCSV(
            ['Type', 'Reading', 'Unit', 'Date/Time', 'Notes'],
            healthData.measurements.map((m: any) => [m.type, m.reading, m.unit, m.dateTime, m.notes])
        ));
    }

    if (healthData.diagnoses?.length) {
        sections.push('\n=== DIAGNOSES ===');
        sections.push(toCSV(
            ['Condition', 'Date of Diagnosis', 'Doctor', 'Notes'],
            healthData.diagnoses.map((d: any) => [d.condition, d.dateOfDiagnosis, d.diagnosingDoctor, d.notes])
        ));
    }

    if (healthData.moodLogs?.length) {
        sections.push('\n=== MOOD LOGS ===');
        sections.push(toCSV(
            ['Mood', 'Date', 'Notes'],
            healthData.moodLogs.map((m: any) => [m.mood, m.date, m.notes])
        ));
    }

    if (healthData.sleepLogs?.length) {
        sections.push('\n=== SLEEP LOGS ===');
        sections.push(toCSV(
            ['Date', 'Duration (hrs)', 'Quality', 'Notes'],
            healthData.sleepLogs.map((s: any) => [s.date, s.duration, s.quality, s.notes])
        ));
    }

    if (healthData.activities?.length) {
        sections.push('\n=== ACTIVITIES ===');
        sections.push(toCSV(
            ['Type', 'Duration (min)', 'Date', 'Notes'],
            healthData.activities.map((a: any) => [a.type, a.duration, a.date, a.notes])
        ));
    }

    if (healthData.appointments?.length) {
        sections.push('\n=== APPOINTMENTS ===');
        sections.push(toCSV(
            ['Reason', 'Doctor', 'Location', 'Date/Time', 'Type'],
            healthData.appointments.map((a: any) => [a.reason, a.doctorName, a.location, a.dateTime, a.type])
        ));
    }

    if (healthData.foodEntries?.length) {
        sections.push('\n=== FOOD ENTRIES ===');
        sections.push(toCSV(
            ['Name', 'Calories', 'Carbs', 'Protein', 'Fat', 'Date'],
            healthData.foodEntries.map((f: any) => [f.name, f.calories, f.carbs, f.protein, f.fat, f.date])
        ));
    }

    const csv = sections.join('\n');
    const fileName = `mehealth_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Export Health Data (CSV)' });
}

// ─── PDF ────────────────────────────────────────────────────────────────────

export async function exportAllHealthDataAsPDF(healthData: any, userName: string): Promise<void> {
    const section = (title: string, rows: string) =>
        rows ? `<div class="section"><h2>${title}</h2>${rows}</div>` : '';

    const table = (headers: string[], rows: string[][]) => `
        <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;

    const safeDate = (d: string) => { try { return format(new Date(d), 'PP'); } catch { return d; } };
    const safeDateTime = (d: string) => { try { return format(new Date(d), 'PPp'); } catch { return d; } };

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
        <h1>Me &amp; Health — Personal Health Report</h1>
        <p class="subtitle">Patient: ${userName || 'User'} &nbsp;|&nbsp; Generated: ${format(new Date(), 'PPP')}</p>

        ${healthData.medications?.length ? section('Medications', table(
        ['Name', 'Preparation', 'Frequency', 'Start Date', 'Status'],
        healthData.medications.map((m: any) => [m.name, m.preparation, m.frequency, safeDate(m.startDate), m.status])
    )) : ''}

        ${healthData.symptoms?.length ? section('Symptoms', table(
        ['Name', 'Severity', 'Intensity', 'Date Started', 'Duration'],
        healthData.symptoms.map((s: any) => [s.name, s.intensityLabel, s.intensity, safeDate(s.dateStarted), s.duration || '—'])
    )) : ''}

        ${healthData.measurements?.length ? section('Measurements', table(
        ['Type', 'Reading', 'Unit', 'Date/Time'],
        healthData.measurements.map((m: any) => [m.type, m.reading, m.unit, safeDateTime(m.dateTime)])
    )) : ''}

        ${healthData.diagnoses?.length ? section('Diagnoses', table(
        ['Condition', 'Date', 'Doctor'],
        healthData.diagnoses.map((d: any) => [d.condition, safeDate(d.dateOfDiagnosis), d.diagnosingDoctor || '—'])
    )) : ''}

        ${healthData.appointments?.length ? section('Appointments', table(
        ['Reason', 'Doctor', 'Location', 'Date'],
        healthData.appointments.map((a: any) => [a.reason, a.doctorName, a.location, safeDateTime(a.dateTime)])
    )) : ''}

        ${healthData.moodLogs?.length ? section('Mood Log', table(
        ['Mood', 'Date', 'Notes'],
        healthData.moodLogs.map((m: any) => [m.mood, safeDate(m.date), m.notes || '—'])
    )) : ''}

        ${healthData.sleepLogs?.length ? section('Sleep Log', table(
        ['Date', 'Duration (hrs)', 'Quality'],
        healthData.sleepLogs.map((s: any) => [safeDate(s.date), s.duration, s.quality || '—'])
    )) : ''}

        ${healthData.activities?.length ? section('Activities', table(
        ['Type', 'Duration (min)', 'Date'],
        healthData.activities.map((a: any) => [a.type, a.duration, safeDate(a.date)])
    )) : ''}
    </body></html>`;

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const fileName = `mehealth_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    const dest = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: dest });
    await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Export Health Report (PDF)' });
}
