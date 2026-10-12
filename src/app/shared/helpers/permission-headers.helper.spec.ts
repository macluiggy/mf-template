import { isUsableBearerToken } from './bearer-token.helper';
import { buildPermissionHeaders } from './permission-headers.helper';

describe('buildPermissionHeaders', () => {
  it('sends the resource:action pair as x-api-key with a JSON content type', () => {
    const headers = buildPermissionHeaders('user', 'listar');

    expect(headers.get('x-api-key')).toBe('user:listar');
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});

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
