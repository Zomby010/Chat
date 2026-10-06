import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

vi.mock('../lib/api', async (orig) => {
  const actual = await orig();
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ status: 'signedIn', profile: { region: 'KE', preferences: {} } }),
}));

const { api } = await import('../lib/api');
const { default: RichText } = await import('../components/chat/RichText');
const { default: CheckInForm } = await import('../components/mood/CheckInForm');
const { default: CrisisResourceList } = await import('../components/crisis/CrisisResourceList');

describe('RichText', () => {
  it('renders lists and bold text without injecting HTML', () => {
    const { container } = render(<RichText text={'Try this:\n- **Breathe** slowly\n- Walk\n<img src=x onerror=alert(1)>'} />);
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('strong').textContent).toBe('Breathe');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  });
});

describe('CrisisResourceList', () => {
  it('shows tap-to-call links for the region', () => {
    render(<CrisisResourceList region="KE" />);
    expect(screen.getByRole('link', { name: /call 999/i })).toHaveAttribute('href', 'tel:999');
    expect(screen.getByRole('link', { name: /kenya red cross/i })).toHaveAttribute('href', 'tel:1199');
  });
});

describe('CheckInForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks for a mood before saving', async () => {
    render(<MemoryRouter><CheckInForm /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    expect(screen.getByText(/pick a face to continue/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('saves a check-in and shows support, including crisis lines when flagged', async () => {
    api.post.mockResolvedValue({
      entry: { id: 'm1', score: 1 },
      support: {
        message: 'Thank you for telling me.',
        suggestions: [{ id: 's1', text: 'Try a breathing exercise', route: '/wellbeing/breathing' }],
        safety: { level: 'high', showResources: true },
      },
    });
    const onSaved = vi.fn();
    render(<MemoryRouter><CheckInForm onSaved={onSaved} /></MemoryRouter>);
    await userEvent.click(screen.getByRole('radio', { name: /struggling/i }));
    await userEvent.type(screen.getByRole('textbox'), 'hard day');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(api.post).toHaveBeenCalledWith('/moods', expect.objectContaining({ score: 1, note: 'hard day' }));
    expect(await screen.findByText('Check-in saved')).toBeInTheDocument();
    expect(screen.getByText(/support is available right now/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /try a breathing exercise/i })).toHaveAttribute('href', '/wellbeing/breathing');
    expect(onSaved).toHaveBeenCalled();
  });
});
