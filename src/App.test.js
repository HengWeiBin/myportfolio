import { render, screen } from '@testing-library/react';
import App from './App';

test('renders terminal portfolio navigation', () => {
  render(<App />);
  const homeLink = screen.getByText(/\[Home\]/i);
  expect(homeLink).toBeInTheDocument();
});
