/**
 * The id unions. Data is keyed by these through `Record<Id, …>`, so adding an id is a compile error
 * everywhere it has to be answered.
 */
export type TileId = 'grass' | 'path' | 'water' | 'waterEdge' | 'hedge' | 'bed';

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
  | 'moonPieCart';

/** A patch of wildflowers growing in the grass, picked by walking onto it (phase 4). */
export type PatchId = 'moonpetals' | 'forgetMeBoos' | 'ghostDaisies';

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
  | 'burritoBowl'
  | 'moonPie'
  | 'moonPieMini'
  | 'fibisBone'
  | CritterId;

/**
 * The critters she catches with her net (phase 10). Each is also something in her bag, so it can
 * be kept, sold, given or donated like anything else she carries.
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
  | 'lanternFish';

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

/** Her look (phase 3). A body choice is made in the creator; hair changes at the Muse Salon. */
export type SkinId = 'porcelain' | 'peach' | 'honey' | 'bronze' | 'umber' | 'ghostly' | 'minty';

export type EyeId = 'brown' | 'blue' | 'green' | 'hazel' | 'grey' | 'plum';

export type HairStyleId = 'long' | 'bob' | 'bunches' | 'pixie';

export type HairColourId =
  'splitDye' | 'blonde' | 'coral' | 'brown' | 'black' | 'auburn' | 'blue' | 'lavender' | 'silver';

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
  | 'foreverOrbs';

/** What her walls are papered with. She owns each one she buys, and picks which is up. */
export type WallpaperId = 'plumStripes' | 'batDamask' | 'ghostPolka' | 'moonlitBlue' | 'mossPanels';

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
  | 'grandExtension';

/**
 * The zones she can be in (decisions.md 78), each its own small map: the town, and her home. Each
 * later area (Whisperwood, Lantern Shore, the castle hill) is one more.
 */
export type ZoneId = 'town' | 'home';

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
