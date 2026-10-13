import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('App smoke test', () => {
  it('renders Hotel Hunapú application successfully', () => {
    render(<App />);

    // Brand and Title
    expect(screen.getAllByText(/Hotel Hunapú/i).length).toBeGreaterThan(0);

    // Initial navigation
    expect(screen.getByText(/Ingresar/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Admin/i).length).toBeGreaterThan(0);

    // Active status
    expect(
      screen.getByText(/Aplicación Frontend Hotel Hunapú · Activa/i),
    ).toBeInTheDocument();
  });
});
