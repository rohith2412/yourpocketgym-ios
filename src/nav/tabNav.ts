import { createContext, useContext } from "react";

export type TabKey = "progress" | "train" | "nutrition" | "profile";

export type TabNav = {
  goTo: (key: TabKey) => void;
  goToProfile: () => void;
};

const noop = () => {};
export const TabNavCtx = createContext<TabNav>({ goTo: noop, goToProfile: noop });
export const useTabNav = () => useContext(TabNavCtx);
