# Comprehensive System Architecture & Blueprint: Complete Health Companion App

## 1. Project Overview & Directives for AI Developer
**Context:** You are tasked with building a highly comprehensive, production-ready Health Tracking Application using React Native and Expo. 
**Objective:** Replicate the exact UX/UI flows and data structures of a multifaceted health app (similar to "PeopleWith"). 
**Execution Rule:** Do NOT summarize. Implement every feature, field, and screen meticulously as defined in this blueprint. Write clean, modular, highly typed (TypeScript) code. 

## 2. Tech Stack Setup
* **Framework:** React Native with Expo (Managed Workflow)
* **Routing:** Expo Router (File-based routing)
* **State Management:** Zustand (for global stores handling user data, symptom logs, medications, etc.)
* **Local Storage:** MMKV (via `react-native-mmkv` for lightning-fast persistent local storage) or SQLite for complex relational queries.
* **Styling:** NativeWind (TailwindCSS for React Native) or strict React Native `StyleSheet` with a defined color palette. 
* **Animations & Charts:** `react-native-reanimated`, `react-native-svg`, and a charting library like `react-native-chart-kit` or `victory-native` for the symptom tracking graphs.
* **Date/Time Handling:** `date-fns` or `dayjs`.

## 3. UI/UX Theming & Design System
* **Color Palette:**
    * Background: `#F8F9FA` (Off-white/Light gray for main canvas)
    * Surface: `#FFFFFF` (Card backgrounds)
    * Primary Text: `#1A1A1A`
    * Secondary Text: `#6B7280`
    * Accent Colors (used for category icons and rings): Soft Yellow, Mint Green, Light Teal, Lavender/Purple, Soft Pink, Orange.
* **Typography:** Clean Sans-Serif (e.g., Inter or Roboto). Heavy emphasis on bold, large headers (`## Your Recent Health`) and readable body text.
* **Core UI Components Needed:**
    * `CategoryButton`: Square cards with rounded corners, a distinct colored icon in the center, and text below.
    * `ActionCard`: Horizontal scrolling cards (e.g., "Add your first Medication") with an icon on the left, text on the right, light pastel background.
    * `CircularProgressRing`: For the "Daily Tasks" section (0-100% completion indicators).
    * `HealthDataCard`: Vertical cards displaying "Average", "Highest", "No of Times" with an "Update" button.
    * `MultiStepFormLayout`: A consistent wrapper for adding items, featuring a top back button, screen title, and a fixed bottom CTA button ("Add Data", "Submit").
    * `SearchableDropdown`: A custom text input that filters a massive list of hardcoded or API-fetched medical terms (Symptoms, Medications).

## 4. Data Models (TypeScript Interfaces)

