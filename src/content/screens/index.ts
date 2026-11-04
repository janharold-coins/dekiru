import type { Screen } from "@/ui/types";
import kycLevels from "./kyc-levels.json";

/** UI screens as data (the seed; the database comes in a later step). */
export const screens: Record<string, Screen> = {
  [kycLevels.id]: kycLevels as Screen,
};

export const screenList = () => Object.values(screens);
