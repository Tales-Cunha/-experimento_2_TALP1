export interface CpfValidationResult {
  valid: boolean;
  error?: string;
}

const CPF_FORMAT_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

function calculateCheckDigit(baseDigits: number[], startWeight: number): number {
  const sum = baseDigits.reduce(
    (accumulator, digit, index) => accumulator + digit * (startWeight - index),
    0,
  );

  const rawDigit = 11 - (sum % 11);
  return rawDigit >= 10 ? 0 : rawDigit;
}

export function validateCpf(cpf: string): CpfValidationResult {
  if (!CPF_FORMAT_REGEX.test(cpf)) {
    return {
      valid: false,
      error: 'CPF must be in the format 000.000.000-00',
    };
  }

  const digits = cpf.replace(/\D/g, '').split('').map(Number);

  if (new Set(digits).size === 1) {
    return {
      valid: false,
      error: 'CPF with all equal digits is invalid',
    };
  }

  const firstNineDigits = digits.slice(0, 9);
  const firstCheckDigit = calculateCheckDigit(firstNineDigits, 10);
  const secondCheckDigit = calculateCheckDigit([...firstNineDigits, firstCheckDigit], 11);

  const isValid = digits[9] === firstCheckDigit && digits[10] === secondCheckDigit;

  if (!isValid) {
    return {
      valid: false,
      error: 'CPF check digits are invalid',
    };
  }

  return { valid: true };
}
