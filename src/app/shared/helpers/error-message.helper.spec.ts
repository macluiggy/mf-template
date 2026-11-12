import { HttpErrorResponse } from '@angular/common/http';

import { DEFAULT_ERROR_MESSAGE, toUserMessage } from './error-message.helper';

describe('toUserMessage', () => {
  it('reads the message of the backend envelope', () => {
    const error = new HttpErrorResponse({
      error: { data: null, message: 'El usuario ya existe' },
      status: 400,
    });

    expect(toUserMessage(error)).toBe('El usuario ya existe');
  });

  it('reads a plain string payload', () => {
    const error = new HttpErrorResponse({
      error: 'Recurso no encontrado',
      status: 404,
    });

    expect(toUserMessage(error)).toBe('Recurso no encontrado');
  });

  it('falls back for a network failure (status 0)', () => {
    const error = new HttpErrorResponse({
      error: { message: 'Sin conexión' },
      status: 0,
    });

    expect(toUserMessage(error)).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('falls back for an HTTP error without a usable message', () => {
    const error = new HttpErrorResponse({ error: {}, status: 500 });

    expect(toUserMessage(error)).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('accepts a plain string error', () => {
    expect(toUserMessage('Algo salió mal')).toBe('Algo salió mal');
  });

  it('accepts the message of a plain Error', () => {
    expect(toUserMessage(new Error('Fallo inesperado'))).toBe(
      'Fallo inesperado',
    );
  });

  it('does not use the message of an HttpErrorResponse as a fallback', () => {
    const error = new HttpErrorResponse({ error: null, status: 500 });

    expect(toUserMessage(error)).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('falls back for empty or unknown errors', () => {
    expect(toUserMessage('')).toBe(DEFAULT_ERROR_MESSAGE);
    expect(toUserMessage('   ')).toBe(DEFAULT_ERROR_MESSAGE);
    expect(toUserMessage(new Error(''))).toBe(DEFAULT_ERROR_MESSAGE);
    expect(toUserMessage(null)).toBe(DEFAULT_ERROR_MESSAGE);
    expect(toUserMessage(undefined)).toBe(DEFAULT_ERROR_MESSAGE);
    expect(toUserMessage({ message: 'not an error' })).toBe(
      DEFAULT_ERROR_MESSAGE,
    );
  });

  it('uses the given fallback and never returns an empty message', () => {
    const error = new HttpErrorResponse({ error: {}, status: 500 });

    expect(toUserMessage(error, 'Intentá de nuevo más tarde')).toBe(
      'Intentá de nuevo más tarde',
    );
    expect(toUserMessage(error, '   ')).toBe(DEFAULT_ERROR_MESSAGE);
  });
});
