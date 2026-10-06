/** Hand-drawn style mood faces; colour comes from the mood token, not red/green. */
const MOUTHS = {
  1: 'M8.5 16.2c1.9-1.6 5.1-1.6 7 0',
  2: 'M9 15.6c1.7-.8 4.3-.8 6 0',
  3: 'M9 15h6',
  4: 'M8.8 14.4c1.8 1.4 4.6 1.4 6.4 0',
  5: 'M8.2 13.8c2 2.4 5.6 2.4 7.6 0',
};

export default function MoodFace({ score, size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`mood-face mood-${score}`}>
      <circle cx="12" cy="12" r="10.5" className="mood-face__bg" />
      {score === 1 ? (
        <>
          <path d="M7.8 9.6l2.2.6M16.2 9.6l-2.2.6" className="mood-face__line" />
        </>
      ) : (
        <>
          <circle cx="9" cy="10" r="1.1" className="mood-face__eye" />
          <circle cx="15" cy="10" r="1.1" className="mood-face__eye" />
        </>
      )}
      <path d={MOUTHS[score]} className="mood-face__line" />
    </svg>
  );
}
