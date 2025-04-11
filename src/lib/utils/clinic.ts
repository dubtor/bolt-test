import { getCountrySlug } from './countries';
import type { Clinic } from '../types/clinic';

export function getClinicUrl(clinic: Clinic): string {
  return `/clinics/${getCountrySlug(clinic.address.country)}/${clinic.slug}`;
}

export function generateDraftClinicName(): string {
  const randomNumber = Math.floor(Math.random() * 10000);
  return `Draft Clinic ${randomNumber}`;
} 