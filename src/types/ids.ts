/**
 * The id unions. Data is keyed by these through `Record<Id, …>`, so adding an id is a compile error
 * everywhere it has to be answered.
 */
export type TileId =
  'grass' | 'path' | 'water' | 'hedge' | 'bed' | 'cliff' | 'steps' | 'ice' | 'boards';

export type PropId =
  | 'tree'
  | 'rock'
  | 'pumpkin'
  | 'pumpkinPatch'
  | 'filmScreen'
  | 'popcornTable'
  | 'contestStage'
  | 'chiliTable'
  | 'catPumpkin'
  | 'lantern'
  | 'gravestone'
  | 'fence'
  | 'fencePost'
  | 'well'
  | 'homeHouse'
  | 'shopHouse'
  | 'salonHouse'
  | 'roseBush'
  | 'hosta'
  | 'farmSign'
  | 'popUpShop'
  | 'storageChest'
  | 'mailbox'
  | 'bakery'
  | 'moonPieCart'
  | 'willow'
  | 'fountain'
  | 'skelly'
  | 'pottedPlant'
  | 'maudeHouse'
  | 'rufusHouse'
  | 'agathaHouse'
  | 'bartyHouse'
  | 'codyHouse'
  // The places beyond the town (phase I).
  | 'toadstools'
  | 'oldTree'
  | 'floatLantern'
  | 'reeds'
  | 'rowboat'
  | 'mound'
  | 'gatePost'
  | 'castle'
  | 'weddingArch'
  | 'gate'
  // Clutter (phase L).
  | 'bush'
  | 'stump'
  | 'log'
  | 'bench'
  | 'signpost'
  | 'noticeboard'
  | 'candyTree'
  // Where a candy sapling grows into another candy tree (0.2's E1).
  | 'saplingPlot'
  | 'honestyStall'
  | 'barrel'
  | 'hayBale'
  | 'scarecrow'
  // A porch goose in its outfit of the season (0.2's K1).
  | 'goose'
  // Newcomers' houses (phase T), which stand on their lots once they move in, and what stands
  // there until they do.
  | 'ollieHouse'
  | 'nessaHouse'
  | 'gourdonHouse'
  | 'hazelHouse'
  | 'lotSign'
  | 'soldSign'
  | 'movingBoxes'
  // What stands in the square while a holiday's decorations are up (phase U).
  | 'spookyTree'
  | 'heartArch'
  | 'potOfGold'
  | 'eggTree'
  | 'flagPole'
  | 'pumpkinTower'
  | 'harvestTable'
  | 'glitterBall';

/** What's growing in the pots by her door (phase G). */
export type PotPlantId = 'mums' | 'plumMums' | 'succulents' | 'hostas';

/** A patch of wildflowers growing in the grass, picked by walking onto it (phase 4). */
export type PatchId = 'moonpetals' | 'forgetMeBoos' | 'ghostDaisies' | 'milkweed';

/** What she cooks at a stove (phase R): each a thing in her bag, and a recipe of the same name. */
export type DishId =
  | 'pumpkinSoup'
  | 'fishChowder'
  | 'moonpetalCake'
  | 'midnightPlate'
  | 'ghostChili'
  | 'pumpkinPie'
  | 'toadstoolStew'
  | 'roseJam'
  | 'moonflowerTea';

/** Everything that can go in her bag. */
/** The monster dolls she collects (0.2's F2): the game's own, never a brand's. */
export type DollId =
  | 'vampDoll'
  | 'stitchDoll'
  | 'wolfDoll'
  | 'mummyDoll'
  | 'ghostDoll'
  | 'witchDoll'
  | 'gorgonDoll'
  | 'seaDoll';

