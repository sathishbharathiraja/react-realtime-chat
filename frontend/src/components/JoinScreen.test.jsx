import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JoinScreen from './JoinScreen';

describe('JoinScreen', () => {
  it('renders correctly', () => {
    render(<JoinScreen onJoin={() => {}} isConnected={true} />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('allows user to generate a random room code and join', () => {
    const handleJoin = vi.fn();
    render(<JoinScreen onJoin={handleJoin} isConnected={true} />);

    // Enter name
    const nameInput = screen.getByPlaceholderText('Enter your name');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    // Click Create New Room (goes to 'create' mode)
    const createButton = screen.getByText('Create New Room');
    fireEvent.click(createButton);

    // Click Start Room
    const startButton = screen.getByText('Start Room');
    fireEvent.click(startButton);

    expect(handleJoin).toHaveBeenCalledTimes(1);
    // Room ID is random, so we just expect any string of length 6
    expect(handleJoin).toHaveBeenCalledWith('Alice', expect.stringMatching(/^\d{6}$/));
  });

  it('allows user to join an existing room', () => {
    const handleJoin = vi.fn();
    render(<JoinScreen onJoin={handleJoin} isConnected={true} />);

    // Enter name
    const nameInput = screen.getByPlaceholderText('Enter your name');
    fireEvent.change(nameInput, { target: { value: 'Bob' } });

    // Click Join Room to reveal the code input (goes to 'join' mode)
    const initialJoinButton = screen.getByText('Join Room');
    fireEvent.click(initialJoinButton);

    // Enter room code
    const roomInput = screen.getByPlaceholderText('123456');
    fireEvent.change(roomInput, { target: { value: '123456' } });

    // Click actual Enter Room button inside the form
    const confirmJoinButton = screen.getByText('Enter Room');
    fireEvent.click(confirmJoinButton);

    expect(handleJoin).toHaveBeenCalledTimes(1);
    expect(handleJoin).toHaveBeenCalledWith('Bob', '123456');
  });

  it('does not allow joining without a name', () => {
    const handleJoin = vi.fn();
    render(<JoinScreen onJoin={handleJoin} isConnected={true} />);

    // Leave name blank
    const createButton = screen.getByText('Create New Room');
    fireEvent.click(createButton);

    expect(handleJoin).not.toHaveBeenCalled();
  });
});
