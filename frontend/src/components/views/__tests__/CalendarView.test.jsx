import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CalendarView from '../CalendarView';
import { vi } from 'vitest';

// Mock global fetch to return empty arrays for /api/calendar and /api/users/all
global.fetch = vi.fn((url) =>
  Promise.resolve({
    json: () => Promise.resolve([]),
    ok: true
  })
);

test('renders Assign Task button after loading', async () => {
  render(<CalendarView token="dummy_token" />);
  
  // Wait for the button to appear after loading finishes
  await waitFor(() => {
    const assignButton = screen.getByText(/Assign Task/i);
    expect(assignButton).toBeInTheDocument();
  });
});
