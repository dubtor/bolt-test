import type { CountryCode } from '../utils/countries';
import type { Doctor } from './doctor';
import { validateDoctor } from './doctor';

export type ClinicStatus = 'draft' | 'published';

// Required fields for a complete clinic
export const REQUIRED_CLINIC_FIELDS = [
  'name',
  'description',
  'address.street',
  'address.city',
  'address.country',
  'address.postalCode',
  'contact.phone',
  'contact.email',
  'services',
  'priceRange.min',
  'priceRange.max',
  'priceRange.currency',
  'operatingHours',
] as const;

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ClinicStatus;
  address: {
    street: string;
    city: string;
    country: CountryCode;
    region?: string; // Optional region/state code
    postalCode: string;
  };
  services: string[];
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  images: {
    main: string;
    gallery: string[];
  };
  doctors: Doctor[];
  rating: number;
  reviewCount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Function to create a new empty clinic
export function createEmptyClinic(): Omit<Clinic, 'id'> {
  return {
    name: '',
    description: '',
    status: 'draft',
    address: {
      street: '',
      city: '',
      country: '' as CountryCode,
      region: '',
      postalCode: ''
    },
    services: [],
    priceRange: {
      min: 0,
      max: 0,
      currency: '€'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    socialMedia: {},
    operatingHours: {
      monday: { open: '', close: '' },
      tuesday: { open: '', close: '' },
      wednesday: { open: '', close: '' },
      thursday: { open: '', close: '' },
      friday: { open: '', close: '' }
    },
    images: {
      main: '',
      gallery: []
    },
    doctors: [],
    rating: 0,
    reviewCount: 0,
    slug: '',
    userId: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Function to validate if a clinic is complete and ready for publishing
export function validateClinic(clinic: Partial<Clinic>): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  // Check each required field
  for (const field of REQUIRED_CLINIC_FIELDS) {
    if (field.includes('.')) {
      // Handle nested fields
      const [parent, child] = field.split('.');
      if (!clinic[parent as keyof Clinic] || !(clinic[parent as keyof Clinic] as any)[child]) {
        missingFields.push(field);
      }
    } else {
      // Handle top-level fields
      if (!clinic[field as keyof Clinic]) {
        missingFields.push(field);
      }
    }
  }

  // Special validation for operating hours
  if (clinic.operatingHours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    for (const day of days) {
      if (!clinic.operatingHours[day]?.open || !clinic.operatingHours[day]?.close) {
        missingFields.push(`operatingHours.${day}`);
      }
    }
  }

  // Special validation for services
  if (!clinic.services || clinic.services.length === 0) {
    missingFields.push('services');
  }

  // Special validation for doctors
  if (clinic.doctors && clinic.doctors.length > 0) {
    clinic.doctors.forEach((doctor, index) => {
      const doctorValidation = validateDoctor(doctor);
      if (!doctorValidation.isValid) {
        doctorValidation.missingFields.forEach(field => {
          missingFields.push(`doctors[${index}].${field}`);
        });
      }
    });
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
} 