import type { HappeningId, VillagerId } from '../types/ids';
import { BEST_TALK, type BestTopic } from './bestFriends';
import { MEMORY_TALK, type MemoryTopic } from './memoryTalk';
import { MYSTERY_TALK, type MysteryTopic } from './mysteryTalk';
import { ANSWER_TALK } from './questions';

/**
 * What a neighbour can bring up besides their own lines (0.2's D2): the weather, her day (the
 * school run in the morning, a quiet hour in the afternoon, family in the evening:
 * personal_touches.md, "Her day (7)"), what she's holding, what she caught today, a happening of
 * theirs later on, and the pet out walking with her. Rainy days are good days here ("Weather (1)").
 * And what they remember of her (V1's P1, `memoryTalk.ts`): what she wears, grows, gives and
 * puts out, how long it's been, and how close they've grown.
 *
 * `{catch}` is what she caught, with its "a" ("a candle moth"); `{pet}` the pet's name as she
 * has it; `{happening}` and `{place}` what's on and where (`HAPPENING_CALLED`, and the row's
 * `place`). `{name}` is her name, as everywhere. Each topic is three lines a neighbour (V1's P1),
 * one a day in turn, so a topic doesn't come out the same two days running.
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
  | 'evening'
  | MemoryTopic
  | VoiceTopic
  | MysteryTopic;

/**
 * Her voice's topics (V1's P2): a best friend missing her and asking her along, and what she
 * answered when they asked her something.
 */
export type VoiceTopic = BestTopic | 'answer';

/**
 * Which comes first when more than one fits: a band just reached and a long time away (which
 * lead a day's first talk), the sky, then what's on, what she has done and wears, and what she's
 * doing, and her time here and her day last.
 */
export const TOPICS: readonly Topic[] = [
  'band',
  'missed',
  'away',
  'storm',
  'rain',
  'fog',
  'invite',
  'happening',
  'gift',
  'caught',
  'harvest',
  'donated',
  'placed',
  'mystery',
  'pet',
  'costume',
  'outfit',
  'bracelet',
  'net',
  'can',
  'rod',
  'seed',
  'answer',
  'here',
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
  anniversaryDuet: 'the duet at the castle',
};

/** The topics of 0.2's D2: the sky, what's on, what she's holding, and her day. */
const AROUND_HER: Record<
  Exclude<Topic, MemoryTopic | VoiceTopic | MysteryTopic>,
  Record<VillagerId, readonly string[]>