```typescript
// Base Types
type FrequencyType = 'Daily' | 'Specific Days of the Week' | 'Days Interval' | 'As Required';

// 1. User Profile
interface UserProfile {
  name: string;
  email: string;
  dob: string; // DD/MM/YYYY
  gender: 'Male' | 'Female' | 'Other';
  ethnicity: string;
}

// 2. Symptoms
interface Symptom {
  id: string;
  name: string; // e.g., "Abdomen inflammation"
  intensity: number; // 0 - 100
  intensityLabel: 'Mild' | 'Moderate' | 'Severe' | 'Very Severe';
  dateStarted: string; // ISO date
  duration?: string;
  notes?: string;
  images?: string[]; // URIs
}

// 3. Medications & Supplements (Shared structure)
interface Medication {
  id: string;
  name: string; // e.g., "Asparaginase (E. coli)"
  preparation: 'Tablet' | 'Liquid' | 'Capsule' | 'Inhaler' | 'Injection' | 'Patch' | 'Powder' | 'Topical' | 'Drop' | 'Gummies' | 'Implant';
  formulation?: 'Uncoated' | 'Coated' | 'Soluble' | 'Dispersible' | 'Chewable' | 'Other';
  dosageUnit: 'mg' | 'unit' | 'piece' | 'puffs' | 'breaths';
  startDate: string;
  endDate?: string;
  frequency: FrequencyType;
  timesPerDay: number; // 1 to 8 times
  schedule: { time: string; dosage: number }[]; // e.g., [{ time: "08:00", dosage: 8 }]
  displayName?: string;
  notes?: string;
  status: 'Current' | 'As Required' | 'Completed';
}

// 4. Measurements
interface Measurement {
  id: string;
  type: string; // e.g., "Albumin Level", "BMI", "Blood Pressure"
  unit: string; // e.g., "g/dL"
  reading: number | string;
  dateTime: string;
}

// 5. Diagnosis
interface Diagnosis {
  id: string;
  condition: string; // e.g., "A Haemophilia"
  dateOfDiagnosis: string; // DD/MM/YYYY or "Unknown"
}

// 6. Mood
interface MoodLog {
  id: string;
  dateTime: string;
  feeling: 'Angry' | 'Anxious' | 'Bored' | 'Happy' | 'Sad' | 'Neutral'; // Tied to emojis
  notes?: string;
}

// 7. Diet
interface DietPlan {
  id: string;
  type: string; // e.g., "Anti-Cancer Diets", "Atkins Diet"
  startDate: string;
  endDate?: string;
  notes?: string;
}

// 8. Investigations (Scans/Tests)
interface Investigation {
  id: string;
  type: string; // e.g., "Abdomen and Pelvis CT Scan"
  dateTime: string;
  notes?: string;
}

// 9. Daily Activity
interface Activity {
  id: string;
  category: 'Basic Activities' | 'Cognitive' | 'Daily Living' | 'Endurance';
  specificActivity: string; // e.g., "Managing pain & health conditions"
  dateTime: string;
  durationHours: number;
  durationMinutes: number;
}

// 10. Appointments
interface Appointment {
  id: string;
  dateTime: string;
  location: string;
  type: 'In Person' | 'Virtual' | 'Telephone';
  hcpId?: string; // Links to Health Care Professional
  durationMinutes: number;
  reminder: string | 'No Reminder';
  reason?: string;
}

// 11. Health Care Professionals (HCPs)
interface HCP {
  id: string;
  firstName: string;
  lastName: string;
  locationName: string;
  role: string;
  contactDetails?: string;
}


# Comprehensive System Architecture & Blueprint: Complete Health Companion App

## 1. Project Overview & Directives for AI Developer
**Context:** You are tasked with building a highly comprehensive, production-ready Health Tracking Application using React Native and Expo. 
**Objective:** Replicate the exact UX/UI flows and data structures of a multifaceted health app (similar to "PeopleWith"). 
**Execution Rule:** Do NOT summarize. Implement every feature, field, and screen meticulously as defined in this blueprint. Write clean, modular, highly typed (TypeScript) code. 

## 2. Tech Stack Setup
* **Framework:** React Native with Expo (Managed Workflow)
* **Routing:** Expo Router (File-based routing)
* **State Management:** Zustand (for global stores handling user data, symptom logs, medications, etc.)
* **Local Storage:** MMKV (via `react-native-mmkv` for lightning-fast persistent local storage) or SQLite for complex relational queries.
* **Styling:** NativeWind (TailwindCSS for React Native) or strict React Native `StyleSheet` with a defined color palette. 
* **Animations & Charts:** `react-native-reanimated`, `react-native-svg`, and a charting library like `react-native-chart-kit` or `victory-native` for the symptom tracking graphs.
* **Date/Time Handling:** `date-fns` or `dayjs`.

## 3. UI/UX Theming & Design System
* **Color Palette:**
    * Background: `#F8F9FA` (Off-white/Light gray for main canvas)
    * Surface: `#FFFFFF` (Card backgrounds)
    * Primary Text: `#1A1A1A`
    * Secondary Text: `#6B7280`
    * Accent Colors (used for category icons and rings): Soft Yellow, Mint Green, Light Teal, Lavender/Purple, Soft Pink, Orange.
