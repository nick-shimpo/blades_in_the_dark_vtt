// Blades in the Dark — canonical reference data (from the free BitD sheets/SRD, CC-BY John Harper)
// plus original GM spark prompts. Identifiers only; no prose.

export const FACTIONS = [
  // Underworld
  {n:"The Unseen",c:"Underworld",t:"IV",h:"S",d:""},
  {n:"The Hive",c:"Underworld",t:"IV",h:"S",d:""},
  {n:"The Circle of Flame",c:"Underworld",t:"III",h:"S",d:""},
  {n:"The Silver Nails",c:"Underworld",t:"III",h:"S",d:""},
  {n:"Lord Scurlock",c:"Underworld",t:"III",h:"S",d:"Six Towers"},
  {n:"The Crows",c:"Underworld",t:"II",h:"W",d:"Crow's Foot"},
  {n:"The Lampblacks",c:"Underworld",t:"II",h:"W",d:"Crow's Foot"},
  {n:"The Red Sashes",c:"Underworld",t:"II",h:"W",d:"Crow's Foot"},
  {n:"The Dimmer Sisters",c:"Underworld",t:"II",h:"S",d:"Six Towers"},
  {n:"The Grinders",c:"Underworld",t:"II",h:"W",d:"The Docks"},
  {n:"The Billhooks",c:"Underworld",t:"II",h:"W",d:"The Docks"},
  {n:"The Wraiths",c:"Underworld",t:"II",h:"W",d:""},
  {n:"The Gray Cloaks",c:"Underworld",t:"II",h:"S",d:""},
  {n:"Ulf Ironborn",c:"Underworld",t:"I",h:"S",d:""},
  {n:"The Fog Hounds",c:"Underworld",t:"I",h:"W",d:""},
  {n:"The Lost",c:"Underworld",t:"I",h:"W",d:""},
  // Institutions
  {n:"Imperial Military",c:"Institutions",t:"VI",h:"S",d:""},
  {n:"City Council",c:"Institutions",t:"V",h:"S",d:"Charterhall"},
  {n:"Ministry of Preservation",c:"Institutions",t:"V",h:"S",d:""},
  {n:"Leviathan Hunters",c:"Institutions",t:"V",h:"S",d:"Whitecrown"},
  {n:"Ironhook Prison",c:"Institutions",t:"IV",h:"S",d:"Dunslough"},
  {n:"Sparkwrights",c:"Institutions",t:"IV",h:"S",d:""},
  {n:"Spirit Wardens",c:"Institutions",t:"IV",h:"S",d:"Bellweather Crematorium"},
  {n:"Bluecoats",c:"Institutions",t:"III",h:"S",d:"Citywide"},
  {n:"Inspectors",c:"Institutions",t:"III",h:"S",d:"Charterhall"},
  {n:"Iruvian Consulate",c:"Institutions",t:"III",h:"S",d:""},
  {n:"Skovlan Consulate",c:"Institutions",t:"III",h:"W",d:""},
  {n:"The Brigade",c:"Institutions",t:"II",h:"S",d:"Citywide"},
  {n:"Severosi Consulate",c:"Institutions",t:"I",h:"S",d:""},
  {n:"Dagger Isles Consulate",c:"Institutions",t:"I",h:"S",d:""},
  // Labor & Trade
  {n:"The Foundation",c:"Labor & Trade",t:"IV",h:"S",d:""},
  {n:"Dockers",c:"Labor & Trade",t:"III",h:"S",d:"The Docks"},
  {n:"Gondoliers",c:"Labor & Trade",t:"III",h:"S",d:"The canals"},
  {n:"Sailors",c:"Labor & Trade",t:"III",h:"W",d:"The Docks"},
  {n:"Laborers",c:"Labor & Trade",t:"III",h:"W",d:"Coalridge"},
  {n:"Cabbies",c:"Labor & Trade",t:"II",h:"W",d:"Citywide"},
  {n:"Cyphers",c:"Labor & Trade",t:"II",h:"S",d:""},
  {n:"Ink Rakes",c:"Labor & Trade",t:"II",h:"W",d:""},
  {n:"Rail Jacks",c:"Labor & Trade",t:"II",h:"W",d:"Gaddoc Station"},
  {n:"Servants",c:"Labor & Trade",t:"II",h:"W",d:"Citywide"},
  // Citizenry
  {n:"Whitecrown",c:"Citizenry",t:"V",h:"S",d:"Whitecrown"},
  {n:"Brightstone",c:"Citizenry",t:"IV",h:"S",d:"Brightstone"},
  {n:"Charterhall",c:"Citizenry",t:"IV",h:"S",d:"Charterhall"},
  {n:"Six Towers",c:"Citizenry",t:"III",h:"W",d:"Six Towers"},
  {n:"Silkshore",c:"Citizenry",t:"II",h:"S",d:"Silkshore"},
  {n:"Nightmarket",c:"Citizenry",t:"II",h:"S",d:"Nightmarket"},
  {n:"Crow's Foot",c:"Citizenry",t:"II",h:"S",d:"Crow's Foot"},
  {n:"The Docks",c:"Citizenry",t:"II",h:"S",d:"The Docks"},
  {n:"Barrowcleft",c:"Citizenry",t:"II",h:"S",d:"Barrowcleft"},
  {n:"Coalridge",c:"Citizenry",t:"II",h:"W",d:"Coalridge"},
  {n:"Charhollow",c:"Citizenry",t:"I",h:"S",d:"Charhollow"},
  {n:"Dunslough",c:"Citizenry",t:"I",h:"W",d:"Dunslough"},
  // The Fringe
  {n:"The Church of Ecstasy",c:"The Fringe",t:"IV",h:"S",d:"Brightstone"},
  {n:"The Horde",c:"The Fringe",t:"III",h:"S",d:""},
  {n:"The Path of Echoes",c:"The Fringe",t:"III",h:"S",d:"Charterhall"},
  {n:"The Forgotten Gods",c:"The Fringe",t:"III",h:"W",d:""},
  {n:"The Reconciled",c:"The Fringe",t:"III",h:"S",d:""},
  {n:"Skovlander Refugees",c:"The Fringe",t:"III",h:"W",d:"Charhollow"},
  {n:"The Weeping Lady",c:"The Fringe",t:"II",h:"S",d:"Six Towers"},
  {n:"Deathlands Scavengers",c:"The Fringe",t:"II",h:"W",d:"Deathlands"}
];

