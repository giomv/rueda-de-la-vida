import { render, screen, fireEvent } from '@testing-library/react';
import { MilestoneSelector } from '@/components/odyssey/MilestoneSelector';
import type { OdysseyMilestone, LifeDomain } from '@/lib/types';

describe('MilestoneSelector', () => {
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
  ];

  const mockMilestones: OdysseyMilestone[] = [
    {
      id: 'milestone-1',
      plan_id: 'plan-123',
      year: 1,
      category: null,
      domain_id: 'domain-1',
      title: 'Start learning programming',
      description: 'Begin with Python basics',
      tag: 'normal',
      order_position: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'milestone-2',
      plan_id: 'plan-123',
      year: 1,
      category: null,
      domain_id: 'domain-2',
      title: 'Get first job',
      description: 'Apply to junior positions',
      tag: 'normal',
      order_position: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'milestone-3',
      plan_id: 'plan-123',
      year: 2,
      category: null,
      domain_id: 'domain-1',
      title: 'Lead a project',
      description: null,
      tag: 'wild',
      order_position: 2,
      created_at: new Date().toISOString(),
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders milestones grouped by year', () => {
    render(
      <MilestoneSelector
        milestones={mockMilestones}
        selectedId={null}
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    // Check year headers
    expect(screen.getByText('Año 1')).toBeInTheDocument();
    expect(screen.getByText('Año 2')).toBeInTheDocument();

    // Check milestone titles
    expect(screen.getByText('Start learning programming')).toBeInTheDocument();
    expect(screen.getByText('Get first job')).toBeInTheDocument();
    expect(screen.getByText('Lead a project')).toBeInTheDocument();
  });

  it('renders milestone descriptions', () => {
    render(
      <MilestoneSelector
        milestones={mockMilestones}
        selectedId={null}
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    expect(screen.getByText('Begin with Python basics')).toBeInTheDocument();
    expect(screen.getByText('Apply to junior positions')).toBeInTheDocument();
  });

  it('renders empty state when no milestones', () => {
    render(
      <MilestoneSelector
        milestones={[]}
        selectedId={null}
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    expect(
      screen.getByText(/No hay hitos en este plan/i)
    ).toBeInTheDocument();
  });

  it('calls onSelect when milestone is clicked', () => {
    render(
      <MilestoneSelector
        milestones={mockMilestones}
        selectedId={null}
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    const milestoneCard = screen.getByText('Start learning programming').closest('[class*="cursor-pointer"]');
    if (milestoneCard) {
      fireEvent.click(milestoneCard);
      expect(mockOnSelect).toHaveBeenCalledWith('milestone-1');
    }
  });

  it('highlights selected milestone', () => {
    render(
      <MilestoneSelector
        milestones={mockMilestones}
        selectedId="milestone-1"
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    // The selected milestone should have a checkmark
    const checkmarks = document.querySelectorAll('.lucide-check');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('renders domain badges for milestones', () => {
    render(
      <MilestoneSelector
        milestones={mockMilestones}
        selectedId={null}
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    // Should show domain badges
    expect(screen.getAllByText('Personal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carrera').length).toBeGreaterThan(0);
  });

  it('renders fallback category when domain not found', () => {
    const milestonesWithCategory: OdysseyMilestone[] = [
      {
        id: 'milestone-1',
        plan_id: 'plan-123',
        year: 1,
        category: 'health',
        domain_id: null,
        title: 'Exercise daily',
        description: 'Start a fitness routine',
        tag: 'normal',
        order_position: 0,
        created_at: new Date().toISOString(),
      },
    ];

    render(
      <MilestoneSelector
        milestones={milestonesWithCategory}
        selectedId={null}
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    expect(screen.getByText('Salud')).toBeInTheDocument();
  });

  it('sorts years in ascending order', () => {
    const unorderedMilestones: OdysseyMilestone[] = [
      { ...mockMilestones[2], year: 5, id: 'm5' },
      { ...mockMilestones[0], year: 1, id: 'm1' },
      { ...mockMilestones[1], year: 3, id: 'm3' },
    ];

    render(
      <MilestoneSelector
        milestones={unorderedMilestones}
        selectedId={null}
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    const yearHeaders = screen.getAllByText(/Año \d/);
    const yearNumbers = yearHeaders.map((el) => parseInt(el.textContent?.replace('Año ', '') || '0'));

    // Check that years are sorted
    expect(yearNumbers).toEqual([1, 3, 5]);
  });

  it('handles selection change correctly', () => {
    const { rerender } = render(
      <MilestoneSelector
        milestones={mockMilestones}
        selectedId="milestone-1"
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    // Click on a different milestone
    const secondMilestone = screen.getByText('Get first job').closest('[class*="cursor-pointer"]');
    if (secondMilestone) {
      fireEvent.click(secondMilestone);
      expect(mockOnSelect).toHaveBeenCalledWith('milestone-2');
    }

    // Rerender with new selection
    rerender(
      <MilestoneSelector
        milestones={mockMilestones}
        selectedId="milestone-2"
        onSelect={mockOnSelect}
        domains={mockDomains}
      />
    );

    // Verify the new selection is highlighted
    const checkmarks = document.querySelectorAll('.lucide-check');
    expect(checkmarks.length).toBe(1);
  });
});
