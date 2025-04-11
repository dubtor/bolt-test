import type { CountryCode, RegionCode } from './utils/countries';

// User related types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export type ClinicStatus = 'draft' | 'published';

// Clinic related types
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

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  image?: string;
  qualifications: string[];
}

export interface Review {
  id: string;
  clinicId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}