import { LifeBuoy } from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';

export default function CrisisButton() {
  const { openCrisis } = useCrisis();
  return (
    <button type="button" className="btn btn--crisis btn--sm crisis-trigger" onClick={openCrisis} aria-haspopup="dialog">
      <LifeBuoy size={16} aria-hidden />
      <span className="crisis-trigger__long">Get help now</span>
      <span className="crisis-trigger__short">Help</span>
    </button>
  );
}
