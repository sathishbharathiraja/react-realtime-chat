import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JoinScreen from '../JoinScreen';

// Mock Firebase imports
vi.mock('../../firebase', () => ({
  auth: {}
}));
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn().mockResolvedValue({})
}));

describe('JoinScreen Component', () => {
  it('renders correctly and has a Google Sign-In button', () => {
    render(<JoinScreen />);
    
    // Check if the title is present
    expect(screen.getByText('Sign in to CorpChat')).toBeInTheDocument();
    
    // Check if the Google button is present and in the right place
    const button = screen.getByRole('button', { name: /Sign in with Google/i });
    expect(button).toBeInTheDocument();
  });

  it('shows loading state when button is clicked', async () => {
    render(<JoinScreen />);
    const button = screen.getByRole('button', { name: /Sign in with Google/i });
    
    // Fire click
    fireEvent.click(button);
    
    // The button should become disabled
    expect(button).toBeDisabled();
  });
});
