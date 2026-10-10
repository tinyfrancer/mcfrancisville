import type { ItemId, VillagerId } from '../types/ids';
import type { Reply } from './replies';

/**
 * Heart moments (V1's P2, decision 301): at two, four, five, eight and ten hearts, a neighbour
 * tells her a little more of their story, a short scene of three to six lines shown one after
 * another, the first talk after their hello once the hearts are reached, once each. Together a
 * neighbour's five tell one story: Maude's "after", Nessa's whole name, Wrapunzel's princess
 * years, Boothoven's lost symphony, Rufus's first bouquet, Agatha's apprenticeship, Barty's old
 * garden, Ollie's first round, Gourdon's first pumpkin, Hazel's star and Scarah's harvest moon.
 * The last line may carry her `replies`. Cody's are his session's (P5): he's married to her.
 * Warm and gently silly, never sad for long and never scary. `{name}` is her name.
 */

/** The hearts a moment comes at, in order. */
export const MOMENT_HEARTS = [2, 4, 5, 8, 10] as const;
export type MomentHearts = (typeof MOMENT_HEARTS)[number];

export interface HeartMoment {
  hearts: MomentHearts;
  lines: readonly string[];
  /** What she can say to the last line, and what they say back. */
  replies?: readonly Reply[];
  /** Something they hand her as they tell it, which goes in her bag. */
  gift?: ItemId;
}

