import type { VillagerId } from '../types/ids';

/**
 * The neighbours theorising (V1's P3a, decision 302): brought up for a few days after a clue is
 * pinned to her corkboard. Agatha has a corkboard of her own, Hazel thinks it's a ghost nobody's
 * met, and Cody is entirely unbothered. Three lines a neighbour, in `MEMORY_TALK`'s shape.
 */
export type MysteryTopic = 'mystery' | 'mayorMet';

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
  // Never said: the town only theorises before she has met him (V1's P3b), but every row has one.
  robBoo: [
    "Ahem. {name}, a mystery? About the mayor? Goodness. I'd stay well out of it. For reasons. Unrelated reasons.",
    "I hear the mayor's very shy. I'm sure they're doing their best, {name}. I'm sure they'll say hello soon. Probably.",
    "Clues, {name}? I've never been any good at clues. I'm much better at leaving them. Not that I have. Ahem.",
  ],
};

/**
 * After the unmasking (V1's P3b, decision 303): for a few days after she has met the mayor at the
 * castle, the town talks of nothing else, in place of theorising. Rob Boo talks about being met.
 * Three lines a neighbour, in the same shape.
 */
export const MAYOR_MET_TALK: Record<VillagerId, readonly string[]> = {
  cody: [
    "The mayor's a ghost, babe. Pinker than you'd think. I like him. He laughed at my joke before I'd finished it.",
    "Honey bunny, the mayor asked me how to be less shy. I said marry the best person in town. He said that one's taken.",
    "Mi amor, you solved it. I want that on record. I'll have the mayor stamp it.",
  ],
  agatha: [
    "{name}, I've taken the string down. All of it. I've kept the pins. You never know.",
    'A shy ghost who types with a sticky W. My corkboard was right about everything but the hat. Nobody saw the hat coming.',
    "Rob Boo came to tea. He went pink when I offered him a biscuit. I may have been a bit gentler than usual. Don't tell.",
  ],
  maude: [
    "Another ghost in town, {name}! We've already started a club. It meets on Tuesdays and says very little.",
    'Rob Boo borrowed a book on public speaking. And returned it the same day. Read it twice. I like him enormously.',
    "{name}, I've added him to the town history. In a chapter of his own. He asked for a footnote. He's getting a chapter.",
  ],
  rufus: [
    "{name}! The mayor's NICE! I said he'd be nice! He scratched behind my ears! It went through! STILL NICE!",
    "I'm so glad it wasn't me! And it wasn't Barty! It was ROB! Rob Boo! It rhymes! Sort of! I love it!",
    'The mayor waved at me this morning! FROM THE TOWN HALL STEPS! I waved back so hard I fell over!',
  ],
  wrapunzel: [
    "I baked the mayor a meringue, dear. He went ever so pink and floated about a foot off the floor. Ghosts can't help it.",
    "Poor lamb, a hundred years too shy to say hello. Well, he's said it now. I'll make sure he eats something.",
    '{name}, the welcome biscuits kept. Told you they would. He had three.',
  ],
  barty: [
    "R.B.! Rob Boo! I knew it wasn't me. My bones knew. All two hundred and six of them.",
    "Mayor came by the garden and asked what everything was. Called the hostas 'distinguished'. Good man. Good ghost.",
    '{name}, you dug that mystery right up. Roots and all. Proud of you.',
  ],
  ollie: [
    '{name}, I delivered a letter to the town hall today, and the mayor opened the door himself! I nearly dropped the round!',
    'All those years of letters with no stamp, and it was the mayor posting them himself. Through the box. Literally through.',
    "Rob Boo signed for a parcel! First signature I've ever had from a ghost. Wobbly. Lovely.",
  ],
  nessa: [
    "{name}, the mayor and I sat on the pier and didn't say anything for an hour. It was the nicest hour.",
    "He straightened the lanterns on the pier. I knew someone did. I'm glad it was him.",
    '{name}, everyone was kind when they met him. I was so happy. I stood at the back, like I said.',
  ],
  gourdon: [
    "Built the mayor a new chair. Doesn't need one. Floats. Sits in it anyway. Says it's the best chair. Good.",
    "Mayor's alright. Measures twice. Speaks once. Then goes pink.",
    '{name}, solved it. Good work. Well built.',
  ],
  hazel: [
    "Jinkies, {name}! A ghost nobody had met! I said so, didn't I? With a star by it!",
    "I showed the mayor the castle through my telescope. He said, 'Oh, that's where I wave from.' Mystery: closed.",
    '{name}, every mystery ends with an unmasking. Ours ended with a friend under the sheet. The best ones do.',
  ],
  boothoven: [
    "{name}, I've written the mayor a theme. Shy at first, in a minor key, and then all at once, gloriously major. Like him.",
    'A ghost who was afraid of being seen! I know that song by heart, {name}. It has a lovely ending.',
    "The mayor and I agree: walking through doors is rude. We knock. It's very satisfying.",
  ],
  scarah: [
    "Cornelius said it was a ghost! He says everything's a ghost. Still. Three times now.",
    "The mayor came to Boo Acres and stood in the field with me, arms out. He said he'd never felt less looked at. Lovely.",
    '{name}, you found the mayor! Cornelius says "Pumpkin." That\'s crow for "well done, detective."',
  ],
  robBoo: [
    "Ahem. You found me, {name}. I'm still not over it. I went pink at the castle and I haven't quite gone back.",
    "Everyone says hello to me now, {name}. In the street! I've had to practise my wave. It's come along nicely.",
    "I've written a letter about meeting you properly. Then I remembered I can just tell you. It was the best night of my century.",
  ],
};