export const CATEGORIES = ["Underworld","Institutions","Labor & Trade","Citizenry","The Fringe"];

export const DISTRICTS = [
  {n:"Whitecrown",s:"Lord Governor's estates, the Academy"},
  {n:"Brightstone",s:"grand mansions, luxury shops"},
  {n:"Charterhall",s:"civic offices, commerce hub"},
  {n:"Six Towers",s:"formerly rich, now dilapidated"},
  {n:"Silkshore",s:"red lamp district, artists"},
  {n:"Nightmarket",s:"exotic rail trade, illicit goods"},
  {n:"Crow's Foot",s:"cramped multi-level streets, gangs"},
  {n:"The Docks",s:"rough taverns, fighting pits, warehouses"},
  {n:"Barrowcleft",s:"farmers, eeleries"},
  {n:"Coalridge",s:"laborers, factories"},
  {n:"Charhollow",s:"tenement maze"},
  {n:"Dunslough",s:"labor camp, destitute ghetto"}
];
export const SPECIAL_PLACES = ["The Lost District","Ironhook Prison","Gaddoc Rail Station","The Deathlands","Old North Port"];

export const NAMES_FIRST = ["Adric","Aldo","Amosen","Andrel","Arden","Arlyn","Arquo","Arvus","Ashlyn","Branon","Brace","Brance","Brena","Bricks","Candra","Carissa","Carro","Casslyn","Cavelle","Clave","Corille","Cross","Crowl","Cyrene","Daphnia","Drav","Edlun","Emeline","Grine","Helles","Hix","Holtz","Kamelin","Kelyr","Kobb","Kristov","Laudius","Lauria","Lenia","Lizete","Lorette","Lucella","Lynthia","Mara","Milos","Morlan","Myre","Narcus","Naria","Noggs","Odrienne","Orlan","Phin","Polonia","Quess","Remira","Ring","Roethe","Sesereth","Sethla","Skannon","Stavrul","Stev","Syra","Talitha","Tesslyn","Thena","Timoth","Tocker","Una","Vaurin","Veleris","Veretta","Vestine","Vey","Volette","Vond","Weaver","Wester","Zamira"];
export const NAMES_FAMILY = ["Ankhayat","Arran","Athanoch","Basran","Boden","Booker","Bowman","Breakiron","Brogan","Clelland","Clermont","Coleburn","Comber","Daava","Dalmore","Danfield","Dunvil","Farros","Grine","Haig","Helker","Helles","Hellyers","Jayan","Jeduin","Kardera","Karstas","Keel","Kessarin","Kinclaith","Lomond","Maroden","Michter","Morriston","Penderyn","Prichard","Rowan","Sevoy","Skelkallan","Skora","Slane","Strangford","Strathmill","Templeton","Tyrconnell","Vale","Walund","Welker"];
export const NAMES_ALIAS = ["Bell","Birch","Bricks","Bug","Chime","Coil","Cricket","Cross","Crow","Echo","Flint","Frog","Frost","Grip","Gunner","Hammer","Hook","Junker","Mist","Moon","Nail","Needle","Ogre","Pool","Ring","Ruby","Silver","Skinner","Song","Spur","Tackle","Thistle","Thorn","Tick-Tock","Twelves","Vixen","Whip","Wicker"];

