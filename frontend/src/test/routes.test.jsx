import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CrisisProvider } from '../context/CrisisContext';
import { AppRoutes } from '../App';

// No Firebase env in tests, so the app runs signed out.
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CrisisProvider>
              <AppRoutes />
            </CrisisProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('routing', () => {
  it('sends signed-out visitors from protected pages to sign in', async () => {
    renderAt('/home');
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('shows crisis resources without an account', async () => {
    renderAt('/resources');
    expect(await screen.findByRole('heading', { name: /support when you need it/i })).toBeInTheDocument();
  });

  it('has a friendly not-found page', async () => {
    renderAt('/nowhere');
    expect(await screen.findByText(/couldn’t find that page/i)).toBeInTheDocument();
  });
});
