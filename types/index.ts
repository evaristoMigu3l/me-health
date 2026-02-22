export type FrequencyType = 'Daily' | 'Specific Days of the Week' | 'Days Interval' | 'As Required';

export interface UserProfile {
    name: string;
    email: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    ethnicity: string;
}

export interface Symptom {
    id: string;
    name: string;
    intensity: number;
    intensityLabel: 'Mild' | 'Moderate' | 'Severe' | 'Very Severe';
    dateStarted: string;
    duration?: string;
    notes?: string;
    images?: string[];
    place?: string;
}

export interface Medication {
    id: string;
    name: string;
    preparation: 'Tablet' | 'Liquid' | 'Capsule' | 'Inhaler' | 'Injection' | 'Patch' | 'Powder' | 'Topical' | 'Drop' | 'Gummies' | 'Implant' | string;
    formulation?: 'Uncoated' | 'Coated' | 'Soluble' | 'Dispersible' | 'Chewable' | 'Other' | string;
    dosageUnit: 'mg' | 'unit' | 'piece' | 'puffs' | 'breaths';
    startDate: string;
    endDate?: string;
    frequency: FrequencyType;
    timesPerDay: number;
    schedule: { time: string; dosage: number }[];
    displayName?: string;
    notes?: string;
    status: 'Current' | 'As Required' | 'Completed';
    // New fields
    selfPrescribed?: boolean;
    targetCondition?: string;
    location?: string; // e.g., 'Home', 'Work'
    type?: string; // e.g., 'Antibiotic', 'Analgesic', 'Supplement'
    color?: string;
    adherenceLog?: string[]; // Array of ISO date strings when taken
    remindersEnabled?: boolean;
}

export interface Measurement {
    id: string;
    type: string;
    unit: string;
    reading: number | string;
    dateTime: string;
    notes?: string;
    subType?: string; // e.g., 'Systolic' or 'Diastolic' for BP if stored separately, or keep reading as string '120/80'
}

export interface Diagnosis {
    id: string;
    condition: string;
    dateOfDiagnosis: string;
    status: 'Active' | 'Resolved' | 'Recurring';
    treatment?: string;
    linkedAppointmentIds?: string[];
}

export interface MoodLog {
    id: string;
    dateTime: string;
    feeling: 'Angry' | 'Anxious' | 'Bored' | 'Happy' | 'Sad' | 'Neutral' | string;
    emoji?: string;
    notes?: string;
}

export interface DietPlan {
    id: string;
    type: string;
    startDate: string;
    endDate?: string;
    notes?: string;
}

export interface Investigation {
    id: string;
    type: string;
    dateTime: string;
    notes?: string;
    result?: string;
    status: 'Scheduled' | 'Completed' | 'Pending';
    linkedAppointmentId?: string;
    linkedMedicationId?: string;
    attachments?: string[]; // URIs to files/photos
}

export interface Activity {
    id: string;
    category: 'Basic Activities' | 'Cognitive' | 'Daily Living' | 'Endurance' | string;
    specificActivity: string;
    dateTime: string;
    durationHours: number;
    durationMinutes: number;
    notes?: string;
}

export interface SleepLog {
    id: string;
    dateTime: string;
    hours: number;
    quality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    notes?: string;
}

export interface FoodEntry {
    id: string;
    name: string;
    calories: number;
    dateTime: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | string;
    notes?: string;
}

export interface Document {
    id: string;
    name: string;
    type: string;
    dateTime: string;
    notes?: string;
    uri?: string;
}

export interface Appointment {
    id: string;
    dateTime: string;
    location: string;
    type: 'In Person' | 'Virtual' | 'Telephone';
    hcpId?: string;
    doctorName?: string; // For ad-hoc doctor names
    durationMinutes: number;
    reminder: string | 'No Reminder';
    reason?: string;
    recurrence?: 'None' | 'Weekly' | 'Monthly' | 'Yearly';
    linkedExamIds?: string[];
}

export interface HCP {
    id: string;
    firstName: string;
    lastName: string;
    locationName: string;
    role: string;
    contactDetails?: string;
}

export interface AppSettings {
    notifications: boolean;
    reminderTime: string;
    darkMode: boolean;
    units: 'metric' | 'imperial';
}
