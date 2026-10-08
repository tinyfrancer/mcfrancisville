import type { VillagerId } from '../types/ids';
import type { Topic } from './smallTalk';

/**
 * Her voice (V1's P2, decision 301): something she can say back to a line, on a chip where the
 * talk's buttons are, and what they say to that. `{name}` is her name, as everywhere.
 */
export interface Reply {
  /** What she says, on the chip. */
  say: string;
  /** What they say back. */
  back: string;
}

/**
 * The topics she can answer (V1's P2): her chips are hers, the same whoever she's talking to, and
 * each neighbour has their own answer to each, in the chips' order.
 */
export interface TopicReplies {
  say: readonly string[];
  back: Record<VillagerId, readonly string[]>;
}

export const REPLIES: Partial<Record<Topic, TopicReplies>> = {
  outfit: {
    say: ['Thank you!', 'I picked it just for today.'],
    back: {
      cody: [
        "Don't thank me, babe. Thank the mirror. It's been showing off all morning.",
        "Today's lucky, then. I'll tell it. Mi amor, you're the best-dressed thing in this town.",
      ],
      maude: [
        "You're very welcome, {name}. A good outfit is like a good first line. It makes you read on.",
        'Then today has excellent taste. I shall write it down. I write everything down.',
      ],
      rufus: [
        "You're welcome!!! I'll say it again tomorrow! And the day after! Every day!",
        'FOR TODAY?! Today is SO lucky! I hope today knows! I am going to tell it!',
      ],
      wrapunzel: [
        "You're welcome, my darling. Now come in and have a bun before it gets cold. The bun, not you.",
        "Then today is a very lucky day. In my time, we'd have carved it on a wall.",
      ],
      agatha: [
        "Don't mention it. I mean that. I've a reputation to keep. But it's lovely, {name}.",
        'I could tell. It has an air about it. A good air. Not a potion air.',
      ],
      barty: [
        "No worries, {name}. Takes one well-turned-out sort to know another. I'm all bones, mind.",
        "And it's paid off! You're a sight for sore eye sockets, that's what.",
      ],
      ollie: [
        "My pleasure! I'll tell the whole round. Well, I'll tell Parcel. She's a good listener.",
        "Today's lucky, then! I'll give it my fanciest stamp.",
      ],
      nessa: [
        "You're welcome. I practised saying it. Under the water. It came out as bubbles.",
        "That's lovely. I pick mine for the weather. It's always damp, so it's always the same.",
      ],
      gourdon: [
        'No bother. Says what it is, a good look. Like a good joint. No gaps.',
        "Shows. Well chosen. Measured twice, I'd bet.",
      ],
      hazel: [
        "You're welcome, {name}! I'd tell the stars, but they've already noticed.",
        'Then you planned it better than I plan my nights. I just look up and hope.',
      ],
      boothoven: [
        'A pleasure, {name}! It has a lovely rhythm to it. Three-four. A waltz of an outfit.',
        'Then today deserves an overture. I shall hum one. There. Did you hear it?',
      ],
      scarah: [
        'You\'re so welcome! Cornelius agrees. He said "Pumpkin." That\'s a yes.',
        "For today?! Oh, today will be so pleased. I'll tell the sunflowers to stand up straight.",
      ],
    },
  },
  gift: {
    say: ["I'm so glad you liked it!", "I'll find you another one."],
    back: {
      cody: [
        'Liked it? I love it, mi amor. I love everything you give me. Mostly I love you.',
        "Honey bunny, you don't have to. …But if you see one, I wouldn't say no.",
      ],
      maude: [
        "Liked it? I've put it beside my very favourite book. That's my highest honour.",
        "Oh, you needn't, {name}. One is perfect. Though a second would make a lovely pair.",
      ],
      rufus: [
        'I LOVED it!!! I showed everyone! I showed the moon! Twice!',
        'ANOTHER ONE?! I would DIE. I would not die. But I would be so happy!',
      ],
      wrapunzel: [
        "I did, dear, very much. It's on my shelf of special things, with the jar.",
        "You spoil me, my darling. I shall bake you something to say thank you. Then you'll owe me again!",
      ],
      agatha: [
        "I did. Don't make a fuss. …It's on the mantelpiece. Where everyone can see it.",
        'Another? You make it very hard to be grumpy, {name}. I shall have to try harder.',
      ],
      barty: [
        'Liked it? Chuffed to my bones! Showed it to Terry the worm. He was very moved.',
        "Ah, no need, {name}. But if you do, I'll find room. There's always room in a shed.",
      ],
      ollie: [
        "I loved it! I keep it in my front pocket. The one I don't put letters in.",
        "You'd do that? I'll deliver you something back. With a stamp on.",
      ],
      nessa: [
        "I did. Very much. I took it down to show the moon carp. They blew bubbles. That's good.",
        "You don't have to. …But I'd be very happy. Quietly happy. On the inside.",
      ],
      gourdon: [
        'Did. Very much. Built it a little shelf of its own.',
        "No need. But I'd not say no. I'll build a bigger shelf.",
      ],
      hazel: [
        "I loved it, {name}! I've put it by the telescope, so it can see the stars too.",
        "Oh, you're kind. I'll name a little star for every one you bring. I'll run out of names first.",
      ],
      boothoven: [
        'Liked it? I wrote it a little tune! It goes da-da-DUM. That last bit is the thank you.',
        'Another? Then I shall write a second verse. Every good gift deserves a second verse.',
      ],
      scarah: [
        'I loved it! I keep it in my patched pocket, next to the little heart. They get on.',
        'Oh, you don\'t have to! But Cornelius would be ever so pleased. He\'d say "Pumpkin."',
      ],
    },
  },
  away: {
    say: ['I missed you too!', "I've been so busy!"],
    back: {
      cody: [
        "Good. I mean, I'm glad. I mean, babe, the manor was much too quiet without you.",
        'I know, mi amor. Busy looks good on you. Come here, though. Not too busy for a hug.',
      ],
      maude: [
        "Did you? Oh, {name}. I've kept your chair warm. Well, I've kept it. Ghosts don't do warm.",
        'Busy is good. Busy means stories. You must tell me every one of them.',
      ],
      rufus: [
        'YOU MISSED ME?! I MISSED YOU MORE! I checked! I counted! I lost count! MORE!',
        "That's OK! You're here NOW! Now is the best time! Now is my favourite!",
      ],
      wrapunzel: [
        'Of course you did, dear. Everyone misses my buns. And me, I hope. Mostly me.',
        'Busy, busy. Sit down a moment, my darling. The world will wait. It always has for me.',
      ],
      agatha: [
        "Hmph. Well. Good. I mean, that's very nice. I hadn't noticed you'd gone. I'd noticed.",
        'Busy is fine. Just come back. Now and then. That is all I am saying.',
      ],
      barty: [
        "Aw, {name}. The garden missed you too. I told it you'd be back. It believed me.",
        "Life gets full, like a good bed in spring. Glad you've a minute for an old skeleton.",
      ],
      ollie: [
        'Me too! I kept going past your mailbox just in case. Very slowly. With the bell.',
        "I know the feeling! Some days the round's three times as long. Glad you're back.",
      ],
      nessa: [
        "You did? I… oh. That's the nicest thing. I'm going a bit pink.",
        "That's alright. I'm good at waiting. I'm a lake monster. We wait a lot.",
      ],
      gourdon: [
        'Good. Well. Me too. Felt like a bench with a leg off.',
        "Busy's alright. Long as you're back. You are. Good.",
      ],
      hazel: [
        "I missed you every night, {name}. I checked the sky for you. You weren't in it. You're here!",
        'Busy is like a cloudy sky. It always clears. And here you are, clear as anything.',
      ],
      boothoven: [
        "And I you! The town was all rests and no notes. Now the tune's back.",
        'Busy is a fast movement. Every symphony needs one. Now, something slower? With me?',
      ],
      scarah: [
        'You did?! Oh, I\'m all a-flutter! Cornelius, she missed us! He says "Pumpkin."',
        "That's alright! Farms are busy too. Everything grows while you're away. Even me!",
      ],
    },
  },
  rain: {
    say: ['I love the rain!', "I'm soaked!"],
    back: {
      cody: [
        'Me too, babe. Rain means a blanket, a film and you. Best kind of day.',
        'Come here, mi amor, take my cape. …It is also soaked. We are both soaked now.',
      ],
      maude: [
        'Oh, so do I. The rain on the library roof sounds like pages turning. Hundreds of them.',
        "Come into the library and dry off, {name}. I'll float you a towel.",
      ],
      rufus: [
        'ME TOO! I love puddles! I love splashing! I love shaking off on people! Sorry!',
        "Me too!!! Let's be soaked TOGETHER! It's better together! Everything is!",
      ],
      wrapunzel: [
        "So do I, dear, as long as I'm indoors. Wet bandages take an age to dry.",
        "Oh, my darling! Come in by the oven. Five minutes and you'll be toasted. Like a bun.",
      ],
      agatha: [
        "Good. Rainwater makes the best potions. I've buckets out. Mind the buckets.",
        "So am I. My hat is a pond now. There's a newt in it. He's welcome.",
      ],
      barty: [
        "That's the spirit! Best gardener in town, the rain. Doesn't even ask for a cuppa.",
        "Ha! Me too, right through. Good thing I've no skin to wrinkle.",
      ],
      ollie: [
        'Me too! The puddles are the best bit of the round. Parcel and I go right through them.',
        "So's the post! Don't worry, I keep the letters under my hat. My hat is not dry.",
      ],
      nessa: [
        'You do? So do I. Rain is like the lake coming to visit you instead.',
        "Oh no. Here, stand under my lily pad. It's not very big. It's a bit of a hat.",
      ],
      gourdon: [
        "Good for the wood. Bad for the candle in my head. It's holding up.",
        "Same. Go and dry off by a fire. I'll fix you a bench to sit on.",
      ],
      hazel: [
        'I love it too, {name}. No stars, but the clouds smell wonderful.',
        "Oh dear! Rain means no stargazing, so I'm free. I'll find you a towel.",
      ],
      boothoven: [
        'As do I! It plays every roof in town at once. A percussion section of thousands.',
        "So am I! My hair is in a terrible minor key. Let's find somewhere to dry and hum.",
      ],
      scarah: [
        'Me too! The crops drink it all up. And I swell a little. Just a little. Straw does.',
        "Oh, so am I! I'm heavier when I'm wet. Cornelius won't sit on my hat. Too squishy.",
      ],
    },
  },
};
