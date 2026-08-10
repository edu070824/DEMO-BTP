import { useContext } from "react";
import { TechStoreContext } from "../context/techStoreContext";

export function useTechStore() {
  const context = useContext(TechStoreContext);

  if (!context) {
    throw new Error("useTechStore debe utilizarse dentro de TechStoreProvider.");
  }

  return context;
}
