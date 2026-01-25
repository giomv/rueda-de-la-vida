import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock crypto.randomUUID
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
  };
} else if (!crypto.randomUUID) {
  crypto.randomUUID = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
}
