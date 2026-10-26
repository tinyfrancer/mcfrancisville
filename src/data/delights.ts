import type { VillagerId } from '../types/ids';

/**
 * What each neighbour says when she sneezes in the long grass in spring (1.6's X5, decision 384),
 * if they're close enough to hear. `{name}` is hers.
 */
export const BLESS_YOU: Record<VillagerId, string> = {
  maude: "Bless you, {name}! Spring gets up everybody's nose.",
  rufus: 'Bless you! I sneeze at the full moon myself. Every month, like clockwork.',
  wrapunzel: 'Bless you, dear. Would you like a bandage? For your nose? No? Fair enough.',
  agatha: 'Bless you, {name}. That one had a little spell in it. Harmless. Sparkly.',
  barty: "Bless you! I'd sneeze too, but I haven't got a nose. One of the perks.",
  cody: 'Bless you, babe! Want me to carry you out of the grass?',
  ollie: "Bless you! I'll deliver you a hanky first thing.",
  nessa: 'Bless you! I felt that one from the water. Lovely.',
  gourdon: 'Bless you! Mind, that one nearly blew my lid off.',
  hazel: "Bless you, {name}. I'll write it in my notes: one sneeze, very sweet.",
  boothoven: 'Bless you! A fine sneeze. Allegro, and in B flat.',
  scarah:
    "Bless you! It's the meadow's fault. It does it to me too, and I'm stuffed with the stuff.",
  robBoo: 'Oh! Bless you, {name}. Sorry, did I startle that out of you?',
};
