# McFrancisVille: the art style

The rules for drawing at 32 pixels a tile (decision 79), from phase C on. The user checked the
scale sheet (`src/sprites/scaleSheet.ts`) on the phone on 2026-09-27 and locked the style in. A sprite drawn to these
rules should sit beside every other one without looking pasted in. Where a rule and a sprite
disagree, change the sprite, or change the rule here first and say why.

**The look in one line:** spooky-cute, soft and warm. Rounded shapes, friendly faces, candlelit
colour, and a Halloween town that's always glad to see her. Nothing is scary, gory or sharp.

## Where it takes its cues

No one game's look is copied (personal_touches.md, "The look, and the scale sheet"). Each of the
games she loves lends a cue, and the 3D ones are reimagined as 2D sprites:

| Game                         | The cue it lends                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Animal Crossing              | Chunky rounded silhouettes, big heads, a town of little houses with their own yards. |
| Stardew Valley               | Rich, warm ramps that shift hue; tiles that read clearly; clutter placed by hand.    |
| Dreamlight Valley            | Soft glowing light, sparkles on anything magic, a dusky-but-cozy night.              |
| Hello Kitty Island Adventure | Candy colours kept soft; simple, very cute faces.                                    |
| Tomodachi Life               | Faces that show a mood at a glance: big eyes, small mouths, blush.                   |
| Pokopia                      | Round, friendly creature shapes, and a world built out of chunky, readable blocks.   |

## Sizes

- **A tile is 32×32.** The world measures in tiles; the renderer scales by a whole number of
  device pixels (decision 86). About 16 tiles show across a phone's short side.
- **Characters are 32×48, chibi** (decision 79): feet on the bottom row, centred on the tile
  they stand on, about a tile and a half tall.
  - Head (with hair) rows 0–23: about 24 of the 48 rows, and 22–26 pixels wide, the widest part.
  - Body rows 24–47: shoulders at 24, waist near 34, legs to 44, feet 45–47. The body is 12–14
    pixels wide; arms are 3–4 pixels wide and end in a 3-pixel mitten of a hand.
  - Eyes sit low on the face (rows 13–18): each 3–4 wide and 5 tall, 5–6 pixels apart, with a
    one-pixel highlight at the top left. A mouth is 1–3 pixels. Cheeks get a 2-pixel blush.
- **Buildings are 4–6 tiles wide** (128–192 px) and about as tall with the roof. A door is at
  least 28 wide and 52 tall, so she fits through it with room over her head: a door is a door.
- **Trees** are 2–3 tiles wide and 3–4 tall. Rocks, pumpkins and bushes stay within a tile or two.
- **Pets and critters** keep their proportion to her: a dog's back comes to her waist, a moth
  fits in her hand (critters can be drawn a little big, so they read).
- **The yard skeleton** (her house, from phase G) is about three times her height and stands
  over the eaves, up toward the ridge: 12 feet in a world where she is chibi.

## Light and shadow

- **Light comes from the top left**, a little in front. Tops and left edges catch it, bottoms and
  right edges fall into shade. `Sketch.sphere` and `Sketch.bevel` both follow this.
