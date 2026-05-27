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
  if (age < 0) return 'Idade Inválida';
  if (age <= 1) return 'Recém-nascido/Lactante';
  if (age <= 5) return 'Pré-escolar';
  if (age <= 12) return 'Escolar';
  if (age <= 15) return 'Adolescente (Até 15 anos)';
  return 'Fora do Limite Pediátrico (> 15 anos)';
}

export function translateFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou palavra-passe incorretos. Por favor, verifique os seus dados de acesso.';
    case 'auth/email-already-in-use':
      return 'Este endereço de e-mail já está associado a outra conta. Se já tem uma conta, por favor faça login.';
    case 'auth/weak-password':
      return 'A palavra-passe escolhida é demasiado fraca. Introduza pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'O endereço de e-mail introduzido é inválido.';
    case 'auth/operation-not-allowed':
      return 'O login por E-mail/Senha está desativado nas configurações do Firebase. Por favor, ative-lo no Firebase Console (Authentication > Sign-in method).';
    case 'auth/too-many-requests':
      return 'O acesso a esta conta foi temporariamente bloqueado devido a sucessivas tentativas falhadas. Por favor, tente novamente mais tarde.';
    case 'auth/user-disabled':
      return 'Esta conta de utilizador foi desativada por um administrador.';
    default:
      return 'Ocorreu um erro ao aceder à sua conta. Por favor, tente novamente.';
  }
}
