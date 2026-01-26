/**
 * Integration tests for Weekly Check-in Flow
 * Tests the weekly reflection functionality
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { WeeklyCheckin } from '@/lib/types/lifeplan';

describe('Weekly Check-in Flow', () => {
  beforeEach(() => {
    useLifePlanStore.getState().reset();
  });

  describe('Check-in State', () => {
    it('should initialize with null check-in', () => {
      const state = useLifePlanStore.getState();
      expect(state.weeklyCheckin).toBeNull();
    });

    it('should set weekly check-in', () => {
      const checkin: WeeklyCheckin = {
        id: 'checkin-1',
        user_id: 'user-123',
        week_start: '2024-01-15',
        what_worked: 'Completed all meditation sessions',
        what_to_adjust: 'Start exercises earlier in the morning',
        created_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().setWeeklyCheckin(checkin);

      const state = useLifePlanStore.getState();
      expect(state.weeklyCheckin).not.toBeNull();
      expect(state.weeklyCheckin?.what_worked).toBe('Completed all meditation sessions');
      expect(state.weeklyCheckin?.what_to_adjust).toBe('Start exercises earlier in the morning');
    });

    it('should clear weekly check-in', () => {
      const checkin: WeeklyCheckin = {
        id: 'checkin-1',
        user_id: 'user-123',
        week_start: '2024-01-15',
        what_worked: 'Test',
        what_to_adjust: 'Test',
        created_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().setWeeklyCheckin(checkin);
      useLifePlanStore.getState().setWeeklyCheckin(null);

      expect(useLifePlanStore.getState().weeklyCheckin).toBeNull();
    });
  });

  describe('Check-in with Week Start Date', () => {
    it('should store check-in with correct week_start', () => {
      const checkin: WeeklyCheckin = {
        id: 'checkin-1',
        user_id: 'user-123',
        week_start: '2024-01-15', // Monday
        what_worked: null,
        what_to_adjust: null,
        created_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().setWeeklyCheckin(checkin);

      expect(useLifePlanStore.getState().weeklyCheckin?.week_start).toBe('2024-01-15');
    });
  });

  describe('Check-in Content', () => {
    it('should allow empty what_worked', () => {
      const checkin: WeeklyCheckin = {
        id: 'checkin-1',
        user_id: 'user-123',
        week_start: '2024-01-15',
        what_worked: null,
        what_to_adjust: 'Something to adjust',
        created_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().setWeeklyCheckin(checkin);

      const state = useLifePlanStore.getState();
      expect(state.weeklyCheckin?.what_worked).toBeNull();
      expect(state.weeklyCheckin?.what_to_adjust).toBe('Something to adjust');
    });

    it('should allow empty what_to_adjust', () => {
      const checkin: WeeklyCheckin = {
        id: 'checkin-1',
        user_id: 'user-123',
        week_start: '2024-01-15',
        what_worked: 'Everything went great',
        what_to_adjust: null,
        created_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().setWeeklyCheckin(checkin);

      const state = useLifePlanStore.getState();
      expect(state.weeklyCheckin?.what_worked).toBe('Everything went great');
      expect(state.weeklyCheckin?.what_to_adjust).toBeNull();
    });

    it('should allow both fields to be filled', () => {
      const checkin: WeeklyCheckin = {
        id: 'checkin-1',
        user_id: 'user-123',
        week_start: '2024-01-15',
        what_worked: 'Maintained consistency with meditation',
        what_to_adjust: 'Need to add more variety to workouts',
        created_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().setWeeklyCheckin(checkin);

      const state = useLifePlanStore.getState();
      expect(state.weeklyCheckin?.what_worked).toBe('Maintained consistency with meditation');
      expect(state.weeklyCheckin?.what_to_adjust).toBe('Need to add more variety to workouts');
    });
  });

  describe('Reset Behavior', () => {
    it('should clear check-in on store reset', () => {
      const checkin: WeeklyCheckin = {
        id: 'checkin-1',
        user_id: 'user-123',
        week_start: '2024-01-15',
        what_worked: 'Test',
        what_to_adjust: 'Test',
        created_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().setWeeklyCheckin(checkin);
      expect(useLifePlanStore.getState().weeklyCheckin).not.toBeNull();

      useLifePlanStore.getState().reset();
      expect(useLifePlanStore.getState().weeklyCheckin).toBeNull();
    });
  });
});

describe('Week Start Date Calculations', () => {
  // Create date at noon local time to avoid timezone issues
  function createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Utility function to get start of week (Monday)
  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  it('should calculate Monday as start of week', () => {
    // Monday June 17, 2024
    const monday = createLocalDate(2024, 6, 17);
    const weekStart = getStartOfWeek(monday);

    expect(weekStart.getDay()).toBe(1); // Monday
    expect(formatDate(weekStart)).toBe('2024-06-17');
  });

  it('should calculate previous Monday for mid-week dates', () => {
    // Wednesday June 19, 2024
    const wednesday = createLocalDate(2024, 6, 19);
    const weekStart = getStartOfWeek(wednesday);

    expect(weekStart.getDay()).toBe(1); // Monday
    expect(formatDate(weekStart)).toBe('2024-06-17');
  });

  it('should calculate previous Monday for Sunday', () => {
    // Sunday June 23, 2024
    const sunday = createLocalDate(2024, 6, 23);
    const weekStart = getStartOfWeek(sunday);

    expect(weekStart.getDay()).toBe(1); // Monday
    expect(formatDate(weekStart)).toBe('2024-06-17');
  });

  it('should calculate week range correctly', () => {
    const monday = createLocalDate(2024, 6, 17);
    const weekStart = getStartOfWeek(monday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    expect(formatDate(weekStart)).toBe('2024-06-17');
    expect(formatDate(weekEnd)).toBe('2024-06-23');
    expect(weekEnd.getDay()).toBe(0); // Sunday
  });
});
