import { render, screen } from '@testing-library/react';
import { DomainSelector, DomainBadge } from '@/components/odyssey/DomainSelector';
import type { LifeDomain } from '@/lib/types';

describe('DomainSelector', () => {
  const mockDomains: LifeDomain[] = [
    {
      id: 'domain-1',
      user_id: 'user-123',
      name: 'Personal',
      slug: 'personal',
      icon: '🌱',
      order_position: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'domain-2',
      user_id: 'user-123',
      name: 'Carrera',
      slug: 'carrera',
      icon: '💼',
      order_position: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'domain-3',
      user_id: 'user-123',
      name: 'Salud',
      slug: 'salud',
      icon: '💪',
      order_position: 2,
      created_at: new Date().toISOString(),
    },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders select trigger with placeholder when no value', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        value={null}
        onChange={mockOnChange}
        placeholder="Selecciona un dominio"
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        value={null}
        onChange={mockOnChange}
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

describe('DomainBadge', () => {
  it('renders domain badge with name and icon', () => {
    const domain: LifeDomain = {
      id: 'domain-1',
      user_id: 'user-123',
      name: 'Personal',
      slug: 'personal',
      icon: '🌱',
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    render(<DomainBadge domain={domain} />);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('🌱')).toBeInTheDocument();
  });

  it('renders domain badge without icon when icon is null', () => {
    const domain: LifeDomain = {
      id: 'domain-1',
      user_id: 'user-123',
      name: 'Custom Domain',
      slug: 'custom-domain',
      icon: null,
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    render(<DomainBadge domain={domain} />);

    expect(screen.getByText('Custom Domain')).toBeInTheDocument();
  });

  it('renders fallback category badge when no domain', () => {
    render(<DomainBadge domain={undefined} fallbackCategory="personal" />);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('🌱')).toBeInTheDocument();
  });

  it('renders career category fallback', () => {
    render(<DomainBadge domain={undefined} fallbackCategory="career" />);

    expect(screen.getByText('Carrera')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
  });

  it('renders health category fallback', () => {
    render(<DomainBadge domain={undefined} fallbackCategory="health" />);

    expect(screen.getByText('Salud')).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
  });

  it('renders finance category fallback', () => {
    render(<DomainBadge domain={undefined} fallbackCategory="finance" />);

    expect(screen.getByText('Finanzas')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('renders couple category fallback', () => {
    render(<DomainBadge domain={undefined} fallbackCategory="couple" />);

    expect(screen.getByText('Pareja')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  it('renders other category fallback', () => {
    render(<DomainBadge domain={undefined} fallbackCategory="other" />);

    expect(screen.getByText('Otro')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('renders nothing when no domain and no fallback category', () => {
    const { container } = render(<DomainBadge domain={undefined} fallbackCategory={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no domain and invalid fallback category', () => {
    const { container } = render(
      <DomainBadge domain={undefined} fallbackCategory={'invalid' as any} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('prefers domain over fallback category', () => {
    const domain: LifeDomain = {
      id: 'domain-1',
      user_id: 'user-123',
      name: 'Custom Name',
      slug: 'custom-name',
      icon: '🎯',
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    render(<DomainBadge domain={domain} fallbackCategory="personal" />);

    // Should show domain, not fallback
    expect(screen.getByText('Custom Name')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
  });
});
