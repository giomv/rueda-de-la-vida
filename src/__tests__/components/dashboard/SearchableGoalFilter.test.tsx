import { render, screen, fireEvent } from '@testing-library/react';
import { SearchableGoalFilter } from '@/components/dashboard/SearchableGoalFilter';
import type { GoalWithYear } from '@/lib/types/dashboard';

const mockGoalsWithYears: GoalWithYear[] = [
  // Year 1 goals
  {
    id: 'goal-1',
    user_id: 'user-123',
    domain_id: 'domain-1',
    title: 'Aprender Marketing Digital',
    metric: null,
    target_date: null,
    origin: 'ODYSSEY',
    source_wheel_id: null,
    source_odyssey_id: 'odyssey-1',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    yearIndex: 1,
  },
  {
    id: 'goal-2',
    user_id: 'user-123',
    domain_id: 'domain-1',
    title: 'Correr un Maratón',
    metric: '42km',
    target_date: null,
    origin: 'ODYSSEY',
    source_wheel_id: null,
    source_odyssey_id: 'odyssey-1',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    yearIndex: 1,
  },
  // Year 2 goals
  {
    id: 'goal-3',
    user_id: 'user-123',
    domain_id: 'domain-2',
    title: 'Meditar Diariamente',
    metric: null,
    target_date: null,
    origin: 'ODYSSEY',
    source_wheel_id: null,
    source_odyssey_id: 'odyssey-1',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    yearIndex: 2,
  },
  // Year 3 goal
  {
    id: 'goal-4',
    user_id: 'user-123',
    domain_id: null,
    title: 'Aprender Programación',
    metric: null,
    target_date: null,
    origin: 'ODYSSEY',
    source_wheel_id: null,
    source_odyssey_id: 'odyssey-1',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    yearIndex: 3,
  },
  // Goal without year (manual goal)
  {
    id: 'goal-5',
    user_id: 'user-123',
    domain_id: 'domain-1',
    title: 'Plan de marca personal',
    metric: null,
    target_date: null,
    origin: 'MANUAL',
    source_wheel_id: null,
    source_odyssey_id: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    yearIndex: null,
  },
];