> = {
  rain: {
    cody: [
      "Listen to that rain, honey bunny. Best weather there is. Let's stay in and let it drum.",
      "Rain day, babe. I've got the blanket, you've got the cocoa. Well. You've got to make the cocoa.",
      "The rain's got the whole town to itself, mi amor. Let's let it. We'll watch from the window.",
    ],
    agatha: [
      "Rain, {name}. Good for the garden, the cauldron and the soul. I've put a bucket out for spells.",
      "{name}, a good soaking for the herbs. I'd bottle this rain if I had the bottles. I'm working on the bottles.",
      "Rain on the cottage roof is the cauldron's favourite song. It bubbles along. Off-key, mind.",
    ],
    maude: [
      "A rainy day! The best kind for reading. And for haunting, frankly. Everything's cosier.",
      "{name}, rain against the library windows! I've opened every book to a stormy chapter, to keep it company.",
      "I can't get wet, more's the pity, because the rain looks lovely to stand in. Do it for me?",
    ],
    rufus: [
      "RAIN!!! I love rain! The flowers love rain! I've been standing in it! I smell AMAZING! (I don't.)",
      'I shook myself dry and now the WHOLE bakery is wet! Wrapunzel laughed! I think she laughed!',
      "PUDDLES, {name}!!! There are SO many puddles!!! I've jumped in eleven! Twelve! Hang on!",
    ],
    wrapunzel: [
      "Rainy day, my darling. That's soup weather. I've a pot on, and the windows are all steamy.",
      'My wraps go all soft in the rain, dear. Like a good scone. Come in and dry off by the oven.',
      'Rainy days bring folk in for a bun and a chat. Best days for the shop, my darling. And the soul.',
    ],
    barty: [
      "Rain! Lovely! The beds are drinking it up, and I don't have to lift a can. Best day of the week.",
      "Every drop's a drink I didn't have to carry. {name}, bones love a day off.",
      'Mud on my toes, rain in my ribs. Lovely. I rattle like a wind chime in a downpour, I do.',
    ],
    ollie: [
      "Rain on the round! Letters in plastic bags, me in a puddle. Wouldn't swap it. Smells like a fresh start.",
      "Rain or shine, the post goes out! Today it's rain. The post is very damp and very cheerful.",
      "I've a raincoat for the letters and none for me. The letters come first. They're the important ones.",
    ],
    nessa: [
      "Rain on the lake makes little rings everywhere, {name}. Thousands. I try to count them. I'm happy.",
      '{name}, the rain makes the lake taller. Only a little. I like being a little taller.',
      "When it rains, everyone hides indoors, and I get the whole shore. I don't mind sharing it with you.",
    ],
    gourdon: [
      'Hear the rain on the tin roof? Finest sound there is, {name}. Puts a good finish on a day, rain does.',
      "{name}, rain shows you where the roof leaks. Then you fix it. That's a good day's work, that is.",
      "Good rain. Wood smells best wet. Sawdust doesn't, mind. Sawdust's a soup.",
    ],
    hazel: [
      "No stars tonight, I'd say. That's alright. The rain's a whole sky of its own, falling down to say hello.",
      "{name}, the clouds are tucking the stars in tonight. A rainy night is the sky's night off.",
      "Every raindrop's a tiny lens, did you know? Look close, and there's a little sky in each.",
    ],
    boothoven: [
      'Listen, {name}! Rain on the roof. The best drummer in town. It never once drops the beat.',
      "Rain on the windows, rain on the roof, rain in the gutter. {name}, it's a whole string section!",
      "I've written a little rondo for drizzle. It keeps coming back round. Like the drizzle.",
    ],
    scarah: [
      "Rain, {name}! The fields are having a good long drink. I go a bit soggy, but it's worth every drop.",
      "{name}, the beetles are sheltering under my hat brim. Fourteen of them. I've named them all. It's a lot of names.",
      "Rain on the pumpkins sounds like a drum. Cornelius dances to it. He'll deny it.",
    ],
  },
  storm: {
    cody: [
      'A real storm, mi amor! Thunder and everything. You love this. I love that you love this.',
      "Thunder, honey bunny! Come here. I'm not scared. You're scared. Hold my hand anyway.",
      'Big storm, booby. Perfect night for a scary film and both of us under one blanket.',
    ],
    agatha: [
      "Thunder, {name}! Proper thunder. I didn't do it. I wish I'd done it. Isn't it marvellous?",
      "{name}, a storm like this is good for a spell. Not that I'm casting one. Not that I'm not.",
      'The lightning lit up the whole cottage. The cat saw something on the stairs. It was me. Hello.',
    ],
    maude: [
      'Did you hear that thunder? I dropped a whole shelf. Then I picked it up and grinned. What a day!',
      "{name}, the thunder rattled the shelves! The dictionaries are fine. The poetry's having a lie down.",
      "A storm's a wonderful thing to read through. Every crack of thunder is a plot twist.",
    ],
    rufus: [
      "THUNDER! Did you hear it?! I howled back! It howled back louder! I think we're friends now!",
      "I'm hiding under a table! A very brave hiding! The bravest hiding there's ever been!",
      "{name}! The lightning made my fur stand up! Now I'm twice as big! Am I scary?! I'm not scary!",
    ],
    wrapunzel: [
      "A storm, dear! The lights flicker and the bread rises faster. I've never known why. I don't ask.",
      'Storms remind me of the old days, dear. Sandstorms, mostly. This is much wetter. Much nicer.',
      "Come in out of the thunder, my darling. Kettle's on. The scones are rising like they're nervous.",
    ],
    barty: [
      'Hear that thunder, {name}? Rattles my bones. Lovely and loud. The beds are having a feast.',
      '{name}, thunder shakes the dew off the hostas. They love it. I love it. My bones love it most.',
      'Lightning lit me up like a lantern just now. Saw all my ribs at once. Still got them all.',
    ],
    ollie: [
      "Lightning over the square! I counted to five for the thunder. Five's far enough to keep walking.",
      "Storm post! The envelopes want to fly. I've told them no. They're very excitable in weather.",
      "{name}, I'm sheltering under the post office porch. Officially it's a tea break. Unofficially, thunder.",
    ],
    nessa: [
      "The lake goes all wild in a storm. Big grey waves. I'm not shy of them. They're shyer than me.",
      'When the thunder rolls over the lake, it echoes twice. Once for me and once for you.',
      "{name}, the storm stirs the whole lake up. Tomorrow it'll be glassy and calm. It always settles.",
    ],
    gourdon: [
      "Storm's in, {name}. I've battened everything I built. Built it all to stand this. Still checking.",
      "{name}, thunder's just the sky moving furniture. Heavy furniture. Badly.",
      "A storm's a test for anything built. Everything I built is passing. Pleased about that.",
    ],
    hazel: [
      'Lightning, {name}! Stars in a hurry, I always say. Every flash is a little wish. Make one.',
      "Every flash, I see the clouds lit up from inside. Like lanterns. The sky's having a party.",
      '{name}, the storm will pass, and the stars will come out scrubbed clean. Brightest night after a storm.',
    ],
    boothoven: [
      "Thunder, {name}! The timpani of the sky. I've been waiting all year for a good crash.",
      'Crash! Boom! Crescendo! {name}, this storm has no sense of restraint at all. I adore it.',
      "I'm conducting the thunder from my window. It doesn't follow my baton. Very modern.",
    ],
    scarah: [
      "{name}, a storm! Cornelius and I count the thunder from the barn. He only gets to one. It's always the same word.",
      "{name}, Cornelius is under my hat. He's very brave in a storm. From under my hat.",
      "The barn creaks and groans in a storm. It's just talking. It's a very old barn with a lot to say.",
    ],
  },
  fog: {
    cody: [
      "Foggy one, babe. Very spooky. Very us. Hold my hand so I don't walk into the well again.",
      "Fog's in, mi amor. I'm a mysterious vampire in the mist. Very dramatic. I tripped on a pumpkin.",
      "Can't see a thing, booby. Good thing I'd know you anywhere. By the giggle.",
    ],
    agatha: [
      'Fog. The town wears it like a shawl. {name}, mind the gravestones. They move about in this.',
      "{name}, fog is a good disguise for a witch. And for anyone with a hat they're not sure about.",
      "I've bottled a little of this fog. For mornings when I need to feel mysterious.",
    ],
    maude: [
      "Ooh, fog. I can't see my own feet. I haven't got feet. It's the principle of the thing.",
      'In the fog, everyone looks a bit like a ghost. I feel very fashionable.',
      "{name}, if you see a shape in the fog waving at you, it's me. Probably. Wave back to be safe.",
    ],
    rufus: [
      "I can't see ANYTHING! I've walked into four trees! I said sorry to all of them!",
      "I'm following my nose in the fog! My nose says there's a sausage! My nose is often wrong!",
      "{name}, is that you?! It IS you! I knew it! I didn't know it! Hello!",
    ],
    wrapunzel: [
      'Foggy morning, dear. It gets in my wraps and makes them curl. I look very dramatic.',
      "Fog rolls up to the shop window like it wants a bun, dear. I'd give it one if it had hands.",
      'A foggy day is a good day for something warm in a mug and a long chat, my darling.',
    ],
    barty: [
      "Fog's rolled in. Can't see the far bed. Could be anything over there. Probably cabbages.",
      "In the fog, the scarecrows look like they're walking about. Mind, one of them is. That's Scarah.",
      "{name}, can't see my own toes this morning. They're down there somewhere. I counted them yesterday.",
    ],
    ollie: [
      "Fog on the round! I'm delivering by memory. If you get a letter for Barty, he'll get yours.",
      "I've delivered three letters to a lamppost this morning. The lamppost was very gracious about it.",
      "Fog's so thick I'm ringing my bell at every step! Ding! That's me! Ding! Still me!",
    ],
    nessa: [
      '{name}, I like the fog. Everyone is a little bit hidden. Even me. Especially me.',
      "{name}, the lake goes soft in the fog. You can't tell where the water stops. I like that.",
      "In the fog I'm nearly invisible. It's restful. You found me anyway. That's nice.",
    ],
    gourdon: [
      "Fog's thick as varnish. Can't see the far end of a plank. I'll measure by feel today.",
      'In fog, measure twice. Then once more. Then go have a tea and wait for it to clear.',
      "My candle doesn't cut through fog much, {name}. Just a glow. Enough to find the door by.",
    ],
    hazel: [
      "The fog's hiding the sky, but it's all still up there. I checked last night. Twinkling away.",
      "The fog's a cloud that came down to visit, {name}. Say hello to it. It came a long way.",
      "Somewhere above the fog, the morning star's still shining. Trust me. I can feel it twinkle.",
    ],
    boothoven: [
      'Fog muffles everything, {name}. The whole town goes pianissimo. I rather like it.',
      '{name}, fog is the sound of a held breath. One long, soft note, waiting for the sun.',
      'I can hear the town better in the fog. Every footstep. Yours sound like a little waltz.',
    ],
    scarah: [
      "Fog's in, {name}. The whole farm's gone soft round the edges. I thought I saw a scarecrow in it. Oh. That was me.",
      "{name}, in the fog the crows can't tell I'm a scarecrow. They come and sit on me. It's lovely.",
      "The fog's caught on the corn like wool on a fence. I could knit something out of this morning.",
    ],
  },
  happening: {
    cody: [
      "Will I see you at {happening} later, booby? It's {place}. I saved you the comfy spot.",
      "There's {happening} later, babe, {place}. I'll be the handsome one waving.",
      "Don't forget {happening} later, mi amor. It's {place}. I'll bring snacks. Mostly for me.",
    ],
    agatha: [
      "There's {happening} later, {place}. You're coming. I've already told the cauldron.",
      "{name}, don't be late for {happening}. It's {place}. Late is a curse I can't lift.",
      "There's {happening} on later, {place}. Bring your best hat. I'll know if you don't.",
    ],
    maude: [
      "Will you come to {happening} later, {name}? It's {place}. I've been looking forward to it all day!",
      "There's {happening} later, {place}! I'll float over early. I always float over early.",
      "{name}, I'm so looking forward to {happening}. It's {place}. Do come! It's better with you.",
    ],
    rufus: [
      "Are you coming to {happening} later?! It's {place}!!! You HAVE to come! I'll be there first!",
      "It's {happening} later, {place}!!! I've been ready since breakfast!!!",
      "{name}, come to {happening}! It's {place}! I'll save you a spot! I'll sit on it so nobody takes it!",
    ],
    wrapunzel: [
      "Come to {happening} later, my darling. It's {place}. I'll bring something warm.",
      "There's {happening} later, dear, {place}. I've baked a little something for it.",
      "Will you be at {happening}, my darling? It's {place}. I'd love to see your face there.",
    ],
    barty: [
      "There's {happening} on later, {place}. Bring yourself, {name}. That's all we need.",
      "Coming to {happening} later? It's {place}. I'll be there with bells on. Well. Bones on.",
      "{name}, there's {happening} later, {place}. Bring a smile, the rest sorts itself.",
    ],
    ollie: [
      "{name}! Got your invitation right here: {happening} later, {place}. That's it. That's the invitation.",
      "Don't miss {happening} later, {place}! I'll be there straight off my round.",
      'A reminder from your postie: {happening}, later, {place}. Delivered by hand, free of charge.',
    ],
    nessa: [
      "Are you going to {happening} later? It's {place}. I'll go if you go. I might go anyway.",
      "There's {happening} later, {place}. I'll stand near the back. Come and stand near the back with me?",
      "{name}, will you be at {happening}? It's {place}. I'd be braver there with you.",
    ],
    gourdon: [
      "Later on there's {happening}, {place}. Come along, {name}. Good company, good chairs.",
      "There's {happening} later, {place}. I fixed the wobbly chair. Sit on that one.",
      "Coming to {happening} later? It's {place}. Not much for crowds, me. Good for company, though.",
    ],
    hazel: [
      "Will I see you at {happening} later? It's {place}. The stars say yes. So do I.",
      "There's {happening} later, {place}. I've a feeling it'll be a good one. My feelings are mostly right.",
      "Come to {happening} later, {name}. It's {place}. I'll show you whichever star's up by then.",
    ],
    boothoven: [
      "Will I hear you at {happening} later? It's {place}. I'll bring a tune to hum.",
      "There's {happening} later, {place}! Every gathering needs a little music. I'll bring a hum.",
      "{name}, will you be at {happening}? It's {place}. I'll hum you a little overture as you arrive.",
    ],
    scarah: [
      "Will you come to {happening} later? It's {place}. I'll save you a spot by me and Cornelius.",
      "There's {happening} later, {place}. Cornelius is coming. He's practised his one word.",
      "{name}, are you coming to {happening}? It's {place}. I'll bring a basket of something from the fields.",
    ],
  },
  caught: {
    cody: [
      'I saw you catch {catch} today, mi amor! Look at you go. My wife, the hunter.',
      "My wife caught {catch} today! Babe, you're amazing. I'd have screamed and run.",
      "You got {catch}, honey bunny? I'm telling everyone. Even the people who don't ask.",
    ],
    agatha: [
      "You caught {catch} today, {name}. I could tell. You've got that look about you.",
      "So you caught {catch} today. Fine work, {name}. I'd have needed a spell. You needed a net.",
      "Caught {catch}, did you? {name}, the critters must trust you. They don't trust me. Fair enough.",
    ],
    maude: [
      "Word is you caught {catch} today! I'll look it up. There's always a book about it.",
      "You caught {catch}! I've a whole chapter on those somewhere. I'll find it. Eventually.",
      'Caught {catch} today, {name}? Write it down. Everything worth catching is worth writing down.',
    ],
    rufus: [
      "You caught {catch}!!! TODAY!!! Can I see it?! Can I sniff it?! I won't sniff it.",
      '{name}!!! You caught {catch}!!! I chased one once! It won! You won!',
      "I heard you caught {catch}!!! I'm so proud I could howl! I'm going to howl! AWOO!",
    ],
    wrapunzel: [
      "Did you catch {catch} today, dear? The museum would love a look, when you're ready.",
      'You caught {catch} today, dear? Clever you. The museum always has a little room.',
      "Caught {catch}, my darling? I'll put the kettle on to celebrate. I celebrate most things.",
    ],
    barty: [
      'I heard you caught {catch} today, {name}. Good eye. Good net. Good day all round.',
      "Caught {catch}, eh? Good steady hands. I'd drop it. My fingers have gaps.",
      "{name}, I hear you caught {catch} today. Clever. My net's just for show. It's a scarf now.",
    ],
    ollie: [
      "News on the round: you caught {catch} today! Everyone's talking about it. Well, me.",
      "Caught {catch}! I'll mention it on the round. Everyone will be thrilled. I'll see to it.",
      "{name}! Heard you caught {catch}! Front page news! There isn't a paper. There should be.",
    ],
    nessa: [
      "You caught {catch} today? That's lovely, {name}. I hope it was a gentle catch.",
      "You caught {catch}? I watched one for a whole evening once. It didn't know I was there.",
      "{name}, you caught {catch} today. You're very gentle with them. I can tell.",
    ],
    gourdon: [
      "You caught {catch} today, I hear. Steady hands. You'd make a fine joiner.",
      "Caught {catch}, did you? Good work. Patient hands. That's the whole trick, in catching and joinery.",
      'Heard you caught {catch}. {name}, quick on your feet. Quicker than a plane on pine.',
    ],
    hazel: [
      'Ooh, you caught {catch} today! The stars must have been on your side. They often are.',
      "{name}, you caught {catch}! I'll look for its shape in the stars tonight. There's one for everything.",
      'Caught {catch} today? Lucky stars! Yours are very bright this week.',
    ],
    boothoven: [
      '{name}, you caught {catch}! Did it make a sound? Everything makes a sound. Bravo, regardless.',
      'You caught {catch}! {name}, that deserves a fanfare. Ta-da-daaa! There. A small fanfare.',
      "Caught {catch} today? Every critter has its own little tune, {name}. That one's a jig.",
    ],
    scarah: [
      'You caught {catch} today? Was it a beetle? Oh, {name}, please say it was a beetle. I do love a beetle.',
      'You caught {catch}! I hope it said thank you for the ride. Critters forget their manners.',
      'Caught {catch} today, {name}? Cornelius says "Pumpkin." That\'s crow for "well done." Mostly.',
    ],
  },
  pet: {
    cody: [
      "Hey, {pet}! Who's a good little monster? You are. Don't tell the others I said that.",
      'Hi, {pet}! Are you looking after my wife? Good. Babe, {pet} is my favourite. After you.',
      '{pet}! Come here, you little gremlin. Mi amor, did you dress {pet} today? Very stylish.',
    ],
    agatha: [
      '{pet} is looking well, {name}. Very well. Better than most people I know. Most of them, frankly.',
      "{pet} has excellent taste in company. That's you, {name}. And me, briefly.",
      "Good day, {pet}. My cat sends her regards. She doesn't. But she would, if she bothered.",
    ],
    maude: [
      "Oh, you've brought {pet}! Hello, {pet}. You're welcome in the library. Paws off the poetry.",
      "Hello again, {pet}! I'd give you a pat, but I'd go straight through. It's the thought.",
      "{pet} looks very well read today. I can always tell. It's the eyes.",
    ],
    rufus: [
      "{pet}!!! HELLO {pet}!!! Can we play?! I'm basically a dog! Don't tell anyone! Everyone knows!",
      '{pet}! {pet}! {pet}! Hi! Hi! Hi! Did you miss me?! I missed you! I always miss you!',
      "Can {pet} and me race?! To the well and back?! I'll lose on purpose! I won't lose on purpose!",
    ],
    wrapunzel: [
      "Hello, {pet}, sweetheart! I've a little biscuit somewhere in these wraps for you.",
      "There's {pet}, the sweetheart. I'd wrap you up and keep you, {pet}, if you'd let me.",
      "Out with {pet}, dear? Bring them round to the shop. There's always a crumb going.",
    ],
    barty: [
      'Out for a walk with {pet}, eh? Good on you. Mind the beds, {pet}. Mind the beds.',
      "{pet}! Good to see you. Don't dig up my bulbs, there's a dear. Dig up Gourdon's.",
      "{name}, {pet} keeps you good company. Best kind. Doesn't talk back. Unlike my hostas.",
    ],
    ollie: [
      "Hello, {pet}! No post for you today. There's never post for pets. I think that's a shame.",
      "{pet}! You'd make a fine postie. Quick feet, good nose, never loses a letter. Probably.",
      "Out for a walk with {pet}? Lovely day for it. Every day's a lovely day for it, if you ask {pet}.",
    ],
    nessa: [
      'Hello, {pet}. You can stand by me. I like a quiet friend. You both are.',
      "{pet} doesn't mind that I'm shy. Pets never mind. That's why I like them.",
      'Hello, {pet}. You can come to the lake any time. The fish say so too.',
    ],
    gourdon: [
      '{pet}! Good to see you. I could build you a little house. Two windows. A porch.',
      "{pet}! Steady little paws. Good on a ladder, I'd bet. Not that I'd let you.",
      'Fine pet, that {pet}. Well made. Good proportions. I notice proportions.',
    ],
    hazel: [
      "{pet}! There's a constellation shaped just like you. I've named it after you. Shh.",
      '{pet} has stars in their eyes, {name}. Look. Right there. Two little ones.',
      "Hello, {pet}! Animals can see the moon better than us, you know. You'll have to tell me about it.",
    ],
    boothoven: [
      '{pet}! What a lovely little rhythm your paws make. Pitter, patter, pitter. Allegretto.',
      "{pet}! You've a fine sense of rhythm. I saw your tail keeping time.",
      'Ah, {pet}. A small, perfect metronome. Tick, tock, wag, wag.',
    ],
    scarah: [
      'Hello, {pet}! Cornelius says "Pumpkin." That\'s crow for "what a good friend you are." He doesn\'t say it to everyone.',
      "{pet}! Mind the crows, they're cheeky. Not Cornelius. Cornelius is a gentleman.",
      "Hello, {pet}! Come and sniff the pumpkins. They don't mind. They're pumpkins.",
    ],
  },
  net: {
    cody: [
      'Out with the net, booby? Catch me something with wings. Not a bat. I am a bat, sometimes.',
      "Babe, if you catch a moth, don't bring it near me. They go for my cape. Every time.",
      'Look at you with the net, mi amor. Like an explorer. A cute one. My explorer.',
    ],
    agatha: [
      "Net in hand. Good. The moths have been bold this week. Show them who's boss.",
      "{name}, mind the bats with that net. They're friends of mine. Mostly.",
      "A net. A witch's broom of the critter world. Sweep gently.",
    ],
    maude: [
      'Off critter catching, {name}? Be gentle with the moths. They read over my shoulder at night.',
      "Catching critters? Leave the library's book-lice be, please. They're readers.",
      '{name}, I once tried to catch a firefly. It went right through me. We laughed about it.',
    ],
    rufus: [
      "Ooh, the net! Are we hunting?! I'm a great hunter! I've never caught anything! Yet!",
      "Can I be the net?! I'll be a great net! I'll just run at things! Okay, you be the net!",
      "Go get 'em, {name}!!! Swish swish swish!!! I'll cheer! That's my job! I'm the cheerer!",
    ],
    wrapunzel: [
      "Bring me one for the museum, dear, if it'll come. Ask it nicely first.",
      "Out with the net, dear? Mind the bakery's moths. They're regulars.",
      "Catch something lovely, my darling. Something with spots. I've a soft spot for spots.",
    ],
    barty: [
      "Net, eh? Mind you don't swish my sunflowers. The beetles live in those. Nice beetles.",
      'Out netting, {name}? The bees are busy, leave them be. Everything else, fair game.',
      'Mind the snapdragons with that thing. They snap back. Not really. Bit really.',
    ],
    ollie: [
      'Catching critters? Swap you a parcel for a firefly. Fair trade. I need a lamp.',
      "Got your net? I've seen a big beetle by the post office. Third step. Every morning.",
      "Net out! If you catch a letter blowing away, that one's mine. Happens more than you'd think.",
    ],
    nessa: [
      "You're good with that net. I've watched. Not in a strange way. In a nice way.",
      "{name}, the dragonflies by the lake are very quick. You're quicker. Gently, though.",
      "If you swing it slowly, they don't mind. I've watched you. You swing it slowly.",
    ],
    gourdon: [
      'Nice net. Good handle on it. Want me to sand the grip? No charge.',
      "Fine net. The hoop's true. Bent mine on a hedge once. Never again.",
      "Off after critters? Mind my sawhorses. There's a beetle lives under the left one. Fond of him.",
    ],
    hazel: [
      "{name}, catch me a moth that's fluttered near a star. They glow afterwards. Probably.",
      '{name}, hunting with a net under the stars? The moths come to the lamps. Wait by one.',
      'Fireflies are the stars that came down to play. Catch one and let it tell you about up there.',
    ],
    boothoven: [
      'A net! Mind you catch them gently, {name}. Moths have the softest little wingbeats.',
      'Swish! {name}, your net makes a lovely sound. A soft sforzando.',
      'Catching critters? {name}, the crickets are my orchestra. Leave me a few violins.',
    ],
    scarah: [
      "A net! {name}, be gentle with the beetles. They're my friends. They're everybody's friends, they just don't know it yet.",
      'Out with the net? The hay bales are full of crickets. They chirp all night. I love every one.',
      "{name}, swing it soft. Beetles startle easy. So do scarecrows. We're a jumpy lot.",
    ],
  },
  can: {
    cody: [
      "Watering the garden, honey bunny? Look at you. Little gardener. I'll watch. Supervising.",
      "Water the pumpkins for me, babe. I'd do it, but the sun. And the bending.",
      "Mi amor, you're very good with that can. I'll be over here. Admiring. It's a job.",
    ],
    agatha: [
      'A watering can. A witch respects a vessel. Be generous with the pumpkins.',
      '{name}, water the roots, not the leaves. Leaves are vain. Roots do the work.',
      "A good drink at the start of the day. For the garden. For me, it's tea with a dash of something.",
    ],
    maude: [
      'Watering? Lovely. Plants are like books. They like to be looked after, and read to.',
      'Do you talk to your plants while you water them? I read to mine. They like mysteries.',
      '{name}, every can of water is a little chapter for the garden. Keep turning the pages.',
    ],
    rufus: [
      "You've got the can! Water ME! I mean. No. Water the flowers. Water me a bit.",
      'Can I drink from the can?! No?! Okay! Can I drink from the puddle after?!',
      "Splash! Splash! The flowers are so happy! Look at them! They're wagging! Flowers wag!",
    ],
    wrapunzel: [
      "Out with the can, dear? Good. A thirsty garden's a sad garden. Same as a baker.",
      'Water them well, dear. Thirsty plants and thirsty bakers are both grumpy. I know.',
      "You've a kind hand with that can, my darling. Everything you water grows. Same with friends.",
    ],
    barty: [
      "{name}, that's the spirit. Little and often. Water at the root. You've got it.",
      "Not too much, now. Drowned roots are sad roots. You know that. You're a natural.",
      "{name}, morning's the time to water. Though any time you water is a good time to water.",
    ],
    ollie: [
      "Watering the beds? Good on you. I'd help, but my hands are full of letters. Always are.",
      "That can's got a good swing to it! Like a letterbox flap. I appreciate a good swing.",
      "Watering? I'll make sure nobody steps on the beds. Official postie duty. I've given myself it.",
    ],
    nessa: [
      'You water so gently. Like a little rain all of your own.',
      '{name}, water from the lake is the softest. Yours looks soft too. The plants think so.',
      "{name}, the garden looks happier already. You're good at making things happy.",
    ],
    gourdon: [
      'Nice can. Rose on the spout. Somebody made that with care. You can tell.',
      "Good can. Galvanised, by the look. That'll outlast us both, {name}.",
      'Keep the soil damp, not soggy. Same as wood glue. Same principle. Mostly.',
    ],
    hazel: [
      "Look at you, {name}, sprinkling your garden like stardust. That's how I like to think of it.",
      '{name}, water the moonflowers last. They like to drink just before the stars come up.',
      'Every drop goes down to the roots like a wish going up to the stars. Same distance, roughly.',
    ],
    boothoven: [
      'Watering! {name}, listen to the drops. Plink, plonk, plink. Your garden is a xylophone.',
      "{name}, the can's spout plays a little glissando. Did you hear? Do it again!",
      'Watering is a lullaby for the garden. Pour slowly, legato, and the plants sigh.',
    ],
    scarah: [
      'Watering, {name}? Good on you. A little and often, at the roots. The plants say thank you. I can hear them.',
      "{name}, that's a good can. Mine's got a hole. I mostly water myself. Grows nothing. Worth a try.",
      "Water's the best gift a field can get. After a bit of sun. And a scarecrow. I'm biased.",
    ],
  },
  rod: {
    cody: [
      "Off fishing, babe? Bring me back a story. The fish can stay. I'm a vampire. Fish are weird.",
      "Fishing, mi amor? Bring the snacks. I'll hold the bucket. I won't look in the bucket.",
      "Booby, if you catch a big one, name it after me. Count Fishula. I'll be so proud.",
    ],
    agatha: [
      "Fishing. Patience and a good hat. You've both. The fish don't stand a chance.",
      "Catch me something with a story to it. A fish that's seen things. Big eyes. Wise.",
      "{name}, cast where the water's still. The old fish think the still water's theirs.",
    ],
    maude: [
      'Fishing? Take a book. The fish like a story read aloud. Something with a twist.',
      '{name}, I once read a whole book about one fish. It was a very big fish. And a very long book.',
      "Fishing's like reading, isn't it? Lots of waiting, then a twist. I love a twist.",
    ],
    rufus: [
      "FISHING! Can I come?! I'll be quiet! I won't be quiet! I'll TRY to be quiet!",
      "Can I fetch the fish?! I'll swim! I'll be so fast! Okay I'll get very wet first!",
      "If you catch one, can I smell it?! Just once?! It's for science! Dog science!",
    ],
    wrapunzel: [
      "A fish for the oven, dear? Or the museum? Either way, I'm ready.",
      'Off to the water, dear? Bring me back a tale with your fish. I do love a fishing tale.',
      "Fish pie, fish cakes, fish in a little paper parcel. Whatever you catch, my darling, there's a dish for it.",
    ],
    barty: [
      "Fishing, eh? Good for the soul. I'd join you, but I sink. Bones, you see.",
      "Fishing? Relaxing, that. I've spent many an afternoon on the pier just thinking. And rattling.",
      "{name}, off with the rod? Mind the hook. I've caught my own tailbone more than once.",
    ],
    ollie: [
      "Gone fishing? You'll want a sign on your door. 'Gone fishing.' Everyone knows what it means.",
      "Fishing? Your post will keep in your mailbox till you're back. Letters can wait for fish.",
      "{name}, if you catch a message in a bottle, it's my job to deliver it. Fair warning.",
    ],
    nessa: [
      "The lake's very quiet today. The fish are waiting for you. I asked them.",
      "The big ones sleep under the pier in the afternoon. Shh. Don't tell them I told you.",
      "If you sit very still, the lake forgets you're there. That's when they bite. I'm always very still.",
    ],
    gourdon: [
      "Off fishing? Mind the pier's end. There's a board there wants fixing. It's on my list.",
      'Off fishing? Good rod, that. Straight grain. Someone took care over it.',
      "Patience is half of fishing, {name}. The other half's a good bit of line. And luck.",
    ],
    hazel: [
      'Fishing! At night the fish come up to look at the stars. Cast for those ones.',
      "{name}, the fish follow the moon. When it's full, they come up to the surface to have a look.",
      'Fishing under a clear sky? Make a wish on every cast. I always do. My catches are mostly wishes.',
    ],
    boothoven: [
      "Fishing, {name}? The reel clicks in perfect time. I've always said fishing is very musical.",
      'Fishing, {name}? A long rest between notes, then a flourish when one bites. Very dramatic.',
      'The splash of a cast is a lovely little note. Plop! A perfect staccato.',
    ],
    scarah: [
      "Fishing? There's a pumpkinseed in my pond who thinks he's a pike. Be kind to his feelings.",
      "Off fishing, {name}? The farm pond's got frogs who'll heckle. Ignore them. They do it to everyone.",
      'Bring back a story, if not a fish. Cornelius loves a fishing story. He says "Pumpkin" at the good bits.',
    ],
  },
  seed: {
    cody: [
      "Planting something, mi amor? Plant me a garlic. No. Don't. I'm kidding. Don't.",
      'Planting, babe? Put something in for me. Something red. Tomatoes. For my image.',
      "Look at my wife, planting things. Honey bunny, you're a tiny farmer and I'm so proud.",
    ],
    agatha: [
      'A seed. Everything starts as something small. Spells, pumpkins, friendships.',
      '{name}, plant it at the waxing moon. Everything comes up keener. Ask any witch.',
      'Seeds are spells that take their time. Patience, {name}. Same as a good curse. Not that I would.',
    ],
    maude: [
      'Seeds in hand! I love a beginning. All the pages still to come.',
      '{name}, every seed is a little story waiting to be told. Plant it, and turn the page tomorrow.',
      "Planting? I pressed a flower in a book once. Forty years ago. It's still there. Still lovely.",
    ],
    rufus: [
      "Seeds!!! Are they flowers?! Will they be flowers?! I'll give them a sniff when they're up!",
      "Can I dig the hole?! I'm an amazing digger! I'll dig SO many holes! Just one? Okay! The best one!",
      "Seeds! What if it's a sausage tree?! Is there a sausage tree?! Plant a sausage tree!",
    ],
    wrapunzel: [
      "Planting today, dear? Grow me something I can bake. Anything. I'll find a way.",
      "Planting, dear? Pop in some herbs, if you've room. A little basil goes a long way.",
      "What'll it be, my darling? Something sweet? Something savoury? I'm already planning the bun.",
    ],
    barty: [
      'Planting, {name}? Good. Pop them in, tuck them up, and leave the rest to the soil.',
      'Not too deep, now. Seeds like to be tucked in, not buried. Big difference.',
      "{name}, every seed's a promise. The garden always keeps it, if you keep yours. Water, sun, patience.",
    ],
    ollie: [
      'Seeds! I deliver those. In packets. They rattle. Best sound on the round.',
      "Seeds! Did those come from the shop? I deliver the shop's post. I feel involved.",
      "Planting something? I'll watch it come up on my round. Every morning. Very exciting post route.",
    ],
    nessa: [
      'What are you planting, {name}? I hope it grows something soft. Soft things are nice.',
      '{name}, plant some near the water if you can. Things grow softer there. Me included.',
      "Seeds are very shy, like me. They hide in the dark for days, then they're brave all at once.",
    ],
    gourdon: [
      "Planting? Good. A bed's like a bench. Get the first bit right and it'll last.",
      'Planting, eh? I came from a seed myself. Long story. Good soil.',
      "Even rows, {name}. Measure the gaps. A crooked row's a wobbly table. Doesn't sit right.",
    ],
    hazel: [
      "Plant it under a good moon and it'll grow twice as glad. Look up tonight. You'll see if it's a good one.",
      'Plant it facing the east, so it sees the morning star when it first pokes up.',
      "Each seed is a little star, waiting under the ground. Give it a night or two. It'll shine.",
    ],
    boothoven: [
      "{name}, plant it with a hum. Seeds grow better to music. I've no proof. I've a feeling.",
      "{name}, every seed is a note. Plant enough and your garden's a song. Mind the tempo.",
      'Planting? Do it in time with something cheerful. Three-four time. Seeds like a waltz.',
    ],
    scarah: [
      "Planting? Oh, {name}! Tuck them in snug, whisper something nice, and come back tomorrow. That's all there is to it.",
      "Seeds! Every one's a little miracle with its coat on. Pointy end up. Or down. They sort it out.",
      "{name}, I've every seed going at my cart. Not that I'm pushing. I'm a bit pushing.",
    ],
  },
  morning: {
    cody: [
      "Kids get to school alright, babe? I'd have done the run, but the sun's out. Sorry.",
      "Morning, mi amor. Coffee's on. Well, my coffee's on. Yours is a hug. Here.",
      "School run survived, honey bunny? You're a hero. I watched from the window. Supportive.",
    ],
    agatha: [
      "{name}, back from the school run? Sit down a moment before work. That is a witch's order.",
      "Morning, {name}. The school run's done and the day's still yours. Spend it wisely. Or at least happily.",
      "{name}, a school-run morning has a witch's energy. Chaos, then calm. I relate.",
    ],
    maude: [
      "Did the little ones get off to school? Good. Now it's your quiet time. Have a cup of something.",
      "Good morning! The library's quiet after the school run. Just me and the books and the dust.",
      '{name}, back from the school run? I hope they all had their shoes on. Even the left one.',
    ],
    rufus: [
      "Did the kids get to school?! Did they have their lunch?! I'd have eaten their lunch! That's why I don't do the run!",
      "MORNING!!! Did the school run go okay?! Did the kids pet any dogs?! I'm a dog! Sort of!",
      "{name}! It's morning! The whole day's ahead! I've already chased three leaves!",
    ],
    wrapunzel: [
      'Morning, my darling. School run done? Then put your feet up. Work can wait one cup of tea.',
      "Morning, dear. School run done? I've kept a warm bun back. You've earned it.",
      "First batch is out, my darling. Sit for a moment before work. The morning's a gentle thing.",
    ],
    barty: [
      'Kids dropped off, {name}? Good. A quiet hour before work is like a good bed: it grows things.',
      "Morning, {name}. School run's done, sun's up, dew's on. Best time in the garden.",
      'Back from the run? Have a breather. Even the worms take a breather after breakfast.',
    ],
    ollie: [
      "Saw you on the school run! Waved. You didn't see. That's alright. I wave at everyone.",
      'Morning post! And a morning wave! Did the school run go smoothly? Mine went bumpily.',
      'Morning, {name}! I passed the school on my round. Very noisy. Very happy. Good noise.',
    ],
    nessa: [
      "Did the school run go alright? I like mornings after. Everything's quiet. Like me.",
      "Morning, {name}. School run done? The lake's still asleep. Talk softly, if you like.",
      'The mornings after the school run are so quiet. I like quiet. You make it nicer.',
    ],
    gourdon: [
      'School run done? Good. Have a sit. I built that bench by the willow for just this.',
      'Morning. School run done? Put the kettle on, put your feet up. Ten minutes. Then work.',
      "Busy morning, {name}? Busy's good. Busy then quiet's better. Have the quiet now.",
    ],
    hazel: [
      'Back from school? I hope the little ones learned something lovely. Ask them tonight what it was.',
      "Morning! The stars went to bed after the school run too. They're very tired, the stars.",
      "{name}, back from the school run? I bet the little ones' faces were shining like the morning star.",
    ],
    boothoven: [
      '{name}, back from the school run? I hope they sang on the way. Everyone should sing on the way.',
      "Good morning, {name}! The school run is a march, then the morning's an adagio. Rest.",
      'The morning has such a bright little melody after the school run. Can you hear it? La-la-laaa.',
    ],
    scarah: [
      "{name}, back from the school run? I hope the little ones skipped the whole way. I would, if my knees weren't straw.",
      "Morning, {name}! The cockerel and me are both up. He's louder. I'm more cheerful.",
      "School run done? The fields are fresh and the dew's on everything. Even me. Especially me.",
    ],
  },
  afternoon: {
    cody: [
      "Quiet afternoon, booby. You've earned it. Feet up, and I'll pretend to do the dishes.",
      "Afternoon, babe. Want to do absolutely nothing together? I'm great at it.",
      "The quiet hour, mi amor. I'm going to nap in a dark corner. Come nap too.",
    ],
    agatha: [
      "{name}, it's a quiet hour. The best kind. Nothing needs doing. I checked. I always check.",
      "The afternoon is for tea and doing nothing, {name}. I'm doing nothing very seriously.",
      "A quiet afternoon. The cauldron's simmering, the cat's asleep. Neither needs me. Bliss.",
    ],
    maude: [
      'The quiet hour! My favourite. The library is all whispers, and the whispers are all mine.',
      '{name}, afternoon is for curling up with a book. Or a nap. Or a book about naps.',
      "The quiet hour! I'm rereading my favourite. I know how it ends. I still gasp.",
    ],
    rufus: [
      "It's the quiet hour! I'm being quiet! Can you tell?! I'm being SO quiet!",
      "I'm doing a nap! Right here! On the grass! Wake me if anything happens! Anything at all!",
      "{name}! It's afternoon! I've done my quiet bit! It was ages! It was four minutes!",
    ],
    wrapunzel: [
      "It's a quiet hour, dear. The shop's empty, the kettle's on. Come and do nothing with me.",
      "Afternoon, dear. The shop's sleepy and so am I. Sit with me and have a scone.",
      'This is the time for a cuppa and a sit, my darling. Busy can come back later.',
    ],
    barty: [
      'Quiet hour, {name}. Even the weeds have a sit down about now. Join them.',
      "Afternoon. Garden's dozing in the sun. Don't wake it, {name}. Sit with me instead.",
      "Quiet bit of the day, eh? The bees are dozy. The beds are dozy. I'm very dozy.",
    ],
    ollie: [
      "Afternoon lull! Everyone's having a quiet hour. I'm having mine walking. Still counts.",
      "Afternoon round's the slowest. Everybody's having a sit. I wave through windows.",
      "{name}! The quiet hour! I'm whispering my deliveries. 'Letter.' 'Letter.' 'Parcel.'",
    ],
    nessa: [
      'This is my favourite bit of the day. The quiet bit. You can stay in it with me.',
      "The water's warm in the afternoon. I float and look at the clouds. You can look too.",
      "Quiet, isn't it? I could sit here all afternoon. With you here it's even nicer.",
    ],
    gourdon: [
      'Quiet hour. Good time to oil a hinge and listen to nothing. Try it.',
      'Afternoon. Too warm to saw. Good time to plan what to saw tomorrow.',
      "Quiet hour, {name}. I sit on a bench I made and think about benches. It's peaceful.",
    ],
    hazel: [
      "It's a quiet hour. Rest your eyes. The stars are resting too, just out of sight.",
      "{name}, the stars are sleeping. I'm reading about them while they do.",
      "Afternoon's the stars' bedtime. Tiptoe. You never know what they can hear.",
    ],
    boothoven: [
      'The quiet hour. {name}, a rest in music is a note too. A very important one. Have yours.',
      '{name}, the afternoon is a gentle andante. Slow, warm, walking pace. Lovely.',
      "Shh, it's the quiet hour. I'm practising rests. I'm very good at them now.",
    ],
    scarah: [
      "{name}, it's the quiet hour. Even the bees sit down about now. Come and lean on the fence with me a while.",
      "{name}, afternoon on the farm. The hens are dozing, the pigs are dozing. I'm on guard. Dozing.",
      "The quiet hour's when the corn grows loudest. Listen. Hear that? Neither do I, but it's happening.",
    ],
  },
  evening: {
    cody: [
      'Family time, honey bunny. Best part of the day. The kids, the pets, you and me. Perfect.',
      'Home soon, babe? Family dinner, then the couch, then me hogging the blanket. Perfect night.',
      "Mi amor, it's evening. Best time. Everyone's fed, the sun's down, and I can go outside.",
    ],
    agatha: [
      "{name}, off home to the family soon? Good. That's the real magic. The rest is just sparkles.",
      "Evening, {name}. The cauldron's off. Even witches have a family dinner.",
      "Go home and put your feet up with the family. That's a spell that never fails.",
    ],
    maude: [
      "Evening with the family? How lovely. Read them something. I'd recommend chapter one.",
      "{name}, evenings with the family are the best chapters. Don't skip any.",
      'Off home for supper? Tell the little ones a ghost says goodnight. A friendly one.',
    ],
    rufus: [
      "Is it family time?! I love family time! I'm everyone's family! Can I come?! I can't come. Okay!",
      "It's nearly night!!! The moon's coming!!! I've got to go practise my howl!!! Bye!!! Not bye!!!",
      'Family time, {name}! Give everyone a big hug from me! A really big one! A Rufus one!',
    ],
    wrapunzel: [
      'Off home to the family, my darling? Take a few scones for the little ones. I insist.',
      "Home to the family, dear? Little ones grow so fast. Every supper's a treasure.",
      "Evening, my darling. Off you go and be with your family. That's the best kind of warm.",
    ],
    barty: [
      "Evening, {name}. Home to the family, eh? That's the best crop there is. Every time.",
      "Evening. The garden's going to bed. You should too, soon. After family time.",
      'Off home, {name}? Good. Best thing a body can do of an evening. Even a body of bones.',
    ],
    ollie: [
      'Evening! I always save my last letter for a house with the lights on and everyone in.',
      "Last round of the day! I'll pass your place and see the lights on. Always makes me smile.",
      "Evening, {name}! Post's done. Time for supper with the people you love. That's the best delivery.",
    ],
    nessa: [
      'I can see your windows lit from the lake in the evenings. It looks so warm in there.',
      'Off home for family time? The lanterns will be bobbing for you, {name}. One bobs the most.',
      "Evenings, I look at all the lit windows in town. Yours is my favourite. It's the warmest.",
    ],
    gourdon: [
      'Evening. Home to the family. Nothing I ever built beats a full table.',
      "Off home? Give the family my best. Gourdon's best. That's a nod and a candle-flicker.",
      'Evening. Tools down, chair pulled up to the table. Best part of building a house is the table.',
    ],
    hazel: [
      '{name}, evening with your family? Show the little ones the first star. Make a wish together.',
      "Evening, {name}. Off home? Look up on the way. The first star's always out for family time.",
      "Supper with the family, then stories, then stars. {name}, that's a perfect evening.",
    ],
    boothoven: [
      "{name}, off home to the family? Supper and chatter and laughter. That's a symphony, that is.",
      'Off home, {name}? The evening is a nocturne. Soft and warm and full of voices you love.',
      'Family time! The best finale to any day. Go on, go and hear it.',
    ],
    scarah: [
      "{name}, off home to the family? Take them a basket of whatever's ripe. It's on me. On the farm, I mean.",
      "Evening, {name}. Home to the family? The barn owl's up. She'll see you safe to your door.",
      "Off home for supper? Your family's lucky. Tell them a scarecrow said so. A very sincere one.",
    ],
  },
};

/** Every topic, in each neighbour's words: three lines each. */
export const SMALL_TALK: Record<Topic, Record<VillagerId, readonly string[]>> = {
  ...AROUND_HER,
  ...MEMORY_TALK,
  // V1's P2: best friends', and their questions' answers brought up after.
  ...BEST_TALK,
  answer: ANSWER_TALK,
  // V1's P3a: the neighbours theorising about the mayor.
  mystery: MYSTERY_TALK,
};
