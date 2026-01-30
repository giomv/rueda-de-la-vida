import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SMARTGoalTooltip } from '@/components/shared/SMARTGoalTooltip';

describe('SMARTGoalTooltip', () => {
  it('renders the info icon', () => {
    render(<SMARTGoalTooltip />);

    // The Info icon should be visible
    const icon = document.querySelector('[data-slot="tooltip-trigger"]');
    expect(icon).toBeInTheDocument();
  });

  it('shows tooltip content on hover', async () => {
    render(<SMARTGoalTooltip />);

    const trigger = document.querySelector('[data-slot="tooltip-trigger"]');
    expect(trigger).toBeInTheDocument();

    // Hover over the trigger
    fireEvent.mouseEnter(trigger!);

    // Wait for tooltip content to appear
    await waitFor(() => {
      expect(screen.getByText('Meta SMART = clara y medible.')).toBeInTheDocument();
    });

    // Check full content
    expect(screen.getByText('Define qué quieres lograr, cuánto, y para cuándo.')).toBeInTheDocument();
    expect(screen.getByText(/Ejemplo:.*Ahorrar S\/ 500 al mes hasta junio/)).toBeInTheDocument();
  });

  it('passes source prop to data attribute for analytics', () => {
    render(<SMARTGoalTooltip source="rueda" />);

    const icon = document.querySelector('svg[data-analytics-source="rueda"]');
    expect(icon).toBeInTheDocument();
  });

  it('uses mi_plan source for Mi Plan context', () => {
    render(<SMARTGoalTooltip source="mi_plan" />);

    const icon = document.querySelector('svg[data-analytics-source="mi_plan"]');
    expect(icon).toBeInTheDocument();
  });

  describe('tooltip content consistency', () => {
    it('displays SMART definition consistently', async () => {
      render(<SMARTGoalTooltip />);

      const trigger = document.querySelector('[data-slot="tooltip-trigger"]');
      fireEvent.mouseEnter(trigger!);

      await waitFor(() => {
        // Verify the exact SMART copy is present (shared between Rueda and Mi Plan)
        const content = document.querySelector('[data-slot="tooltip-content"]');
        expect(content).toBeInTheDocument();
        expect(content?.textContent).toContain('Meta SMART = clara y medible.');
        expect(content?.textContent).toContain('Define qué quieres lograr, cuánto, y para cuándo.');
        expect(content?.textContent).toContain('Ahorrar S/ 500 al mes hasta junio');
      });
    });
  });
});
