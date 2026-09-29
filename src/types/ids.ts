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
  | 'honestyStall'
  | 'barrel'
  | 'hayBale'
  | 'scarecrow';

/** What's growing in the pots by her door (phase G). */
export type PotPlantId = 'mums' | 'plumMums' | 'succulents' | 'hostas';

/** A patch of wildflowers growing in the grass, picked by walking onto it (phase 4). */
export type PatchId = 'moonpetals' | 'forgetMeBoos' | 'ghostDaisies' | 'milkweed';

/** Everything that can go in her bag. */
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
  | 'toadstool'
  | 'milkweed'
  | 'castleKey'
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
  | 'blueMoonfish';

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
 * crossed while she waits, and devil horns and a head-bang, rocking out at the big moments.
 */
export type Pose = 'phone' | 'arms' | 'horns' | 'bang' | 'pinup';

/** Her look (phase 3). A body choice is made in the creator; hair changes at the Muse Salon. */
export type SkinId = 'porcelain' | 'peach' | 'honey' | 'bronze' | 'umber' | 'ghostly' | 'minty';

export type EyeId = 'brown' | 'blue' | 'green' | 'hazel' | 'grey' | 'plum';

export type HairStyleId = 'splitBob' | 'long' | 'bob' | 'bunches' | 'pixie';

export type HairColourId =
  | 'pinkSplit'
  | 'splitDye'
  | 'blonde'
  | 'coral'
  | 'brown'
  | 'black'
  | 'auburn'
  | 'blue'
  | 'lavender'
  | 'silver';

export type TattooId = 'sleeves' | 'scattered';

/** Where a piece of clothing is worn. A dress is worn as the top and leaves no room for a bottom. */
export type Slot = 'top' | 'bottom' | 'shoes' | 'hat' | 'necklace' | 'glasses';

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
  | 'sunHat';

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
  | 'manyColoursCoat';

/** The colours a piece of clothing comes in. Every piece comes in at least one blue. */
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
  | 'stumpStool'
  | 'jackOLantern'
  | 'roseVase'
  | 'pressedFlowers'
  | 'stoneHearth'
  | 'moonflowerLamp'
  | 'candyCornWreath'
  | 'hostaPlanter'
  | 'littleGargoyle'
  | 'blueRoseDome'
  | 'pepperGarland'
  | 'ghostStories'
  | 'moonBouquet'
  | 'coffinCake'
  | 'broomstick'
  | 'boneGnome'
  | 'codyPortrait'
  | 'birthdayCake'
  | 'lunaMothLamp'
  | 'curiosityCabinet'
  | 'longNeckYoshi'
  | 'butterflyFrame'
  | 'rhinestoneGuitar'
  | 'foreverOrbs'
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
  | 'mummyTeapot';

/** What her walls are papered with. She owns each one she buys, and picks which is up. */
export type WallpaperId =
  'plumStripes' | 'batDamask' | 'ghostPolka' | 'moonlitBlue' | 'mossPanels' | 'goldDamask';

/** What her floor is laid with, owned the same way. */
export type FlooringId = 'oakBoards' | 'checkerboard' | 'bluePlanks' | 'mossCarpet' | 'cobblestone';

/**
 * What she can make at her workbench (phase 8): bracelets from beads, furniture from what she
 * gathers and grows, and extensions to her house.
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
  | 'sprinkler';

/**
 * The places outdoors (decisions.md 78), each drawn from a map: the town and the places beyond its
 * edges. The castle hill and the secret place are more (phase I).
 */
/** Something buried somewhere outdoors, dug up once (phase I). */
export type BuriedId = 'castleKey';

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
  | 'codyManor';

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
  | 'pinUpPortrait';

/**
 * Her neighbours (phase 9), every one a spooky creature (decisions.md 16): a ghost librarian, a
 * werewolf florist, a mummy baker, a witch, a skeleton gardener, and Cody, a vampire.
 */
export type VillagerId = 'maude' | 'rufus' | 'wrapunzel' | 'agatha' | 'barty' | 'cody';

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
