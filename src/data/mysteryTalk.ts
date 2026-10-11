import type { VillagerId } from '../types/ids';

/**
 * The neighbours theorising (V1's P3a, decision 302): brought up for a few days after a clue is
 * pinned to her corkboard. Agatha has a corkboard of her own, Hazel thinks it's a ghost nobody's
 * met, and Cody is entirely unbothered. Three lines a neighbour, in `MEMORY_TALK`'s shape.
 */
export type MysteryTopic = 'mystery';

export const MYSTERY_TALK: Record<VillagerId, readonly string[]> = {
  cody: [
    "A new clue, babe? Love that for you. The mayor can be whoever they want. I'm just here for the snacks at the reveal.",
    "Honey bunny, I don't need to know who the mayor is. I know who you are. That's the only mystery I ever solved.",
    "Mi amor, the creeper's harmless. The mayor's harmless. I'm harmless. Mostly. Go get 'em, detective.",
  ],
  agatha: [
    "{name}, a new clue! I've moved three strings on my corkboard and added a fourth. It's red. They're all red.",
    "My corkboard says it's someone we've never met. My cauldron says it's someone shy. They're both rarely wrong.",
    "I've crossed the creeper off my board and written him back on twice. I'm keeping the pin warm.",
  ],
  maude: [
    "Have you noticed, {name}? The mayor writes like someone who reads a lot of letters and sends very few. I'd know.",
    'A shy mayor. I like them already. The shy ones make the best library members. They return their books.',
    "I've checked every book on mayors in the library. None of them mention being see-through. I'm looking again.",
  ],
  rufus: [
    'A CLUE!!! I smelled it from here!!! It smells like envelopes!!! And a bit like cold!!!',
    "Is it me? Am I the mayor? I don't think I'm the mayor! I'd remember! Probably! I'm almost sure!",
    "I've been sniffing round the square for the mayor! I found a sandwich! Not the mayor! Still good!",
  ],
  wrapunzel: [
    "A mayor who won't be seen, dear. In my day that was called royalty. Or being very wrapped up in one's work.",
    'Be gentle when you find them, my darling. Anyone who hides that long is usually just hoping to be liked.',
    "I've baked a tray of welcome biscuits for whoever it turns out to be. They'll keep. Biscuits and secrets both.",
  ],
  barty: [
    "{name}, R.B., Rufus says it isn't him. I say it isn't me. My bones say it isn't me. All two hundred and six.",
    "A mayor, popping up when the time's right. Like a bulb. You can't hurry a bulb. I've tried.",
    "Something's taking root in this town, I reckon. A big reveal. I've weeded the square just in case.",
  ],
  ollie: [
    "The mayor's letters come with no stamp and no address, and they always get there. That's either magic or very good posting.",
    "{name}, I've seen the mayor's handwriting on a hundred envelopes. It wobbles. Nervous hand, I'd say. A kind one.",
    "Between you and me, the mayor's post goes up the castle hill. I've never seen who takes it in. I wave anyway.",
  ],
  nessa: [
    "I don't mind not knowing who the mayor is. I know what it's like to be shy. Maybe they're just waiting till they're brave.",
    "Someone has been leaving the lanterns on the pier straightened at night. Nobody's there when I look. I don't mind.",
    "{name}, if the mayor is shy, I hope everyone's kind when they meet them. I'll stand at the back so they're not crowded.",
  ],
  gourdon: [
    'Somebody ordered a brand new desk chair. No name on the slip. Paid in exact change. Left the money on the bench overnight.',
    "Mayor's a careful one. Measures twice, writes once. I respect that. Wish they'd measure their way here.",
    '{name}, my candle went out by the well last night. No wind. Just a polite little draught. Then it said sorry.',
  ],
  hazel: [
    "Jinkies, {name}, I've got it. The mayor is a ghost nobody's met! Shy, see-through, writes letters. It all fits!",
    'I pointed my telescope at the castle last night. One window lit, and something in it waving. Very slowly. Very shyly.',
    '{name}, every mystery has an unmasking. I hope ours ends with a friend under the sheet. The best ones do.',
  ],
  boothoven: [
    '{name}, this is a mystery in a minor key, resolving to a major one. I can hear it coming. Two more bars, perhaps.',
    "The mayor's typing has a rhythm, did you know? Click-clack-clack, ding. A shy little waltz. I've written it down.",
    "A ghost who's shy of being seen? Oh, {name}, I know the feeling. It took me a century to come out from behind the piano.",
  ],
  scarah: [
    "Cornelius reckons it's a ghost. Cornelius reckons everything's a ghost. He's been right twice. That's twice.",
    "A shy mayor, eh? I stood in a field for forty years before I said a word to anyone. They'll come round.",
    '{name}, somebody left a thank-you note in the seed cart. Typed. Every W a little darker. The plot thickens, like a good soup.',
  ],
};
