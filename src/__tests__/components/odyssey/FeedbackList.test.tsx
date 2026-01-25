import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackList } from '@/components/odyssey/FeedbackList';
import type { OdysseyFeedback } from '@/lib/types';

describe('FeedbackList', () => {
  const mockOnChange = jest.fn();
  const mockOnAdd = jest.fn();
  const mockOnRemove = jest.fn();

  const baseFeedback: OdysseyFeedback[] = [
    {
      id: 'feedback-1',
      plan_id: 'plan-123',
      person_name: 'Juan Garcia',
      feedback_text: 'This is a great plan!',
      order_position: 0,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders feedback items', () => {
    render(
      <FeedbackList
        feedback={baseFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByDisplayValue('Juan Garcia')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a great plan!')).toBeInTheDocument();
  });

  it('renders add button when under max items', () => {
    render(
      <FeedbackList
        feedback={baseFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        maxItems={5}
      />
    );

    const addButton = screen.getByRole('button', { name: /agregar/i });
    expect(addButton).toBeInTheDocument();
  });

  it('hides add button when at max items', () => {
    const maxFeedback: OdysseyFeedback[] = Array(5)
      .fill(null)
      .map((_, i) => ({
        id: `feedback-${i}`,
        plan_id: 'plan-123',
        person_name: `Person ${i}`,
        feedback_text: `Feedback ${i}`,
        order_position: i,
        created_at: new Date().toISOString(),
      }));

    render(
      <FeedbackList
        feedback={maxFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        maxItems={5}
      />
    );

    expect(screen.queryByRole('button', { name: /agregar/i })).not.toBeInTheDocument();
  });

  it('calls onChange when person name is updated', () => {
    render(
      <FeedbackList
        feedback={baseFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
      />
    );

    const nameInput = screen.getByDisplayValue('Juan Garcia');
    fireEvent.change(nameInput, { target: { value: 'Maria Lopez' } });

    expect(mockOnChange).toHaveBeenCalledWith(0, { person_name: 'Maria Lopez' });
  });

  it('calls onChange when feedback text is updated', () => {
    render(
      <FeedbackList
        feedback={baseFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
      />
    );

    const textInput = screen.getByDisplayValue('This is a great plan!');
    fireEvent.change(textInput, { target: { value: 'Updated feedback' } });

    expect(mockOnChange).toHaveBeenCalledWith(0, { feedback_text: 'Updated feedback' });
  });

  it('calls onAdd when add button is clicked', () => {
    render(
      <FeedbackList
        feedback={baseFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
      />
    );

    const addButton = screen.getByRole('button', { name: /agregar/i });
    fireEvent.click(addButton);

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when remove button is clicked', () => {
    render(
      <FeedbackList
        feedback={baseFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
      />
    );

    // Find the remove button (the X button)
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(
      (btn) => btn.querySelector('svg.lucide-x') !== null
    );

    if (removeButton) {
      fireEvent.click(removeButton);
      expect(mockOnRemove).toHaveBeenCalledWith(0);
    }
  });

  it('renders empty state correctly', () => {
    render(
      <FeedbackList
        feedback={[]}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
      />
    );

    // Should only show the add button
    const addButton = screen.getByRole('button', { name: /agregar/i });
    expect(addButton).toBeInTheDocument();

    // No feedback items should be displayed
    expect(screen.queryByPlaceholderText('Nombre de la persona')).not.toBeInTheDocument();
  });

  it('displays feedback items with correct numbering', () => {
    const multipleFeedback: OdysseyFeedback[] = [
      { ...baseFeedback[0], id: 'f1' },
      { ...baseFeedback[0], id: 'f2', person_name: 'Second Person' },
    ];

    render(
      <FeedbackList
        feedback={multipleFeedback}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
  });
});
