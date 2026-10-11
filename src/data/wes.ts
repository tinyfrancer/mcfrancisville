/**
 * Wes, once he stops running (V1's P3a, decision 302). The first three times she gets near he
 * scarpers; after the third he stays behind his tree for a chat, and turns out to be the mayor's
 * nervous assistant, checking the town is ready. No schedule, no house, no hearts: he still only
 * lurks, now and then, by the trees, and what he says grows with the days she has stopped to chat.
 * `{name}` is her name.
 */

/** How many times she gets near him, and he runs, before he stays for a chat. */
export const WES_GLIMPSES = 3;

/** What he says, by how well they know each other: the days she has chatted with him. */
export type WesBand = 'hello' | 'friend' | 'close';

/** From how many days of chats he is a friend, and then close. */
export const WES_FRIEND_CHATS = 3;
export const WES_CLOSE_CHATS = 8;

/** What she reads as he runs off the third time: next time he'll stay. */
export const WES_STAYS =
  'Wes scarpers, stops, and creeps halfway back. "Next time," he whispers, very loudly, ' +
  '"I\'ll stay for a chat. I\'ve been told to."';

/** The first chat, one line after another: the creeper owns up. */
export const WES_FIRST: readonly string[] = [
  "Oh! Hello. You can see me. Of course you can see me, I'm behind a tree. A thin one. I should have picked a fatter tree.",
  "I'm Wes. You knew that. Everyone knows that. I'm very well known for not being seen.",
  "The truth is, {name}, I'm not a creeper. I'm an assistant. The mayor's assistant. Was that a secret? It was meant to be a secret.",
  "The mayor asked me to check the town was ready. For something. I can't say what. I've sworn on my hat.",
  "So I check. Behind trees, mostly. It's going very well, apart from the hiding. Please don't tell the mayor I told you. I'll tell them myself. Eventually.",
];

/** A line a talk after the first, a day's lines in turn. */
export const WES_TALK: Record<WesBand, readonly string[]> = {
  hello: [
    "Hello, {name}. I'm not lurking. I'm assisting. From behind a tree. It's a technique.",
    'The mayor says I should practise talking to people. This counts. Please say this counts.',
    'I have a clipboard under this coat. Bridges: sturdy. Pumpkins: enormous. Neighbours: lovely. Me: hidden. Mostly.',
    "Maude says I've had a library book out for eleven years. I'm a slow reader. And I'm scared of Maude.",
    'Is my hat on straight? I pull it down so nobody recognises me. Everybody recognises me.',
    "I'm meant to be checking the fountain. I've checked it. It's a fountain. It fountains beautifully.",
    "Don't mind me, {name}. I'll just be here. Behind this. Being an assistant.",
  ],
  friend: [
    'Ollie leaves my letters behind trees. I find them. It works for both of us.',
    "I asked Gourdon for a bigger tree to hide behind. He doesn't build trees. I had to ask.",
    "Agatha calls me the creeper. I've decided to take it as a nickname. A fond one. I hope it's a fond one.",
    "{name}, you're the only person who waits for me to finish hiding before you say hello. It means a lot.",
    "The mayor's very proud of the town, you know. And of you. They say so in their letters. I've seen the drafts. There are a lot of drafts.",
    "I used to run off because I'm shy. Now I stay because I'm shy and you're nice. It's progress.",
    'I nearly said hello to Rufus yesterday. He wagged so hard he fell over. So did I. Out of the tree.',
  ],
  close: [
    "{name}, I've stopped hiding from you altogether. I only hide from everyone else now. It's a big step.",
    "You're a good friend to a man behind a tree. I've told the mayor. They said they're not surprised.",
    "The mayor's shy too, you know. Shyer than me. I know! Hard to believe. Be gentle when you meet them.",
    "I keep a list of the town's best things. You're at the top. Above the pumpkins. Don't tell the pumpkins.",
    "My mum always said I'd find my people. She didn't say they'd find me behind a tree, but here we are.",
    'When this is all over, I might try standing in the open. Just for a minute. You can stand there with me.',
    'Nobody ever stayed to chat before, {name}. Thank you for staying. And for not minding the moustache.',
  ],
};

/** What he says while the mayor gets ready to say hello, once the chain is done, leading his talk. */
export const WES_READY: readonly string[] = [
  "The mayor's nearly ready, {name}. Nearly. I've ironed the sash twice. It's very hard to iron a sash for a ghost. I mean, for a mayor.",
  "I can't say when. I can say it'll be at the castle. I can't say that either. Forget I said castle.",
  "The mayor's practising their wave. It's coming along. You'll know it when you see it. If you can see it.",
  "Everything's ready but the mayor. The mayor says they're ready. They're under the desk, but they say they're ready.",
];

/** What he says as he hands over the last chapter of the October story, if it's due. */
export const WES_DELIVERS =
  "Oh! This fell out of my coat. It's the last chapter of the mayor's story. For you. I'm only delivering it. Honestly.";
