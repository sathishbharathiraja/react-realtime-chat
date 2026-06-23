import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoomSelection from '../components/RoomSelection';

describe('RoomSelection', () => {
  const mockUser = { displayName: 'Test User' };
  const mockOnJoin = vi.fn();
  const mockOnLogout = vi.fn();

  it('renders choice mode initially', () => {
    render(<RoomSelection user={mockUser} onJoin={mockOnJoin} onLogout={mockOnLogout} isConnected={true} />);
    
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    expect(screen.getByText('Create Room')).toBeInTheDocument();
    expect(screen.getByText('Join Room')).toBeInTheDocument();
  });

  it('generates a 6-digit code when Create Room is clicked and confirmed', () => {
    render(<RoomSelection user={mockUser} onJoin={mockOnJoin} onLogout={mockOnLogout} isConnected={true} />);
    
    // Click 'Create Room' to go to create mode
    fireEvent.click(screen.getByText('Create Room'));
    
    // In create mode, click 'Generate Code'
    fireEvent.click(screen.getByText('Generate Code'));
    
    // Verify a 6 digit code is displayed
    const codeElement = screen.getByText(/^\d{6}$/);
    expect(codeElement).toBeInTheDocument();
    
    // Click 'Enter Room' which is now visible
    fireEvent.click(screen.getByText('Enter Room'));
    
    // Verify onJoin was called with the code
    expect(mockOnJoin).toHaveBeenCalledWith(codeElement.textContent);
  });

  it('allows joining a room with exactly 6 digits', () => {
    render(<RoomSelection user={mockUser} onJoin={mockOnJoin} onLogout={mockOnLogout} isConnected={true} />);
    
    // Click 'Join Room'
    fireEvent.click(screen.getByText('Join Room'));
    
    const input = screen.getByPlaceholderText('------');
    // We need to use getAllByText because 'Join Room' text is on both the choice mode button and the form button.
    // Actually, in 'join' mode, the choice buttons are unmounted, so there's only one.
    const joinButton = screen.getAllByText('Join Room').find(el => el.tagName === 'BUTTON');
    
    // Initially disabled
    expect(joinButton).toBeDisabled();
    
    // Enter 3 digits, still disabled
    fireEvent.change(input, { target: { value: '123' } });
    expect(joinButton).toBeDisabled();
    
    // Enter 6 digits, enabled
    fireEvent.change(input, { target: { value: '123456' } });
    expect(joinButton).toBeEnabled();
    
    // Submit
    fireEvent.click(joinButton);
    expect(mockOnJoin).toHaveBeenCalledWith('123456');
  });
});
