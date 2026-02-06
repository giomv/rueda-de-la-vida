import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchableGoalSelect } from '@/components/lifeplan/SearchableGoalSelect';
import type { GoalWithYear } from '@/lib/types/dashboard';

const mockGoals: GoalWithYear[] = [
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
    yearIndex: 2,
  },
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
    yearIndex: 1,
  },
  {
    id: 'goal-4',
    user_id: 'user-123',
    domain_id: null,
    title: 'Aprender Programación',
    metric: null,
    target_date: null,
    origin: 'MANUAL',
    source_wheel_id: null,
    source_odyssey_id: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    yearIndex: null, // No year assigned
  },
  {
    id: 'goal-5',
    user_id: 'user-123',
    domain_id: 'domain-1',
    title: 'Ahorrar para Casa',
    metric: null,
    target_date: null,
    origin: 'ODYSSEY',
    source_wheel_id: null,
    source_odyssey_id: 'odyssey-1',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    yearIndex: 1, // Same year as goal-1 and goal-3 for alphabetical sorting test
  },
];

describe('SearchableGoalSelect', () => {
  const mockOnChange = jest.fn();
  const mockOnNewGoal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with placeholder when no value selected', () => {
    render(
      <SearchableGoalSelect
        goals={mockGoals}
        value={null}
        onChange={mockOnChange}
        onNewGoal={mockOnNewGoal}
        placeholder="Seleccionar meta"
      />
    );

    expect(screen.getByRole('button')).toHaveTextContent('Seleccionar meta');
  });

  it('renders with selected goal title when value is set', () => {
    render(
      <SearchableGoalSelect
        goals={mockGoals}
        value="goal-1"
        onChange={mockOnChange}
        onNewGoal={mockOnNewGoal}
      />
    );

    const trigger = screen.getByRole('button', { name: /aprender marketing/i });
    expect(trigger).toHaveTextContent('Aprender Marketing Digital');
  });

  it('opens dropdown when trigger is clicked', async () => {
    render(
      <SearchableGoalSelect
        goals={mockGoals}
        value={null}
        onChange={mockOnChange}
        onNewGoal={mockOnNewGoal}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByPlaceholderText('Buscar meta...')).toBeInTheDocument();
    expect(screen.getByText('Sin meta')).toBeInTheDocument();
    expect(screen.getByText('Nueva meta')).toBeInTheDocument();
  });

  // ===== Year Grouping Tests =====

  describe('year grouping', () => {
    it('displays goals grouped by year with year headers', () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Check year headers are present
      expect(screen.getByText('Año 1')).toBeInTheDocument();
      expect(screen.getByText('Año 2')).toBeInTheDocument();
      expect(screen.getByText('Sin año asignado')).toBeInTheDocument();
    });

    it('orders groups by year (Año 1 → Año 2 → ... → Sin año asignado)', () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Get all year headers
      const headers = screen.getAllByText(/^(Año \d+|Sin año asignado)$/);

      // Verify order: Año 1, Año 2, Sin año asignado
      expect(headers[0]).toHaveTextContent('Año 1');
      expect(headers[1]).toHaveTextContent('Año 2');
      expect(headers[2]).toHaveTextContent('Sin año asignado');
    });

    it('sorts goals alphabetically within each year group', () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Get all option elements (excluding headers)
      const options = screen.getAllByRole('option');

      // Find the goals from Year 1 (should be alphabetically sorted)
      // Year 1 goals: Ahorrar para Casa, Aprender Marketing Digital, Meditar Diariamente
      // Filter out "Sin meta" and "Nueva meta"
      const goalOptions = options.filter(
        (opt) =>
          !opt.textContent?.includes('Sin meta') &&
          !opt.textContent?.includes('Nueva meta')
      );

      // First goal option should be from Year 1, alphabetically first
      expect(goalOptions[0]).toHaveTextContent('Ahorrar para Casa');
      expect(goalOptions[1]).toHaveTextContent('Aprender Marketing Digital');
      expect(goalOptions[2]).toHaveTextContent('Meditar Diariamente');
      // Year 2 goal
      expect(goalOptions[3]).toHaveTextContent('Correr un Maratón');
      // No year goal
      expect(goalOptions[4]).toHaveTextContent('Aprender Programación');
    });
  });

  // ===== Search Tests =====

  describe('search functionality', () => {
    it('shows hint when typing 1-2 characters', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta...');

      fireEvent.change(input, { target: { value: 'a' } });
      expect(
        screen.getByText('Escribe al menos 3 letras para buscar.')
      ).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'ap' } });
      expect(
        screen.getByText('Escribe al menos 3 letras para buscar.')
      ).toBeInTheDocument();
    });

    it('preserves year grouping when filtering', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta...');

      // Search for "apr" which matches "Aprender Marketing Digital" (Year 1) and "Aprender Programación" (No year)
      fireEvent.change(input, { target: { value: 'apr' } });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Year headers should still be present for matched years
      expect(screen.getByText('Año 1')).toBeInTheDocument();
      expect(screen.getByText('Sin año asignado')).toBeInTheDocument();

      // Year 2 header should not be present (no matches)
      expect(screen.queryByText('Año 2')).not.toBeInTheDocument();

      // Matched goals should be visible
      expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
      expect(screen.getByText('Aprender Programación')).toBeInTheDocument();

      // Non-matching goals should not be visible
      expect(screen.queryByText('Correr un Maratón')).not.toBeInTheDocument();
    });

    it('performs case-insensitive search', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta...');

      fireEvent.change(input, { target: { value: 'MAR' } });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should match "Marketing" (case-insensitive)
      expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
      // "Maratón" also matches
      expect(screen.getByText('Correr un Maratón')).toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta...');

      fireEvent.change(input, { target: { value: 'xyz123' } });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText('No se encontraron metas.')).toBeInTheDocument();
    });

    it('resets list when backspacing to less than 3 characters', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta...');

      // Type 3+ characters and wait for filter
      fireEvent.change(input, { target: { value: 'apr' } });
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Only matching goals visible
      expect(screen.queryByText('Correr un Maratón')).not.toBeInTheDocument();

      // Backspace to 2 characters
      fireEvent.change(input, { target: { value: 'ap' } });

      // All goals should be visible again immediately
      expect(screen.getByText('Correr un Maratón')).toBeInTheDocument();
    });
  });

  // ===== Selection Tests =====

  describe('selection', () => {
    it('calls onChange with null when "Sin meta" is selected', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value="goal-1"
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      const trigger = screen.getByRole('button', { name: /aprender marketing/i });
      fireEvent.click(trigger);
      fireEvent.click(screen.getByText('Sin meta'));

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('calls onNewGoal when "Nueva meta" is selected', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Nueva meta'));

      expect(mockOnNewGoal).toHaveBeenCalled();
    });

    it('calls onChange with goal id when a goal is selected', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Aprender Marketing Digital'));

      expect(mockOnChange).toHaveBeenCalledWith('goal-1');
    });

    it('closes dropdown after selection', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Buscar meta...')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Aprender Marketing Digital'));

      expect(
        screen.queryByPlaceholderText('Buscar meta...')
      ).not.toBeInTheDocument();
    });
  });

  // ===== Keyboard Navigation Tests =====

  describe('keyboard navigation', () => {
    it('supports ArrowDown to navigate through options', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta...');

      // Press ArrowDown to highlight first item (index 0 = "Sin meta")
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('navigates to goals after Sin meta and Nueva meta', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByPlaceholderText('Buscar meta...');

      // Navigate: Sin meta (0) -> Nueva meta (1) -> First goal (2)
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // Sin meta
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // Nueva meta
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // First goal (Ahorrar para Casa - alphabetically first in Year 1)
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith('goal-5'); // Ahorrar para Casa
    });

    it('closes dropdown on Escape key', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value={null}
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Buscar meta...')).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Buscar meta...');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(
        screen.queryByPlaceholderText('Buscar meta...')
      ).not.toBeInTheDocument();
    });
  });

  // ===== Clear Selection Tests =====

  describe('clear selection', () => {
    it('clears selection when X button is clicked', async () => {
      render(
        <SearchableGoalSelect
          goals={mockGoals}
          value="goal-1"
          onChange={mockOnChange}
          onNewGoal={mockOnNewGoal}
        />
      );

      const clearButton = screen.getByRole('button', { name: /limpiar/i });
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });
});
