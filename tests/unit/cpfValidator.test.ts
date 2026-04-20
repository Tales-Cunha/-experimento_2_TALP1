import { validateCpf } from '../../shared/utils/cpfValidator';

describe('validateCpf', () => {
  it.each([
    '529.982.247-25',
    '111.444.777-35',
    '935.411.347-80',
    '390.533.447-05',
  ])('accepts known valid CPF: %s', (cpf) => {
    expect(validateCpf(cpf)).toEqual({ valid: true });
  });

  it.each([
    '529.982.247-24',
    '111.444.777-34',
    '935.411.347-81',
  ])('rejects CPF with wrong check digits: %s', (cpf) => {
    expect(validateCpf(cpf)).toEqual({
      valid: false,
      error: 'CPF check digits are invalid',
    });
  });

  it.each([
    '52998224725',
    '529.982.24725',
    '52.982.247-25',
    '529.982.247-2',
    '529.982.247-250',
  ])('rejects CPF with wrong format: %s', (cpf) => {
    expect(validateCpf(cpf)).toEqual({
      valid: false,
      error: 'CPF must be in the format 000.000.000-00',
    });
  });

  it.each([
    '000.000.000-00',
    '111.111.111-11',
    '222.222.222-22',
    '999.999.999-99',
  ])('rejects all-same-digit CPF: %s', (cpf) => {
    expect(validateCpf(cpf)).toEqual({
      valid: false,
      error: 'CPF with all equal digits is invalid',
    });
  });
});