* **Typography:** Clean Sans-Serif (e.g., Inter or Roboto). Heavy emphasis on bold, large headers (`## Your Recent Health`) and readable body text.
* **Core UI Components Needed:**
    * `CategoryButton`: Square cards with rounded corners, a distinct colored icon in the center, and text below.
    * `ActionCard`: Horizontal scrolling cards (e.g., "Add your first Medication") with an icon on the left, text on the right, light pastel background.
    * `CircularProgressRing`: For the "Daily Tasks" section (0-100% completion indicators).
    * `HealthDataCard`: Vertical cards displaying "Average", "Highest", "No of Times" with an "Update" button.
    * `MultiStepFormLayout`: A consistent wrapper for adding items, featuring a top back button, screen title, and a fixed bottom CTA button ("Add Data", "Submit").
    * `SearchableDropdown`: A custom text input that filters a massive list of hardcoded or API-fetched medical terms (Symptoms, Medications).

## 4. Data Models (TypeScript Interfaces)

```typescript
// Base Types
type FrequencyType = 'Daily' | 'Specific Days of the Week' | 'Days Interval' | 'As Required';

// 1. User Profile
interface UserProfile {
  name: string;
  email: string;
  dob: string; // DD/MM/YYYY
  gender: 'Male' | 'Female' | 'Other';
  ethnicity: string;
}

// 2. Symptoms
interface Symptom {
  id: string;
  name: string; // e.g., "Abdomen inflammation"
  intensity: number; // 0 - 100
  intensityLabel: 'Mild' | 'Moderate' | 'Severe' | 'Very Severe';
  dateStarted: string; // ISO date
  duration?: string;
  notes?: string;
  images?: string[]; // URIs
}

// 3. Medications & Supplements (Shared structure)
interface Medication {
  id: string;
  name: string; // e.g., "Asparaginase (E. coli)"
  preparation: 'Tablet' | 'Liquid' | 'Capsule' | 'Inhaler' | 'Injection' | 'Patch' | 'Powder' | 'Topical' | 'Drop' | 'Gummies' | 'Implant';
  formulation?: 'Uncoated' | 'Coated' | 'Soluble' | 'Dispersible' | 'Chewable' | 'Other';
  dosageUnit: 'mg' | 'unit' | 'piece' | 'puffs' | 'breaths';
  startDate: string;
  endDate?: string;
  frequency: FrequencyType;
  timesPerDay: number; // 1 to 8 times
  schedule: { time: string; dosage: number }[]; // e.g., [{ time: "08:00", dosage: 8 }]
  displayName?: string;
  notes?: string;
  status: 'Current' | 'As Required' | 'Completed';
}

// 4. Measurements
interface Measurement {
  id: string;
  type: string; // e.g., "Albumin Level", "BMI", "Blood Pressure"
  unit: string; // e.g., "g/dL"
  reading: number | string;
  dateTime: string;
}

// 5. Diagnosis
interface Diagnosis {
  id: string;
  condition: string; // e.g., "A Haemophilia"
  dateOfDiagnosis: string; // DD/MM/YYYY or "Unknown"
}

// 6. Mood
interface MoodLog {
  id: string;
  dateTime: string;
  feeling: 'Angry' | 'Anxious' | 'Bored' | 'Happy' | 'Sad' | 'Neutral'; // Tied to emojis
  notes?: string;
}

// 7. Diet
interface DietPlan {
  id: string;
  type: string; // e.g., "Anti-Cancer Diets", "Atkins Diet"
  startDate: string;
  endDate?: string;
  notes?: string;
}

// 8. Investigations (Scans/Tests)
interface Investigation {
  id: string;
  type: string; // e.g., "Abdomen and Pelvis CT Scan"
  dateTime: string;
  notes?: string;
}

// 9. Daily Activity
interface Activity {
  id: string;
  category: 'Basic Activities' | 'Cognitive' | 'Daily Living' | 'Endurance';
  specificActivity: string; // e.g., "Managing pain & health conditions"
  dateTime: string;
  durationHours: number;
  durationMinutes: number;
}

// 10. Appointments
interface Appointment {
  id: string;
  dateTime: string;
  location: string;
  type: 'In Person' | 'Virtual' | 'Telephone';
  hcpId?: string; // Links to Health Care Professional
  durationMinutes: number;
  reminder: string | 'No Reminder';
  reason?: string;
}

// 11. Health Care Professionals (HCPs)
interface HCP {
  id: string;
  firstName: string;
  lastName: string;
  locationName: string;
  role: string;
  contactDetails?: string;
}