import type { HappeningId, VillagerId } from '../types/ids';

/**
 * What a neighbour can bring up besides their own lines (0.2's D2): the weather, her day (the
 * school run in the morning, a quiet hour in the afternoon, family in the evening:
 * personal_touches.md, "Her day (7)"), what she's holding, what she caught today, a happening of
 * theirs later on, and the pet out walking with her. Rainy days are good days here ("Weather (1)").
 *
 * `{catch}` is what she caught, with its "a" ("a candle moth"); `{pet}` the pet's name as she
 * has it; `{happening}` and `{place}` what's on and where (`HAPPENING_CALLED`, and the row's
 * `place`). `{name}` is her name, as everywhere.
 */
export type Topic =
  | 'rain'
  | 'storm'
  | 'fog'
  | 'happening'
  | 'caught'
  | 'pet'
  | 'net'
  | 'can'
  | 'rod'
  | 'seed'
  | 'morning'
  | 'afternoon'
  | 'evening';

/** Which comes first when more than one fits: the sky, then what's on, then what she's doing. */
export const TOPICS: readonly Topic[] = [
  'storm',
  'rain',
  'fog',
  'happening',
  'caught',
  'pet',
  'net',
  'can',
  'rod',
  'seed',
  'morning',
  'afternoon',
  'evening',
];

/** A happening as it's spoken of, after "at" or "for": "book club", "the moon howl". */
export const HAPPENING_CALLED: Record<HappeningId, string> = {
  bookClub: 'book club',
  midnightBake: 'the midnight bake',
  spellGoneWrong: 'the spell-casting',
  moonHowl: 'the moon howl',
  seedSwap: 'the seed swap',
  movieNight: 'movie night',
  filmNight: 'film night',
  newYearDip: "the New Year's dip",
  valentineTea: "Valentine's tea",
  stPatricksJig: 'the jig',
  eggHunt: 'the egg hunt',
  fireworksPicnic: 'the fireworks picnic',
  costumeContest: 'the costume contest',
  halloweenParty: 'the Halloween party',
  thanksgivingDinner: 'Thanksgiving dinner',
  carols: 'the carols',
  countdown: 'the countdown',
  welcomeParty: "Boothoven's welcome party",
};

