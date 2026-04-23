import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getAgeGroup(age: number): string {
  if (age <= 1) return 'Recém-nascido/Lactante';
  if (age <= 5) return 'Pré-escolar';
  if (age <= 12) return 'Escolar';
  if (age <= 21) return 'Adolescente/Jovem';
  return 'Adulto';
}