export type ItemId =
  | 'wood'
  | 'stone'
  | 'moonpetal'
  | 'forgetMeBoo'
  | 'ghostDaisy'
  | 'purseButter'
  | 'midnightPizza'
  | 'batWingCookie'
  | 'pumpkinPudding'
  | 'ghostMallow'
  | 'pumpkin'
  | 'ghostPepper'
  | 'candyCorn'
  | 'batWingBean'
  | 'rose'
  | 'blueRose'
  | 'moonflower'
  | 'snapdragon'
  | 'spiderLily'
  | 'hosta'
  | 'batFlower'
  | 'pumpkinSeed'
  | 'ghostPepperSeed'
  | 'candyCornSeed'
  | 'batWingBeanSeed'
  | 'roseSeed'
  | 'moonflowerSeed'
  | 'snapdragonSeed'
  | 'spiderLilyBulb'
  | 'hostaDivision'
  | 'batFlowerSeed'
  | 'jackOLanternPizza'
  | 'ghostGooBall'
  | 'pumpkinGooBall'
  | 'blueMoonGooBall'
  | 'swampGooBall'
  | 'eyeballSquish'
  | 'booBao'
  | 'xiaoLongBoo'
  | 'batGyoza'
  | DollId
  | 'recordGhoulyParton'
  | 'recordLadyGhoulga'
  | 'recordFleetwoodMacabre'
  | 'recordScreamDion'
  | 'recordBoneJovi'
  | 'recordBoolafonte'
  | 'heartBead'
  | 'loveBeads'
  | 'smileyBead'
  | 'tigerFootballBead'
  | 'scarletFootballBead'
  | 'batBead'
  | 'ghostBead'
  | 'loveBracelet'
  | 'smileyBracelet'
  | 'friendshipBracelet'
  | 'tigersBracelet'
  | 'scarletBracelet'
  | 'spookyBracelet'
  | 'recordWalkTheTomb'
  | 'sprinkler'
  | 'burritoBowl'
  | 'moonPie'
  | 'moonPieMini'
  | 'fibisBone'
  | 'iceSkates'
  // Her broom home, from Agatha (0.2's P1).
  | 'broom'
  // Dropped by the candy tree now and then, to plant in her yard (0.2's E1).
  | 'candySapling'
  | 'toadstool'
  | 'milkweed'
  | 'castleKey'
  // The holidays (phase U): eggs hunted at Easter, treats handed round, the castle hall's key.
  | 'chocolateEgg'
  | 'chocolateHeart'
  | 'shamrock'
  | 'icePop'
  | 'gingerbreadBat'
  | 'hallKey'
  // October's sweets (0.2's J2), handed out at the neighbours' doors.
  | 'gummyCluster'
  | 'chewyDots'
  | 'sourGhouls'
  // The pick of the pumpkin patch (0.2's J3), for carving, and film night's popcorn.
  | 'patchPumpkin'
  | 'popcorn'
  // The Halloween party's white chicken chili (0.2's J4).
  | 'whiteChickenChili'
  | DishId
  | CritterId;

/**
 * The critters she catches with her net (phase 10), and the fish with her rod (phase Q). Each is
 * also something in her bag, so it can be kept, sold, given or donated like anything else she
 * carries.
 */
export type CritterId =
  | 'lunaMoth'
  | 'candleMoth'
  | 'owlEyeMoth'
  | 'ghostMoth'
  | 'pumpkinBat'
  | 'velvetBat'
  | 'vampireBat'
  | 'lilyFrog'
  | 'pumpkinToad'
  | 'glowToad'
  | 'greenOrb'
  | 'blueOrb'
  | 'orbPair'
  | 'skullBeetle'
  | 'jewelBeetle'
  | 'firefly'
  | 'ghostMinnow'
  | 'booKoi'
  | 'lanternFish'
  // Beyond the town (phase I): the woods, the shore, the hidden clearing and the castle hill.
  | 'toadstoolToad'
  | 'mossBeetle'
  | 'wisp'
  | 'mistNewt'
  | 'moonCarp'
  | 'ghostPike'
  | 'lanternBat'
  | 'wishingMoth'
  | 'monarch'
  // Out only in their weather (phase L).
  | 'raindropFrog'
  | 'veilMoth'
  // Caught with her rod (phase Q).
  | 'pumpkinseed'
  | 'catfish'
  | 'fogEel'
  | 'blueMoonfish'
  // Out by day, and the top of the Cabinet (0.2's F1).
  | 'tombstoneToad'
  | 'mourningCloak'
  | 'reedFrog'
  | 'ladybug'
  | 'herculesBeetle'
  | 'axolotl'
  | 'glowJelly';

/** What grows in her garden beds (phase 5). */
export type CropId =
  | 'pumpkin'
  | 'ghostPepper'
  | 'candyCorn'
  | 'batWingBeans'
  | 'rose'
  | 'moonflower'
  | 'snapdragon'
  | 'spiderLily'
  | 'batFlower'
  | 'hosta';

export type Facing = 'down' | 'up' | 'left' | 'right';

