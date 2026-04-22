import { validateCpf } from '../../shared/utils/cpfValidator';

describe('CPF Validator', () => {
  it('should validate correctly for 5 valid CPFs', () => {
    const validCpfs = [
      '577.049.488-30',
      '255.145.739-40',
      '872.528.809-15',
      '518.082.544-06',
      '051.961.079-24',
    ];

    validCpfs.forEach((cpf) => {
      const result = validateCpf(cpf);
      expect(result).toEqual({ valid: true });
    });
  });

  it('should invalidate CPF when the first check digit is wrong', () => {
    // 577.049.488-30 is valid. Changing 3 to 4.
    const result = validateCpf('577.049.488-40');
    expect(result).toEqual({
      valid: false,
      error: 'CPF check digits are invalid',
    });
  });

  it('should invalidate CPF when the second check digit is wrong', () => {
    // 577.049.488-30 is valid. Changing 0 to 1.
    const result = validateCpf('577.049.488-31');
    expect(result).toEqual({
      valid: false,
      error: 'CPF check digits are invalid',
    });
  });

  it('should invalidate CPFs with all same digits', () => {
    const sameDigitCpfs = [
      '111.111.111-11',
      '000.000.000-00',
      '999.999.999-99',
    ];

    sameDigitCpfs.forEach((cpf) => {
      const result = validateCpf(cpf);
      expect(result).toEqual({
        valid: false,
        error: 'CPF with all equal digits is invalid', // Updated according to actual implementation
      });
    });
  });

  it('should invalidate CPF with wrong format: missing dots', () => {
    const result = validateCpf('123456789-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CPF must be in the format 000.000.000-00');
  });

  it('should invalidate CPF with wrong format: missing dash', () => {
    const result = validateCpf('123.456.78901');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CPF must be in the format 000.000.000-00');
  });

  it('should invalidate CPF with wrong format: too short', () => {
    const result = validateCpf('123.456.789');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CPF must be in the format 000.000.000-00');
  });

  it('should invalidate CPF with wrong format: too long', () => {
    const result = validateCpf('123.456.789-012');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CPF must be in the format 000.000.000-00');
  });

  it('should invalidate CPF for an empty string', () => {
    const result = validateCpf('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CPF must be in the format 000.000.000-00');
  });

  it('should invalidate CPF safely without throwing when input is null', () => {
    const result = validateCpf(null as unknown as string);
    expect(result.valid).toBe(false);
  });

  it('should invalidate CPF safely without throwing when input is undefined', () => {
    const result = validateCpf(undefined as unknown as string);
    expect(result.valid).toBe(false);
  });
});
