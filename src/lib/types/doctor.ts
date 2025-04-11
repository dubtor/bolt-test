export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  image?: string;
  qualifications: string[];
}

// Required fields for a complete doctor
export const REQUIRED_DOCTOR_FIELDS = [
  'name',
  'specialization',
  'experience',
  'qualifications'
] as const;

// Function to validate if a doctor is complete
export function validateDoctor(doctor: Partial<Doctor>): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  // Check each required field
  for (const field of REQUIRED_DOCTOR_FIELDS) {
    if (field === 'qualifications') {
      // Special handling for qualifications array
      if (!doctor.qualifications || doctor.qualifications.length === 0) {
        missingFields.push(field);
      }
    } else if (!doctor[field as keyof Doctor]) {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
} 