export const VENUES = ["The Hooded Fox","The Hook & Line","The Leaky Bucket","The Devil's Tooth","The Black Tree","The Cat & Candle","The Broken Anchor","The Red Lamp","The Nail & Bottle","The Six Arms","The Old Rasp","The Moon's Daughter","The Sexton","Hazlewood","Quinn's","Undercross","Echo Gardens","The Night Market","Chalk Street Bridge","Candle Street Bridge","Gaddoc Rail Station","Heartbreak Square","The Anvilworks","The Black Circle","Bellweather Crematorium","The Blood Pits","The Lost Ward","Razor Hill"];

// ---- Spark tables (original prompts) ----
const T = (id,title,items,group) => ({id,title,die:"d"+items.length,items,group});

export const TABLES = [
  T("descriptor","Descriptor",["Violent","Elegant","Occult","Desperate","Secret","Compromised","Unstable","Theatrical"],"generic"),
  T("action","Action",["Steal","Sabotage","Protect","Expose","Recover","Frame","Infiltrate","Blackmail"],"generic"),
  T("object","Object",["Ledger","Key","Weapon","Relic","Letter","Contraband","Prototype","Body"],"generic"),
  T("motive","Motive",["Money","Revenge","Leverage","Survival","Loyalty","Freedom","Status","Knowledge"],"generic"),
  T("twist","Twist",["Someone expected them","A third party arrives","The target is sympathetic","The target is worse than expected","The prize has a hidden cost","Evidence points toward the crew","An ally wants the same thing","Another clock is already running"],"generic"),
  T("location","Location",["Rooftop garden","Flooded cellar","Canal dock","Counting house","Séance parlor","Rail yard","Bathhouse","Abandoned chapel"],"generic"),
  T("npcrole","NPC role",["Fence","Clerk","Bluecoat sergeant","Dockhand","Cult adept","Noble cousin","Physicker","Ward boss"],"generic"),
  T("npcwant","NPC want",["Out of debt","A ghost laid to rest","Passage out of the city","A rival ruined","Protection","Recognition","One more dose","A secret kept"],"generic"),
  T("npcproblem","NPC problem",["Owes the wrong people","Haunted","Watched by inspectors","Addicted","Blackmailed","Dying slowly","Disgraced","Possessed relative"],"generic"),
  T("npcpersona","NPC personality",["Jovial mask","Brittle pride","Dead calm","Nervous energy","Pious","Flirtatious","Bone-tired","Zealous"],"generic"),
  T("secret","Secret",["Informs for the Bluecoats","Cult member","Embezzling","False identity","Loves an enemy","Hides a ghost","Owns the missing deed","Killed someone who mattered"],"generic"),
  T("obstacle","Obstacle",["Locked vault","Patrol schedule","Hostile spirits","Rival crew present","A witness","Arcane ward","Flooded route","Loyal guards"],"generic"),
  T("complication","Complication",["Alarm sounds early","The information was wrong","Target has moved","Betrayal mid-job","Fire breaks out","Bluecoat sweep","A ghost manifests","A crowd gathers"],"generic"),
  T("consequence","Consequence",["A new clock starts","Heat rises","Witness escapes","Gear lost","Position worsens","A faction takes notice","Harm threatened","The opportunity slips"],"generic"),
  T("reward","Reward",["Coin cache","Leverage letter","Rare asset","Grateful contact","Territory foothold","Occult trinket","Reputation","Information"],"generic"),
  // Doskvol
  T("district","District",["Whitecrown","Brightstone","Charterhall","Six Towers","Silkshore","Nightmarket","Crow's Foot","The Docks","Barrowcleft","Coalridge","Charhollow","Dunslough"],"doskvol"),
  T("loctype","Location type",["Tavern","Warehouse","Manor","Workshop","Shrine","Gambling den","Bathhouse","Market stall","Boathouse","Tenement"],"doskvol"),
  T("venue","Street / venue",VENUES,"doskvol"),
  T("rumour","Local rumour",["The Dimmer Sisters bought a body","A hunter ship came back wrong","Bluecoats sweep Crow's Foot tonight","A Sparkwright prototype is missing","The Red Sashes are short on coin","A noble's séance went bad","New drug moving out of Nightmarket","Unclaimed cargo at Gaddoc Station","Spirit Wardens are asking about a name","Lights seen in the Lost District"],"doskvol"),
  T("problem","Doskvol problem",["Bridge toll war","Canal locks jammed","Ghost outbreak","Labor strike","Bluecoat crackdown","Coal shortage","Vice den turf spat","Plague scare"],"doskvol"),
  T("occult","Occult event",["Ghost field surge","Séance gone wrong","A demon's offer","Cult procession","A hollow walking","Lightning barrier flickers","Haunted cargo","Traces of blood ritual"],"doskvol"),
  T("crimeopp","Crime opportunity",["Unguarded shipment","Drunk heir","Auction of relics","Feuding gangs distracted","Inspector selling files","Warehouse fire sale","Prison transfer","Festival crowds"],"doskvol"),
  // Score
  T("scoretype","Score type",["Burglary","Robbery","Sabotage","Assault","Deception","Extortion","Smuggling","Rescue","Acquisition","Protection","Occult operation","Espionage"],"score"),
  T("target","Target",["Noble","Rival gang","Merchant","Institution","Cult","Workshop","Warehouse","Individual","Faction asset","Transport"],"score"),
  T("whynow","Why now?",["Opportunity","Debt","Faction pressure","Personal goal","A clock","Rivalry","Revenge","Scarcity"],"score"),
  T("whycare","Why care?",["Human cost","Hypocrisy","Personal connection","Moral complication","Useful information","Future leverage","Unexpected sympathy","Threat to the crew"],"score"),
  // NPC
  T("fear","Fear",["Exposure","The Spirit Wardens","Their patron","Ghosts","Poverty","Pain","Losing family","Being forgotten"],"npc"),
  T("tell","Tell",["Taps fingers","Never blinks","Quotes scripture","Counts coins","Wheezes","Overdressed","Smells of incense","Laughs wrong"],"npc"),
  T("vulnerability","Vulnerability",["Family in Dunslough","A debt ledger","Their vice","Sentimental token","Public reputation","Illness","Secret faith","Old warrant"],"npc"),
  T("relcrew","Relationship to crew",["Old friend","Owes the crew","Burned by the crew","Spying on the crew","Wants in","Kin to a contact","Neutral broker","Secret admirer"],"npc"),
  T("immediate","Immediate action",["Runs","Bargains","Calls for help","Lies badly","Attacks","Freezes","Offers a deal","Prays"],"npc")
];

