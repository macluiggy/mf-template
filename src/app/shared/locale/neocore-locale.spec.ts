import { formatCurrency, formatNumber } from '@angular/common';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  NEOCORE_CURRENCY_CODE,
  NEOCORE_LOCALE_ID,
  provideNeocoreLocale,
  registerNeocoreLocale,
} from './neocore-locale';

/**
 * Separators of the locale Angular formats with, read from Angular itself:
 * with a single fraction digit only the decimal separator is left, and with
 * no fraction digits only the group separator is.
 */
function separatorsOf(locale: string): { decimal: string; group: string } {
  return {
    decimal: formatNumber(1.5, locale, '1.1-1').replace(/\d/g, ''),
    group: formatNumber(1234, locale, '1.0-0').replace(/\d/g, ''),
  };
}

describe('provideNeocoreLocale', () => {
  it('provides the Spanish (Ecuador) locale id', () => {
    TestBed.configureTestingModule({ providers: [provideNeocoreLocale()] });

    expect(TestBed.inject(LOCALE_ID)).toBe('es-EC');
    expect(TestBed.inject(LOCALE_ID)).toBe(NEOCORE_LOCALE_ID);
  });

  it('provides the US dollar as the default currency', () => {
    TestBed.configureTestingModule({ providers: [provideNeocoreLocale()] });

    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe('USD');
    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe(NEOCORE_CURRENCY_CODE);
  });

  it('overrides the default currency of an outer injector', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
        provideNeocoreLocale(),
      ],
    });

    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe(NEOCORE_CURRENCY_CODE);
  });
});

describe('registerNeocoreLocale', () => {
  it('registers the locale data, so the pipes format in Spanish', () => {
    registerNeocoreLocale();

    const { decimal, group } = separatorsOf('es-EC');

    expect(decimal).toBe(',');
    expect(group).toBe('.');
  });

  it('is idempotent: calling it twice does not throw', () => {
    expect(() => {
      registerNeocoreLocale();
      registerNeocoreLocale();
    }).not.toThrow();
  });
});

describe('Spanish (Ecuador) formatting', () => {
  beforeAll(() => {
    registerNeocoreLocale();
  });

  it('formats numbers with the Spanish separators', () => {
    const { decimal, group } = separatorsOf('es-EC');

    expect(formatNumber(1234.5, 'es-EC', '1.2-2')).toBe(
      `1${group}234${decimal}50`,
    );
  });

  it('formats currency with the Spanish separators', () => {
    const currency = formatCurrency(1234.5, 'es-EC', '$', 'USD');

    expect(currency).toContain(formatNumber(1234.5, 'es-EC', '1.2-2'));
    expect(currency.endsWith('$')).toBe(true);
  });
});
