import type { SlideData } from "@/deck/types";
import data from "./templates.json";

/**
 * Slide templates: approved slides with their words swapped for placeholders, to fill in with your own.
 * Built from the Sales master by scripts/build-templates.py. Images stay as approved until uploads exist.
 */
export interface SlideTemplate {
  id: string;
  name: string;
  /** What it's for, one line. */
  use: string;
  /** The approved slide it was made from ("sales/s01"). */
  from: string;
  slide: SlideData;
}

export const templates = data as unknown as SlideTemplate[];

export const getTemplate = (id: string) => templates.find((t) => t.id === id);
