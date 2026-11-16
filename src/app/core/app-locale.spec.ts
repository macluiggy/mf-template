import { formatCurrency, formatNumber } from '@angular/common';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  ES_EC_LOCALE,
  provideAppLocale,
  provideNeocoreLocale,
  registerAppLocale,
  registerNeocoreLocale,
} from './app-locale';

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

describe('provideAppLocale', () => {
  it('provides the Spanish (Ecuador) locale id by default', () => {
    TestBed.configureTestingModule({ providers: [provideAppLocale()] });

    expect(TestBed.inject(LOCALE_ID)).toBe('es-EC');
    expect(TestBed.inject(LOCALE_ID)).toBe(ES_EC_LOCALE.id);
  });

  it('provides the US dollar as the default currency by default', () => {
    TestBed.configureTestingModule({ providers: [provideAppLocale()] });

    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe('USD');
    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe(ES_EC_LOCALE.currency);
  });

  it('provides another locale id and currency when the caller asks for them', () => {
    TestBed.configureTestingModule({
      providers: [provideAppLocale({ currency: 'EUR', id: 'en-US' })],
    });

    expect(TestBed.inject(LOCALE_ID)).toBe('en-US');
    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe('EUR');
  });

  it('keeps the default locale id when only the currency is overridden', () => {
    TestBed.configureTestingModule({
      providers: [provideAppLocale({ currency: 'EUR' })],
    });

    expect(TestBed.inject(LOCALE_ID)).toBe(ES_EC_LOCALE.id);
    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe('EUR');
  });

  it('overrides the default currency of an outer injector', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
        provideAppLocale(),
      ],
    });

    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe(ES_EC_LOCALE.currency);
  });
});

describe('registerAppLocale', () => {
  it('registers the locale data, so the pipes format in Spanish', () => {
    registerAppLocale();

    const { decimal, group } = separatorsOf('es-EC');

    expect(decimal).toBe(',');
    expect(group).toBe('.');
  });

  it('is idempotent: calling it twice does not throw', () => {
    expect(() => {
      registerAppLocale();
      registerAppLocale();
    }).not.toThrow();
  });
});

describe('the deprecated Neocore aliases', () => {
  it('provide the same locale as the default preset', () => {
    TestBed.configureTestingModule({ providers: [provideNeocoreLocale()] });

    expect(TestBed.inject(LOCALE_ID)).toBe('es-EC');
    expect(TestBed.inject(DEFAULT_CURRENCY_CODE)).toBe('USD');
  });

  it('register the same locale data as the default preset', () => {
    expect(() => registerNeocoreLocale()).not.toThrow();
  });
});

describe('Spanish (Ecuador) formatting', () => {
  beforeAll(() => {
    registerAppLocale();
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