/**
 * What she does standing still (personal_touches.md, "Her, drawn bigger"): her phone or her arms
 * crossed while she waits, and devil horns and a head-bang, rocking out at the big moments. And
 * sitting (0.2's G1), the one pose that can face away from us.
 */
export type Pose = 'phone' | 'arms' | 'horns' | 'bang' | 'pinup' | 'sit';

/** Her look (phase 3). A body choice is made in the creator; hair changes at the Muse Salon. */
export type SkinId = 'porcelain' | 'peach' | 'honey' | 'bronze' | 'umber' | 'ghostly' | 'minty';

export type EyeId = 'brown' | 'blue' | 'green' | 'hazel' | 'grey' | 'plum';

export type HairStyleId = 'splitBob' | 'long' | 'bob' | 'bunches' | 'pixie';

export type HairColourId =
  | 'pink'
  | 'darkBrown'
  | 'blonde'
  | 'coral'
  | 'brown'
  | 'black'
  | 'auburn'
  | 'blue'
  | 'lavender'
  | 'silver';

export type TattooId = 'sleeves' | 'scattered';

/**
 * Where a piece of clothing is worn. A dress is worn as the top and leaves no room for a bottom;
 * `outer` goes on over the top (a jacket, a cape) and `tights` under the bottom (0.2's W3).
 */
export type Slot =
  'top' | 'bottom' | 'shoes' | 'hat' | 'necklace' | 'glasses' | 'gloves' | 'outer' | 'tights';

/** How a piece is drawn on the doll. Many outfits share a cut and differ by colour and print. */
export type CutId =
  | 'tee'
  | 'jersey'
  | 'sundress'
  | 'collarDress'
  | 'jeans'
  | 'cutoffs'
  | 'pleatedSkirt'
  | 'sneakers'
  | 'boots'
  | 'maryJanes'
  | 'heels'
  | 'platforms'
  | 'flats'
  | 'tallBoots'
  | 'sandals'
  | 'beanie'
  | 'witchHat'
  | 'catEars'
  | 'chainPendant'
  | 'pearls'
  | 'roundGlasses'
  | 'catEyeGlasses'
  | 'threeQuarterTee'
  | 'flowerCrown'
  | 'sunHat'
  // The Halloween Festival's costumes (0.2's J2).
  | 'explorerHat'
  | 'antennae'
  | 'wings'
  | 'topHat'
  | 'jacket'
  | 'mane'
  | 'turtleneck'
  | 'squareGlasses'
  // A fuller closet (0.2's W2).
  | 'hoodie'
  | 'leggings'
  | 'cardigan'
  | 'overalls'
  | 'pomBeanie'
  | 'skaterSkirt'
  | 'gloves'
  | 'bigTee'
  | 'longTee'
  | 'wellies'
  | 'joggers'
  | 'hairBow'
  | 'sweats'
  // Cooler clothes to buy (0.2's W3).
  | 'corset'
  | 'tulleSkirt'
  | 'fishnets'
  | 'tights'
  | 'moto'
  | 'denimJacket'
  | 'operaCoat'
  | 'velvetDress'
  | 'gown'
  | 'spacesuit'
  | 'helmet'
  | 'tiara'
  | 'platformBoots'
  | 'cape'
  | 'batWings'
  | 'wraps'
  | 'horns';

