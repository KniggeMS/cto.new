import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './index';

describe('App', () => {
  it('renders the heading and date text', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /InFocus Web App/i })).toBeInTheDocument();
    expect(screen.getByText(/Placeholder for the InFocus web application/i)).toBeInTheDocument();
    expect(screen.getByText(/Current date:/i)).toBeInTheDocument();
  });
});
