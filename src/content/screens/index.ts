import type { Screen } from "@/ui/types";
import kycLevels from "./kyc-levels.json";
import kycFailed from "./kyc-failed.json";

/** UI screens as data (the seed; the database comes in a later step). */
export const screens: Record<string, Screen> = {
  [kycLevels.id]: kycLevels as Screen,
  [kycFailed.id]: kycFailed as Screen,
};

export const screenList = () => Object.values(screens);
