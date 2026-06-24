import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock dependencies
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }))
}));

vi.mock('../firebase', () => ({
  auth: {}
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    // Simulate an authenticated user
    cb({
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: vi.fn().mockResolvedValue('fake-token')
    });
    return () => {};
  }),
  signOut: vi.fn()
}));

describe('App Layout & Routing', () => {
  it('renders the sidebar navigation buttons correctly for authenticated users', async () => {
    render(<App />);
    
    // Check for the top bar
    expect(await screen.findByText('CorpChat Teams')).toBeInTheDocument();
    
    // Check if sidebar buttons are correctly placed
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Calls')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