- **Cast shadows fall down and to the right**, like the hedges' in `ground.ts`. Something standing
  gets a soft, flat ellipse under its feet, drawn by the renderer (`shadow` on a drawable, or the
  ground's baked shadows), never painted into the sprite.
- **Don't paint the night into a sprite.** The time of day is a light map over the whole frame
  (decision 34). A sprite is drawn in daylight; what lights up after dark goes in its `glow`
  palette, and a pool of lamplight is a `light`.

## Colour

- **Every colour is in `src/sprites/palette.ts`**, and nothing else writes a hex (decision 3).
- **Ramps have five tones**, darkest first, made by `ramp(base)`: shadows lean toward the night's
  plum and lights toward candlelight, so a ramp shifts hue rather than just greying. Most
  materials use three or four of the five; the lightest is for a highlight, not a fill.
- **A sprite uses few ramps:** a character is skin, hair, two or three clothes, and accents.
  A building is walls, roof, trim, windows and door.
- **Keep it soft.** Saturated colour is for accents (a pumpkin, a door, a flower), on a ground of
  dusky greens, plums and warm stone. Black is never a fill: the darkest colour is `ink`, and
  it's a plum.

## Outlines

- **Soft, coloured outlines.** A shape's outline is the darkest tone of its own ramp, not black,
  so a pink-haired head has a deep pink edge and a green tree a deep green one
  (`Sketch.outline`, from the mask of what's painted).
- **Inside lines only where two shapes need separating** (an arm across a body, a door in a wall),
  in the darker of the two's second tone.
- **Never outline a glow, a light, water's surface or a shadow.**
- One pixel wide, always. Corners are rounded by leaving out the corner pixel.

## Texture and dithering

- **Dither sparingly:** only on big, soft surfaces (a tree's canopy, a roof's tiles, deep water,
  a night sky), to step between two tones without a hard band. `Sketch.sphere(…, { dither: true })`
  and `Sketch.dither` do it.
- **Never dither a face, hands or anything small.** A character's clothes are flat tones with a
  shaded side.
- **The ground is calmer than what stands on it.** Tiles use low contrast and sparse detail, so
  characters and props read against them.

## Faces and characters

- **Friendly first.** Every face is a face you'd want to wave at. Monsters are cute: fangs are
  two white pixels, claws are rounded, a skeleton smiles.
- **Her** is the most detailed character on screen. Neighbours are drawn from the same body and
  parts (decision 27), so they share her proportions.
- **Clothes are painted onto body regions** (`src/sprites/doll.ts`, decision 88): a short sleeve
  is her upper arm, a ¾ sleeve reaches her elbow, a long one her forearm. Each layer gets its
  own light and soft outline from `finish`, so a new cut paints regions and never draws lines.
- **Idle and moods** move whole pixels: a bob is one pixel, a blink is one frame.

## Spiders

She finds spiders frightening, and they are still in the game, drawn gently
(personal_touches.md):

- **Round, big-eyed and a little fuzzy:** a round body with a dithered fuzzy edge, two big shiny
  eyes (sometimes a bow or a hat), and short, stubby, bent legs, four a side, like a plush toy's.
- **Never realistic legs, fangs, hairs or a menacing pose.** Nothing hunched, nothing with
  pincers.
- **Never a surprise.** A spider doesn't jump out, crawl toward her, drop onto her, or appear
  without warning. They sit in their webs, dangle slowly on a thread, or potter where they can be
  seen from afar. A web is lacy decoration.

## Animation

- Two to four frames, gentle and slow: a walk is two steps a tile, a flutter a few frames.
- Anything that moves does so by whole pixels, and nothing shimmers (decision 85).
- Small life in the world (phase L) is subtle: water glints, smoke curls, grass sways by a pixel.

## Making art

1. Sketch it with the helpers in `src/sprites/sketch.ts` (shapes, `sphere`, `bevel`, `outline`,
   `dither`, `stamp`, `mirrorX`) or type the grid, whichever is clearer. The result is always a
   grid of semantic keys and a palette (decision 2), so it recolours by palette swap.
2. Add it to the catalogue (`src/sprites/catalogue.ts`), which the gallery and the test that draws
   everything read from.
3. Look at it: `npm run sprite -- <name>` writes a PNG to `.sprites/`, and `?gallery` shows it on
   the phone, the scale sheet first and at the size the game draws it.

## Version 0's art, until it's redrawn

The redraw is staged (decision 79). Until a sprite is redrawn at 32, its old 16-pixel grid is
baked at 2× in the world (`bakeOld` and `old(n)`, `src/render/legacy.ts`, decision 86). A phase
that redraws a sprite deletes its `bakeOld` and `old` calls, and `grep -rn "old(" src/render`
shows what's left.
