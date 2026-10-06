import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import CrisisDialog from '../components/crisis/CrisisDialog';

const CrisisContext = createContext(null);

/** Lets any component open the crisis support dialog in one call. */
export function CrisisProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openCrisis = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openCrisis }), [openCrisis]);
  return (
    <CrisisContext.Provider value={value}>
      {children}
      <CrisisDialog open={open} onClose={() => setOpen(false)} />
    </CrisisContext.Provider>
  );
}

export function useCrisis() {
  return useContext(CrisisContext);
}