export const SMALL_TALK: Record<Topic, Record<VillagerId, string>> = {
  rain: {
    cody: "Listen to that rain, honey bunny. Best weather there is. Let's stay in and let it drum.",
    agatha:
      "Rain, {name}. Good for the garden, the cauldron and the soul. I've put a bucket out for spells.",
    maude:
      "A rainy day! The best kind for reading. And for haunting, frankly. Everything's cosier.",
    rufus:
      "RAIN!!! I love rain! The flowers love rain! I've been standing in it! I smell AMAZING! (I don't.)",
    wrapunzel:
      "Rainy day, my darling. That's soup weather. I've a pot on, and the windows are all steamy.",
    barty:
      "Rain! Lovely! The beds are drinking it up, and I don't have to lift a can. Best day of the week.",
    ollie:
      "Rain on the round! Letters in plastic bags, me in a puddle. Wouldn't swap it. Smells like a fresh start.",
    nessa:
      "Rain on the lake makes little rings everywhere, {name}. Thousands. I try to count them. I'm happy.",
    gourdon:
      'Hear the rain on the tin roof? Finest sound there is, {name}. Puts a good finish on a day, rain does.',
    hazel:
      "No stars tonight, I'd say. That's alright. The rain's a whole sky of its own, falling down to say hello.",
    boothoven:
      'Listen, {name}! Rain on the roof. The best drummer in town. It never once drops the beat.',
  },
  storm: {
    cody: 'A real storm, mi amor! Thunder and everything. You love this. I love that you love this.',
    agatha:
      "Thunder, {name}! Proper thunder. I didn't do it. I wish I'd done it. Isn't it marvellous?",
    maude:
      'Did you hear that thunder? I dropped a whole shelf. Then I picked it up and grinned. What a day!',
    rufus:
      "THUNDER! Did you hear it?! I howled back! It howled back louder! I think we're friends now!",
    wrapunzel:
      "A storm, dear! The lights flicker and the bread rises faster. I've never known why. I don't ask.",
    barty:
      'Hear that thunder, {name}? Rattles my bones. Lovely and loud. The beds are having a feast.',
    ollie:
      "Lightning over the square! I counted to five for the thunder. Five's far enough to keep walking.",
    nessa:
      "The lake goes all wild in a storm. Big grey waves. I'm not shy of them. They're shyer than me.",
    gourdon:
      "Storm's in, {name}. I've battened everything I built. Built it all to stand this. Still checking.",
    hazel:
      'Lightning, {name}! Stars in a hurry, I always say. Every flash is a little wish. Make one.',
    boothoven:
      "Thunder, {name}! The timpani of the sky. I've been waiting all year for a good crash.",
  },
  fog: {
    cody: "Foggy one, babe. Very spooky. Very us. Hold my hand so I don't walk into the well again.",
    agatha:
      'Fog. The town wears it like a shawl. {name}, mind the gravestones. They move about in this.',
    maude:
      "Ooh, fog. I can't see my own feet. I haven't got feet. It's the principle of the thing.",
    rufus: "I can't see ANYTHING! I've walked into four trees! I said sorry to all of them!",
    wrapunzel:
      'Foggy morning, dear. It gets in my wraps and makes them curl. I look very dramatic.',
    barty:
      "Fog's rolled in. Can't see the far bed. Could be anything over there. Probably cabbages.",
    ollie:
      "Fog on the round! I'm delivering by memory. If you get a letter for Barty, he'll get yours.",
    nessa: '{name}, I like the fog. Everyone is a little bit hidden. Even me. Especially me.',
    gourdon:
      "Fog's thick as varnish. Can't see the far end of a plank. I'll measure by feel today.",
    hazel:
      "The fog's hiding the sky, but it's all still up there. I checked last night. Twinkling away.",
    boothoven: 'Fog muffles everything, {name}. The whole town goes pianissimo. I rather like it.',
  },
  happening: {
    cody: "Will I see you at {happening} later, booby? It's {place}. I saved you the comfy spot.",
    agatha: "There's {happening} later, {place}. You're coming. I've already told the cauldron.",
    maude:
      "Will you come to {happening} later, {name}? It's {place}. I've been looking forward to it all day!",
    rufus:
      "Are you coming to {happening} later?! It's {place}!!! You HAVE to come! I'll be there first!",
    wrapunzel: "Come to {happening} later, my darling. It's {place}. I'll bring something warm.",
    barty: "There's {happening} on later, {place}. Bring yourself, {name}. That's all we need.",
    ollie:
      "{name}! Got your invitation right here: {happening} later, {place}. That's it. That's the invitation.",
    nessa:
      "Are you going to {happening} later? It's {place}. I'll go if you go. I might go anyway.",
    gourdon:
      "Later on there's {happening}, {place}. Come along, {name}. Good company, good chairs.",
    hazel: "Will I see you at {happening} later? It's {place}. The stars say yes. So do I.",
    boothoven: "Will I hear you at {happening} later? It's {place}. I'll bring a tune to hum.",
  },
  caught: {
    cody: 'I saw you catch {catch} today, mi amor! Look at you go. My wife, the hunter.',
    agatha: "You caught {catch} today, {name}. I could tell. You've got that look about you.",
    maude: "Word is you caught {catch} today! I'll look it up. There's always a book about it.",
    rufus: "You caught {catch}!!! TODAY!!! Can I see it?! Can I sniff it?! I won't sniff it.",
    wrapunzel:
      "Did you catch {catch} today, dear? The museum would love a look, when you're ready.",
    barty: 'I heard you caught {catch} today, {name}. Good eye. Good net. Good day all round.',
    ollie: "News on the round: you caught {catch} today! Everyone's talking about it. Well, me.",
    nessa: "You caught {catch} today? That's lovely, {name}. I hope it was a gentle catch.",
    gourdon: "You caught {catch} today, I hear. Steady hands. You'd make a fine joiner.",
    hazel: 'Ooh, you caught {catch} today! The stars must have been on your side. They often are.',
    boothoven:
      'You caught {catch}, {name}! Did it make a sound? Everything makes a sound. Bravo, regardless.',
  },
  pet: {
    cody: "Hey, {pet}! Who's a good little monster? You are. Don't tell the others I said that.",
    agatha:
      '{pet} is looking well, {name}. Very well. Better than most people I know. Most of them, frankly.',
    maude:
      "Oh, you've brought {pet}! Hello, {pet}. You're welcome in the library. Paws off the poetry.",
    rufus:
      "{pet}!!! HELLO {pet}!!! Can we play?! I'm basically a dog! Don't tell anyone! Everyone knows!",
    wrapunzel: "Hello, {pet}, sweetheart! I've a little biscuit somewhere in these wraps for you.",
    barty: 'Out for a walk with {pet}, eh? Good on you. Mind the beds, {pet}. Mind the beds.',
    ollie: "Hello, {pet}! I've no post for you today. I'll write you something myself. Promise.",
    nessa: 'Hello, {pet}. You can stand by me. I like a quiet friend. You both are.',
    gourdon: '{pet}! Good to see you. I could build you a little house. Two windows. A porch.',
    hazel: "{pet}! There's a constellation shaped just like you. I've named it after you. Shh.",
    boothoven:
      '{pet}! What a lovely little rhythm your paws make. Pitter, patter, pitter. Allegretto.',
  },
  net: {
    cody: 'Out with the net, booby? Catch me something with wings. Not a bat. I am a bat, sometimes.',
    agatha: "Net in hand. Good. The moths have been bold this week. Show them who's boss.",
    maude:
      'Off critter catching, {name}? Be gentle with the moths. They read over my shoulder at night.',
    rufus: "Ooh, the net! Are we hunting?! I'm a great hunter! I've never caught anything! Yet!",
    wrapunzel: "Bring me one for the museum, dear, if it'll come. Ask it nicely first.",
    barty: "Net, eh? Mind you don't swish my sunflowers. The beetles live in those. Nice beetles.",
    ollie: 'Catching critters? Swap you a parcel for a firefly. Fair trade. I need a lamp.',
    nessa: "You're good with that net. I've watched. Not in a strange way. In a nice way.",
    gourdon: 'Nice net. Good handle on it. Want me to sand the grip? No charge.',
    hazel: "{name}, catch me a moth that's fluttered near a star. They glow afterwards. Probably.",
    boothoven:
      'A net! Mind you catch them gently, {name}. Moths have the softest little wingbeats.',
  },
  can: {
    cody: "Watering the garden, honey bunny? Look at you. Little gardener. I'll watch. Supervising.",
    agatha: 'A watering can. A witch respects a vessel. Be generous with the pumpkins.',
    maude: 'Watering? Lovely. Plants are like books. They like to be looked after, and read to.',
    rufus: "You've got the can! Water ME! I mean. No. Water the flowers. Water me a bit.",
    wrapunzel: "Out with the can, dear? Good. A thirsty garden's a sad garden. Same as a baker.",
    barty: "{name}, that's the spirit. Little and often. Water at the root. You've got it.",
    ollie: "Watering the beds? I'll carry it for you after my round. Can't carry anything now.",
    nessa: 'You water so gently. Like a little rain all of your own.',
    gourdon: 'Nice can. Rose on the spout. Somebody made that with care. You can tell.',
    hazel:
      "Look at you, {name}, sprinkling your garden like stardust. That's how I like to think of it.",
    boothoven:
      'Watering! {name}, listen to the drops. Plink, plonk, plink. Your garden is a xylophone.',
  },
  rod: {
    cody: "Off fishing, babe? Bring me back a story. The fish can stay. I'm a vampire. Fish are weird.",
    agatha: "Fishing. Patience and a good hat. You've both. The fish don't stand a chance.",
    maude: 'Fishing? Take a book. The fish like a story read aloud. Something with a twist.',
    rufus: "FISHING! Can I come?! I'll be quiet! I won't be quiet! I'll TRY to be quiet!",
    wrapunzel: "A fish for the oven, dear? Or the museum? Either way, I'm ready.",
    barty: "Fishing, eh? Good for the soul. I'd join you, but I sink. Bones, you see.",
    ollie: "Gone fishing? I'll put a sign on your door. 'Gone fishing.' Saves you a job.",
    nessa: "The lake's very quiet today. The fish are waiting for you. I asked them.",
    gourdon: "Off fishing? Mind the pier's end. I'm fixing that board. Next week. Promise.",
    hazel: 'Fishing! At night the fish come up to look at the stars. Cast for those ones.',
    boothoven:
      "Fishing, {name}? The reel clicks in perfect time. I've always said fishing is very musical.",
  },
  seed: {
    cody: "Planting something, mi amor? Plant me a garlic. No. Don't. I'm kidding. Don't.",
    agatha: 'A seed. Everything starts as something small. Spells, pumpkins, friendships.',
    maude: 'Seeds in hand! I love a beginning. All the pages still to come.',
    rufus:
      "Seeds!!! Are they flowers?! Will they be flowers?! I'll give them a sniff when they're up!",
    wrapunzel: "Planting today, dear? Grow me something I can bake. Anything. I'll find a way.",
    barty: 'Planting, {name}? Good. Pop them in, tuck them up, and leave the rest to the soil.',
    ollie: 'Seeds! I deliver those. In packets. They rattle. Best sound on the round.',
    nessa: 'What are you planting, {name}? I hope it grows something soft. Soft things are nice.',
    gourdon: "Planting? Good. A bed's like a bench. Get the first bit right and it'll last.",
    hazel: "Plant it under a good moon and it'll grow twice as glad. I'll check the moon for you.",
    boothoven:
      "{name}, plant it with a hum. Seeds grow better to music. I've no proof. I've a feeling.",
  },
  morning: {
    cody: "Kids get to school alright, babe? I'd have done the run, but the sun's out. Sorry.",
    agatha:
      "{name}, back from the school run? Sit down a moment before work. That is a witch's order.",
    maude:
      "Did the little ones get off to school? Good. Now it's your quiet time. Have a cup of something.",
    rufus:
      "Did the kids get to school?! Did they have their lunch?! I'd have eaten their lunch! That's why I don't do the run!",
    wrapunzel:
      'Morning, my darling. School run done? Then put your feet up. Work can wait one cup of tea.',
    barty:
      'Kids dropped off, {name}? Good. A quiet hour before work is like a good bed: it grows things.',
    ollie: "Saw you on the school run! Waved. You didn't see. That's alright. I wave at everyone.",
    nessa: "Did the school run go alright? I like mornings after. Everything's quiet. Like me.",
    gourdon: 'School run done? Good. Have a sit. I built that bench by the willow for just this.',
    hazel:
      'Back from school? I hope the little ones learned something lovely. Ask them tonight what it was.',
    boothoven:
      '{name}, back from the school run? I hope they sang on the way. Everyone should sing on the way.',
  },
  afternoon: {
    cody: "Quiet afternoon, booby. You've earned it. Feet up, and I'll pretend to do the dishes.",
    agatha: 'A quiet hour, {name}. The best kind. Nothing needs doing. I checked. I always check.',
    maude:
      'The quiet hour! My favourite. The library is all whispers, and the whispers are all mine.',
    rufus: "It's the quiet hour! I'm being quiet! Can you tell?! I'm being SO quiet!",
    wrapunzel:
      "It's a quiet hour, dear. The shop's empty, the kettle's on. Come and do nothing with me.",
    barty: 'Quiet hour, {name}. Even the weeds have a sit down about now. Join them.',
    ollie: "Afternoon lull! Everyone's having a quiet hour. I'm having mine walking. Still counts.",
    nessa: 'This is my favourite bit of the day. The quiet bit. You can stay in it with me.',
    gourdon: 'Quiet hour. Good time to oil a hinge and listen to nothing. Try it.',
    hazel: "It's a quiet hour. Rest your eyes. The stars are resting too, just out of sight.",
    boothoven:
      'The quiet hour. {name}, a rest in music is a note too. A very important one. Have yours.',
  },
  evening: {
    cody: 'Family time, honey bunny. Best part of the day. The kids, the pets, you and me. Perfect.',
    agatha:
      "{name}, off home to the family soon? Good. That's the real magic. The rest is just sparkles.",
    maude: "Evening with the family? How lovely. Read them something. I'd recommend chapter one.",
    rufus:
      "Is it family time?! I love family time! I'm everyone's family! Can I come?! I can't come. Okay!",
    wrapunzel:
      'Off home to the family, my darling? Take a few scones for the little ones. I insist.',
    barty: "Evening, {name}. Home to the family, eh? That's the best crop there is. Every time.",
    ollie: 'Evening! I always save my last letter for a house with the lights on and everyone in.',
    nessa: 'I can see your windows lit from the lake in the evenings. It looks so warm in there.',
    gourdon: 'Evening. Home to the family. Nothing I ever built beats a full table.',
    hazel:
      '{name}, evening with your family? Show the little ones the first star. Make a wish together.',
    boothoven:
      "{name}, off home to the family? Supper and chatter and laughter. That's a symphony, that is.",
  },
};
