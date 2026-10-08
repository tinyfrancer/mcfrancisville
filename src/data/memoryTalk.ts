import type { OutfitId, VillagerId } from '../types/ids';

/**
 * What a neighbour remembers of her and brings up (V1's P1, decision 300): a band of friendship
 * just reached, a long time since they talked, the last gift she gave them, what she picked or
 * gave the museum today, the newest piece she put out at home or in her yard, her costume or
 * what she has on, the bracelet of hers they wear, and how long she has lived in town.
 *
 * What each leaves to fill, as `systems/remembering.ts` says it: `{away}` how long since they
 * talked ("three days", "a whole week"); `{gift}` what she gave them and `{ago}` when ("the
 * pumpkin", "yesterday"); `{harvest}` what she picked today ("pumpkin", for "the pumpkin harvest");
 * `{donated}` what she gave the museum, with its "a"; `{piece}` the piece she put out (after "your
 * new"); `{wearing}` a piece she has on (after "your"); `{bracelet}` the one they wear; `{here}`
 * how long she has been in town ("a week", "two months"). None of them starts a sentence, and
 * none comes straight before her name, so a plural or a long name reads as well as any.
 */
export type MemoryTopic =
  | 'band'
  | 'away'
  | 'gift'
  | 'harvest'
  | 'donated'
  | 'placed'
  | 'costume'
  | 'outfit'
  | 'bracelet'
  | 'here';

/**
 * The pieces that make a costume, from the pop-up's shelves, for the `costume` topic: anything
 * else she wears is just what she has on.
 */
export const COSTUME_PIECES: ReadonlySet<OutfitId> = new Set<OutfitId>([
  'witchHat',
  'catEars',
  'skeletonTee',
  'jackOLanternDress',
  'bugCatcherHat',
  'bugCatcherShirt',
  'butterflyAntennae',
  'butterflyWings',
  'ringmasterHat',
  'ringmasterCoat',
  'lionMane',
  'clueTurtleneck',
  'clueGlasses',
  'spaceSuit',
  'spaceHelmet',
  'vampireCape',
  'batWings',
  'mummyWraps',
  'devilHorns',
]);