export type OutfitId =
  | 'teeGhoulyParton'
  | 'teeLadyGhoulga'
  | 'teeFleetwoodMacabre'
  | 'teeScreamDion'
  | 'cozyTee'
  | 'jerseyTigers'
  | 'sundressFloral'
  | 'sundressGingham'
  | 'wednesdayDress'
  | 'jeans'
  | 'cutoffs'
  | 'pleatedSkirt'
  | 'sneakers'
  | 'stompyBoots'
  | 'maryJanes'
  | 'pumpkinBeanie'
  | 'batPendant'
  | 'moonLocket'
  | 'pearlStrand'
  | 'roundGlasses'
  | 'catEyeGlasses'
  | 'teeBoneJovi'
  | 'jerseyScarlet'
  | 'sundressDots'
  | 'glitterHeels'
  | 'velvetPumps'
  | 'platformMaryJanes'
  | 'batBowFlats'
  | 'rhinestoneBoots'
  | 'kneeHighBoots'
  | 'moonbeamSandals'
  | 'witchHat'
  | 'catEars'
  | 'skeletonTee'
  | 'jackOLanternDress'
  | 'bookwormTee'
  | 'flowerCrown'
  | 'crumbsTee'
  | 'starryDress'
  | 'strawSunHat'
  | 'maroonTee'
  | 'manyColoursCoat'
  | 'postieTee'
  | 'bubbleDress'
  | 'flannelShirt'
  | 'nightSkyTee'
  // The pop-up's Halloween shelf (0.2's J2): three costumes for two.
  | 'bugCatcherHat'
  | 'bugCatcherShirt'
  | 'butterflyAntennae'
  | 'butterflyWings'
  | 'ringmasterHat'
  | 'ringmasterCoat'
  | 'lionMane'
  | 'clueTurtleneck'
  | 'clueGlasses'
  | 'scaredyTee'
  // The fuller closet from the first day (0.2's W2).
  | 'cozyHoodie'
  | 'leggings'
  | 'mothCardigan'
  | 'overalls'
  | 'bobbleBeanie'
  | 'skaterSkirt'
  | 'gardenGloves'
  | 'comfyShirt'
  | 'stripyTee'
  | 'rainBoots'
  | 'joggers'
  | 'hairBow'
  | 'sweatpants'
  // Cooler clothes to buy (0.2's W3): Cobweb Corner's clothes, its weekly boutique, and the
  // pop-up's Halloween shelf.
  | 'walkTheTombHoodie'
  | 'corsetTop'
  | 'tulleSkirt'
  | 'fishnets'
  | 'stripyTights'
  | 'motoJacket'
  | 'denimJacket'
  | 'batSkirt'
  | 'velvetDress'
  | 'operaCoat'
  | 'ballGown'
  | 'tiara'
  | 'spaceSuit'
  | 'spaceHelmet'
  | 'platformBoots'
  | 'vampireCape'
  | 'batWings'
  | 'mummyWraps'
  | 'devilHorns';

/** The colours a piece of clothing comes in. Every piece that recolours comes in a blue. */
export type FabricId =
  | 'blue'
  | 'navy'
  | 'sky'
  | 'denim'
  | 'rose'
  | 'coral'
  | 'cream'
  | 'plum'
  | 'lavender'
  | 'ink'
  | 'moss'
  | 'teal'
  | 'pumpkin'
  | 'silver'
  | 'gold'
  | 'scarlet'
  | 'maroon';

/** Where she can buy things (phase 6): Cobweb Corner, and the pop-up that wanders about town. */
export type ShopId = 'corner' | 'popUp' | 'moonPie';

/**
 * Furniture for her home (phase 7): pieces that stand on the floor, rugs that lie on it, and
 * pieces that hang on the wall.
 */
/** What finishing a shelf or a wing sends her (0.2's F2). */
export type MilestonePiece =
  | 'framedMoth'
  | 'framedBat'
  | 'framedFrog'
  | 'framedOrb'
  | 'framedBeetle'
  | 'framedFish'
  | 'mothDome'
  | 'batDome'
  | 'frogDome'
  | 'orbDome'
  | 'beetleDome'
  | 'fishDome'
  | 'squishyShelf'
  | 'dollHouse';

/** A shelf to finish (0.2's F2): a family caught, a season's own, a wing of the museum, a set. */
export type MilestoneId =
  | 'moths'
  | 'bats'
  | 'frogs'
  | 'orbs'
  | 'beetles'
  | 'fish'
  | 'autumn'
  | 'winter'
  | 'spring'
  | 'summer'
  | 'mothWing'
  | 'batWing'
  | 'frogWing'
  | 'orbWing'
  | 'beetleWing'
  | 'fishWing'
  | 'squishies'
  | 'dolls';