export const HEART_MOMENTS: Partial<Record<VillagerId, readonly HeartMoment[]>> = {
  maude: [
    {
      hearts: 2,
      lines: [
        "{name}, may I tell you something? People always ask what it's like. After, I mean.",
        "It's very like before. Only quieter. And I can't hold a teacup, which is a shame.",
        'I still turn the pages, though. It takes a little concentrating. Like whistling.',
      ],
    },
    {
      hearts: 4,
      lines: [
        'I was the librarian here when I was alive, too. Forty-one years. I never missed a day.',
        'One winter evening I sat down by the fire with a very good book.',
        'I remember thinking, "Just one more chapter." And then it was morning, and I was see-through.',
        "I finished the chapter. It was worth it. It's always worth it.",
      ],
    },
    {
      hearts: 5,
      lines: [
        "The first week after, I hid in the stacks. I thought I'd frighten people.",
        'Then Agatha came in for a book on fungus, looked straight at me, and said, "Oh, there you are."',
        "She'd been bringing back her books late on purpose, so I'd have to come and find her.",
        "She's very clever, Agatha. Don't tell her I said so. She'll be unbearable.",
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}, I've never told anyone this. I was frightened of the after. For years. Before it came.",
        'All those endings in all those books, and I never once wanted to reach my own.',
        'But it turned out not to be an ending at all. More of a… new chapter. Smaller print.',
        "And you're in it now. That's the best thing that's happened since the fire.",
      ],
    },
    {
      hearts: 10,
      lines: [
        "I've been writing something, {name}. A book. My own, for once.",
        "It's about a librarian who thought her story was over, and a town that kept turning the pages.",
        "There's a new neighbour in it. She comes in near the end and makes everything brighter.",
        "I'd like you to read it first. Before anyone. Would you?",
      ],
      replies: [
        {
          say: "I'd love to.",
          back: "Oh, good. I'll read it to you by the fire, a chapter a night. The best bit's yours.",
        },
        {
          say: 'Only if I can read it twice.',
          back: "Once alive and once after? Ha! Oh, {name}. You're the best reader I've ever had.",
        },
      ],
    },
  ],
  rufus: [
    {
      hearts: 2,
      lines: [
        "{name}! Can I tell you a secret? A big one? It's not a big secret. It's a big story!",
        "I didn't always do the flowers! Before, I just ate them. Mostly the daisies. They're crunchy.",
        'Then one day I picked one instead of eating it! And it was SO pretty! And I kept it!',
      ],
    },
    {
      hearts: 4,
      lines: [
        'So after the daisy, I picked LOTS! I made my first ever bouquet! All by myself!',
        'It had daisies, and a dandelion, and some grass, and a stick, and a bit of a fence.',
        'Barty said it was "very structural". I think that means good!',
      ],
    },
    {
      hearts: 5,
      lines: [
        'I wanted to give my first bouquet to someone. But I was new. Nobody knew me. I was scared.',
        'I sat by the well holding it ALL day. I howled a little. Just a small howl.',
        'And then Wrapunzel came out and said, "Is that for me?" And I said yes! It wasn\'t! But then it was!',
        "She put it in a jar on the counter. It's STILL there. It's a bit crispy now.",
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}, can I tell you a real one? A quiet one? I'll be quiet. I can be quiet.",
        'When I first came here, I thought nobody would want a werewolf in town. Too loud. Too hairy.',
        "So I made everybody flowers. I thought if I made enough flowers, they'd let me stay.",
        "They'd have let me stay anyway. Wrapunzel says so. I still make the flowers. Now it's just for love!",
      ],
    },
    {
      hearts: 10,
      lines: [
        'I have something for you! Close your eyes! Are they closed? They are not closed!',
        "It's a bouquet. A daisy, a dandelion, some grass, a stick, and a very small bit of fence.",
        "It's my first bouquet again. I made it the same way. Because you're my first best friend!",
        "Well. Wrapunzel was first. But you're first-first! Is that allowed?!",
      ],
      replies: [
        {
          say: "It's allowed!",
          back: "YES! I'm telling the moon! I'm telling EVERYONE! I'm howling it! AWOOO!",
        },
        {
          say: 'I love it. Even the fence.',
          back: "The fence is the best bit! I knew you'd get it! I KNEW it!",
        },
      ],
    },
  ],
  wrapunzel: [
    {
      hearts: 2,
      lines: [
        "Sit down a moment, dear. You'll have heard I'm a princess. Well. I was. Briefly.",
        'Three thousand years ago, on the Nile. My father was a pharaoh, and very fond of honey cakes.',
        'I was meant to be learning to rule. I was mostly in the kitchens. Learning to bake.',
      ],
    },
    {
      hearts: 4,
      lines: [
        'The palace bakers let me knead the dough if I promised not to tell my father.',
        "I told him, of course. I brought him a honey cake I'd made myself.",
        'He said it was the finest thing in all of Egypt. He was a terrible liar. It was rather burnt.',
        "But he ate the whole thing. That's how I knew he loved me.",
      ],
    },
    {
      hearts: 5,
      lines: [
        'When I was wrapped, they put all sorts in the tomb with me. Gold, jewels, little boats.',
        'The only thing I really wanted was my recipe for honey cake.',
        "Someone slipped it in at the very end, folded up in my sleeve. I've never known who.",
        "I still have it. It's a bit faded. I could bake it with my eyes shut. I sometimes do.",
      ],
    },
    {
      hearts: 8,
      lines: [
        '{name}, being a princess was lonely. Everyone bowed. Nobody stayed for tea.',
        'Then I woke up in a museum, three thousand years later, and walked out the front door.',
        "I've never looked back. A princess has a crown. A baker has a counter full of friends.",
        "And here you are, staying for tea. You've no idea what that means to an old mummy.",
      ],
    },
    {
      hearts: 10,
      lines: [
        "My darling, I've baked something. A honey cake. My father's. Not burnt, this time.",
        "I've never made it for anyone else. Not once in three thousand years.",
        "It's the finest thing in all of McFrancisVille. And I'm not a terrible liar.",
      ],
      replies: [
        {
          say: "It's perfect.",
          back: 'Then he was right, after all. Just a little early. Eat it all, dear. Every crumb.',
        },
        {
          say: "I'll eat the whole thing.",
          back: "Oh, you wonderful thing. That's how I'll know. That's how I'll always know.",
        },
      ],
    },
  ],
  agatha: [
    {
      hearts: 2,
      lines: [
        '{name}, you want to know how I became a witch. Everyone does. They never ask.',
        'I was apprenticed at nine to old Mother Thistlewick, in a cottage that leaned to the left.',
        'My first job was to stir. Just stir. For a year. Clockwise. She checked.',
      ],
    },
    {
      hearts: 4,
      lines: [
        'In my second year, she let me make my first potion. A simple one. To make a kettle sing.',
        'I put in too much nutmeg. The kettle sang opera. All night. In Italian.',
        'Mother Thistlewick laughed so hard she fell off her stool. I had never seen her laugh before.',
      ],
    },
    {
      hearts: 5,
      lines: [
        "She taught me to fly, too. Or tried to. I've never once managed a straight line.",
        'She said, "Agatha, a straight line is only the quickest way. It\'s not the best one."',
        'I thought she was being kind. Now I think she was telling me something about everything.',
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}, I'll tell you something I don't tell people. I wasn't a very good apprentice.",
        "I was grumpy, I was proud, and I wouldn't ask for help. Not once. Not ever.",
        'One winter I got lost on my broom in a snowstorm. Too proud to turn back.',
        'Mother Thistlewick flew out and found me. She never said a word about it. She just made cocoa.',
        "I've been trying to be that kind of person ever since. I'm getting there. Slowly.",
      ],
    },
    {
      hearts: 10,
      lines: [
        'When Mother Thistlewick retired, she gave me her spoon. The stirring one. Clockwise.',
        'She said, "Give it to your own apprentice one day." I never took one. Too grumpy.',
        "I don't suppose you'd like to stir something with me, {name}? Just now and then?",
      ],
      replies: [
        {
          say: "I'd love to. Clockwise.",
          back: "Clockwise. Good. You'll make a better witch than me. Don't tell anyone I said so.",
        },
        {
          say: 'Only if we add nutmeg.',
          back: "Ha! Opera all night. Oh, {name}. She'd have liked you. I like you. There. I said it.",
        },
      ],
    },
  ],
  barty: [
    {
      hearts: 2,
      lines: [
        '{name}, did I ever tell you about my old garden? Before the graveyard beds?',
        'Little cottage by the sea, it was. Long time ago. When I had a bit more of me.',
        'Grew hostas up the path. Folks came from three villages over to look at them.',
      ],
    },
    {
      hearts: 4,
      lines: [
        'My Mabel planted the first one. She said a path ought to have something to say hello.',
        'Every spring we split them and planted more. By the end, the hostas went right down to the sand.',
        'The gulls used to sit in them. Daft birds. Mabel loved them.',
      ],
    },
    {
      hearts: 5,
      lines: [
        "When I was done being alive, I woke up here. Bones and a hat. Didn't know a soul.",
        'First thing I did was look for a bit of earth. Found the graveyard. Nobody was tending it.',
        'So I did. Seemed a shame not to. A garden is a garden, whoever is in it.',
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}, the hostas in the graveyard beds. Every one of them comes from Mabel's first.",
        'I went back to the old cottage once. Long gone. But the hostas were still there, down to the sand.',
        'I dug up a little bit and walked it all the way here in my hat.',
        "That's why I keep them so tidy. It's my way of saying hello to her. Every single morning.",
      ],
    },
    {
      hearts: 10,
      gift: 'hostaDivision',
      lines: [
        "Here, {name}. I've split one of Mabel's hostas for you. Wrapped it in my hat.",
        "Plant it somewhere it can say hello to folk. That's what they're for.",
        "You're family now. Mabel would've said so first. She always said things first.",
      ],
      replies: [
        {
          say: "I'll look after it always.",
          back: "I know you will. Split it come spring. Then there'll be two of you saying hello.",
        },
        {
          say: 'Tell me more about Mabel.',
          back: "Ha! Have you got a few years? Sit down. She once punched a gull. For me. It's a long story.",
        },
      ],
    },
  ],
  ollie: [
    {
      hearts: 2,
      lines: [
        "{name}, do you want to hear about my first round here? It's a bit embarrassing.",
        'I got off the coach with a map, a bag of letters and Parcel. The map was upside down.',
        "I didn't know. I delivered the whole round upside down. Everyone got the right post anyway.",
      ],
    },
    {
      hearts: 4,
      lines: [
        "The first letter I ever delivered here was to Maude. It was from Maude. She'd posted it to herself.",
        'I knocked on the library door. Nobody answered. Then the letter floated out of my hand.',
        'I screamed. Maude screamed. Then we both laughed. She made me tea I could drink and she could hold.',
      ],
    },
    {
      hearts: 5,
      lines: [
        'Before this, I did the post in a town where nobody waved. Not once. Six years.',
        'On my first round here, Rufus waved at me from the well. Then he ran alongside Parcel for a mile.',
        'Then Barty waved. Then a gravestone waved. I think it was a gravestone. I waved back.',
        'I went home that night and wrote to my mum. I said, "I think I\'ve found it."',
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}, I was very lonely, before here. I carried everyone's letters and nobody wrote to me.",
        'My first week here, I found a letter in my own pigeonhole. No stamp. It just said, "Welcome, Ollie."',
        'I never found out who wrote it. I think it was everyone. I think they passed it round.',
        "I keep it in my front pocket. The one I don't put letters in.",
      ],
    },
    {
      hearts: 10,
      lines: [
        "I've brought you something, {name}. A letter. From me. I didn't post it. I wanted to hand it over.",
        'It says, "Welcome, {name}." Same as mine. A bit late. I didn\'t know how to start it before.',
        'Every round, your mailbox is the one I look forward to. Every single day.',
      ],
      replies: [
        {
          say: "I'll keep it in my pocket.",
          back: "The one you don't put letters in? Oh. Oh, that's the right one. That's the best pocket.",
        },
        {
          say: "I'll write back.",
          back: "You will? I'll deliver it to myself! First class! I'll ring the bell and everything!",
        },
      ],
    },
  ],
  nessa: [
    {
      hearts: 2,
      lines: [
        "{name}… can I tell you something? It's about my name. Nessa isn't all of it.",
        "It's the bit people can say. The rest of it is mostly bubbles. And a long low hum.",
        "I've never said the whole thing out loud above the water. I'd go bright pink.",
      ],
    },
    {
      hearts: 4,
      lines: [
        'My grandmother gave me my name. She was the lake monster before me. A very big one.',
        'She said a lake monster needs a long name, so it lasts. Lakes are very long-lived.',
        'Mine has a bit for the moon in it, a bit for the reeds, and a bit for her. Under the water.',
      ],
    },
    {
      hearts: 5,
      lines: [
        'People used to come to the shore with cameras, hoping to see the monster. Hoping to see me.',
        'I hid under the lake for years. I thought if they saw me, they would be disappointed.',
        'Then Rufus swam out, waved, and said, "You\'re SO big! I love you!" He sank. I carried him back.',
        'That was the first day I came up in daylight. I was very, very damp. He was very happy.',
      ],
    },
    {
      hearts: 8,
      lines: [
        '{name}, the lanterns on the lake. I light them so people can find the water at night.',
        'My grandmother did it first. She said a lake should never be dark for anyone who comes to it.',
        "When I light them now, I say a bit of my name for each one. Quietly. That's how she taught me.",
        "So every lantern on the lake has a bit of me in it. I've never told anyone that.",
      ],
    },
    {
      hearts: 10,
      lines: [
        "{name}, I'd like to tell you my whole name. Out loud. Above the water. If you don't mind.",
        "Nessamirelunavelloubbubbleblubhmmmmlorna. …That's it. That's me. The hum is the long bit.",
        "Only you and the moon know it now. And the carp. The carp don't count.",
      ],
      replies: [
        {
          say: "It's beautiful.",
          back: "You think so? …I've gone pink. Right down to the tail. Thank you. Thank you, {name}.",
        },
        {
          say: 'Can I call you Nessa still?',
          back: 'Always. Nessa is the bit I give to friends. The whole of it is for my best one.',
        },
      ],
    },
  ],
  gourdon: [
    {
      hearts: 2,
      lines: [
        "Folks ask how a pumpkin learns carpentry. Fair question. I'll tell you. Short version.",
        'First thing I remember is a field. Rows of us. Then a hand picking me up.',
        'It was Barty. Younger then. Well. Same age. Fewer worms.',
      ],
    },
    {
      hearts: 4,
      lines: [
        'Barty carved me a grin for the harvest festival. Wonky. One tooth too many.',
        'Put a candle in me. Stood me on a fence post. And I just… lit up. On the inside.',
        'Next morning I was still lit. And I could think. Mostly about the fence post. Badly made.',
      ],
    },
    {
      hearts: 5,
      lines: [
        'So I fixed the fence post. Then the fence. Then the gate. Barty never asked me to.',
        'First thing I ever built from nothing was a stool. Three legs. Wobbled on four of them.',
        "Kept it. Still sit on it. It's a terrible stool. It's my favourite.",
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}. Every autumn, they grow me a new head. You know that. Here's what you don't.",
        'Barty grows them from the seeds of my first. Same field. Same row. Every year.',
        'I asked him once why he bothers. He said, "A good thing\'s worth keeping going."',
        'Never said a better thing about anything. Not much for words, Barty. Me neither.',
      ],
    },
    {
      hearts: 10,
      gift: 'pumpkinSeed',
      lines: [
        'Got something. Saved a seed from my first head. Kept it in a matchbox. For years.',
        "Never knew who it was for. Know now. It's for you, {name}.",
        "Plant it. See what comes up. Might be a pumpkin. Might be a carpenter. Either way, it's a friend.",
      ],
      replies: [
        {
          say: "I'll plant it somewhere sunny.",
          back: 'Good. Sunny is right. Give it a fence post. A well-made one.',
        },
        {
          say: "I'll carve it a grin.",
          back: "Make it wonky. One tooth too many. That's how you know it's a good one.",
        },
      ],
    },
  ],
  hazel: [
    {
      hearts: 2,
      lines: [
        "{name}, I've a favourite star. I don't tell people, because they all want to know which.",
        "It's not the brightest. It's quite small. Slightly to the left of the castle, most nights.",
        "I've been watching it since I was six. I call it Pip.",
      ],
    },
    {
      hearts: 4,
      lines: [
        "When I was little, I couldn't sleep. The dark seemed so big. My gran took me up on the roof.",
        'She pointed at the smallest star she could find and said, "That one\'s looking after you."',
        'I looked at Pip every night after that. I slept like a log. I still do. In the afternoons.',
      ],
    },
    {
      hearts: 5,
      lines: [
        'I came to McFrancisVille because the sky here is the darkest for miles. No lamps. Well, a few.',
        "The first night, I set up the telescope on the hill, looked for Pip, and couldn't find it.",
        'I looked until dawn. I was so worried. Then Nessa lit the lanterns on the lake, and there it was.',
        "In the water. Pip, reflected. I'd been looking in the wrong place.",
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}, I'll tell you something nobody knows. Pip isn't really a star.",
        "It's a little planet, going round a star too faint to see. I worked it out at university.",
        'I was so disappointed. I cried on the roof. Then I thought, a planet might have someone on it.',
        'Someone looking up at our sun, thinking, "That one\'s looking after me." I wave, now. Every night.',
      ],
    },
    {
      hearts: 10,
      lines: [
        "{name}, I've named a star after you before. Three, I think. This one's different.",
        "I want to share Pip with you. Half each. You can look at it whenever you can't sleep.",
        "It's looked after me all my life. I'd like it to look after you too.",
      ],
      replies: [
        {
          say: "I'll wave every night.",
          back: "Then Pip will have two of us waving. It'll be the best-waved-at planet in the sky.",
        },
        {
          say: 'Half each. Deal.',
          back: "Deal! You can have the half with the moons. I've always thought it was the nicer half.",
        },
      ],
    },
  ],
  boothoven: [
    {
      hearts: 2,
      lines: [
        "{name}, you know I've written nine symphonies. Eight and a half, rather. The ninth is lost.",
        'I wrote it all in one night, the last night I was alive. It was the best thing I ever did.',
        "And in the morning, as a ghost, I found I couldn't remember a note of it. Not one.",
      ],
    },
    {
      hearts: 4,
      lines: [
        "For a hundred years I looked for that symphony. In attics, in libraries, in other people's music.",
        "I'd hear four notes in a street organ and chase it for a mile. Never the right four.",
        'Maude let me search every book in the library. Twice. Most of them were not music.',
      ],
    },
    {
      hearts: 5,
      lines: [
        'The first half of it came back to me here. In McFrancisVille. Do you know where?',
        'Rufus howling at the moon. Agatha humming at her cauldron. Nessa singing on the lake at dusk.',
        "Four bars from each. I wrote them down on a napkin at Wrapunzel's. They fit together.",
        "That's my eight and a half. The town gave the half back. Bit by bit.",
      ],
    },
    {
      hearts: 8,
      lines: [
        "{name}, I've been thinking. Perhaps I never forgot the ninth. Perhaps I never finished it.",
        'Perhaps that night I wrote what I had, and the rest was waiting for something I had not heard yet.',
        "Since you came, I've written another page. And another. It's coming back. Faster. Fortissimo.",
      ],
    },
    {
      hearts: 10,
      lines: [
        "{name}, it's done. The ninth. Finished, after two hundred years.",
        'The last movement is a new theme. Warm. Cheerful. A little bit silly. A tune for a best friend.',
        'I should like the first person to hear it to be you. Before the town. Before anyone.',
      ],
      replies: [
        {
          say: 'Play it for me.',
          back: "Then sit, sit! The candles will dance. Listen for your theme. You'll know it. It's you.",
        },
        {
          say: 'Will it have a part for Rufus?',
          back: "A howling solo in the third movement! He'll be insufferable! Oh, {name}, I adore you.",
        },
      ],
    },
  ],
  scarah: [
    {
      hearts: 2,
      lines: [
        "{name}, can I tell you about the night I woke up? The harvest moon? It's my favourite story.",
        "I'd been standing in the far field for years. Arms out. Very still. Not thinking much.",
        "Then the biggest, orangest moon I've ever seen came up over the barn. And I sneezed.",
      ],
    },
    {
      hearts: 4,
      lines: [
        'It was the straw in my nose. The moonlight tickled it. I sneezed so hard my hat flew off.',
        'Cornelius was sitting on my hat at the time. He flew off too. He said "Pumpkin." His first word.',
        'We just looked at each other for a long while. Then I said, "Hello." My first word.',
      ],
    },
    {
      hearts: 5,
      lines: [
        "I didn't know what to do, so I did what I'd seen the farmers do. I picked the corn.",
        'All night, by the harvest moon. Every row. I was so slow. Arms out is not a good way to pick.',
        'By morning the whole field was in. The farmer came out, saw me, and fainted. Gently. Into a bale.',
        "When he came round, he made me a cup of tea. We're still friends. He's ever so old now.",
      ],
    },
    {
      hearts: 8,
      lines: [
        '{name}, sometimes I worry. What if I only woke up for one harvest moon, and one day I just… stop?',
        'Agatha says no. She says things that wake up by accident tend to stay awake on purpose.',
        "And I think she's right. Every harvest moon, I feel a little more awake. More me.",
        "This year I'll have been awake for the best one yet. Because you're here for it.",
      ],
    },
    {
      hearts: 10,
      lines: [
        '{name}, next harvest moon, will you come and stand in the far field with me? Just for a bit?',
        "We'll put our arms out, and look up, and see if anything tickles. Cornelius will sit on your hat.",
        "I've never had anyone to share it with. Not someone who could stand in a field and mean it.",
      ],
      replies: [
        {
          say: "I'll be there. Arms out.",
          back: 'Arms out! Oh, {name}. I might sneeze from happiness. Stand well back. Or not!',
        },
        {
          say: 'Can Cornelius sit on my hat?',
          back: '"Pumpkin!" …That means yes. That means very much yes. He\'s been hoping you\'d ask.',
        },
      ],
    },
  ],
};