export const MEMORY_TALK: Record<MemoryTopic, Record<VillagerId, readonly string[]>> = {
  band: {
    cody: [
      "Babe, I just realised. I fall more in love with you every day. That's not news. It's still true.",
      "Mi amor, I feel like we just got even closer. Is that possible? Apparently it's possible.",
      "Honey bunny, every day with you is my favourite day. Today's ahead, though. Don't tell yesterday.",
    ],
    agatha: [
      "Something's changed between us, {name}. I can feel it. It's a good spell. I didn't cast it.",
      "I don't let many people close, {name}. You've snuck in. Very well. Stay.",
      "{name}, you're one of my people now. That's a short list. Shorter than my spell list. Much.",
    ],
    maude: [
      "{name}, I think we've become proper friends! I've written it in my diary. In ink!",
      'Do you know, I feel closer to you than to most of my books? And I love my books.',
      "{name}, I've moved you up a shelf in my heart. The top one. Where the favourites go.",
    ],
    rufus: [
      "{name}!!! We're even BETTER friends now!!! I can tell!!! I'm so happy!!!",
      "My tail won't stop! It's because of you! We're SO much closer now! My tail can tell!",
      "I told the whole town we're closer than ever! Everyone already knew! I told them again!",
    ],
    wrapunzel: [
      "My darling, I do believe we've grown dearer to each other. My wraps feel warmer for it.",
      "You've found a place in this old heart, dear. Right in the middle. Where it's warmest.",
      "{name}, I find myself looking out for you of a morning. That's how I know you're family now.",
    ],
    barty: [
      "{name}, I reckon we've grown closer. Took root, this has. Good deep roots.",
      "You know, every bone I've got is glad to see you. That's two hundred and six glad bones.",
      "Something's blooming between us, {name}. Friendship. Not hostas. Well. Also hostas.",
    ],
    ollie: [
      "{name}, I think you might be my favourite stop on the round. Don't tell anyone. I'll tell everyone.",
      "{name}, I've moved you to the front of the bag. That's where the important letters go.",
      "We're closer than ever now, aren't we? I can tell. I wave at you twice as hard.",
    ],
    nessa: [
      "{name}, I'm not as shy with you now. Have you noticed? I have. It's nice.",
      "I think we're real friends now. I've never said that out loud before. There. I did.",
      "You make me feel brave, {name}. A little braver every time. That's what friends do, I think.",
    ],
    gourdon: [
      "We're good friends now, {name}. Solid. Built to last. I can tell good joinery.",
      "Not one for speeches. But you've grown dear to me. There. That's the speech.",
      'My candle burns a bit brighter for you now, {name}. Noticed it this morning.',
    ],
    hazel: [
      "{name}, our stars have moved closer together. I checked. It's true. It's in the sky.",
      "I think we've become something lovely, {name}. Friends. The kind that twinkle.",
      "If I named a star for every good friend, I'd give the brightest one your name.",
    ],
    boothoven: [
      '{name}, our friendship has modulated to a warmer key. I heard it happen!',
      "We've grown closer, haven't we? It's like a duet when both parts finally fit.",
      'Bravo, {name}! Our friendship just reached a crescendo. A gentle one. A lovely swell.',
    ],
    scarah: [
      '{name}, I reckon we\'ve grown closer. Cornelius agrees. He said "Pumpkin" twice.',
      "You've grown on me, {name}. Like moss on a fence post. That's a compliment, on a farm.",
      "My straw's all a-rustle. It does that when someone's become dear to me. You have.",
    ],
  },
  away: {
    cody: [
      "Babe! It's been {away} since we had a proper chat out here. The bats are terrible listeners.",
      "Mi amor, it's been {away} without a talk in town. I counted. I'm very dramatic about counting.",
      "There you are, booby. It's been {away}. I missed your face. Your face is my favourite.",
    ],
    agatha: [
      "{name}! It's been {away}. The cauldron was asking. I told it you were busy. Were you busy?",
      "There you are. It's been {away}, {name}. I didn't worry. I simply checked my crystal ball four times.",
      "It's been {away} since you stopped by. Hmph. Welcome back. I mean that warmly. Very warmly.",
    ],
    maude: [
      "{name}! It's been {away}! I've read nine books waiting. I'd have read them anyway. But still!",
      "Oh, it's you! It's been {away}. I left a candle in the window. Ghosts can do that. Sort of.",
      "It's been {away} since our last chat, {name}. I've saved up so much to tell you!",
    ],
    rufus: [
      "{name}!!! It's been {away}!!! I missed you SO much!!! I sniffed your door! Twice!",
      "WHERE WERE YOU?! It's been {away}! I'm not upset! I'm the opposite! I'm SO HAPPY!",
      "It's been {away} and I counted every one! On my paws! I ran out of paws!",
    ],
    wrapunzel: [
      "There's my darling! It's been {away}. I wondered where you'd got to. Come here.",
      "{name}, it's been {away}. The shop's missed you. I've missed you more.",
      "Oh, it's been {away}, dear. Never mind. You're here now, and that's what counts.",
    ],
    barty: [
      "{name}! It's been {away}. The garden kept growing, mind. Didn't stop for anything.",
      "There you are. It's been {away}. My bones were starting to wonder. They're a nosy lot.",
      "It's been {away}, {name}. No harm done. Good things grow in the gaps.",
    ],
    ollie: [
      "{name}! It's been {away}! I kept waving at your house anyway. Just in case.",
      "Look who it is! It's been {away}! I nearly sent out a search party. I'd have delivered it.",
      "It's been {away}, {name}! Welcome back to my round. You've been missed on it.",
    ],
    nessa: [
      "Oh. {name}. It's been {away}. I… I'm glad you're back. Very glad, actually.",
      "It's been {away}. I kept your bit of the pier free. In case. It was free anyway. But still.",
      "{name}, it's been {away}. The lake was very quiet without you. Quieter than me.",
    ],
    gourdon: [
      "There you are. It's been {away}, {name}. Good to see you. Means it.",
      "It's been {away}. Kept busy. Built a shelf. Thought of you while I sanded it.",
      "{name}. It's been {away}, hasn't it? Never mind. A good joint holds, however long you leave it.",
    ],
    hazel: [
      "{name}! It's been {away}! I wished on a star you'd come by. It worked. They usually do.",
      "It's been {away}, {name}. I watched the moon change while you were gone. It missed you too.",
      "There you are! It's been {away}. Time's funny. It goes slow when friends are away.",
    ],
    boothoven: [
      "{name}! It's been {away}! A long rest in the music. But the theme always returns!",
      "Ah, it's been {away}. I've composed you a welcome-back fanfare. Ta-ra! Ta-raaa!",
      "It's been {away}, {name}. The town's tune wasn't quite right without your part in it.",
    ],
    scarah: [
      "{name}! It's been {away}! Cornelius kept watch on the lane for you. He's a very good watcher.",
      "It's been {away}, {name}. The fields have grown a whole inch. I've grown a whole straw.",
      "There you are! It's been {away}. I'd have come looking, but I'm on my post most mornings.",
    ],
  },
  gift: {
    cody: [
      "Babe, I'm still thinking about the {gift} you gave me {ago}. You spoil me. Keep going.",
      'Mi amor, the {gift} you gave me {ago}? Still smiling about it. Fangs and everything.',
      "Honey bunny, thank you again for the {gift} {ago}. I tell everyone. Even people who don't ask.",
    ],
    agatha: [
      "I've not forgotten the {gift} you gave me {ago}, {name}. A witch keeps track of kindnesses.",
      "The {gift} you gave me {ago}. Very thoughtful. Don't let me say so twice.",
      "{name}, about the {gift} you gave me {ago}. Thank you. I said it then. I'm saying it again.",
    ],
    maude: [
      "I'm still thinking about the {gift} you gave me {ago}. I've written a little poem about it.",
      '{name}, I keep thinking of the {gift} you gave me {ago}. Such a kind thought.',
      "{name}, thank you again for the {gift} {ago}. I've told every book in the library.",
    ],
    rufus: [
      "{name}! The {gift} you gave me {ago}!!! I still love it!!! I'll love it forever!!!",
      'Remember the {gift} you gave me {ago}?! I do! I think about it a LOT!',
      'I told everyone about the {gift} you gave me {ago}! Twice! Some people three times!',
    ],
    wrapunzel: [
      "The {gift} you gave me {ago}, dear. So thoughtful. You've a good heart.",
      "I've not stopped smiling about the {gift} you gave me {ago}, my darling.",
      "Thank you again for the {gift} {ago}, dear. I've told every customer. Twice.",
    ],
    barty: [
      'Still chuffed about the {gift} you gave me {ago}, {name}. Made my week, that did.',
      'The {gift} from you {ago} made an old skeleton very happy.',
      'I keep thinking of the {gift} you gave me {ago}. Kind of you. Very kind.',
    ],
    ollie: [
      "{name}! The {gift} you gave me {ago}! Best thing I've been given that I didn't have to deliver!",
      "I'm still telling folk on the round about the {gift} you gave me {ago}.",
      "Thanks again for the {gift} {ago}! I don't get given things much. I give things. It was nice.",
    ],
    nessa: [
      'The {gift} you gave me {ago}… I still think about that. Thank you, {name}.',
      '{name}, I kept the {gift} you gave me {ago} somewhere safe. Well. In my heart, anyway.',
      "I don't get many presents. The {gift} you gave me {ago}… thank you. Truly.",
    ],
    gourdon: [
      'Still thinking on the {gift} you gave me {ago}. Good choice. Thoughtful.',
      "Kind of you, the {gift} {ago}. Didn't say much at the time. Saying it now.",
      'The {gift} you gave me {ago}. I think of it every day. Every day, I do.',
    ],
    hazel: [
      '{name}, the {gift} you gave me {ago} made me feel like a wish come true.',
      "I'm still glowing about the {gift} you gave me {ago}. Like a star. A small happy one.",
      "Thank you again for the {gift} {ago}. I'll think of it whenever I see the Pole Star.",
    ],
    boothoven: [
      'The {gift} you gave me {ago}, {name}! A whole new movement came of it. Allegro con gioia!',
      "I'm still humming over the {gift} you gave me {ago}. It has a melody, you know. Everything kind does.",
      "{name}, thank you again for the {gift} {ago}. Bravissimo. I've hummed about it since.",
    ],
    scarah: [
      '{name}, the {gift} you gave me {ago}! I showed it to every crow on the farm. Even the rude ones.',
      "I'm still smiling about the {gift} you gave me {ago}. My straw stood right up.",
      '{name}, thank you for the {gift} {ago}. Cornelius said "Pumpkin" at it, which is high praise.',
    ],
  },
  harvest: {
    cody: [
      'I saw you bringing in the {harvest} harvest, babe. Farmer chic. Very you.',
      "Mi amor, the {harvest} harvest looks amazing. I'd help, but sunshine. You understand.",
      "Booby, you were out picking today? The {harvest} harvest! My wife grows things. I can't even grow a tan.",
    ],
    agatha: [
      'I hear the {harvest} harvest came in today, {name}. Grown with care. I can smell it from here.',
      'Your {harvest} harvest came in today. Good soil and good hands. And possibly a hex. A kind one.',
      "Today's {harvest} harvest, {name}. Not bad at all. From me, that's a parade.",
    ],
    maude: [
      "You brought in the {harvest} harvest today! I'll find a recipe book. There's always a recipe book.",
      '{name}, I saw the {harvest} harvest go by in your arms. Like a happy ending, in a basket.',
      "{name}, a good harvest is like finishing a book. Today's {harvest} harvest, that's a whole chapter.",
    ],
    rufus: [
      'You did the {harvest} harvest!!! Can I smell it?! I smelled it already! It smelled GREAT!',
      '{name}!!! The {harvest} harvest!!! You grew it with your HANDS!!!',
      "I saw you picking today! The {harvest} harvest! I wagged at it! It didn't wag back! Plants don't!",
    ],
    wrapunzel: [
      "The {harvest} harvest came in, dear? Wonderful. I'm already thinking what I'd bake with it.",
      "You've been picking today, my darling. The {harvest} harvest! Fresh as a morning.",
      'I heard about your {harvest} harvest, dear. Clever hands. Grown with love, I can tell.',
    ],
    barty: [
      "Brought in the {harvest} harvest today, eh? That's the good bit. All the waiting, then that.",
      "{name}, I saw your {harvest} harvest. Grand job. Better than mine, and I'm a professional.",
      "The {harvest} harvest! Proud of you, {name}. Every gardener's proud of every gardener.",
    ],
    ollie: [
      "News on the round: the {harvest} harvest is in! I'm telling everyone. They're very pleased.",
      "Saw you picking today, {name}! The {harvest} harvest! Better than any parcel I've carried.",
      "The {harvest} harvest, eh? That's a delivery straight from the ground. No stamps needed.",
    ],
    nessa: [
      'You brought in the {harvest} harvest today. I saw from the water. It looked like a good day.',
      "{name}, the {harvest} harvest… that's lovely. You make things grow. That's a kind of magic.",
      'Was it a good {harvest} harvest? It looked it. You looked happy.',
    ],
    gourdon: [
      'Brought the {harvest} harvest in, did you? Good. Hard work. Honest work.',
      'The {harvest} harvest. Grown straight and true, {name}. Same as a good plank.',
      "Saw you picking today. The {harvest} harvest. Proud of you. Don't make a fuss.",
    ],
    hazel: [
      'You brought in the {harvest} harvest today! The moon was just right for it. You must have known.',
      "{name}, the {harvest} harvest! Things you grow come up shining. I've noticed.",
      'Was it the {harvest} harvest today? Under these stars, everything grows a little bit gladder.',
    ],
    boothoven: [
      'The {harvest} harvest! {name}, a harvest is a finale. Every row a bar, every plant a note.',
      "I heard you brought in the {harvest} harvest today. {name}, that's a triumphant cadence!",
      "{name}, the {harvest} harvest came in! I've written a little harvest song. It's mostly humming.",
    ],
    scarah: [
      "{name}, you brought in the {harvest} harvest! Oh, I'm proud as punch. Prouder. Proud as pumpkin.",
      "The {harvest} harvest! Farmers' hearts and all. You're one of us now, {name}.",
      'I saw you picking today, {name}. The {harvest} harvest! Cornelius said "Pumpkin." He says it about everything.',
    ],
  },
  donated: {
    cody: [
      'You gave the museum {donated} today, babe? Wrapunzel must be thrilled. My wife, the curator.',
      "Mi amor, there's {donated} in the museum because of you? With a little label? I'm going to go and look at it.",
      'Honey bunny, you gave away {donated} today. To science! Very generous. Very nerdy. I love it.',
    ],
    agatha: [
      'So you gave {donated} to the museum today. Good. Things should be seen, {name}. Most things.',
      "Wrapunzel's cases have {donated} in them now, thanks to you. Nicely done.",
      'I hear you donated {donated} today, {name}. A witch respects a good collection.',
    ],
    maude: [
      "You gave the museum {donated}! I'll note it in the town records. In my best hand.",
      "There's a new label in the museum today, all thanks to you. I'll float by and read it.",
      '{name}, I heard you gave the museum {donated} today. Knowledge is a gift, and so is that.',
    ],
    rufus: [
      "You gave the museum {donated}!!! Can I go and see it?! I'll be SO quiet!!! I won't!",
      "{name}!!! There's {donated} in the museum because of YOU!!!",
      "I peeked in the museum! There's {donated} there now! You did that! I barked at it! Politely!",
    ],
    wrapunzel: [
      "Thank you for {donated} today, my darling. The museum's a little fuller and a lot happier.",
      'You brought me {donated} for the cases today, dear! I wrote its label twice. To get it just so.',
      "{name}, there's {donated} in my museum now! You're a treasure. A proper curator's treasure.",
    ],
    barty: [
      "Gave {donated} to the museum, eh? Good on you. I've a few bones in there myself. Not mine.",
      "I hear the museum's got {donated} now, thanks to you. Grand, {name}.",
      'Donated {donated} today, did you? Generous. Most folk keep the good stuff.',
    ],
    ollie: [
      "Big news on the round! You gave the museum {donated}! I've told the whole street.",
      "{name}! There's {donated} in the museum now! I peeked through the window on my round.",
      "You gave Wrapunzel {donated} today? She waved at me so hard. That'll be why.",
    ],
    nessa: [
      "You gave {donated} to the museum. Now everyone can see it. That's very generous, {name}.",
      "I'll go and see the museum's new one when it's quiet. When nobody's looking. I like it then.",
      "{name}, there's {donated} in the museum because of you. That's a nice thing to leave in the world.",
    ],
    gourdon: [
      "Gave {donated} to the museum, did you? Good. Wrapunzel's cases are well made. Mine, actually.",
      "{name}, there's {donated} in the museum now. Good on you. Things should be shared.",
      "Heard you gave the museum {donated}. Generous of you. The town's richer for it.",
    ],
    hazel: [
      "You gave the museum {donated}! Now everyone can wonder at it. That's what wonder is for.",
      "{name}, there's {donated} in the museum! The stars are proud. I asked them.",
      'I heard you donated {donated} today. Every case in that museum is a little night sky.',
    ],
    boothoven: [
      '{name}, you gave the museum {donated}! A new piece in the collection, like a new verse.',
      "You donated {donated} today? Bravo! The museum's song just grew a note.",
      '{name}, I heard you gave the museum {donated}. Very generous. Generosity has a lovely sound.',
    ],
    scarah: [
      "{name}, you gave the museum {donated}? Oh, I'll go and visit it on Sunday. In my good hat.",
      "There's {donated} in the museum because of you! I hope it has a comfy case. It deserves one.",
      '{name}, you donated {donated} today. Cornelius says "Pumpkin." He means "how generous."',
    ],
  },
  placed: {
    cody: [
      "Babe, I love your new {piece}. Where did you even find it? Don't tell me. I'll just enjoy it.",
      'Mi amor, your new {piece}! So good. Your place gets cosier every day.',
      "I saw your new {piece}, booby. Very stylish. I'm going to sit near it and look stylish too.",
    ],
    agatha: [
      "{name}, I hear good things of your new {piece}. Witches hear things. It's our way.",
      "There's good energy round your new {piece}, I'm told. A witch knows good energy when she's told about it.",
      "Rearranging, are we? The cauldron's been talking of nothing but your new {piece}.",
    ],
    maude: [
      "{name}, I hear you've put out your new {piece}! A home is just a book you live in. Every page matters.",
      "Your new {piece}! Lovely! Near a window, I hope? Everything's better near a window.",
      '{name}, I heard about your new {piece}. I do love a fresh bit of decorating. Like a new chapter.',
    ],
    rufus: [
      'Your new {piece}!!! I heard!!! Can I sniff it?! Can I sit on it?! Can I sniff it while I sit on it?!',
      "{name}! I peeked in the window! Your new {piece}! SO nice! I didn't peek! I peeked!",
      "Everybody's talking about your new {piece}! Well, me. I'm everybody today!",
    ],
    wrapunzel: [
      'Your new {piece}! Just the thing, dear. A home should be a hug you can walk into.',
      "I hear you've been decorating, my darling. Your new {piece}! How lovely.",
      "{name}, the whole shop's talking about your new {piece}. A little home touch goes such a long way.",
    ],
    barty: [
      "{name}, heard about your new {piece}. Making the place your own. That's the spirit.",
      "Your new {piece}, eh? Nice. Put a plant beside it. Everything's better with a plant beside it.",
      'Decorating, {name}? Your new {piece}! Grand. Homes grow too, you know. Same as gardens.',
    ],
    ollie: [
      'I spotted your new {piece} through the window on my round! Very smart, {name}.',
      'Your new {piece}! Did I deliver that one? I remember most of what I deliver. Most of it.',
      "{name}! Word on the round is you've put out your new {piece}. Word on the round is very approving.",
    ],
    nessa: [
      "{name}, your new {piece}… how cosy. I like cosy. I'd like to see your place some day.",
      "Everyone's saying such nice things about your new {piece}. I believe them. You have a good eye.",
      '{name}, your new {piece}… by a window? I like to think of you near a window, looking at the lake.',
    ],
    gourdon: [
      'Heard about your new {piece}. Good. Check the legs are level. Folk never check the legs.',
      '{name}, your new {piece}. Sturdy, I hope. Anything wobbles, a folded card under the short leg. Old trick.',
      "Your new {piece}. Well chosen. A room's only as good as what's in it. And who.",
    ],
    hazel: [
      '{name}, your new {piece}! Put it where the moonlight falls. Everything looks lovelier in moonlight.',
      '{name}, your new {piece}! Just right. Homes are little skies. You fill yours with stars.',
      "{name}, rearranging under a good moon? There'll be luck in your new {piece}. I can tell.",
    ],
    boothoven: [
      '{name}, your new {piece}! A room is like a chord. Add the right note and it rings.',
      "Your new {piece}! Charming! I'd play a welcome song for it. On a piano, not on the piece.",
      "I hear you've been decorating, {name}. Your new {piece}! The whole house hums in a new key.",
    ],
    scarah: [
      "{name}, your new {piece}! Oh, I'd love one. I'd put it in the barn. The cows would be thrilled.",
      "{name}, I heard about your new {piece}. A home's like a field. Plant it with things you love.",
      "Decorating, {name}? Your new {piece}! Lovely. My farmhouse is all hay. I like hay. Hay's cosy.",
    ],
  },
  costume: {
    cody: [
      "Babe, your {wearing}! Ten out of ten. I'd vote for you in any costume contest. I'd vote twice.",
      "Mi amor, your {wearing}! You make spooky look adorable. That's my job, normally.",
      "Honey bunny, the {wearing}! Very convincing. I almost ran. I would never run. I'm a vampire.",
    ],
    agatha: [
      "{name}, your {wearing}! A proper costume. I approve, and I don't approve of much.",
      'Dressing up today? A lesser witch would be fooled by your {wearing}.',
      "A proper costume, and your {wearing} best of all. Halloween's in the heart, not the calendar.",
    ],
    maude: [
      '{name}, your {wearing}! You look like the cover of my favourite storybook!',
      'Ooh, dressing up! Your {wearing}! Wonderful. Every day can be Halloween, if you ask me.',
      "I love your {wearing}! I'd dress up too, but I'm already a ghost. It's a bit on the nose.",
    ],
    rufus: [
      '{name}!!! Your {wearing}!!! Are you a monster?! Are we BOTH monsters?! BEST DAY!!!',
      "I didn't recognise you in your {wearing}! I did! I'm pretending! It's a game!",
      "Costume day?! Your {wearing}! SO good! I'm in my costume too! It's just me! I'm a wolf!",
    ],
    wrapunzel: [
      'Oh, my darling, your {wearing}! You look a treat. Positively spooky. In the nicest way.',
      "{name}, your {wearing}! I'd dress up too, but I've been in these wraps since the pharaohs.",
      'Oh, your {wearing}! Lovely, dear. Dressing up is good for the soul. Ask any mummy.',
    ],
    barty: [
      '{name}, your {wearing}! Very spooky. Not as spooky as a skeleton. But close.',
      'Costume, eh? Your {wearing}! Grand. I go as a skeleton every year. Saves on fabric.',
      "Look at your {wearing}! You'd scare the crows off my beds. Nicely, mind.",
    ],
    ollie: [
      "{name}! Your {wearing}! I nearly delivered your post to a stranger! I didn't! Very convincing!",
      "Love your {wearing}! I've a costume too. It's the postie uniform. Everyone thinks it's real.",
      "{name}, the whole round's talking about your {wearing}! Well, it will be. I'll see to it.",
    ],
    nessa: [
      "{name}, your {wearing}! Very good. I'd dress up too, but I'd be too shy to be seen.",
      'You look lovely in your {wearing}. Spooky. But lovely. Both at once.',
      "Your {wearing}… I like it all. It's fun to be someone else for a day. Even for me.",
    ],
    gourdon: [
      'Your {wearing}. Nicely done, {name}. Good stitching. I notice stitching.',
      'Costume day? Your {wearing}. Proper fit. Made to measure, by the look.',
      "{name}, your {wearing}. Very good. I'm a pumpkin all year. Saves deciding.",
    ],
    hazel: [
      '{name}, your {wearing}! You look like something out of a story told under the stars.',
      "Dressing up! Your {wearing}! Wonderful. You'd make the moon look twice.",
      "I love your {wearing}. It's a little bit magic, dressing up. You turn into a whole new constellation.",
    ],
    boothoven: [
      '{name}, your {wearing}! A costume is an overture for a day of fun!',
      "Bravo! Your {wearing}! A triumph. I'd compose you a march to go with it.",
      'Your {wearing}! Dressing up suits you, {name}. Like a melody in a new key.',
    ],
    scarah: [
      "{name}, your {wearing}! Oh, you'd scare every crow in the county. Not Cornelius. He's seen everything.",
      "{name}, costume day? Your {wearing}! Lovely. I'm a scarecrow all year. I never get to dress up as one.",
      "Love your {wearing}! I'd wear one too, but my hat won't come off. It's sewn on. Long story.",
    ],
  },
  outfit: {
    cody: [
      'Babe, your {wearing}. Wow. I married up. I married so far up.',
      'Mi amor, I like your {wearing} today. You look like the best day of my life. That was the wedding. Same vibes.',
      "Booby, your {wearing}? Cute. You're cute. That's my comment.",
    ],
    agatha: [
      '{name}, I like your {wearing}. Good choice. I know a good choice. I make them daily.',
      "That's a fine look. Your {wearing} especially. Even my cat noticed, and she notices nothing.",
      'Dressed for the weather? Or against it? Either way, your {wearing}. Lovely.',
    ],
    maude: [
      "{name}, I adore your {wearing}! Very literary. I can't say why. It just is.",
      "Ooh, your {wearing}! In my day we'd have called that the height of fashion. Still is!",
      '{name}, I like your {wearing} today. You look like the heroine of a very cosy novel.',
    ],
    rufus: [
      "I LOVE your {wearing}!!! Can I try it on?! No?! Okay!!! It's best on YOU!!!",
      '{name}!!! Your {wearing}!!! You look SO nice!!! You always look nice!!! Extra nice today!!!',
      'Ooh, your {wearing}?! Very you! What does that mean?! It means GOOD!',
    ],
    wrapunzel: [
      "Don't you look lovely, dear. Your {wearing}! Just the thing for a day like this.",
      "{name}, I do like your {wearing}. Very becoming. I'm a wraps woman myself, but I appreciate it.",
      'Look at you in your {wearing}, my darling. A picture. Pretty as a cake.',
    ],
    barty: [
      '{name}, I like your {wearing}. Smart. Smarter than my gardening hat, and I love that hat.',
      'Your {wearing}, eh? Looking sharp today. Sharp as my shears.',
      'Dressed nice today, {name}. Your {wearing} especially. Brightens the place up. Like a marigold.',
    ],
    ollie: [
      "{name}! Love your {wearing}! I'd know you anywhere on the round in that!",
      "Your {wearing}? Very smart. Smarter than my uniform. Don't tell the uniform.",
      'Looking nice today, {name}! Your {wearing} especially. Brightened my whole route.',
    ],
    nessa: [
      '{name}, I like your {wearing}. I was going to say so earlier. I got shy.',
      "Your {wearing}… pretty. I mean it. I don't say things I don't mean. I don't say much at all.",
      "You look nice today, {name}. I noticed your {wearing} straight away. Sorry. I'm blushing.",
    ],
    gourdon: [
      'Your {wearing}. Nice. Well made, that. Good seams.',
      "Looking smart, {name}. Your {wearing}, I mean. Should've said. Said now.",
      'Like your {wearing}. Practical and handsome. Like a good dovetail.',
    ],
    hazel: [
      '{name}, your {wearing}! Lovely. Like something the stars would wear, if they wore things.',
      'Ooh, your {wearing}! You look like a wish someone made on a good night.',
      "I like your {wearing} today. You're shining, {name}. More than usual. And usual's a lot.",
    ],
    boothoven: [
      '{name}, your {wearing}! Elegant. Like a sonata. Every part in its place.',
      'I adore your {wearing}. Rhythm! Clothes can have rhythm. Yours do.',
      "{name}, your {wearing}! It all sings today. Not out loud. I'd have heard.",
    ],
    scarah: [
      "{name}, your {wearing}! Very fetching. I'm in my usual straw. Straw goes with everything.",
      "Ooh, I like your {wearing}. You'd look lovely in a field of sunflowers. Most things do.",
      'Your {wearing}! Cornelius likes it. He said "Pumpkin." He\'s a very good judge of clothes.',
    ],
  },
  bracelet: {
    cody: [
      'Babe, look. Still wearing the {bracelet} you gave me. Never taking it off. Not even in the coffin.',
      'Mi amor, every time I look at the {bracelet} you gave me, I think of you. So, constantly.',
      'Booby, the {bracelet} you gave me goes with everything. Mostly black. But still.',
    ],
    agatha: [
      "I wear the {bracelet} you gave me every day, {name}. A witch's wrist is very particular.",
      "The {bracelet} you gave me is still on my wrist. It's become a sort of charm. Don't tell anyone.",
      "{name}, the {bracelet} you gave me has outlasted three spells. That's a good bracelet.",
    ],
    maude: [
      "{name}, I still wear the {bracelet} you gave me. It's the only thing that doesn't go through me.",
      'Look! The {bracelet} you gave me! On my wrist, where it belongs. Well. Roughly where my wrist is.',
      "I've written about the {bracelet} you gave me in my diary. Three pages. It's a good bracelet.",
    ],
    rufus: [
      "Look!!! I'm wearing the {bracelet} you gave me!!! I never take it off!!! Not even for baths!!! I don't take baths!!!",
      '{name}! The {bracelet} you gave me! It jingles when I run! I run a LOT!',
      "I showed the whole town the {bracelet} you gave me! Twice! It's my favourite thing!",
    ],
    wrapunzel: [
      'See, dear? Still wearing the {bracelet} you gave me. Wrapped right in with the rest.',
      "I wear the {bracelet} you gave me every day, my darling. It's the brightest thing on me.",
      '{name}, the {bracelet} you gave me catches the light by the oven. I watch it while I bake.',
    ],
    barty: [
      'Still got the {bracelet} you gave me on, {name}. Rattles nicely on my wrist bone. Like a wind chime.',
      'Look, the {bracelet} you gave me. On my wrist. Well. My radius. Same thing.',
      "Never take off the {bracelet} you gave me. Not gardening, not sleeping. It's lucky.",
    ],
    ollie: [
      '{name}! Still wearing the {bracelet} you gave me! Folk ask about it on my round. I tell them.',
      "The {bracelet} you gave me goes on every delivery. It's the best-travelled bracelet in town.",
      '{name}, I wave with the hand that has the {bracelet} you gave me. So you see it. Did you see it?',
    ],
    nessa: [
      "{name}, I still wear the {bracelet} you gave me. Every day. I look at it when I'm shy.",
      "The {bracelet} you gave me doesn't mind the water. I checked. Very carefully. It's still perfect.",
      "The {bracelet} you gave me… it makes me feel braver. I don't know why. It just does.",
    ],
    gourdon: [
      '{name}, still wearing the {bracelet} you gave me. Keep it out of the sawdust. Mostly.',
      'The {bracelet} you gave me. Best-made thing on me. And I made most things on me.',
      "Wear the {bracelet} you gave me every day. Don't take it off. Not for anything.",
    ],
    hazel: [
      "I wear the {bracelet} you gave me every night when I stargaze, {name}. It's my lucky one.",
      "Look, the {bracelet} you gave me. It twinkles. It's practically a constellation.",
      'The {bracelet} you gave me never comes off, {name}. Some things you keep close, like wishes.',
    ],
    boothoven: [
      'I wear the {bracelet} you gave me when I play, {name}. It keeps time. Click, click.',
      "The {bracelet} you gave me, on my wrist! It's like a little grace note I carry everywhere.",
      '{name}, the {bracelet} you gave me jingles in perfect rhythm. Waltz time, mostly.',
    ],
    scarah: [
      '{name}, still wearing the {bracelet} you gave me! Under the straw. Cornelius guards it.',
      '{name}, the {bracelet} you gave me is my favourite thing. After the farm. And Cornelius. And you.',
      'I wear the {bracelet} you gave me every day. Even in the rain. It goes lovely with straw.',
    ],
  },
  here: {
    cody: [
      "You've been in town {here}, mi amor, and it already feels like you were always here.",
      'Booby, {here} in McFrancisVille and the whole town loves you. I was first. Remember that.',
      "Has it really been {here}, babe? Time flies when you're married to a vampire.",
    ],
    agatha: [
      "{name}, you've been here {here} now. The town's got used to you. So have I. Don't tell.",
      'Has it been {here} already? Time moves strangely round a cauldron. And round good friends.',
      "You've been in McFrancisVille {here}, {name}. Long enough to know which gravestones move.",
    ],
    maude: [
      "{name}, you've been in town {here}! I've been keeping a little record. A ghost likes a record.",
      "It's been {here} since you moved in, and the town's a nicer story for it.",
      "{name}, has it really been {here}? You feel like a chapter I've always known.",
    ],
    rufus: [
      "You've lived here {here}!!! That's SO long!!! Or short?! I can't count days! I count sausages!",
      "{name}! It's been {here} since you came! I've loved every single bit of it! Every bit!",
      "Do you know how long you've lived here?! It's been {here}! I've been counting! Badly!",
    ],
    wrapunzel: [
      "You've been with us {here} now, my darling. It feels like you've always had a chair by my oven.",
      "It's been {here} since you came, dear, and I can't picture the town without you.",
      "{name}, you've been here {here}. Long enough to know the best bun is the one in the corner.",
    ],
    barty: [
      "You've been here {here} now, {name}. Put down good roots. I can tell.",
      "It's been {here} since you came to town. Garden's never looked better. Coincidence? No.",
      "Has it been {here}? Feels like you've always been in the town. Like a good old tree.",
    ],
    ollie: [
      "{name}, you've had post here for {here} now! I remember your first letter. Very exciting.",
      "You've been on my round {here} now. Favourite stop. Since day one.",
      "It's been {here} since you came! Every day I've had something for you, I've brought it round. Happily.",
    ],
    nessa: [
      "You've been here {here}, {name}. I was too shy to say hello at first. I'm glad I did.",
      "It's been {here} since you came. The town feels warmer. I think it's you.",
      "Has it been {here}? I like how you've made yourself at home. You make me feel at home too.",
    ],
    gourdon: [
      "You've been in town {here}, {name}. Settled in well. Good foundations.",
      "Been here {here} now, haven't you? Feels longer. In a good way. Like you belong.",
      "{name}, it's been {here}. Town's sturdier with you in it. I'd know. I check.",
    ],
    hazel: [
      "You've been here {here}, {name}! The sky's turned a good deal since you came. All for the better.",
      "It's been {here} since you arrived. I remember the stars that night. They were very excited.",
      "Has it really been {here}? You've become part of the town's sky, {name}. A bright bit.",
    ],
    boothoven: [
      "{name}, you've been here {here}! You've become part of the town's melody. A lovely refrain.",
      "It's been {here} since you came. The whole town sounds better. I've listened carefully.",
      "You've lived here {here}, {name}. Long enough to have a theme of your own. You do. It's cheerful.",
    ],
    scarah: [
      "You've been in town {here}, {name}! Every day of it, the fields have looked a little brighter.",
      'It\'s been {here} since you came. Cornelius remembers. He said "Pumpkin" the day you arrived.',
      "Has it been {here}? Oh, {name}, you've settled in like seeds in good soil.",
    ],
  },
};