export type FurnitureId =
  | 'batBed'
  | 'twoHeadedDuck'
  | 'pumpkinChair'
  | 'coffinBookshelf'
  | 'cauldron'
  | 'batLamp'
  | 'marbleRun'
  | 'recordPlayer'
  | 'monstera'
  | 'snakePlant'
  | 'venusFlytrap'
  | 'succulents'
  | 'skeletonFriend'
  | 'candelabra'
  | 'crystalBall'
  | 'tombstone'
  | 'moonRug'
  | 'spiderwebRug'
  | 'ghostPortrait'
  | 'catPortrait'
  | 'moonPainting'
  | 'batClock'
  | 'wallShelf'
  | 'pothos'
  | 'gothicMirror'
  | 'mysteryCorkboard'
  | 'floralLamp'
  | 'batGarland'
  | 'workbench'
  | 'stove'
  | 'stumpStool'
  | 'jackOLantern'
  | 'catLantern'
  | 'halloweenPhoto'
  | 'roseVase'
  | 'pressedFlowers'
  | 'stoneHearth'
  | 'moonflowerLamp'
  | 'candyCornWreath'
  | 'hostaPlanter'
  | 'planterBox'
  | 'littleGargoyle'
  | 'blueRoseDome'
  | 'pepperGarland'
  | 'ghostStories'
  | 'moonBouquet'
  | 'coffinCake'
  | 'broomstick'
  | 'broomStand'
  | 'boneGnome'
  | 'codyPortrait'
  | 'birthdayCake'
  | 'lunaMothLamp'
  | 'curiosityCabinet'
  | 'longNeckYoshi'
  | 'butterflyFrame'
  | 'rhinestoneGuitar'
  | 'tealMixer'
  | 'makeupChair'
  | 'foreverOrbs'
  // For finishing a shelf of the Cabinet, a wing of the museum, her squishies or her dolls (0.2's F2).
  | MilestonePiece
  // The town's Christmas present to her (phase U).
  | 'holidayTree'
  // Keepsakes from her neighbours' houses (phase H), hers once a friendship is close enough.
  | 'floatingCandles'
  | 'wingbackChair'
  | 'roseBucket'
  | 'pawPrintRug'
  | 'potionShelf'
  | 'witchHatLamp'
  | 'seedlingTray'
  | 'skullPlanter'
  | 'velvetSettee'
  | 'stainedGlass'
  | 'cupcakeTower'
  | 'mummyTeapot'
  // Newcomers' keepsakes, what they teach her to make, and what they give her (phase T).
  | 'stampAlbum'
  | 'parcelStack'
  | 'smoothStones'
  | 'crossedOars'
  | 'toolRack'
  | 'carvedOwl'
  | 'orrery'
  | 'moonGlobe'
  | 'pigeonholes'
  | 'lilyLantern'
  | 'pumpkinStool'
  | 'starChart'
  | 'writingDesk'
  | 'bubbleTank'
  | 'pumpkinClock'
  | 'telescope';

/** What her walls are papered with. She owns each one she buys, and picks which is up. */
export type WallpaperId =
  'plumStripes' | 'batDamask' | 'ghostPolka' | 'moonlitBlue' | 'mossPanels' | 'goldDamask';

/** The bracelets she strings at her workbench, which she can wear (0.2's W1). */
export type BraceletId = Extract<
  ItemId,
  | 'loveBracelet'
  | 'smileyBracelet'
  | 'friendshipBracelet'
  | 'tigersBracelet'
  | 'scarletBracelet'
  | 'spookyBracelet'
>;

/** What her floor is laid with, owned the same way. */
export type FlooringId = 'oakBoards' | 'checkerboard' | 'bluePlanks' | 'mossCarpet' | 'cobblestone';

/**
 * What she can make at her workbench (phase 8): bracelets from beads, furniture from what she
 * gathers and grows, and extensions to her house; and at a stove, her dishes (phase R).
 */
export type RecipeId =
  | 'loveBracelet'
  | 'smileyBracelet'
  | 'friendshipBracelet'
  | 'tigersBracelet'
  | 'scarletBracelet'
  | 'spookyBracelet'
  | 'stumpStool'
  | 'jackOLantern'
  | 'catLantern'
  | 'roseVase'
  | 'pressedFlowers'
  | 'stoneHearth'
  | 'moonflowerLamp'
  | 'candyCornWreath'
  | 'hostaPlanter'
  | 'littleGargoyle'
  | 'blueRoseDome'
  | 'pepperGarland'
  | 'roomyExtension'
  | 'grandExtension'
  | 'gardenRow'
  | 'northRow'
  | 'stallShelf'
  | 'planterBox'
  | 'sprinkler'
  | 'pigeonholes'
  | 'lilyLantern'
  | 'pumpkinStool'
  | 'starChart'
  | DishId;

/**
 * The places outdoors (decisions.md 78), each drawn from a map: the town and the places beyond its
 * edges. The castle hill and the secret place are more (phase I).
 */
/** Something buried somewhere outdoors, dug up once (phase I). */
export type BuriedId = 'castleKey' | 'hallKey';

export type MapZoneId = 'town' | 'whisperwood' | 'lanternShore' | 'castleHill' | 'hiddenClearing';

