import type { BuildingVisualIdentity, BuildingVisualLevel } from '../simulation/contracts'

type Milestone = Omit<BuildingVisualLevel, 'structuralMilestone' | 'stage'> & {
  stage: BuildingVisualLevel['stage']
}

const LEVEL_MILESTONE_INDEX = [0, 1, 1, 2, 2, 3, 3, 4, 4] as const
const LEVEL_KEYS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'] as const

function identity(
  buildingClass: string,
  silhouetteFamily: string,
  functionalSignature: string,
  materialPalette: string,
  heroFeature: string,
  supportFeatures: readonly string[],
  dynamicSignature: readonly string[],
  milestones: readonly [Milestone, Milestone, Milestone, Milestone, Milestone],
): BuildingVisualIdentity {
  const levelArc = Object.fromEntries(LEVEL_KEYS.map((levelKey, level) => {
    const milestone = milestones[LEVEL_MILESTONE_INDEX[level]]
    return [levelKey, {
      ...milestone,
      structuralMilestone: [1, 3, 5, 7].includes(level),
    }]
  })) as BuildingVisualIdentity['levelArc']
  return {
    era: 'jiangnan-preindustrial',
    buildingClass,
    silhouetteFamily,
    functionalSignature,
    materialPalette,
    heroFeature,
    supportFeatures,
    dynamicSignature,
    levelArc,
  }
}

const commonMilestones = (
  ruin: Milestone,
  repaired: Milestone,
  settled: Milestone,
  prosperous: Milestone,
  thriving: Milestone,
): readonly [Milestone, Milestone, Milestone, Milestone, Milestone] => [
  ruin,
  repaired,
  settled,
  prosperous,
  thriving,
]

