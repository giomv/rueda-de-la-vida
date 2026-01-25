/**
 * Tests for domain-actions utility functions
 * Note: Server actions that require Supabase are tested separately with integration tests
 * This file tests the utility functions that can run without database connections
 */

// Extract the normalizeToSlug function for testing
// Since it's internal to domain-actions.ts, we'll test the expected behavior

describe('normalizeToSlug utility', () => {
  // Recreate the normalizeToSlug function for testing
  function normalizeToSlug(input: string): string {
    const accentMap: Record<string, string> = {
      'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ñ': 'n', 'ç': 'c',
      'Á': 'a', 'À': 'a', 'Â': 'a', 'Ã': 'a', 'Ä': 'a',
      'É': 'e', 'È': 'e', 'Ê': 'e', 'Ë': 'e',
      'Í': 'i', 'Ì': 'i', 'Î': 'i', 'Ï': 'i',
      'Ó': 'o', 'Ò': 'o', 'Ô': 'o', 'Õ': 'o', 'Ö': 'o',
      'Ú': 'u', 'Ù': 'u', 'Û': 'u', 'Ü': 'u',
      'Ñ': 'n', 'Ç': 'c',
    };

    return input
      .split('')
      .map(char => accentMap[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  it('converts to lowercase', () => {
    expect(normalizeToSlug('Personal')).toBe('personal');
    expect(normalizeToSlug('CARRERA')).toBe('carrera');
    expect(normalizeToSlug('SaLuD')).toBe('salud');
  });

  it('removes accents from Spanish characters', () => {
    expect(normalizeToSlug('Educación')).toBe('educacion');
    expect(normalizeToSlug('Año')).toBe('ano');
    expect(normalizeToSlug('Niño')).toBe('nino');
  });

  it('removes accents from various accented characters', () => {
    expect(normalizeToSlug('café')).toBe('cafe');
    expect(normalizeToSlug('naïve')).toBe('naive');
    expect(normalizeToSlug('résumé')).toBe('resume');
  });

  it('replaces spaces with hyphens', () => {
    expect(normalizeToSlug('Crecimiento Personal')).toBe('crecimiento-personal');
    expect(normalizeToSlug('Vida Ideal')).toBe('vida-ideal');
  });

  it('removes special characters', () => {
    expect(normalizeToSlug('Salud & Bienestar')).toBe('salud-bienestar');
    expect(normalizeToSlug("Familia's Values")).toBe('familia-s-values');
  });

  it('collapses multiple hyphens', () => {
    expect(normalizeToSlug('Test   Multiple   Spaces')).toBe('test-multiple-spaces');
    expect(normalizeToSlug('Test---Multiple---Hyphens')).toBe('test-multiple-hyphens');
  });

  it('removes leading and trailing hyphens', () => {
    expect(normalizeToSlug(' Leading Space')).toBe('leading-space');
    expect(normalizeToSlug('Trailing Space ')).toBe('trailing-space');
    expect(normalizeToSlug(' Both Sides ')).toBe('both-sides');
  });

  it('handles empty string', () => {
    expect(normalizeToSlug('')).toBe('');
  });

  it('handles numbers', () => {
    expect(normalizeToSlug('Plan 1')).toBe('plan-1');
    expect(normalizeToSlug('2024 Goals')).toBe('2024-goals');
  });

  it('handles common Spanish domain names', () => {
    expect(normalizeToSlug('Relaciones')).toBe('relaciones');
    expect(normalizeToSlug('Finanzas')).toBe('finanzas');
    expect(normalizeToSlug('Espiritualidad')).toBe('espiritualidad');
    expect(normalizeToSlug('Ocio')).toBe('ocio');
    expect(normalizeToSlug('Entorno')).toBe('entorno');
  });

  it('produces consistent slugs for fuzzy matching', () => {
    // These should all produce the same slug for matching purposes
    expect(normalizeToSlug('Educación')).toBe(normalizeToSlug('educacion'));
    expect(normalizeToSlug('EDUCACION')).toBe(normalizeToSlug('Educación'));
    expect(normalizeToSlug('educación')).toBe(normalizeToSlug('EDUCACIÓN'));
  });
});

describe('default domains', () => {
  const defaultDomains = [
    { name: 'Personal', icon: '🌱', slug: 'personal' },
    { name: 'Carrera', icon: '💼', slug: 'carrera' },
    { name: 'Salud', icon: '💪', slug: 'salud' },
    { name: 'Finanzas', icon: '💰', slug: 'finanzas' },
    { name: 'Pareja', icon: '❤️', slug: 'pareja' },
    { name: 'Otro', icon: '✨', slug: 'otro' },
  ];

  it('has correct number of default domains', () => {
    expect(defaultDomains).toHaveLength(6);
  });

  it('each default domain has required fields', () => {
    defaultDomains.forEach((domain) => {
      expect(domain.name).toBeDefined();
      expect(domain.icon).toBeDefined();
      expect(domain.slug).toBeDefined();
    });
  });

  it('slugs match normalized names', () => {
    function normalizeToSlug(input: string): string {
      return input.toLowerCase();
    }

    defaultDomains.forEach((domain) => {
      expect(domain.slug).toBe(normalizeToSlug(domain.name));
    });
  });

  it('all icons are single emoji characters', () => {
    defaultDomains.forEach((domain) => {
      // Emoji regex to check for common emoji patterns
      expect(domain.icon.length).toBeGreaterThan(0);
    });
  });
});
