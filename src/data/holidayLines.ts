import type { VillagerId } from '../types/ids';
import type { HolidayId } from './calendar';

/**
 * What each neighbour says first on a holiday (phase U), unless it's one of her own days, which
 * comes first. `{name}` is her name. Cody calls her babe, as ever.
 */
export const HOLIDAY_LINES: Record<HolidayId, Record<VillagerId, string>> = {
  newYear: {
    cody: "Happy New Year, babe! First kiss of the year: done. Second one's whenever you're ready.",
    maude:
      "Happy New Year, {name}! I've made a resolution to haunt more quietly. It's going well. Boo.",
    rufus:
      "HAPPY NEW YEAR! I went in the pond this morning! It's a tradition! I started it this morning!",
    wrapunzel:
      'Happy New Year, my darling. Another year! I have seen a few thousand of them, and I still love a fresh one.',
    agatha:
      "Happy New Year, {name}. I read the year's tea leaves. They said 'lovely', and 'more biscuits'.",
    barty: 'Happy New Year, {name}! New year, new seeds. Same old bones, mind you.',
    ollie:
      "Happy New Year, {name}! I've a whole new year of post to deliver. I've started a list. It's a long list.",
    nessa: 'Happy New Year, {name}. The lake was so still at midnight. Every firework twice.',
    gourdon:
      "New year, {name}. Fresh timber. Measure twice, cut once. That's my resolution. Every year.",
    hazel:
      "Happy New Year, {name}! The Earth's gone all the way round the Sun again. Clever old thing.",
  },
  valentines: {
    cody: "Happy Valentine's, babe. I'd give you my heart, but you've had it for years. Check your mailbox.",
    maude:
      "Happy Valentine's Day, {name}! I've written a love poem to a book. It's going very well.",
    rufus:
      "HAPPY VALENTINE'S! I sold every rose in the shop by nine! Then I bought one back! It's for you!",
    wrapunzel:
      "Happy Valentine's Day, my darling. Heart-shaped everything today. Even the bread. Especially the bread.",
    agatha:
      "Happy Valentine's, {name}. I don't do love potions. Well. Not on a Tuesday. What day is it?",
    barty:
      "Happy Valentine's, {name}! Grew a heart-shaped pumpkin for the occasion. Well. Heart-ish.",
    ollie:
      "Happy Valentine's! {name}, it's the busiest day of my year. Half these cards are from Cody. To you.",
    nessa: "Happy Valentine's Day, {name}. I lit the lanterns pink last night. Just a little pink.",
    gourdon:
      "Happy Valentine's, {name}. Carved a heart into a bench. Good, deep grain. Lasts forever.",
    hazel:
      "Happy Valentine's Day! Did you know there's a star that's really two stars going round each other? Like you and Cody.",
  },
  stPatricks: {
    cody: "Happy St Paddy's, babe. I'm wearing green socks. That's as far as I'm going. Don't look at them.",
    maude:
      "Happy St Patrick's Day, {name}! Ghosts go very green if you ask them nicely. I'm a sort of mint.",
    rufus: "HAPPY ST PATRICK'S! I dyed my fur green! Only a little bit! Mostly my ears!",
    wrapunzel:
      "Happy St Patrick's Day, dear! Green icing on everything. I had to buy a bucket of it.",
    agatha:
      "Happy St Patrick's, {name}. I've been looking for a four-leaf clover all morning. Found three. With three leaves.",
    barty:
      "{name}, top o' the morning! The shamrocks are up in the graveyard garden. Very lucky, shamrocks.",
    ollie:
      "Happy St Patrick's Day! I've a green satchel on today, {name}. Very festive. Very official.",
    nessa: "Happy St Patrick's Day, {name}. I'm green every day. Today it's finally the fashion.",
    gourdon:
      "Happy St Patrick's, {name}. I'm an orange fella. Green's not my colour. Wearing it anyway.",
    hazel:
      "Happy St Patrick's Day! {name}, look for the green star tonight. It's there if you squint.",
  },
  easter: {
    cody: "Happy Easter, babe! Barty hid eggs all over town. I found one. I ate it. Don't tell Barty.",
    maude:
      'Happy Easter, {name}! There are eggs hidden all over town. I saw where two went, but my lips are sealed.',
    rufus:
      "HAPPY EASTER! There are EGGS! Hidden EVERYWHERE! I'm not allowed to find them. I've been told. Twice.",
    wrapunzel:
      "Happy Easter, my darling! Barty's egg hunt is on. Chocolate eggs, dear, and I made every one.",
    agatha:
      'Happy Easter, {name}. Barty hid the eggs this year, so some of them are probably planted. Look in the soil.',
    barty:
      "Happy Easter, {name}! I've hidden eight eggs round town. Under trees, by the graves, that sort of thing. Happy hunting!",
    ollie:
      "Happy Easter, {name}! I've spotted an egg or two on my round. I'll say no more. Postie's honour.",
    nessa:
      'Happy Easter, {name}. Barty asked if he could hide an egg in the lake. I said please no.',
    gourdon: 'Happy Easter, {name}. Built Barty a basket for the eggs. Oak. Overbuilt. Suits him.',
    hazel:
      "Happy Easter! Easter follows the full moon, did you know? The moon's in charge of the chocolate.",
  },
  fourthOfJuly: {
    cody: "Happy Fourth, babe! Fireworks over the pond tonight. I'll hold your hand. And the bats' ears.",
    maude:
      'Happy Fourth of July, {name}! Fireworks tonight. I go right through them. Very festive, very tingly.',
    rufus:
      "HAPPY FOURTH! FIREWORKS! I love fireworks! I'm scared of fireworks! I'm going to watch ALL of them!",
    wrapunzel:
      'Happy Fourth, dear! I made a flag cake. The blueberries kept rolling off. So did the stars.',
    agatha:
      "Happy Fourth of July, {name}. I've charmed the fireworks to go 'ooh' on their own. Saves everyone a job.",
    barty:
      'Happy Fourth, {name}! Picnic by the pond tonight. Bring a blanket. I bring a very long blanket.',
    ollie:
      'Happy Fourth of July, {name}! No post today. Well, a little post. I missed it. The post, I mean.',
    nessa:
      "Happy Fourth, {name}. The fireworks look twice as good on the water. I'll be watching from the lake.",
    gourdon:
      'Happy Fourth, {name}. Built the picnic tables. Sturdy. You could dance on them. Please do not.',
    hazel: 'Happy Fourth! {name}, fireworks are just stars in a hurry. Loud, impatient stars.',
  },
  halloween: {
    cody: "Happy Halloween, babe! It's Halloween every day here, but today it's official. Trick or treat!",
    maude:
      'Happy Halloween, {name}! My favourite day. Everyone dresses up as a ghost and I finally blend in. Here, a treat!',
    rufus:
      'HAPPY HALLOWEEN! Trick or treat! No, wait, you say that! I give you the treat! Here! Take it!',
    wrapunzel:
      'Happy Halloween, my darling! I dressed up as a mummy. Nobody noticed. Have a treat, dear.',
    agatha:
      "Happy Halloween, {name}. The busiest night of a witch's year. I've a treat for you. Not a trick. This year.",
    barty:
      'Happy Halloween, {name}! I dressed up as a skeleton. Took no time at all. Here, a treat!',
    ollie:
      'Happy Halloween, {name}! Trick or treat! I always carry treats on my round. Postie tradition.',
    nessa: 'Happy Halloween, {name}. I lit every lantern orange. Here, I saved you a treat.',
    gourdon:
      "Happy Halloween, {name}. It's my day, really. Everyone carves a face like mine. Have a treat.",
    hazel:
      'Happy Halloween! The stars are extra twinkly tonight, {name}. They love a costume. Have a treat!',
  },
  thanksgiving: {
    cody: "Happy Thanksgiving, babe. I'm thankful for you. Every single day. Also pie. You, then pie.",
    maude:
      "Happy Thanksgiving, {name}! I'm thankful for my books, my friends, and you. Not in that order.",
    rufus: "HAPPY THANKSGIVING! I'm thankful for EVERYTHING! Especially gravy! And you! And gravy!",
    wrapunzel:
      "Happy Thanksgiving, my darling. There's dinner in the square tonight. I've baked nine pies. Ten, now.",
    agatha:
      "Happy Thanksgiving, {name}. I'm thankful for good neighbours. You'll do nicely. Better than nicely.",
    barty:
      'Happy Thanksgiving, {name}! Thankful for a good harvest, and a good friend to share it with.',
    ollie:
      "Happy Thanksgiving, {name}! I'm thankful for a town that writes so many letters. Truly. I'm not tired at all.",
    nessa: "Happy Thanksgiving, {name}. I'm thankful I moved here. I'm thankful you said hello.",
    gourdon:
      'Happy Thanksgiving, {name}. Built the long table for tonight. Seats everyone. I measured.',
    hazel:
      "Happy Thanksgiving! I'm thankful for clear skies, warm pie, and friends to point at the stars with.",
  },
  christmasEve: {
    cody: "It's Christmas Eve, babe! Skelly wants to know if he's on the nice list. He is. So are you.",
    maude:
      'Merry Christmas Eve, {name}! Carols by the well tonight. I sing the high notes. The very high notes.',
    rufus: "IT'S CHRISTMAS EVE! I can't sleep! It's the afternoon! I still can't sleep!",
    wrapunzel:
      "Christmas Eve, my darling! Gingerbread in the oven, and a carol on the radio. Everything's just so.",
    agatha:
      "Happy Christmas Eve, {name}. Something landed on my roof last night. I've decided it was a reindeer.",
    barty:
      'Christmas Eve, {name}! Snow on the gravestones. Prettiest the graveyard garden looks all year.',
    ollie:
      "Merry Christmas Eve, {name}! Last post before Christmas. I've never carried so many parcels. Or so happily.",
    nessa:
      'Merry Christmas Eve, {name}. The lake froze a little at the edges. It looks like sugar.',
    gourdon: "Christmas Eve, {name}. Made a sleigh. Just in case. You never know who's coming by.",
    hazel:
      "Merry Christmas Eve! {name}, I'll be watching the sky all night. In case anything's flying about.",
  },
  christmas: {
    cody: "Merry Christmas, babe. You're my favourite present. Every year. The wrapped ones are a close second.",
    maude:
      "Merry Christmas, {name}! I got a book for Christmas. I've read it twice. I'm starting again.",
    rufus:
      "MERRY CHRISTMAS! I got a ball! It squeaks! Listen! …Okay, it's in my mouth now. Merry Christmas!",
    wrapunzel:
      'Merry Christmas, my darling! Did you get your tree? I made the baubles. Every one a little different.',
    agatha:
      'Merry Christmas, {name}. I charmed the lights on your tree. They twinkle when you smile. Try it.',
    barty:
      "Merry Christmas, {name}! Grew that little tree myself. Black as midnight. Isn't she lovely?",
    ollie:
      "Merry Christmas, {name}! No round today. I'm just walking about saying Merry Christmas. It's great.",
    nessa:
      'Merry Christmas, {name}. Snow on the lake, and every lantern lit. It feels like a card.',
    gourdon:
      'Merry Christmas, {name}. Made everyone a little wooden bat. Yours is the one that smiles.',
    hazel:
      "Merry Christmas! There was a very bright star over McFrancisVille last night, {name}. I'm sure of it.",
  },
  newYearsEve: {
    cody: "Last night of the year, babe. Fireworks at midnight by the well. I'm saving you the midnight kiss.",
    maude:
      "Happy New Year's Eve, {name}! We're counting down by the well tonight. I've been practising my numbers.",
    rufus:
      "NEW YEAR'S EVE! I'm going to stay up till midnight! I stay up till midnight every night! But this one COUNTS!",
    wrapunzel:
      "New Year's Eve, my darling! Come to the well tonight. I've made little cakes with sparklers in.",
    agatha:
      "Happy New Year's Eve, {name}. I've a spell for midnight. It makes the fireworks rhyme. Mostly.",
    barty:
      "New Year's Eve, {name}! Another year of growing things. Here's to the next. See you at the well!",
    ollie:
      "Happy New Year's Eve, {name}! I've delivered every letter of the year. Every one! I'm having a lie down.",
    nessa:
      "Happy New Year's Eve, {name}. I'll be at the well tonight. With everyone. Even though it's loud.",
    gourdon:
      "New Year's Eve, {name}. Built the countdown clock. It counts backwards. That's the whole idea.",
    hazel:
      "Happy New Year's Eve! {name}, at midnight the whole sky turns over a new page. Well. It feels like it.",
  },
};
