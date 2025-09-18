import { createContext, useContext, useEffect, useState } from "react";

type ActiveId = string | 'all';
const KEY = 'active_property_global';

const Ctx = createContext<{id: ActiveId; setId: (v: ActiveId) => void}>({
  id: 'all', 
  setId: () => {}
});

export function ActivePropertyProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<ActiveId>(() => 
    (localStorage.getItem(KEY) as ActiveId) || 'all'
  );
  
  useEffect(() => {
    if (id === 'all') {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, id);
    }
  }, [id]);
  
  return (
    <Ctx.Provider value={{ id, setId }}>
      {children}
    </Ctx.Provider>
  );
}

export const useActiveProperty = () => useContext(Ctx);