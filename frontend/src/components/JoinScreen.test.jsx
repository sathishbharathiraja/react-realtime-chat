import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JoinScreen from './JoinScreen';

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {}
}));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
}));

describe('JoinScreen', () => {
  it('renders login mode initially', () => {
    render(<JoinScreen />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('toggles to sign up mode', () => {
    render(<JoinScreen />);
    
    const toggleButton = screen.getByText("Don't have an account? Sign up");
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. John Doe')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });
});
