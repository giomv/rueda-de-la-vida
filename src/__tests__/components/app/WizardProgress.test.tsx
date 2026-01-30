import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardProgress } from '@/components/app/WizardProgress';
import { useWizardStore } from '@/lib/stores/wizard-store';
import { WIZARD_STEPS } from '@/lib/types';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ wheelId: 'test-wheel-123' }),
}));

// Mock the store
jest.mock('@/lib/stores/wizard-store', () => ({
  useWizardStore: jest.fn(),
}));

const mockUseWizardStore = useWizardStore as jest.MockedFunction<typeof useWizardStore>;

describe('WizardProgress', () => {
  const defaultStoreState = {
    domains: [],
    scores: [],
    priorities: [],
    actionPlans: [],
    isDirty: false,
    markClean: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWizardStore.mockReturnValue(defaultStoreState);
  });

  it('renders all step labels', () => {
    render(<WizardProgress currentStep={0} />);

    WIZARD_STEPS.forEach((step) => {
      expect(screen.getAllByText(step.label).length).toBeGreaterThan(0);
    });
  });

  it('highlights the current step', () => {
    render(<WizardProgress currentStep={2} />);

    // The current step should show step 3 of 8 in mobile view
    expect(screen.getByText('Paso 3 de 8')).toBeInTheDocument();
    // Multiple elements with "Resultado" exist (mobile header + step labels)
    expect(screen.getAllByText('Resultado').length).toBeGreaterThan(0);
  });

  it('shows progress bar based on current step', () => {
    const { container } = render(<WizardProgress currentStep={3} />);

    // Progress should be at 50% (4/8)
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('renders step buttons with correct aria attributes', () => {
    render(<WizardProgress currentStep={1} />);

    // Current step should have aria-current
    const currentStepButtons = screen.getAllByRole('button', { name: /Puntajes.*actual/i });
    expect(currentStepButtons.length).toBeGreaterThan(0);
    expect(currentStepButtons[0]).toHaveAttribute('aria-current', 'step');
  });

  describe('Step navigation - All steps always clickable', () => {
    it('navigates to any step when clicked (no prerequisites required)', () => {
      // Empty state - steps should still be clickable
      mockUseWizardStore.mockReturnValue(defaultStoreState);

      render(<WizardProgress currentStep={0} />);

      // Click on step 5 (Reflexión) - should navigate even with empty state
      const reflexionButtons = screen.getAllByRole('button', { name: /Reflexión/i });
      fireEvent.click(reflexionButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/rueda/test-wheel-123/reflexion');
    });

    it('navigates to the last step from the first step', () => {
      mockUseWizardStore.mockReturnValue(defaultStoreState);

      render(<WizardProgress currentStep={0} />);

      // Click on last step (Seguimiento)
      const seguimientoButtons = screen.getAllByRole('button', { name: /Seguimiento/i });
      fireEvent.click(seguimientoButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/rueda/test-wheel-123/seguimiento');
    });

    it('navigates backwards to previous steps', () => {
      mockUseWizardStore.mockReturnValue(defaultStoreState);

      render(<WizardProgress currentStep={5} />);

      // Click on first step (Dominios)
      const dominiosButtons = screen.getAllByRole('button', { name: /Dominios/i });
      fireEvent.click(dominiosButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/rueda/test-wheel-123/dominios');
    });

    it('does not navigate when clicking current step', () => {
      render(<WizardProgress currentStep={2} />);

      const currentStepButtons = screen.getAllByRole('button', { name: /Resultado.*actual/i });
      fireEvent.click(currentStepButtons[0]);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('all non-current steps have hover cursor style', () => {
      render(<WizardProgress currentStep={3} />);

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
      mockUseWizardStore.mockReturnValue(dirtyState);

      render(<WizardProgress currentStep={0} />);

      // Navigate to any step
      const puntajesButtons = screen.getAllByRole('button', { name: /Puntajes/i });
      fireEvent.click(puntajesButtons[0]);

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
      mockUseWizardStore.mockReturnValue(dirtyState);

      render(<WizardProgress currentStep={0} />);

      // Navigate to step 2
      const puntajesButtons = screen.getAllByRole('button', { name: /Puntajes/i });
      fireEvent.click(puntajesButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
      });

      // Confirm navigation
      const continueButton = screen.getByText('Continuar de todos modos');
      fireEvent.click(continueButton);

      expect(dirtyState.markClean).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/rueda/test-wheel-123/puntajes');
    });

    it('cancels navigation when choosing to stay', async () => {
      const dirtyState = {
        ...defaultStoreState,
        isDirty: true,
      };
      mockUseWizardStore.mockReturnValue(dirtyState);

      render(<WizardProgress currentStep={0} />);

      // Navigate to step 2
      const puntajesButtons = screen.getAllByRole('button', { name: /Puntajes/i });
      fireEvent.click(puntajesButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
      });

      // Cancel navigation
      const stayButton = screen.getByText('Quedarme aquí');
      fireEvent.click(stayButton);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not show dialog when state is clean', () => {
      mockUseWizardStore.mockReturnValue(defaultStoreState);

      render(<WizardProgress currentStep={0} />);

      // Navigate to step 2
      const puntajesButtons = screen.getAllByRole('button', { name: /Puntajes/i });
      fireEvent.click(puntajesButtons[0]);

      // Should navigate immediately without dialog
      expect(mockPush).toHaveBeenCalledWith('/rueda/test-wheel-123/puntajes');
      expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct navigation role and label', () => {
      render(<WizardProgress currentStep={0} />);

      const nav = screen.getByRole('navigation', { name: /Progreso del asistente/i });
      expect(nav).toBeInTheDocument();
    });

    it('step buttons are keyboard accessible', () => {
      render(<WizardProgress currentStep={0} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('no steps have aria-disabled attribute', () => {
      render(<WizardProgress currentStep={0} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('aria-disabled');
      });
    });

    it('current step is marked with aria-current', () => {
      render(<WizardProgress currentStep={3} />);

      const currentButtons = screen.getAllByRole('button', { name: /Prioridades.*actual/i });
      expect(currentButtons.length).toBeGreaterThan(0);
      currentButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-current', 'step');
      });
    });
  });
});
