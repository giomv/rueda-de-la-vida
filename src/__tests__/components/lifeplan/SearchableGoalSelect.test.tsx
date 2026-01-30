import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableGoalSelect } from '@/components/lifeplan/SearchableGoalSelect';
import type { Goal } from '@/lib/types/lifeplan';

const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    user_id: 'user-123',
    domain_id: 'domain-1',
    title: 'Aprender Marketing Digital',
    metric: null,
    target_date: null,
    origin: 'MANUAL',
    source_wheel_id: null,
    source_odyssey_id: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    user_id: 'user-123',
    domain_id: 'domain-1',
    title: 'Correr un Maratón',
    metric: '42km',
    target_date: null,
    origin: 'WHEEL',
    source_wheel_id: 'wheel-1',
    source_odyssey_id: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

  it('shows origin suffix for WHEEL goals', () => {
    render(
      <SearchableGoalSelect
        goals={mockGoals}
        value="goal-2"
        onChange={mockOnChange}
        onNewGoal={mockOnNewGoal}
      />
    );

    const trigger = screen.getByRole('button', { name: /correr un maratón/i });
    expect(trigger).toHaveTextContent('Correr un Maratón (RV)');
  });

  it('shows origin suffix for ODYSSEY goals', () => {
    render(
      <SearchableGoalSelect
        goals={mockGoals}
        value="goal-3"
        onChange={mockOnChange}
        onNewGoal={mockOnNewGoal}
      />
    );

    const trigger = screen.getByRole('button', { name: /meditar diariamente/i });
    expect(trigger).toHaveTextContent('Meditar Diariamente (PV)');
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
    expect(screen.getByText('Metas actuales')).toBeInTheDocument();
  });

  it('shows all goals in dropdown when search term is less than 3 characters', async () => {
    render(
      <SearchableGoalSelect
        goals={mockGoals}
        value={null}
        onChange={mockOnChange}
        onNewGoal={mockOnNewGoal}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    // All goals should be visible
    expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
    expect(screen.getByText(/Correr un Maratón/)).toBeInTheDocument();
    expect(screen.getByText(/Meditar Diariamente/)).toBeInTheDocument();
    expect(screen.getByText('Aprender Programación')).toBeInTheDocument();
  });

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

    // Type 1 character
    fireEvent.change(input, { target: { value: 'a' } });
    expect(screen.getByText('Escribe al menos 3 letras para buscar.')).toBeInTheDocument();

    // Type 2 characters
    fireEvent.change(input, { target: { value: 'ap' } });
    expect(screen.getByText('Escribe al menos 3 letras para buscar.')).toBeInTheDocument();
  });

  it('does NOT filter when typing 1-2 characters', async () => {
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

    // Type 2 characters - should NOT filter
    fireEvent.change(input, { target: { value: 'ap' } });

    // All goals should still be visible
    expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
    expect(screen.getByText(/Correr un Maratón/)).toBeInTheDocument();
    expect(screen.getByText(/Meditar Diariamente/)).toBeInTheDocument();
    expect(screen.getByText('Aprender Programación')).toBeInTheDocument();
  });

  it('filters goals when typing 3+ characters (after throttle)', async () => {
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

    // Type 3 characters
    fireEvent.change(input, { target: { value: 'apr' } });

    // Initially all goals still visible (due to throttle)
    expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();

    // Wait for throttle (3 seconds)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Now only matching goals should be visible
    expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
    expect(screen.getByText('Aprender Programación')).toBeInTheDocument();
    expect(screen.queryByText(/Correr un Maratón/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Meditar Diariamente/)).not.toBeInTheDocument();
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

    // Type uppercase
    fireEvent.change(input, { target: { value: 'MAR' } });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Should match "Marketing" (case-insensitive)
    expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
    // "Maratón" also matches
    expect(screen.getByText(/Correr un Maratón/)).toBeInTheDocument();
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

    // Only "Aprender" goals visible
    expect(screen.queryByText(/Correr un Maratón/)).not.toBeInTheDocument();

    // Backspace to 2 characters
    fireEvent.change(input, { target: { value: 'ap' } });

    // All goals should be visible again immediately
    expect(screen.getByText('Aprender Marketing Digital')).toBeInTheDocument();
    expect(screen.getByText(/Correr un Maratón/)).toBeInTheDocument();
    expect(screen.getByText(/Meditar Diariamente/)).toBeInTheDocument();
    expect(screen.getByText('Aprender Programación')).toBeInTheDocument();
  });

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

    expect(screen.queryByPlaceholderText('Buscar meta...')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation with ArrowDown', async () => {
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

    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    // "Sin meta" (first item at index 0) should be selected
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('supports keyboard navigation with ArrowUp', async () => {
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

    // Press ArrowDown 3 times to get to first goal (index 2 = first goal after "Sin meta" and "Nueva meta")
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // index 0: Sin meta
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // index 1: Nueva meta
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // index 2: first goal
    fireEvent.keyDown(input, { key: 'Enter' });

    // First goal should be selected (goal-1)
    expect(mockOnChange).toHaveBeenCalledWith('goal-1');
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

    expect(screen.queryByPlaceholderText('Buscar meta...')).not.toBeInTheDocument();
  });

  it('clears selection when X button is clicked', async () => {
    render(
      <SearchableGoalSelect
        goals={mockGoals}
        value="goal-1"
        onChange={mockOnChange}
        onNewGoal={mockOnNewGoal}
      />
    );

    // Find and click the clear button (X icon) - it's nested inside the trigger
    const clearButton = screen.getByRole('button', { name: /limpiar/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });
});
