import { describe, it, expect } from 'vitest';
import { parseCSVText, parseBudget, parseBoolean, parseNumber, cleanHeader } from '@/lib/csvParser';

describe('parseCSVText', () => {
  it('parses a simple CSV into headers and rows', () => {
    const csv = 'Name,Phone,Country\nJohn,+39123,Italy\nMaria,+39456,Germany';
    const { headers, rows } = parseCSVText(csv);
    expect(headers).toEqual(['Name', 'Phone', 'Country']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(['John', '+39123', 'Italy']);
    expect(rows[1]).toEqual(['Maria', '+39456', 'Germany']);
  });

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Note\n"Rossi, Marco","Has pool, nice"';
    const { rows } = parseCSVText(csv);
    expect(rows[0][0]).toBe('Rossi, Marco');
    expect(rows[0][1]).toBe('Has pool, nice');
  });

  it('returns empty for blank input', () => {
    const { headers, rows } = parseCSVText('');
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });
});

describe('parseBudget', () => {
  it('parses plain number', () => {
    expect(parseBudget('500000')).toBe(500000);
  });

  it('parses k suffix', () => {
    expect(parseBudget('500k')).toBe(500000);
  });

  it('parses million', () => {
    expect(parseBudget('1.5 million')).toBe(1500000);
  });

  it('returns null for empty', () => {
    expect(parseBudget('')).toBeNull();
  });
});

describe('parseBoolean', () => {
  it.each(['yes', 'true', 'sì', 'si', '1'])('returns true for "%s"', (v) => {
    expect(parseBoolean(v)).toBe(true);
  });

  it('returns false for "no"', () => {
    expect(parseBoolean('no')).toBe(false);
  });
});

describe('parseNumber', () => {
  it('extracts number from text', () => {
    expect(parseNumber('At least 500sqm')).toBe(500);
  });

  it('handles range, takes first', () => {
    expect(parseNumber('120 / 150 mq')).toBe(120);
  });

  it('returns null for empty', () => {
    expect(parseNumber('')).toBeNull();
  });
});

describe('cleanHeader', () => {
  it('removes &nbsp; and extra spaces', () => {
    expect(cleanHeader('  Name &nbsp; Surname  ')).toBe('Name Surname');
  });
});
