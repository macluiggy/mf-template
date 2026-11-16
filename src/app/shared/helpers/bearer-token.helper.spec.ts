import { isUsableBearerToken } from './bearer-token.helper';

describe('isUsableBearerToken', () => {
  it.each([
    ['abc', true],
    ['', false],
    ['   ', false],
    ['undefined', false],
    ['null', false],
    [undefined, false],
    [42, false],
  ])('%j -> %s', (token, expected) => {
    expect(isUsableBearerToken(token)).toBe(expected);
  });
});
