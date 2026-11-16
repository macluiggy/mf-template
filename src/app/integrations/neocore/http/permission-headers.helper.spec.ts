import { buildPermissionHeaders } from './permission-headers.helper';

describe('buildPermissionHeaders', () => {
  it('sends the resource:action pair as x-api-key with a JSON content type', () => {
    const headers = buildPermissionHeaders('user', 'listar');

    expect(headers.get('x-api-key')).toBe('user:listar');
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});
