import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Dialog } from '../ui';
import CrisisResourceList from './CrisisResourceList';
import RegionSelect from './RegionSelect';
import { useAuth } from '../../context/AuthContext';
import { guessRegion } from '../../lib/region';

/** Reachable from every page via the "Get help now" button. Works signed out and offline. */
export default function CrisisDialog({ open, onClose }) {
  const { profile } = useAuth();
  const [region, setRegion] = useState(() => profile?.region || guessRegion());
  useEffect(() => {
    if (profile?.region) setRegion(profile.region);
  }, [profile?.region]);

  return (
    <Dialog open={open} onClose={onClose} title="You deserve support right now">
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          MindMate can’t respond to emergencies. If you’re thinking about harming yourself or feel unsafe, please contact one of these services now. They are free and confidential.
        </p>
        <RegionSelect value={region} onChange={setRegion} />
        <CrisisResourceList region={region} />
        <p className="small muted" style={{ margin: 0 }}>
          While you wait: breathe slowly, move away from anything you could use to hurt yourself, and if you can, stay near someone you trust.{' '}
          <Link to="/resources" onClick={onClose}>
            More support options
          </Link>
        </p>
      </div>
    </Dialog>
  );
}
