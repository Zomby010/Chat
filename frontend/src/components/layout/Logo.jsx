import { Link } from 'react-router';

/** MindMate mark: a leaf held inside a speech shape, "growth through conversation". */
export function LogoMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5c-4.7 0-8.5 3.4-8.5 7.6 0 2.2 1 4.1 2.7 5.5L5.5 20l3.9-1.9c.8.2 1.7.3 2.6.3 4.7 0 8.5-3.4 8.5-7.6S16.7 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 13.2c0-2.6 2-4.6 6-4.7-.1 3.9-2.1 5.9-4.7 5.9-.5 0-.9 0-1.3-.2Zm0 0c.9-1.3 2-2.2 3.4-2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="brand" aria-label="MindMate home">
      <span className="brand__mark">
        <LogoMark />
      </span>
      MindMate
    </Link>
  );
}
