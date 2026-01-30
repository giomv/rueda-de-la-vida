import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OdysseyProgress } from '@/components/odyssey/OdysseyProgress';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import { ODYSSEY_WIZARD_STEPS } from '@/lib/types';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ odysseyId: 'test-odyssey-123' }),
}));

// Mock the store
jest.mock('@/lib/stores/odyssey-store', () => ({
  useOdysseyStore: jest.fn(),
}));

const mockUseOdysseyStore = useOdysseyStore as jest.MockedFunction<typeof useOdysseyStore>;

describe('OdysseyProgress', () => {
  const defaultStoreState = {
    plans: [],
    milestones: {},
    feedback: {},
    activePlanNumber: null,
    isDirty: false,
    markClean: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOdysseyStore.mockReturnValue(defaultStoreState);
  });

  it('renders all step labels', () => {
    render(<OdysseyProgress currentStep="plan-1" />);

    ODYSSEY_WIZARD_STEPS.forEach((step) => {
      expect(screen.getAllByText(step.label).length).toBeGreaterThan(0);
    });
  });

  it('highlights the current step', () => {
    render(<OdysseyProgress currentStep="plan-2" />);

    // The current step should show step 2 of 5 in mobile view
    expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument();
    // Multiple elements with "Plan 2" exist (mobile header + step labels)
    expect(screen.getAllByText('Plan 2').length).toBeGreaterThan(0);
  });

  it('shows progress bar based on current step', () => {
    const { container } = render(<OdysseyProgress currentStep="comparacion" />);

    // Progress should be at 80% (4/5)
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '80%' });
  });

  it('renders step buttons with correct aria attributes', () => {
    render(<OdysseyProgress currentStep="plan-1" />);

    // Current step should have aria-current
    const currentStepButtons = screen.getAllByRole('button', { name: /Plan 1.*actual/i });
    expect(currentStepButtons.length).toBeGreaterThan(0);
    expect(currentStepButtons[0]).toHaveAttribute('aria-current', 'step');
  });

  describe('Step navigation - All steps always clickable', () => {
    it('navigates to any step when clicked (no prerequisites required)', () => {
      // Empty state - steps should still be clickable
      mockUseOdysseyStore.mockReturnValue(defaultStoreState);

      render(<OdysseyProgress currentStep="plan-1" />);

      // Click on Prototipo (last step) - should navigate even with empty state
      const prototipoButtons = screen.getAllByRole('button', { name: /Prototipo/i });
      fireEvent.click(prototipoButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/plan-de-vida/test-odyssey-123/prototipo');
    });

    it('navigates to the last step from the first step', () => {
      mockUseOdysseyStore.mockReturnValue(defaultStoreState);

      render(<OdysseyProgress currentStep="plan-1" />);

      // Click on Prototipo
      const prototipoButtons = screen.getAllByRole('button', { name: /Prototipo/i });
      fireEvent.click(prototipoButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/plan-de-vida/test-odyssey-123/prototipo');
    });

    it('navigates backwards to previous steps', () => {
      mockUseOdysseyStore.mockReturnValue(defaultStoreState);

      render(<OdysseyProgress currentStep="prototipo" />);

      // Click on first step (Plan 1)
      const plan1Buttons = screen.getAllByRole('button', { name: /Plan 1/i });
      fireEvent.click(plan1Buttons[0]);

      expect(mockPush).toHaveBeenCalledWith('/plan-de-vida/test-odyssey-123/plan-1');
    });

    it('navigates to middle steps from any position', () => {
      mockUseOdysseyStore.mockReturnValue(defaultStoreState);

      render(<OdysseyProgress currentStep="plan-1" />);

      // Click on Comparación (middle step)
      const comparacionButtons = screen.getAllByRole('button', { name: /Comparación/i });
      fireEvent.click(comparacionButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/plan-de-vida/test-odyssey-123/comparacion');
    });

    it('does not navigate when clicking current step', () => {
      render(<OdysseyProgress currentStep="plan-2" />);

      const currentStepButtons = screen.getAllByRole('button', { name: /Plan 2.*actual/i });
      fireEvent.click(currentStepButtons[0]);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('all non-current steps have hover cursor style', () => {
      render(<OdysseyProgress currentStep="plan-2" />);

      // All step buttons should be clickable (no disabled styling)
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach((button) => {
        // Buttons should not have cursor-not-allowed class
        expect(button.className).not.toContain('cursor-not-allowed');
      });
    });
  });

  describe('Unsaved changes behavior', () => {
    it('shows unsaved changes dialog when navigating with dirty state', async () => {
      const dirtyState = {
        ...defaultStoreState,
        isDirty: true,
      };
      mockUseOdysseyStore.mockReturnValue(dirtyState);

      render(<OdysseyProgress currentStep="plan-1" />);

      // Navigate to any step
      const plan2Buttons = screen.getAllByRole('button', { name: /Plan 2/i });
      fireEvent.click(plan2Buttons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
      });
    });

    it('navigates after confirming unsaved changes', async () => {
      const dirtyState = {
        ...defaultStoreState,
        isDirty: true,
        markClean: jest.fn(),
      };
      mockUseOdysseyStore.mockReturnValue(dirtyState);

      render(<OdysseyProgress currentStep="plan-1" />);

      // Navigate to Plan 2
      const plan2Buttons = screen.getAllByRole('button', { name: /Plan 2/i });
      fireEvent.click(plan2Buttons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
      });

      // Confirm navigation
      const continueButton = screen.getByText('Continuar de todos modos');
      fireEvent.click(continueButton);

      expect(dirtyState.markClean).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/plan-de-vida/test-odyssey-123/plan-2');
    });

    it('cancels navigation when choosing to stay', async () => {
      const dirtyState = {
        ...defaultStoreState,
        isDirty: true,
      };
      mockUseOdysseyStore.mockReturnValue(dirtyState);

      render(<OdysseyProgress currentStep="plan-1" />);

      // Navigate to Plan 2
      const plan2Buttons = screen.getAllByRole('button', { name: /Plan 2/i });
      fireEvent.click(plan2Buttons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
      });

      // Cancel navigation
      const stayButton = screen.getByText('Quedarme aquí');
      fireEvent.click(stayButton);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not show dialog when state is clean', () => {
      mockUseOdysseyStore.mockReturnValue(defaultStoreState);

      render(<OdysseyProgress currentStep="plan-1" />);

      // Navigate to Plan 2
      const plan2Buttons = screen.getAllByRole('button', { name: /Plan 2/i });
      fireEvent.click(plan2Buttons[0]);

      // Should navigate immediately without dialog
      expect(mockPush).toHaveBeenCalledWith('/plan-de-vida/test-odyssey-123/plan-2');
      expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct navigation role and label', () => {
      render(<OdysseyProgress currentStep="plan-1" />);

      const nav = screen.getByRole('navigation', { name: /Progreso del Plan de Vida/i });
      expect(nav).toBeInTheDocument();
    });

    it('step buttons are keyboard accessible', () => {
      render(<OdysseyProgress currentStep="plan-1" />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('no steps have aria-disabled attribute', () => {
      render(<OdysseyProgress currentStep="plan-1" />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('aria-disabled');
      });
    });

    it('current step is marked with aria-current', () => {
      render(<OdysseyProgress currentStep="comparacion" />);

      const currentButtons = screen.getAllByRole('button', { name: /Comparación.*actual/i });
      expect(currentButtons.length).toBeGreaterThan(0);
      currentButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-current', 'step');
      });
    });
  });
});
