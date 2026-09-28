import type { ItemId, ToolId } from '../types/ids';

export interface ToolRow {
  name: string;
  /** Said on the quick bar when she picks it up. */
  description: string;
}

/**
 * What she can hold from the quick bar (phase M). Nothing needs one: a tap on a bed still does
 * what the bed needs, and a tap on a critter still swings her net. What she holds is what she
 * carries, and a seed in her hand is planted straight into an empty bed.
 */
export const TOOLS: Record<ToolId, ToolRow> = {
  hands: {
    name: 'Hands',
    description: 'Nothing in your hands. A bed gets whatever it needs, and a seed asks which.',
  },
  net: {
    name: 'Bug net',
    description: 'Your trusty net. Tap a critter to swing it.',
  },
  can: {
    name: 'Watering can',
    description: 'A little tin can with a rose on the spout. Tap a bed to water it.',
  },
};

export const TOOL_IDS = Object.keys(TOOLS) as ToolId[];

/** What's in her hand: a tool, or a seed from her bag to plant. */
export type Held = ToolId | ItemId;

export function isTool(held: string): held is ToolId {
  return (TOOL_IDS as string[]).includes(held);
}
