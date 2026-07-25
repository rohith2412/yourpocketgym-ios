import { createContext, useContext } from "react";

export type TabNav = { goToProfile: () => void };
export const TabNavCtx = createContext<TabNav>({ goToProfile: () => {} });
export const useTabNav = () => useContext(TabNavCtx);