describe('SearchableGoalFilter', () => {
  const mockOnChange = jest.fn();
  const mockOnGoalSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with "Todas las metas" when no value selected', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button')).toHaveTextContent('Todas las metas');
    });

    it('renders with selected goal title when value is set', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value="goal-1"
          onChange={mockOnChange}
        />
      );

      // Use aria-haspopup to find the main trigger button (not the clear button)
      const trigger = screen.getByRole('button', { expanded: false });
      expect(trigger).toHaveTextContent('Aprender Marketing Digital');
    });

    it('shows clear button (X) when a goal is selected', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value="goal-1"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText('Limpiar selección')).toBeInTheDocument();
    });

    it('does not show clear button when no goal is selected', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByLabelText('Limpiar selección')).not.toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Year grouping', () => {
    it('displays year headers in order (Año 1 → Año N)', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Check year headers appear
      expect(screen.getByText('Año 1')).toBeInTheDocument();
      expect(screen.getByText('Año 2')).toBeInTheDocument();
      expect(screen.getByText('Año 3')).toBeInTheDocument();
      expect(screen.getByText('Sin año asignado')).toBeInTheDocument();
    });

    it('displays year headers in correct order', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Get all headers in order
      const headers = screen.getAllByText(/^Año \d|Sin año asignado$/);
      expect(headers[0]).toHaveTextContent('Año 1');
      expect(headers[1]).toHaveTextContent('Año 2');
      expect(headers[2]).toHaveTextContent('Año 3');
      expect(headers[3]).toHaveTextContent('Sin año asignado');
    });

    it('shows goals under their correct year headers', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // All goals should be visible
      expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
      expect(screen.getByText('Correr un Maratón')).toBeInTheDocument();
      expect(screen.getByText('Meditar Diariamente')).toBeInTheDocument();
      expect(screen.getByText('Aprender Programación')).toBeInTheDocument();
      expect(screen.getByText('Plan de marca personal')).toBeInTheDocument();
    });

    it('groups goals correctly - Year 1 goals appear together', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Get all options
      const options = screen.getAllByRole('option');

      // First option is "Todas las metas"
      expect(options[0]).toHaveTextContent('Todas las metas');
      // Next should be Year 1 goals (after header)
      expect(options[1]).toHaveTextContent('Aprender Marketing Digital');
      expect(options[2]).toHaveTextContent('Correr un Maratón');
    });

    it('preserves year grouping when domain filter is applied', () => {
      // Filter to only domain-1 goals (which have Year 1 and no-year goals)
      const domain1Goals = mockGoalsWithYears.filter(g => g.domain_id === 'domain-1');

      render(
        <SearchableGoalFilter
          goals={domain1Goals}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Should show Year 1 header and Sin año asignado
      expect(screen.getByText('Año 1')).toBeInTheDocument();
      expect(screen.getByText('Sin año asignado')).toBeInTheDocument();
      // Should NOT show Year 2 or Year 3
      expect(screen.queryByText('Año 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Año 3')).not.toBeInTheDocument();
    });
  });

  describe('Search with year grouping', () => {
    it('preserves year grouping during search', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      // Type "Aprender" - should match goals from Year 1 and Year 3
      fireEvent.change(input, { target: { value: 'Aprender' } });

      // Should still see year headers for matching goals
      expect(screen.getByText('Año 1')).toBeInTheDocument();
      expect(screen.getByText('Año 3')).toBeInTheDocument();

      // Year 2 has no matching goals
      expect(screen.queryByText('Año 2')).not.toBeInTheDocument();

      // Matching goals should be visible
      expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
      expect(screen.getByText('Aprender Programación')).toBeInTheDocument();

      // Non-matching goals should be hidden
      expect(screen.queryByText('Correr un Maratón')).not.toBeInTheDocument();
      expect(screen.queryByText('Meditar Diariamente')).not.toBeInTheDocument();
    });

    it('filters goals as user types (immediate, case-insensitive)', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      // Type "mar" - should match "Marketing" and "Maratón" and "marca"
      fireEvent.change(input, { target: { value: 'mar' } });

      expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
      expect(screen.getByText('Correr un Maratón')).toBeInTheDocument();
      expect(screen.getByText('Plan de marca personal')).toBeInTheDocument();
      expect(screen.queryByText('Meditar Diariamente')).not.toBeInTheDocument();
      expect(screen.queryByText('Aprender Programación')).not.toBeInTheDocument();
    });

    it('shows "No se encontraron metas." when no matches', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      fireEvent.change(input, { target: { value: 'xyz123nonexistent' } });

      expect(screen.getByText('No se encontraron metas.')).toBeInTheDocument();
    });

    it('still shows "Todas las metas" option when no matches', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      fireEvent.change(input, { target: { value: 'xyz123' } });

      // "Todas las metas" should still be visible
      expect(screen.getByRole('option', { name: 'Todas las metas' })).toBeInTheDocument();
    });
  });

  describe('Dropdown behavior', () => {
    it('opens dropdown when trigger is clicked', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      // When no goal selected, there's only one button
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByPlaceholderText('Buscar meta…')).toBeInTheDocument();
      // Check for the option, not just text (since "Todas las metas" also appears as placeholder)
      expect(screen.getByRole('option', { name: 'Todas las metas' })).toBeInTheDocument();
    });

    it('closes dropdown after selecting a goal', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Aprender Marketing Digital'));

      expect(screen.queryByPlaceholderText('Buscar meta…')).not.toBeInTheDocument();
    });

    it('does not open when disabled', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(screen.queryByPlaceholderText('Buscar meta…')).not.toBeInTheDocument();
    });
  });

  describe('Selection behavior', () => {
    it('calls onChange with goal id when a goal is selected', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Aprender Marketing Digital'));

      expect(mockOnChange).toHaveBeenCalledWith('goal-1');
    });

    it('calls onChange with null when "Todas las metas" is selected', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value="goal-1"
          onChange={mockOnChange}
        />
      );

      // Get the main trigger button (has aria-haspopup)
      const trigger = screen.getByRole('button', { expanded: false });
      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole('option', { name: 'Todas las metas' }));

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('calls onGoalSelected with the goal when a goal is selected', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
          onGoalSelected={mockOnGoalSelected}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Aprender Marketing Digital'));

      expect(mockOnGoalSelected).toHaveBeenCalledWith(mockGoalsWithYears[0]);
    });

    it('clears selection when X button is clicked', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value="goal-1"
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Limpiar selección'));

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Keyboard navigation', () => {
    it('opens dropdown on Enter key', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      fireEvent.keyDown(trigger, { key: 'Enter' });

      expect(screen.getByPlaceholderText('Buscar meta…')).toBeInTheDocument();
    });

    it('opens dropdown on ArrowDown key', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });

      expect(screen.getByPlaceholderText('Buscar meta…')).toBeInTheDocument();
    });

    it('navigates with ArrowDown and selects with Enter (skips headers)', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      // ArrowDown to highlight "Todas las metas" (index 0)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      // ArrowDown to highlight first goal (index 1) - skips header
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      // Enter to select
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith('goal-1');
    });

    it('navigates with ArrowUp', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      // ArrowUp should wrap to last item
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should select the last goal (goal-5 - Sin año asignado)
      expect(mockOnChange).toHaveBeenCalledWith('goal-5');
    });

    it('closes dropdown on Escape key', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Buscar meta…')).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Buscar meta…');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByPlaceholderText('Buscar meta…')).not.toBeInTheDocument();
    });

    it('closes dropdown on Tab key', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');
      fireEvent.keyDown(input, { key: 'Tab' });

      expect(screen.queryByPlaceholderText('Buscar meta…')).not.toBeInTheDocument();
    });

    it('keyboard nav works with filtered results and preserves grouping', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      // Filter to show only "Aprender" goals (Year 1 and Year 3)
      fireEvent.change(input, { target: { value: 'aprender' } });

      // Should have: "Todas las metas", "Año 1" header, "Aprender Marketing Digital", "Año 3" header, "Aprender Programación"
      // ArrowDown to "Todas las metas" (0)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      // ArrowDown to first filtered goal (1) - Year 1's goal
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith('goal-1');
    });
  });

  describe('Domain filtering integration', () => {
    it('shows only goals from selected domain when filtered externally', () => {
      // Simulate filtering by domain - only pass goals from domain-1
      const domain1Goals = mockGoalsWithYears.filter(g => g.domain_id === 'domain-1');

      render(
        <SearchableGoalFilter
          goals={domain1Goals}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
      expect(screen.getByText('Correr un Maratón')).toBeInTheDocument();
      expect(screen.getByText('Plan de marca personal')).toBeInTheDocument();
      expect(screen.queryByText('Meditar Diariamente')).not.toBeInTheDocument();
      expect(screen.queryByText('Aprender Programación')).not.toBeInTheDocument();
    });

    it('search works within domain-filtered goals while preserving year grouping', () => {
      const domain1Goals = mockGoalsWithYears.filter(g => g.domain_id === 'domain-1');

      render(
        <SearchableGoalFilter
          goals={domain1Goals}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta…');

      fireEvent.change(input, { target: { value: 'mar' } });

      // Within domain-1, "mar" matches Marketing, Maratón, marca
      expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
      expect(screen.getByText('Correr un Maratón')).toBeInTheDocument();
      expect(screen.getByText('Plan de marca personal')).toBeInTheDocument();

      // Year headers should still be present for matching groups
      expect(screen.getByText('Año 1')).toBeInTheDocument();
      expect(screen.getByText('Sin año asignado')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria attributes on trigger', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has listbox role on options container', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('options have option role', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value={null}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(mockGoalsWithYears.length + 1); // goals + "Todas las metas"
    });

    it('selected option has aria-selected=true', () => {
      render(
        <SearchableGoalFilter
          goals={mockGoalsWithYears}
          value="goal-1"
          onChange={mockOnChange}
        />
      );

      // Get the main trigger button (has aria-haspopup)
      const trigger = screen.getByRole('button', { expanded: false });
      fireEvent.click(trigger);

      const selectedOption = screen.getByRole('option', { name: 'Aprender Marketing Digital' });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });
  });
});