/**
 * The insides of the town's buildings (phase H), each a room gone into by its door: the shops, the
 * salon, the bakery and museum, and her neighbours' houses.
 */
export type InteriorId =
  | 'cobwebCorner'
  | 'muse'
  | 'crumbs'
  | 'library'
  | 'rufusCabin'
  | 'agathaCottage'
  | 'bartyCottage'
  | 'codyManor'
  | 'ollieCottage'
  | 'nessaBoathouse'
  | 'gourdonPumpkin'
  | 'hazelObservatory'
  // Castle Mac-A-Boo's hall (phase U), for their anniversary.
  | 'castleHall';

/**
 * Her neighbours' own events (phase S): the book club, the midnight bake, a spell gone mildly
 * wrong and the rest, each a row in `data/happenings.ts`.
 */
export type HappeningId =
  | 'bookClub'
  | 'midnightBake'
  | 'spellGoneWrong'
  | 'moonHowl'
  | 'seedSwap'
  | 'movieNight'
  // The Halloween Festival's (0.2's J3, J4).
  | 'filmNight'
  | 'costumeContest'
  // The holidays' own (phase U).
  | 'newYearDip'
  | 'valentineTea'
  | 'stPatricksJig'
  | 'eggHunt'
  | 'fireworksPicnic'
  | 'halloweenParty'
  | 'thanksgivingDinner'
  | 'carols'
  | 'countdown';

/** Something one of her neighbours has lost in town, for her to find and hand back (phase S2). */
export type LostId =
  'readingGlasses' | 'tennisBall' | 'rollingPin' | 'hatPin' | 'fingerBone' | 'sunglasses';

/** The zones she can be in: outdoors, her home, and inside a building. Each is a row in `data/zones.ts`. */
export type ZoneId = MapZoneId | 'home' | InteriorId;

/**
 * What stands in a building for good (phase H), drawn at 32: counters, shelves, the salon chair,
 * the museum's cases. Never hers, so never furniture.
 */
export type FixtureId =
  | 'shopCounter'
  | 'goodsShelf'
  | 'clothesRack'
  | 'salonChair'
  | 'salonMirror'
  | 'hoodDryer'
  | 'washBasin'
  | 'bakeryCounter'
  | 'bakeryOven'
  | 'museumCase'
  | 'libraryShelf'
  | 'flowerBuckets'
  | 'bigCauldron'
  | 'pottingBench'
  | 'pipeOrgan'
  | 'pinUpPortrait'
  | 'sortingTable'
  | 'lanternRack'
  | 'carpentersBench'
  | 'bigTelescope'
  // The castle hall's (phase U).
  | 'weddingCake'
  | 'weddingPortrait'
  | 'musicBox'
  | 'hallWindow';

/**
 * Her neighbours (phase 9), every one a spooky creature (decisions.md 16): a ghost librarian, a
 * werewolf florist, a mummy baker, a witch, a skeleton gardener, and Cody, a vampire.
 */
export type VillagerId =
  | 'maude'
  | 'rufus'
  | 'wrapunzel'
  | 'agatha'
  | 'barty'
  | 'cody'
  // Newcomers (phase T): a postie, a lake monster, a pumpkin-headed carpenter and a stargazer.
  | 'ollie'
  | 'nessa'
  | 'gourdon'
  | 'hazel';

/**
 * Their pets (phase 11, decisions.md 17): Florence, Fibi, Dolly and Gary as themselves, and Wybie
 * and Elvira as gentle ghost pets.
 */
export type PetId = 'florence' | 'fibi' | 'dolly' | 'gary' | 'wybie' | 'elvira';

/** What a pet wears round its neck: collars and bandanas (phase 11). */
export type AccessoryId =
  | 'pinkSpikedCollar'
  | 'plumSpikedCollar'
  | 'blueBandana'
  | 'scarletBandana'
  | 'lavenderBandana'
  | 'pumpkinBandana'
  | 'mossBandana'
  | 'skyBandana'
  | 'tealCollar'
  | 'roseCollar'
  | 'bellCollar'
  | 'ghostBandana';

/** What she can hold in her hand from the quick bar, besides a seed (phase M). A rod comes later. */
export type ToolId = 'hands' | 'net' | 'can' | 'rod';

/** The collections that mark what's new in them until she has looked (phase M). */
export type ShelfId = 'bag' | 'closet' | 'storage' | 'cabinet' | 'recipes';