export const PLAYBOOKS = {
  Cutter: {
    complication:["Challenged to a duel","Old fight debt resurfaces","Banned from the pits","Someone they maimed returns"],
    contact:["Pit surgeon who owes them","Bluecoat who looks away","Armorer with a grudge","Fence for scary weapons"],
    score:["Bodyguard job gone crooked","Collect for a ward boss","Break a friend from custody","Intimidate a witness"],
    vulnerability:["Temper on a short fuse","Protects the weak, openly","Known face, easy to track","A trophy they can't hide"],
    want:["A fight that matters","Respect from a boss","Their name feared","A student to train"],
    tempt:["A fine blade, stolen","Front row at the pits","Coin to hurt someone deserving","A title: enforcer"]
  },
  Hound: {
    complication:["Old bounty resurfaces","The pet is spooked by ghosts","A mistaken target haunts them","Rifle traced to a murder"],
    contact:["Deathlands gate sergeant","Taxidermist informant","Rail-yard watchman","Retired manhunter"],
    score:["Track a runaway heir","Recover a stolen beast","Silence a witness — or fake it","Escort through the Deathlands"],
    vulnerability:["Sees targets, not people","The pet is a soft spot","Patient to a fault","Collects trophies"],
    want:["The one that got away","A clean shot at a hated name","A rare beast","Land beyond the barrier"],
    tempt:["A commissioned kill, legal-ish","Electroplasmic ammunition","A perfect vantage, for a price","A bounty ledger, open"]
  },
  Leech: {
    complication:["A formula exploded downtown","Supplier cut them off","A test subject talks","A patent thief profits"],
    contact:["Corpse thief","Academy chemist","Scrapyard boss","Apothecary with debts"],
    score:["Steal reagents from Sparkwrights","Sabotage a rival's workshop","Cook for a gang, once","Recover a seized still"],
    vulnerability:["Fumes and shakes","The workshop is home","Curiosity beats caution","Owes for equipment"],
    want:["A stable formula","The Academy's recognition","A real laboratory","One impossible cure"],
    tempt:["Rare reagents, no questions","A prototype to dissect","Funding, with strings","Forbidden schematics"]
  },
  Lurk: {
    complication:["Left a witness","Signature method recognized","A door they couldn't open","A ghost saw them"],
    contact:["Roof-runner kid","Locksmith","Bored noble insomniac","Chimney sweep network"],
    score:["The vault everyone failed","Steal back what was stolen","Plant evidence upstairs","Map a manor for a buyer"],
    vulnerability:["Works alone, always","Keeps trophies","Superstitious rituals","Can't refuse a challenge"],
    want:["A perfect unwitnessed job","A door with no key","Enough to disappear","The record unbeaten"],
    tempt:["Blueprints of the Mint","A wagered challenge","Fine lockpicks","A patron's shopping list"]
  },
  Slide: {
    complication:["An identity won't die","A proposal accepted — as whom?","The mark fell in love","Two cons collide"],
    contact:["Theater costumer","Society gossip","Forger","Doorman at the club"],
    score:["Long con on a magistrate","Sell a fake relic, twice","Replace a courier","Charm into a gala vault"],
    vulnerability:["Believes their own lies","Too many faces owe favors","Vanity","A real name that hurts"],
    want:["The room's full attention","One honest friend","A seat at high tables","A con told forever"],
    tempt:["An invitation upstairs","A flawless cover identity","Applause","Blackmail, gift-wrapped"]
  },
  Spider: {
    complication:["A thread pulled back","The ledger is missing","An ally flipped","The plan leaked, altered"],
    contact:["Ministry clerk","Deal broker","Jailhouse fixer","Archivist"],
    score:["Swap a will before reading","Bankrupt a rival quietly","Buy a debt, own a man","Rig an auction"],
    vulnerability:["Trusts the plan too much","Clean hands, thin alibi","Hoards secrets","Pride of authorship"],
    want:["The city on strings","A worthy opponent","Every debt collected","To never be surprised"],
    tempt:["A cabinet of files","A minister's ear","A rival's ruin, prepaid","The perfect informant"]
  },
  Whisper: {
    complication:["A compelled ghost lingers","A demon knows their name","The ritual left a mark","Wardens sniffing close"],
    contact:["Grave-digger","Spirit medium","Occult bookseller","Rogue Rail Jack"],
    score:["Steal a spirit bottle","Cleanse — or curse — a manor","A grimoire in the Lost District","Broker with a demon"],
    vulnerability:["Hears the ghost field, always","Debt to something old","Body wearing thin","Forbidden curiosity"],
    want:["A true name","Passage past death","The ghost field, mapped","An answer from beyond"],
    tempt:["A demon's fair offer","An unopened séance box","Pure electroplasm","A dead loved one's echo"]
  }
};
export const PB_CATS = [["complication","Complication"],["contact","Contact"],["score","Score hook"],["vulnerability","Vulnerability"],["want","Wants"],["tempt","Temptation"]];

export const REL_PRESETS = ["Allied","Friendly","Rival","Hostile","At war","Owes","Owed","Uses","Protects","Wants","Fears","Unknown"];
export const NODE_TYPES = ["crew","faction","npc","location","org","other"];
export const CLOCK_SIZES = [4,6,8,10,12];
