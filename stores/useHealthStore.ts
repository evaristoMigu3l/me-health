import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    scheduleMedicationReminder,
    scheduleAppointmentReminder,
    cancelNotification
} from '../utils/notifications';
import {
    Symptom, Medication, Measurement, Diagnosis, MoodLog,
    DietPlan, Investigation, Activity, SleepLog, FoodEntry,
    Document, Appointment, HCP
} from '../types';

interface HealthState {
    symptoms: Symptom[];
    addSymptom: (s: Symptom) => void;
    updateSymptom: (s: Symptom) => void;
    removeSymptom: (id: string) => void;

    medications: Medication[];
    addMedication: (m: Medication) => void;
    updateMedication: (m: Medication) => void;
    removeMedication: (id: string) => void;

    measurements: Measurement[];
    addMeasurement: (m: Measurement) => void;
    updateMeasurement: (m: Measurement) => void;
    removeMeasurement: (id: string) => void;

    diagnoses: Diagnosis[];
    addDiagnosis: (d: Diagnosis) => void;
    updateDiagnosis: (d: Diagnosis) => void;
    removeDiagnosis: (id: string) => void;

    moodLogs: MoodLog[];
    addMoodLog: (m: MoodLog) => void;
    updateMoodLog: (m: MoodLog) => void;
    removeMoodLog: (id: string) => void;

    dietPlans: DietPlan[];
    addDietPlan: (d: DietPlan) => void;
    removeDietPlan: (id: string) => void;

    investigations: Investigation[];
    addInvestigation: (i: Investigation) => void;
    updateInvestigation: (i: Investigation) => void;
    removeInvestigation: (id: string) => void;

    activities: Activity[];
    addActivity: (a: Activity) => void;
    updateActivity: (a: Activity) => void;
    removeActivity: (id: string) => void;

    sleepLogs: SleepLog[];
    addSleepLog: (s: SleepLog) => void;
    updateSleepLog: (s: SleepLog) => void;
    removeSleepLog: (id: string) => void;

    foodEntries: FoodEntry[];
    addFoodEntry: (f: FoodEntry) => void;
    updateFoodEntry: (f: FoodEntry) => void;
    removeFoodEntry: (id: string) => void;

    documents: Document[];
    addDocument: (d: Document) => void;
    removeDocument: (id: string) => void;

    appointments: Appointment[];
    addAppointment: (a: Appointment) => void;
    updateAppointment: (a: Appointment) => void;
    removeAppointment: (id: string) => void;

    hcps: HCP[];
    addHCP: (h: HCP) => void;
    removeHCP: (id: string) => void;
}

export const useHealthStore = create<HealthState>()(
    persist(
        (set) => ({
            symptoms: [],
            addSymptom: (s) => set((state) => ({ symptoms: [...state.symptoms, s] })),
            updateSymptom: (updated) => set((state) => ({ symptoms: state.symptoms.map((s) => (s.id === updated.id ? updated : s)) })),
            removeSymptom: (id) => set((state) => ({ symptoms: state.symptoms.filter((s) => s.id !== id) })),

            medications: [],
            addMedication: (m) => {
                scheduleMedicationReminder(m);
                set((state) => ({ medications: [...state.medications, m] }));
            },
            updateMedication: (updated) => {
                scheduleMedicationReminder(updated);
                set((state) => ({ medications: state.medications.map((m) => (m.id === updated.id ? updated : m)) }));
            },
            removeMedication: (id) => {
                cancelNotification(id, 'med');
                set((state) => ({ medications: state.medications.filter((m) => m.id !== id) }));
            },

            measurements: [],
            addMeasurement: (m) => set((state) => ({ measurements: [...state.measurements, m] })),
            updateMeasurement: (updated) => set((state) => ({ measurements: state.measurements.map((m) => (m.id === updated.id ? updated : m)) })),
            removeMeasurement: (id) => set((state) => ({ measurements: state.measurements.filter((m) => m.id !== id) })),

            diagnoses: [],
            addDiagnosis: (d) => set((state) => ({ diagnoses: [...state.diagnoses, d] })),
            updateDiagnosis: (updated) => set((state) => ({ diagnoses: state.diagnoses.map((d) => (d.id === updated.id ? updated : d)) })),
            removeDiagnosis: (id) => set((state) => ({ diagnoses: state.diagnoses.filter((d) => d.id !== id) })),

            moodLogs: [],
            addMoodLog: (m) => set((state) => ({ moodLogs: [...state.moodLogs, m] })),
            updateMoodLog: (updated) => set((state) => ({ moodLogs: state.moodLogs.map((m) => (m.id === updated.id ? updated : m)) })),
            removeMoodLog: (id) => set((state) => ({ moodLogs: state.moodLogs.filter((m) => m.id !== id) })),

            dietPlans: [],
            addDietPlan: (d) => set((state) => ({ dietPlans: [...state.dietPlans, d] })),
            removeDietPlan: (id) => set((state) => ({ dietPlans: state.dietPlans.filter((d) => d.id !== id) })),

            investigations: [],
            addInvestigation: (i) => set((state) => ({ investigations: [...state.investigations, i] })),
            updateInvestigation: (updated) => set((state) => ({ investigations: state.investigations.map((i) => (i.id === updated.id ? updated : i)) })),
            removeInvestigation: (id) => set((state) => ({ investigations: state.investigations.filter((i) => i.id !== id) })),

            activities: [],
            addActivity: (a) => set((state) => ({ activities: [...state.activities, a] })),
            updateActivity: (updated) => set((state) => ({ activities: state.activities.map((a) => (a.id === updated.id ? updated : a)) })),
            removeActivity: (id) => set((state) => ({ activities: state.activities.filter((a) => a.id !== id) })),

            sleepLogs: [],
            addSleepLog: (s) => set((state) => ({ sleepLogs: [...state.sleepLogs, s] })),
            updateSleepLog: (updated) => set((state) => ({ sleepLogs: state.sleepLogs.map((s) => (s.id === updated.id ? updated : s)) })),
            removeSleepLog: (id) => set((state) => ({ sleepLogs: state.sleepLogs.filter((s) => s.id !== id) })),

            foodEntries: [],
            addFoodEntry: (f) => set((state) => ({ foodEntries: [...state.foodEntries, f] })),
            updateFoodEntry: (updated) => set((state) => ({ foodEntries: state.foodEntries.map((f) => (f.id === updated.id ? updated : f)) })),
            removeFoodEntry: (id) => set((state) => ({ foodEntries: state.foodEntries.filter((f) => f.id !== id) })),

            documents: [],
            addDocument: (d) => set((state) => ({ documents: [...state.documents, d] })),
            removeDocument: (id) => set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

            appointments: [],
            addAppointment: (a) => {
                scheduleAppointmentReminder(a);
                set((state) => ({ appointments: [...state.appointments, a] }));
            },
            updateAppointment: (updated) => {
                scheduleAppointmentReminder(updated);
                set((state) => ({ appointments: state.appointments.map((a) => (a.id === updated.id ? updated : a)) }));
            },
            removeAppointment: (id) => {
                cancelNotification(id, 'appt');
                set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) }));
            },

            hcps: [],
            addHCP: (h) => set((state) => ({ hcps: [...state.hcps, h] })),
            removeHCP: (id) => set((state) => ({ hcps: state.hcps.filter((h) => h.id !== id) })),
        }),
        {
            name: 'health-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