export const BUILDING_VISUAL_IDENTITIES: Readonly<Record<string, BuildingVisualIdentity>> = {
  'main-pier': identity('cargo-pier', 'branching-stone-wharf', 'waterborne cargo transfer', 'stone · tarred wood · deep indigo', 'multi-berth wharf', ['cargo shed', 'derrick arm'], ['winch swing', 'porter queue', 'water lapping'], commonMilestones(
    { stage: 'ruin', silhouette: 'broken-piles', functionalRead: 'abandoned water edge', environment: 'mud flats and scattered planks', activeElements: ['collapsed piles', 'stranded crate'] },
    { stage: 'repaired', silhouette: 'single-straight-berth', functionalRead: 'one usable landing', environment: 'packed shore apron', activeElements: ['mooring post', 'repair lantern'] },
    { stage: 'settled', silhouette: 'cross-berth-wharf', functionalRead: 'local cargo landing', environment: 'stone edge and cargo lane', activeElements: ['small cargo shed', 'hand cart'] },
    { stage: 'prosperous', silhouette: 'branching-multi-berth', functionalRead: 'organized harbor exchange', environment: 'warehouse yard and loading route', activeElements: ['derrick', 'cargo queue', 'berth markers'] },
    { stage: 'thriving', silhouette: 'masonry-main-wharf', functionalRead: 'busy regional port', environment: 'stone quay, market apron and service yard', activeElements: ['multiple sheds', 'working winches', 'arriving crews'] },
  )),
  'main-ferry': identity('river-ferry', 'stair-and-shelter', 'passenger crossing', 'blue-grey stone · weathered timber · ferry red', 'landing stair', ['ticket board', 'rain shelter'], ['boarding queue', 'ferry approach', 'lantern sway'], commonMilestones(
    { stage: 'ruin', silhouette: 'washed-stair', functionalRead: 'broken crossing point', environment: 'eroded bank and loose stones', activeElements: ['broken steps', 'old mooring ring'] },
    { stage: 'repaired', silhouette: 'stone-stair-shelter', functionalRead: 'small passenger landing', environment: 'cleared bank and rope line', activeElements: ['ticket board', 'rain awning'] },
    { stage: 'settled', silhouette: 'paired-landing-court', functionalRead: 'regular local crossing', environment: 'two-sided waiting apron', activeElements: ['queue rail', 'ferry bell'] },
    { stage: 'prosperous', silhouette: 'covered-ferry-terminal', functionalRead: 'reliable town crossing', environment: 'paved steps and linked road', activeElements: ['covered shelter', 'boarding sign', 'porter'] },
    { stage: 'thriving', silhouette: 'dual-terminal-crossing', functionalRead: 'high-volume water transit', environment: 'formal ferry court and shore route', activeElements: ['arrival platform', 'ticket counter', 'lantern line'] },
  )),
  'main-bridge': identity('masonry-bridge', 'single-arch-span', 'road crossing', 'blue-grey stone · moss · dark timber', 'wide stone arch', ['bridge rails', 'gate stalls'], ['pedestrian flow', 'rain splash', 'stall awnings'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-arch', functionalRead: 'broken road crossing', environment: 'water gap and fallen stones', activeElements: ['collapsed parapet', 'temporary plank'] },
    { stage: 'repaired', silhouette: 'low-stone-span', functionalRead: 'walkable bridge', environment: 'cleared banks and stepping path', activeElements: ['new parapet', 'bridge steps'] },
    { stage: 'settled', silhouette: 'single-arch-bridge', functionalRead: 'stable town crossing', environment: 'stone approaches and rain drains', activeElements: ['arched opening', 'stone rails'] },
    { stage: 'prosperous', silhouette: 'wide-arch-market-bridge', functionalRead: 'crossing with bridge stalls', environment: 'paved bridgeheads and small stalls', activeElements: ['bridgehead stalls', 'carved rail'] },
    { stage: 'thriving', silhouette: 'grand-single-arch-crossing', functionalRead: 'main civic crossing', environment: 'organized bridge street and planted banks', activeElements: ['crowded bridgewalk', 'paired bridge courts', 'rain chains'] },
  )),
  'main-inn': identity('guesthouse', 'two-storey-courtyard', 'lodging and hospitality', 'white lime · dark timber · jujube textile', 'two-storey guest wing', ['front hall', 'laundry yard'], ['window opening', 'luggage carrying', 'lamp lighting'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-guest-shed', functionalRead: 'abandoned lodging shed', environment: 'weeded yard and broken bedding rack', activeElements: ['fallen sign', 'cold hearth'] },
    { stage: 'repaired', silhouette: 'single-wing-guesthouse', functionalRead: 'small lodging house', environment: 'cleared courtyard and lamp post', activeElements: ['front sign', 'guest door'] },
    { stage: 'settled', silhouette: 'two-storey-front-wing', functionalRead: 'regular overnight lodging', environment: 'courtyard laundry and guest path', activeElements: ['upper windows', 'luggage rack'] },
    { stage: 'prosperous', silhouette: 'multi-courtyard-inn', functionalRead: 'busy town inn', environment: 'front hall, rear yard and guest lane', activeElements: ['room balconies', 'arrival canopy', 'laundry lines'] },
    { stage: 'thriving', silhouette: 'riverfront-guesthouse-complex', functionalRead: 'regional hospitality hub', environment: 'multiple guest wings and lit courtyard', activeElements: ['reception hall', 'guest rooms', 'luggage teams'] },
  )),
  'main-teahouse': identity('teahouse', 'open-terrace-pavilion', 'tea service and gathering', 'tea brown · muted jade · warm plaster', 'open tea terrace', ['tea stove', 'storytelling corner'], ['flag flutter', 'tea pouring', 'guest seating'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-tea-shed', functionalRead: 'abandoned tea stall', environment: 'overgrown bank and cold stove', activeElements: ['broken tea table', 'torn flag'] },
    { stage: 'repaired', silhouette: 'single-open-tea-stall', functionalRead: 'small tea counter', environment: 'swept bank and two seats', activeElements: ['tea flag', 'small stove'] },
    { stage: 'settled', silhouette: 'raised-tea-room', functionalRead: 'regular tea room', environment: 'covered terrace and waterside seats', activeElements: ['tea counter', 'window seats'] },
    { stage: 'prosperous', silhouette: 'two-storey-tea-terrace', functionalRead: 'popular tea house', environment: 'layered terrace and storytelling corner', activeElements: ['upper terrace', 'tea banners', 'guest tables'] },
    { stage: 'thriving', silhouette: 'riverfront-tea-complex', functionalRead: 'cultural gathering house', environment: 'multiple terraces, lit tea court and busy promenade', activeElements: ['tea service teams', 'storyteller stage', 'full seating'] },
  )),
  'main-eatery': identity('food-house', 'front-shop-rear-kitchen', 'prepared food service', 'warm ochre · soot grey · awning vermilion', 'visible cooking hearth', ['steamer rack', 'street dining tables'], ['smoke plume', 'serving queue', 'table turnover'], commonMilestones(
    { stage: 'ruin', silhouette: 'burnt-food-stall', functionalRead: 'closed cooking shed', environment: 'ash, weeds and broken counter', activeElements: ['cold hearth', 'fallen menu board'] },
    { stage: 'repaired', silhouette: 'single-counter-food-stall', functionalRead: 'small takeaway counter', environment: 'swept frontage and one awning', activeElements: ['lit stove', 'serving window'] },
    { stage: 'settled', silhouette: 'front-shop-rear-kitchen', functionalRead: 'neighborhood eatery', environment: 'kitchen yard and two street tables', activeElements: ['steamer', 'prep table'] },
    { stage: 'prosperous', silhouette: 'awning-food-street', functionalRead: 'busy town restaurant', environment: 'street dining row and delivery lane', activeElements: ['multiple stoves', 'menu boards', 'guest queue'] },
    { stage: 'thriving', silhouette: 'food-house-court', functionalRead: 'high-throughput food court', environment: 'front shop, rear kitchen, banquet yard and lit street', activeElements: ['steam canopy', 'serving teams', 'full tables'] },
  )),
  'main-weavery': identity('weaving-workshop', 'dye-yard-and-long-rack', 'cloth production', 'indigo · unbleached cloth · muted brick', 'long drying racks', ['dye vats', 'open looms'], ['cloth flutter', 'loom rhythm', 'dye washing'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-weaving-shed', functionalRead: 'abandoned craft shed', environment: 'faded dye pits and broken rack', activeElements: ['dry vat', 'torn cloth'] },
    { stage: 'repaired', silhouette: 'single-loom-shed', functionalRead: 'small cloth workshop', environment: 'cleared dye yard and short rack', activeElements: ['one loom', 'dye basin'] },
    { stage: 'settled', silhouette: 'dye-yard-workshop', functionalRead: 'working textile yard', environment: 'drainage channel and cloth line', activeElements: ['dye vats', 'cloth rack'] },
    { stage: 'prosperous', silhouette: 'long-rack-weaving-court', functionalRead: 'town cloth producer', environment: 'multiple racks and shopfront display', activeElements: ['loom row', 'indigo vats', 'cloth bundles'] },
    { stage: 'thriving', silhouette: 'multi-court-weaving-house', functionalRead: 'regional textile workshop', environment: 'full dye, weave, dry and display sequence', activeElements: ['moving looms', 'colored cloth river', 'loading yard'] },
  )),
  'main-carpentry': identity('carpentry-workshop', 'open-timber-frame-shed', 'wood construction', 'raw timber · sawdust tan · dark joinery', 'open assembly shed', ['log rack', 'joinery frame'], ['sawing', 'planing', 'beam lifting'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-timber-shed', functionalRead: 'abandoned wood yard', environment: 'scattered logs and weeds', activeElements: ['broken bench', 'fallen beam'] },
    { stage: 'repaired', silhouette: 'open-woodshop-shed', functionalRead: 'small repair shop', environment: 'cleared timber apron', activeElements: ['workbench', 'hand saw'] },
    { stage: 'settled', silhouette: 'frame-assembly-yard', functionalRead: 'working carpentry yard', environment: 'log rack and covered work bay', activeElements: ['joinery frame', 'wood chips'] },
    { stage: 'prosperous', silhouette: 'long-joinery-workshop', functionalRead: 'town building supplier', environment: 'assembly shed, drying rack and loading lane', activeElements: ['beam frame', 'planing bench', 'cart bay'] },
    { stage: 'thriving', silhouette: 'multi-bay-carpentry-court', functionalRead: 'regional construction yard', environment: 'timber storage, assembly and finished-frame court', activeElements: ['large roof frame', 'worker teams', 'delivery carts'] },
  )),
  'main-kiln': identity('ceramic-kiln', 'long-dragon-kiln', 'firing brick and ceramic', 'firebrick · ash white · kiln blue', 'long kiln body', ['clay yard', 'cooling shed'], ['fire glow', 'smoke plume', 'kiln loading'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-kiln-mound', functionalRead: 'cold abandoned kiln', environment: 'ash yard and cracked clay', activeElements: ['broken flue', 'discarded shard'] },
    { stage: 'repaired', silhouette: 'single-small-kiln', functionalRead: 'small firing kiln', environment: 'cleared clay apron and wood stack', activeElements: ['lit firebox', 'clay shelf'] },
    { stage: 'settled', silhouette: 'kiln-and-clay-yard', functionalRead: 'regular ceramic production', environment: 'forming table and cooling shelter', activeElements: ['mould table', 'cooling rack'] },
    { stage: 'prosperous', silhouette: 'long-dragon-kiln-yard', functionalRead: 'town brick and ceramic works', environment: 'long kiln, clay yard and finished-goods route', activeElements: ['multiple fire doors', 'smoke flue', 'cart queue'] },
    { stage: 'thriving', silhouette: 'twin-kiln-production-court', functionalRead: 'regional firing complex', environment: 'two kilns, forming yard, cooling court and warehouse', activeElements: ['twin fire glow', 'ceramic stacks', 'loading crews'] },
  )),
  'main-granary': identity('granary', 'raised-long-storehouse', 'grain storage and dispatch', 'grain gold · cedar brown · lime white', 'raised storehouse', ['drying yard', 'rat-proof stone base'], ['cart loading', 'grain pouring', 'sparrow flock'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-grain-store', functionalRead: 'spoiled grain shelter', environment: 'spilled grain and weeded yard', activeElements: ['broken bins', 'pest clutter'] },
    { stage: 'repaired', silhouette: 'single-raised-grain-store', functionalRead: 'small protected store', environment: 'cleared drying patch', activeElements: ['raised floor', 'vent window'] },
    { stage: 'settled', silhouette: 'storehouse-and-drying-yard', functionalRead: 'working grain store', environment: 'organized sacks and drying yard', activeElements: ['grain bins', 'hand cart'] },
    { stage: 'prosperous', silhouette: 'multi-bay-granary', functionalRead: 'town grain reserve', environment: 'large drying court and dispatch lane', activeElements: ['raised bays', 'weighing scale', 'grain carts'] },
    { stage: 'thriving', silhouette: 'granary-court-and-silos', functionalRead: 'regional food reserve', environment: 'multiple storehouses, full drying yard and regulated loading line', activeElements: ['grain chutes', 'dispatch crews', 'bird deterrents'] },
  )),
  'main-pharmacy': identity('herbal-pharmacy', 'shop-and-herb-yard', 'medicine preparation and care', 'herb green · paper beige · medicine red', 'dense medicine drawers', ['drying racks', 'stone mortar'], ['pounding', 'weighing', 'herb drying'], commonMilestones(
    { stage: 'ruin', silhouette: 'closed-herb-shed', functionalRead: 'abandoned herb room', environment: 'overgrown herb yard', activeElements: ['fallen drawer', 'dry root bundle'] },
    { stage: 'repaired', silhouette: 'small-herb-counter', functionalRead: 'basic medicine counter', environment: 'cleared drying rack and sign', activeElements: ['medicine drawer', 'mortar'] },
    { stage: 'settled', silhouette: 'shop-and-drying-yard', functionalRead: 'working neighborhood pharmacy', environment: 'front counter and herb yard', activeElements: ['herb racks', 'weighing table'] },
    { stage: 'prosperous', silhouette: 'pharmacy-courtyard', functionalRead: 'town care and preparation house', environment: 'diagnosis front room and processing court', activeElements: ['dense drawers', 'drying rows', 'waiting bench'] },
    { stage: 'thriving', silhouette: 'multi-room-herbal-house', functionalRead: 'regional medicine and care center', environment: 'shop, clinic, processing yard and herb store', activeElements: ['care queue', 'pounding teams', 'full herb racks'] },
  )),
  'main-academy': identity('academy', 'axis-hall-and-library', 'education and civic learning', 'ink black · white plaster · scholar blue', 'central lecture hall', ['stone stele', 'library tower'], ['class movement', 'page turning', 'bell ring'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-school-court', functionalRead: 'abandoned study hall', environment: 'weeded courtyard and broken tablet', activeElements: ['fallen stele', 'empty desk'] },
    { stage: 'repaired', silhouette: 'single-lecture-hall', functionalRead: 'small village school', environment: 'swept court and bell post', activeElements: ['lecture room', 'school gate'] },
    { stage: 'settled', silhouette: 'hall-and-scholar-yard', functionalRead: 'regular town academy', environment: 'study court and planted axis', activeElements: ['teacher desk', 'student benches'] },
    { stage: 'prosperous', silhouette: 'axis-hall-library-court', functionalRead: 'town education complex', environment: 'lecture hall, side study rooms and stele court', activeElements: ['library wing', 'class rows', 'bell tower'] },
    { stage: 'thriving', silhouette: 'multi-court-academy', functionalRead: 'regional learning institution', environment: 'formal axis, lecture hall, library and scholar garden', activeElements: ['busy school gate', 'reading groups', 'library tower'] },
  )),
  'main-theatre': identity('theatre', 'water-stage-and-audience-court', 'performance and public culture', 'lacquer red · water blue · warm gold', 'water-facing stage', ['backstage wing', 'drum frame'], ['gong cue', 'audience arrival', 'curtain movement'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-stage-platform', functionalRead: 'silent performance platform', environment: 'empty waterside and fallen props', activeElements: ['broken stage', 'silent drum'] },
    { stage: 'repaired', silhouette: 'small-water-stage', functionalRead: 'occasional local performance', environment: 'cleared audience bank', activeElements: ['stage mouth', 'drum stand'] },
    { stage: 'settled', silhouette: 'stage-and-audience-court', functionalRead: 'regular town performance', environment: 'planted audience court and backstage shed', activeElements: ['audience benches', 'backstage door'] },
    { stage: 'prosperous', silhouette: 'roofed-water-theatre', functionalRead: 'popular public theatre', environment: 'covered stage, audience court and lantern route', activeElements: ['roofed stage', 'drum frame', 'crowd court'] },
    { stage: 'thriving', silhouette: 'complete-theatre-complex', functionalRead: 'regional performance venue', environment: 'stage, backstage wings, audience plaza and riverside promenade', activeElements: ['opening curtain', 'performers', 'full audience'] },
  )),
  'main-homes': identity('housing-block', 'continuous-lane-homes', 'resident housing and daily life', 'lime white · roof grey · laundry blue', 'continuous residential lane', ['inner courtyard', 'shared kitchen'], ['door opening', 'laundry sway', 'children play'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-house-lot', functionalRead: 'uninhabited ruin lot', environment: 'weeds and broken cooking yard', activeElements: ['fallen wall', 'cold hearth'] },
    { stage: 'repaired', silhouette: 'single-courtyard-house', functionalRead: 'one settled household', environment: 'swept yard and vegetable patch', activeElements: ['front door', 'laundry pole'] },
    { stage: 'settled', silhouette: 'paired-lane-homes', functionalRead: 'small residential lane', environment: 'shared path and two living courts', activeElements: ['door plates', 'cooking smoke'] },
    { stage: 'prosperous', silhouette: 'continuous-house-row', functionalRead: 'dense neighborhood block', environment: 'inner alley, shared well and garden court', activeElements: ['multiple doorways', 'children play', 'laundry lines'] },
    { stage: 'thriving', silhouette: 'lived-in-residential-quarter', functionalRead: 'full urban neighborhood', environment: 'continuous lanes, small courtyards and resident circulation', activeElements: ['open doors', 'resident groups', 'lit kitchens'] },
  )),
  'main-gate': identity('town-gate', 'road-spanning-gatehouse', 'town boundary and governance', 'blue-grey stone · dark timber · seal red', 'road-spanning gate', ['inscription board', 'guard rooms'], ['arrival flow', 'lantern lighting', 'gate opening'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-boundary-post', functionalRead: 'unmarked town edge', environment: 'broken road and overgrown ditch', activeElements: ['fallen marker', 'collapsed post'] },
    { stage: 'repaired', silhouette: 'single-gate-frame', functionalRead: 'marked settlement entrance', environment: 'cleared road apron and boundary stone', activeElements: ['town plaque', 'watch post'] },
    { stage: 'settled', silhouette: 'gatehouse-and-yard', functionalRead: 'controlled town entrance', environment: 'paved threshold and small guard yard', activeElements: ['gate doors', 'guard room'] },
    { stage: 'prosperous', silhouette: 'stone-timber-town-gate', functionalRead: 'busy civic entrance', environment: 'arrival square and paired watch rooms', activeElements: ['inscription board', 'lanterns', 'entry queue'] },
    { stage: 'thriving', silhouette: 'formal-gate-and-entry-square', functionalRead: 'prosperous town threshold', environment: 'gatehouse, entry plaza, side rooms and active road', activeElements: ['open gate', 'registry desk', 'arriving residents'] },
  )),
  'main-garden': identity('water-garden', 'curved-water-court', 'beautification and leisure', 'lotus green · pale stone · water jade', 'curved water court', ['covered walkway', 'rockery'], ['leaf sway', 'water ripple', 'visitor pause'], commonMilestones(
    { stage: 'ruin', silhouette: 'weeded-water-lot', functionalRead: 'neglected wet ground', environment: 'choked pond and fallen stones', activeElements: ['broken bank', 'wild reeds'] },
    { stage: 'repaired', silhouette: 'small-pond-garden', functionalRead: 'cleared public green', environment: 'clean pond edge and planted path', activeElements: ['pond', 'stone bench'] },
    { stage: 'settled', silhouette: 'pond-and-planted-court', functionalRead: 'neighborhood garden', environment: 'planted beds and short walkway', activeElements: ['lotus pond', 'flower beds'] },
    { stage: 'prosperous', silhouette: 'curved-water-garden', functionalRead: 'town leisure garden', environment: 'rockery, covered walk and linked water edge', activeElements: ['curved bridge', 'rockery', 'garden visitors'] },
    { stage: 'thriving', silhouette: 'layered-water-garden-park', functionalRead: 'civic landscape and leisure park', environment: 'continuous water court, seasonal planting and shaded promenade', activeElements: ['multiple garden rooms', 'flower cycles', 'visitor groups'] },
  )),
  'windfield-rice': identity('rice-fields', 'terraced-paddy-grid', 'grain cultivation', 'water jade · rice green · mud brown', 'terraced paddy system', ['irrigation channels', 'field hut'], ['rice wind', 'planting rows', 'harvest crews'], commonMilestones(
    { stage: 'ruin', silhouette: 'broken-paddy-parcels', functionalRead: 'neglected flooded field', environment: 'collapsed bunds and weeds', activeElements: ['broken channel', 'sparse seedlings'] },
    { stage: 'repaired', silhouette: 'single-paddy-parcel', functionalRead: 'small cultivable field', environment: 'repaired bunds and water inlet', activeElements: ['field hut', 'water gate'] },
    { stage: 'settled', silhouette: 'ordered-paddy-grid', functionalRead: 'working rice plots', environment: 'linked channels and field paths', activeElements: ['seedling rows', 'irrigation ditch'] },
    { stage: 'prosperous', silhouette: 'terraced-paddy-system', functionalRead: 'productive rice estate', environment: 'multiple terraces and harvest staging area', activeElements: ['water gates', 'workers', 'grain stacks'] },
    { stage: 'thriving', silhouette: 'complete-rice-landscape', functionalRead: 'high-yield grain district', environment: 'full terrace network, channels, field paths and harvest flow', activeElements: ['rippling paddies', 'harvest teams', 'loaded carts'] },
  )),
  'windfield-orchard': identity('orchard', 'ordered-tree-grove', 'fruit cultivation', 'leaf green · fruit vermilion · earth ochre', 'ordered fruit rows', ['sorting shed', 'bee boxes'], ['blossom drift', 'fruit picking', 'bird flock'], commonMilestones(
    { stage: 'ruin', silhouette: 'wild-orchard-lot', functionalRead: 'neglected fruit ground', environment: 'overgrown trees and broken path', activeElements: ['fallen ladder', 'wild branches'] },
    { stage: 'repaired', silhouette: 'small-fruit-grove', functionalRead: 'small managed orchard', environment: 'cleared rows and picking path', activeElements: ['fruit trees', 'basket'] },
    { stage: 'settled', silhouette: 'ordered-orchard-rows', functionalRead: 'working fruit grove', environment: 'regular rows and small storage shed', activeElements: ['ladders', 'bee boxes'] },
    { stage: 'prosperous', silhouette: 'multi-zone-orchard', functionalRead: 'town fruit estate', environment: 'orchard blocks, sorting yard and cart lane', activeElements: ['sorting tables', 'fruit baskets', 'workers'] },
    { stage: 'thriving', silhouette: 'complete-orchard-estate', functionalRead: 'regional fruit supply', environment: 'flower, fruit, sorting and dispatch zones', activeElements: ['full tree rows', 'sorting crews', 'bird activity'] },
  )),
  'windfield-mill': identity('water-mill', 'exposed-waterwheel-house', 'grain milling', 'mill brown · water jade · flour white', 'large external waterwheel', ['headrace channel', 'grain hoist'], ['wheel rotation', 'millstone turning', 'water flow'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-mill-frame', functionalRead: 'silent watermill ruin', environment: 'blocked channel and mossy wheel', activeElements: ['broken wheel', 'silted race'] },
    { stage: 'repaired', silhouette: 'single-waterwheel-mill', functionalRead: 'small grain mill', environment: 'cleared water race and grain apron', activeElements: ['turning wheel', 'millstone'] },
    { stage: 'settled', silhouette: 'mill-house-and-channel', functionalRead: 'regular milling service', environment: 'headrace, mill house and sack bay', activeElements: ['grain sacks', 'water gate'] },
    { stage: 'prosperous', silhouette: 'double-wheel-mill-court', functionalRead: 'town milling works', environment: 'paired wheels, loading yard and downstream channel', activeElements: ['two wheels', 'hoist', 'cart bay'] },
    { stage: 'thriving', silhouette: 'complete-mill-waterworks', functionalRead: 'regional grain processing', environment: 'full waterworks, mill court, storage and dispatch route', activeElements: ['continuous wheels', 'mill crews', 'flowing channel'] },
  )),
  'windfield-barn': identity('grain-barn', 'long-low-drying-store', 'grain drying and overflow storage', 'straw gold · wood brown · canvas beige', 'long low barn', ['drying floor', 'winnowing yard'], ['winnowing', 'rake turning', 'cart flow'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-barn', functionalRead: 'spoiled crop shelter', environment: 'weeds, torn matting and scattered straw', activeElements: ['fallen roof', 'empty trough'] },
    { stage: 'repaired', silhouette: 'single-long-barn', functionalRead: 'small grain shelter', environment: 'cleared yard and drying mat', activeElements: ['barn door', 'grain mat'] },
    { stage: 'settled', silhouette: 'barn-and-drying-floor', functionalRead: 'working grain barn', environment: 'winnowing floor and storage racks', activeElements: ['grain piles', 'wood rake'] },
    { stage: 'prosperous', silhouette: 'segmented-long-barn', functionalRead: 'town grain staging yard', environment: 'multiple bays, drying floor and cart lane', activeElements: ['winnowing fans', 'sacks', 'cart route'] },
    { stage: 'thriving', silhouette: 'granary-barn-production-line', functionalRead: 'high-throughput harvest reserve', environment: 'full drying court, storage bays and dispatch flow', activeElements: ['busy winnowing', 'grain carts', 'stacked reserve'] },
  )),
  'mistgrove-tea': identity('tea-estate', 'contour-tea-terraces', 'tea cultivation and first processing', 'tea green · mountain grey · bamboo tan', 'contour tea rows', ['shade trees', 'first-processing shed'], ['leaf picking', 'mist drift', 'basket carrying'], commonMilestones(
    { stage: 'ruin', silhouette: 'overgrown-tea-slope', functionalRead: 'neglected mountain tea ground', environment: 'broken terraces and heavy mist', activeElements: ['wild tea shrubs', 'fallen path'] },
    { stage: 'repaired', silhouette: 'single-tea-terrace', functionalRead: 'small tea plot', environment: 'repaired slope path and shade tree', activeElements: ['tea rows', 'picking baskets'] },
    { stage: 'settled', silhouette: 'contour-tea-garden', functionalRead: 'working tea garden', environment: 'linked terraces and field hut', activeElements: ['shade trees', 'leaf baskets'] },
    { stage: 'prosperous', silhouette: 'tea-estate-and-processing-shed', functionalRead: 'town tea estate', environment: 'continuous contour rows and first-processing shed', activeElements: ['tea teams', 'withering racks', 'mountain path'] },
    { stage: 'thriving', silhouette: 'complete-mountain-tea-estate', functionalRead: 'regional tea supply district', environment: 'layered terraces, processing yard and long mountain route', activeElements: ['misty tea rows', 'picking crews', 'loaded baskets'] },
  )),
  'mistgrove-herbs': identity('herb-garden', 'labeled-medicinal-beds', 'medicinal plant cultivation', 'herb green · stone grey · paper yellow', 'labeled medicinal beds', ['nursery shelter', 'drying racks'], ['plant tending', 'root drying', 'insect life'], commonMilestones(
    { stage: 'ruin', silhouette: 'wild-herb-plot', functionalRead: 'uncultivated medicinal ground', environment: 'overgrown beds and fallen labels', activeElements: ['wild herbs', 'broken marker'] },
    { stage: 'repaired', silhouette: 'single-medicinal-bed', functionalRead: 'small herb plot', environment: 'cleared stone path and label stakes', activeElements: ['labeled bed', 'herb basket'] },
    { stage: 'settled', silhouette: 'divided-herb-garden', functionalRead: 'working medicinal garden', environment: 'separate beds and small nursery', activeElements: ['label rows', 'seedling tray'] },
    { stage: 'prosperous', silhouette: 'herb-garden-processing-yard', functionalRead: 'town medicinal supply', environment: 'multiple beds, nursery and drying yard', activeElements: ['drying racks', 'root bundles', 'garden workers'] },
    { stage: 'thriving', silhouette: 'complete-medicinal-estate', functionalRead: 'regional herb supply garden', environment: 'cultivation, nursery, harvest and drying zones', activeElements: ['dense labeled beds', 'processing crews', 'butterfly activity'] },
  )),
  'mistgrove-bamboo': identity('bamboo-workshop', 'bamboo-grove-and-long-shed', 'bamboo processing and weaving', 'bamboo green · split cane tan · dark timber', 'bamboo grove and long shed', ['split-cane racks', 'basket court'], ['leaf sway', 'bamboo splitting', 'weaving'], commonMilestones(
    { stage: 'ruin', silhouette: 'wild-bamboo-ground', functionalRead: 'unmanaged bamboo slope', environment: 'fallen culms and broken shed', activeElements: ['wild bamboo', 'collapsed rack'] },
    { stage: 'repaired', silhouette: 'bamboo-grove-shed', functionalRead: 'small bamboo yard', environment: 'cleared grove edge and cutting bench', activeElements: ['culm stack', 'cutting bench'] },
    { stage: 'settled', silhouette: 'grove-and-processing-shed', functionalRead: 'working bamboo shop', environment: 'split-cane rack and covered bench', activeElements: ['split cane', 'weaving frame'] },
    { stage: 'prosperous', silhouette: 'long-bamboo-workshop', functionalRead: 'town bamboo producer', environment: 'grove, processing shed and finished-goods court', activeElements: ['long shed', 'basket frames', 'delivery stack'] },
    { stage: 'thriving', silhouette: 'complete-bamboo-production-belt', functionalRead: 'regional bamboo craft district', environment: 'managed grove, long shed, weaving court and product yard', activeElements: ['moving weavers', 'bamboo stacks', 'finished baskets'] },
  )),
  'mistgrove-pavilion': identity('mountain-pavilion', 'ridge-pavilion-platform', 'scenic rest and wayfinding', 'mountain stone · cedar brown · cloud grey', 'ridge-top viewing platform', ['stone stair', 'inscribed rail'], ['visitor ascent', 'cloud shadow', 'flag movement'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-ridge-platform', functionalRead: 'unsafe mountain lookout', environment: 'broken steps and scrub', activeElements: ['fallen rail', 'overgrown path'] },
    { stage: 'repaired', silhouette: 'single-ridge-pavilion', functionalRead: 'small mountain rest point', environment: 'cleared stair and stone seat', activeElements: ['pavilion roof', 'stone stair'] },
    { stage: 'settled', silhouette: 'pavilion-and-view-deck', functionalRead: 'safe scenic stop', environment: 'view deck and marked mountain path', activeElements: ['view rail', 'wayfinding stone'] },
    { stage: 'prosperous', silhouette: 'ridge-pavilion-and-walk', functionalRead: 'town scenic route node', environment: 'stepped platform and restrained covered walk', activeElements: ['view deck', 'rest seats', 'route signs'] },
    { stage: 'thriving', silhouette: 'complete-ridge-view-garden', functionalRead: 'regional scenic waystation', environment: 'terrain-following platform, stairs and planted rest court', activeElements: ['visitors', 'cloud movement', 'inscribed rail'] },
  )),
  'tide-harbor': identity('fishing-harbor', 'fish-shed-and-net-yard', 'fishing landing and fish market', 'sea green · net blue · fish silver', 'fish landing yard', ['net racks', 'fish market shed'], ['boat arrival', 'net mending', 'seabird flock'], commonMilestones(
    { stage: 'ruin', silhouette: 'broken-fishing-jetty', functionalRead: 'abandoned fishing edge', environment: 'tide mud and torn nets', activeElements: ['broken jetty', 'empty basket'] },
    { stage: 'repaired', silhouette: 'single-fishing-landing', functionalRead: 'small fishing landing', environment: 'cleared shore and net post', activeElements: ['fish basket', 'net rack'] },
    { stage: 'settled', silhouette: 'fish-shed-and-jetty', functionalRead: 'working local fishery', environment: 'shed, landing and drying line', activeElements: ['fish shed', 'mending bench'] },
    { stage: 'prosperous', silhouette: 'multi-berth-fishing-harbor', functionalRead: 'town fish market', environment: 'multiple landings, net yard and fish sorting court', activeElements: ['fish crates', 'net racks', 'boat queue'] },
    { stage: 'thriving', silhouette: 'complete-fishing-port', functionalRead: 'regional fish exchange', environment: 'multi-berth harbor, market, repair and drying zones', activeElements: ['returning boats', 'fish auction', 'seabird flock'] },
  )),
  'tide-salt': identity('salt-works', 'geometric-salt-ponds', 'salt evaporation and transport', 'salt white · brine blue · sun ochre', 'regular salt pond grid', ['sluice gates', 'salt store'], ['water shimmer', 'raking', 'salt cart movement'], commonMilestones(
    { stage: 'ruin', silhouette: 'broken-salt-pans', functionalRead: 'flooded abandoned salt ground', environment: 'collapsed dikes and brine weeds', activeElements: ['broken sluice', 'muddy pan'] },
    { stage: 'repaired', silhouette: 'single-salt-pan', functionalRead: 'small salt pan', environment: 'repaired dike and water gate', activeElements: ['sluice', 'salt rake'] },
    { stage: 'settled', silhouette: 'ordered-salt-pan-grid', functionalRead: 'working salt field', environment: 'linked brine channels and salt pile', activeElements: ['crystal bed', 'water gate'] },
    { stage: 'prosperous', silhouette: 'crystallization-pond-complex', functionalRead: 'town salt works', environment: 'evaporation, crystal and storage sequence', activeElements: ['salt piles', 'raking teams', 'cart track'] },
    { stage: 'thriving', silhouette: 'complete-salt-production-grid', functionalRead: 'regional salt supply', environment: 'full pond grid, sluice network, salt store and dispatch route', activeElements: ['shimmering pans', 'salt crews', 'loaded carts'] },
  )),
  'tide-shipyard': identity('shipyard', 'slipway-and-frame-yard', 'boat construction and repair', 'tar black · hull wood · sail canvas', 'slipway with raised hull', ['keel blocks', 'timber yard'], ['hammering', 'hoist movement', 'launching'], commonMilestones(
    { stage: 'ruin', silhouette: 'collapsed-slipway', functionalRead: 'abandoned boat yard', environment: 'rotted timbers and silted ramp', activeElements: ['fallen frame', 'old keel'] },
    { stage: 'repaired', silhouette: 'single-repair-slipway', functionalRead: 'small boat repair yard', environment: 'cleared ramp and timber stack', activeElements: ['keel blocks', 'repair tools'] },
    { stage: 'settled', silhouette: 'slipway-and-frame-shed', functionalRead: 'working boat yard', environment: 'covered shed and launch path', activeElements: ['raised hull', 'scaffold'] },
    { stage: 'prosperous', silhouette: 'multi-slip-shipyard', functionalRead: 'town shipbuilding yard', environment: 'multiple slips, timber court and sail loft', activeElements: ['hull frames', 'hoists', 'timber teams'] },
    { stage: 'thriving', silhouette: 'complete-shipbuilding-complex', functionalRead: 'regional shipyard', environment: 'multiple build slips, material yard, sail loft and launch basin', activeElements: ['finished hull', 'working cranes', 'launch crew'] },
  )),
  'tide-lighthouse': identity('lighthouse', 'single-tower-and-keeper-yard', 'navigation and coastal safety', 'limestone · lantern gold · sea green', 'single navigation tower', ['keeper house', 'breakwater wall'], ['rotating light', 'wave spray', 'seabird flight'], commonMilestones(
    { stage: 'ruin', silhouette: 'fallen-beacon', functionalRead: 'unlit coastal marker', environment: 'broken reef wall and scrub', activeElements: ['fallen beacon', 'dark lamp room'] },
    { stage: 'repaired', silhouette: 'low-beacon-tower', functionalRead: 'small coastal light', environment: 'cleared reef edge and keeper hut', activeElements: ['lamp room', 'keeper door'] },
    { stage: 'settled', silhouette: 'stone-beacon-and-wall', functionalRead: 'working navigation light', environment: 'stone base, keeper yard and breakwater', activeElements: ['light beam', 'wave wall'] },
    { stage: 'prosperous', silhouette: 'tall-lighthouse-yard', functionalRead: 'reliable coastal guidance', environment: 'tall tower, keeper court and protected path', activeElements: ['rotating lantern', 'keeper team', 'sea wall'] },
    { stage: 'thriving', silhouette: 'complete-coastal-safety-station', functionalRead: 'regional navigation landmark', environment: 'single tall tower, keeper compound and robust breakwater', activeElements: ['wide light beam', 'wave spray', 'watch rotation'] },
  )),
}

export function getBuildingVisualIdentity(buildingType: string): BuildingVisualIdentity | undefined {
  return BUILDING_VISUAL_IDENTITIES[buildingType]
}

export function getBuildingVisualLevel(
  buildingType: string,
  level: number,
): BuildingVisualLevel | undefined {
  const identity = getBuildingVisualIdentity(buildingType)
  if (!identity) return undefined
  const normalizedLevel = Math.max(0, Math.min(8, Math.floor(level))) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  return identity.levelArc[`L${normalizedLevel}`]
}
