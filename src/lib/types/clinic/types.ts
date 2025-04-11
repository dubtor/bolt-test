import type { CountryCode } from '../../utils/countries';
import type { Doctor } from '../doctor/types';

export type ClinicStatus = 'draft' | 'published';

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