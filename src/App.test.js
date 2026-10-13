import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Mission Control UI & 5-Section Layout', () => {
  test('renders terminal portfolio navigation with all 5 sections and archive link', async () => {
    render(<App />);

    expect(screen.getByText(/\[Home\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Featured Work\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Evolution\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Capabilities\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Credentials & Contact\]/i)).toBeInTheDocument();

    const archiveLinks = screen.getAllByRole('link', { name: /\[Archive\]/i });
    expect(archiveLinks.length).toBeGreaterThan(0);
    expect(screen.getByText(/SYSTEM ONLINE/i)).toBeInTheDocument();
  });

  test('renders all 5 narrative sections on the homepage', async () => {
    render(<App />);

    // 1. Hero Section
    expect(screen.getByText(/\$ view_projects\.sh/i)).toBeInTheDocument();
    expect(screen.getByText(/\$ cat resume\.txt/i)).toBeInTheDocument();

    // 2. Featured Work Section
    expect(screen.getByText(/Featured Projects/i)).toBeInTheDocument();

    // 3. System Evolution Section
    expect(screen.getByText(/System Evolution/i)).toBeInTheDocument();

    // 4. Capabilities & Stack Section
    expect(screen.getByText(/Capabilities & Stack/i)).toBeInTheDocument();

    // 5. Credentials & Contact Handshake
    expect(screen.getAllByText(/initiate_handshake\.sh/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sh \.\/contact_me\.sh/i)).toBeInTheDocument();
  });

  test('navigates to /archive route and renders search and filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    const archiveLinks = screen.getAllByRole('link', { name: /\[Archive\]/i });
    await user.click(archiveLinks[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by keywords, algorithms/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /All Types/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Projects/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Credentials/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Tiers/i })).toBeInTheDocument();
    expect(screen.getByText(/Return to Mission Control/i)).toBeInTheDocument();
  });
});
