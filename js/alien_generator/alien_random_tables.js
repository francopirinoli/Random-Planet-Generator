// js/alien_generator/alien_random_tables.js
// V3: Added native planet name parts.

// Helper function for weighted random selection
export function getWeightedRandom(items) {
    if (!items || items.length === 0) return null;
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const item of items) {
        const weight = item.weight || 1;
        if (random < weight) return item.value;
        random -= weight;
    }
    return items[items.length - 1].value; // Fallback
}

// Helper function to get multiple unique items from an array
export function getRandomUniqueItems(arr, count) {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Helper function to get a random element (if not using weighted, or for simple arrays)
export function getRandomElement(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to get a random floating-point number in a specified range.
export function getRandomInRange(min, max) { // Added export
    return Math.random() * (max - min) + min;
}

// Helper function to get a random integer in a specified range.
export function getRandomIntInRange(min, max) { // Added export
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// HSL to RGB color conversion helper
export function hslToRgb(h, s, l) { // Added export
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}


// --- SPECIES NAMING ---
export const speciesNameParts = {
    prefixes: ["K'th", "Zyl", "Vor", "Gral", "Nym", "Xant", "Plex", "Hyl", "Jor", "Flar", "Myr", "Quil", "Vex", "Zeph", "Cryl"],
    midfixes: ["oo", "aa", "enn", "arr", "iss", "org", "ypt", "ilium", "andr", "oph", "argon", "eon", "yth"],
    suffixes: ["arr", "ons", "ians", "ites", "oids", "lings", "ari", "esi", "um", "ians", "aki", "tar", "eni", "yx", "qor"],
};

// --- INDIVIDUAL NAMING ---
export const individualNameParts = {
    firstSyllables: ["Zan", "Kel", "Ryn", "Vor", "Lys", "Jax", "Pyr", "Fen", "Gor", "Sil", "Brev", "Caz", "Nix", "Taz", "Ulm"],
    middleSyllables: ["'el", "a", "i", "u", "or", "an", "et", "os", "ik", "az", "yr", "on"],
    lastSyllables: ["ak", "os", "en", "is", "ar", "et", "ix", "on", "us", "al", "or", "ez", "yl", "im", "az"],
};

// --- NATIVE PLANET NAMING --- (NEW SECTION)
export const nativePlanetNameParts = {
    prefixes: [
        "Terra", "Aqua", "Ignis", "Aer", "Silva", "Kryll", "Xylo", "Zeno", "Myco", "Geo", "Lithos", "Cryo", "Helio", "Umbra", "Lux",
        "Kai", "Shen", "Coru", "Val", "Rhun", "Aethel", "Bao", "Jor", "Ky'than", "Ophir", "Sol"
    ],
    midfixes: [ // Often representing a quality or feature
        "nova", "prime", "mundi", "terra", "luna", "solara", "umbra", "virens", "caelum", "profundus", "saxum", "glacies",
        "dor", "goth", "nar", "seth", "val", "din", "mir", "bora", "theon", "kastra", "neer", "heim"
    ],
    suffixes: [ // Can denote place, type, or be more abstract
        "a", "ia", "os", "us", "um", "prime", "alpha", "omega", "sanctum", "major", "minor", "nex", "gard", "polis", "terra", "mond",
        "grad", "stan", "lia", "nesos", "ria", "topia", "sphere", "world", "home", "star", "jewel"
    ],
    // Single word names (can be combined or used alone if a more "mythic" name is desired)
    singleWordNames: [
        "Avalon", "Hyperion", "Yggdrasil", "Olympus", "Elysium", "Nirvana", "Arcadia", "Eden", "Ky'lar", "Solitude", "Sanctuary",
        "The Cradle", "The Source", "First Home", "Ancient Heart", "The Core", "The Wellspring", "The Silent World", "The Verdant Sphere"
    ]
};


// --- PHYSICAL TRAITS ---
export const physicalTraits = {
    bodyTypes: [
        { value: "Humanoid", weight: 10 },
        { value: "Insectoid", weight: 8 },
        { value: "Reptilian", weight: 7 },
        { value: "Avian", weight: 6 },
        { value: "Molluscoid (Cephalopod-like)", weight: 5 },
        { value: "Molluscoid (Gastropod-like)", weight: 4 },
        { value: "Amphibian", weight: 5 },
        { value: "Arachnoid", weight: 4 },
        { value: "Crustacean-like", weight: 3 },
        { value: "Plant-like (Mobile Flora)", weight: 3 },
        { value: "Crystalline/Mineral-based", weight: 2 },
        { value: "Energy-based (Non-corporeal)", weight: 1 },
        { value: "Amorphous/Shapeshifting", weight: 2 },
        { value: "Aquatic Mammalian (Dolphin-like)", weight: 3 },
        { value: "Aquatic Fish-like", weight: 3 },
        { value: "Fungoid (Mobile Fungi)", weight: 2 },
        { value: "Avian-Reptilian Hybrid", weight: 3},
        { value: "Mammalian-Insectoid Hybrid", weight: 2}
    ],
    skinTextures: [
        { value: "Smooth, leathery skin", weight: 10 },
        { value: "Chitinous plates", weight: 8 },
        { value: "Overlapping scales (reptilian)", weight: 7 },
        { value: "Feathered (plumage)", weight: 6 },
        { value: "Gelatinous, translucent membrane", weight: 5 },
        { value: "Rough, bark-like hide", weight: 4 },
        { value: "Segmented exoskeleton", weight: 7 },
        { value: "Fine, dense fur", weight: 6 },
        { value: "Rocky, mineral-encrusted hide", weight: 3 },
        { value: "Bioluminescent, patterned skin", weight: 4 },
        { value: "Slimy, mucus-coated skin", weight: 3 },
        { value: "Photosynthetic, leaf-like integument", weight: 2 },
        { value: "Crystalline facets", weight: 2 },
        { value: "Shifting, iridescent scales (fish-like)", weight: 4}
    ],
    appendages: {
        limbCounts: [{value: 2, weight: 5}, {value: 4, weight: 10}, {value: 6, weight: 7}, {value: 8, weight: 4}, {value: 0, weight: 2}, {value: "multiple (10+)", weight: 1}],
        limbTypes: ["manipulator claws", "tentacles", "jointed legs", "powerful talons", "delicate cilia", "prehensile tails", "membranous wings", "fin-like flippers", "root-like tendrils", "psionically controlled tendrils"],
        headFeatures: ["multiple eyes (e.g., 2-8)", "no visible eyes", "large single occulus", "antennae", "mandibles", "proboscis", "crested head", "auroral display around head", "no distinct head"],
    },
    heightRanges: [
        { min: 0.3, max: 0.8, description: "Diminutive" },
        { min: 0.8, max: 1.5, description: "Small" },
        { min: 1.5, max: 2.5, description: "Human-sized" },
        { min: 2.5, max: 4.0, description: "Large" },
        { min: 4.0, max: 10.0, description: "Towering" },
        { min: 0.1, max: 15.0, description: "Extremely Variable (Amorphous/Colonial)"}
    ],
    lifespanRanges: [
        { min: 20, max: 50, description: "Short-lived" },
        { min: 50, max: 150, description: "Human-like lifespan" },
        { min: 150, max: 500, description: "Long-lived" },
        { min: 500, max: 2000, description: "Venerable" },
        { min: 10, max: 10000, description: "Extremely Variable (e.g., due to hibernation, regeneration, or being hive-based)" }
    ],
    primarySenses: [
        "Vision (standard spectrum)", "Vision (infrared)", "Vision (ultraviolet)",
        "Hearing (sonic)", "Hearing (ultrasonic/infrasonic)",
        "Olfaction (chemoreception)", "Gustation (contact chemoreception)",
        "Tactition (touch/pressure)", "Thermoreception (heat/cold)",
        "Electroreception", "Magnetoreception",
        "Echolocation", "Vibration Sense (substrate)",
        "Psionic/Empathic Sense", "Gravitational Sense"
    ]
};

// --- GENDER/SEX CONCEPTS ---
export const genderConcepts = [
    { value: "Binary (similar to human male/female)", weight: 5, description: "Species primarily exhibits two distinct biological sexes and/or social gender roles." },
    { value: "Multiple Genders (3+ distinct roles/identities)", weight: 3, description: "Society recognizes three or more distinct genders, potentially with different biological or social functions." },
    { value: "Agender/Genderless", weight: 4, description: "Species lacks biological sex differentiation or the concept of social gender entirely." },
    { value: "Hermaphroditic/Sequential Hermaphroditism", weight: 3, description: "Individuals possess both male and female reproductive capabilities, possibly changing sex during their lifespan." },
    { value: "Fluid/Non-binary Spectrum", weight: 2, description: "Gender identity is fluid, changeable, or exists outside of fixed categories." },
    { value: "Role-Based (Gender determined by social role/caste)", weight: 2, description: "Social roles or caste determine 'gender' identity, rather than biology." },
    { value: "Hive-Based (e.g., Queen, Drone, Worker)", weight: 1, description: "Reproduction and social roles are dictated by a hive structure with specialized biological forms." },
    { value: "Incomprehensible/Alien", weight: 1, description: "Gender/sex concepts are fundamentally different and difficult to map to human understanding (e.g., based on psychic resonance, life cycle stage)." }
];

// --- INDIVIDUAL OCCUPATIONS ---
export const occupations = {
    anyLevel: [
        "Storyteller/Historian", "Artist (Sculptor/Painter/Musician)", "Healer/Medic",
        "Spiritual Leader/Priest", "Elder/Advisor", "Hunter/Gatherer", "Farmer/Cultivator",
        "Caregiver/Nurturer", "Guard/Warrior", "Trader/Merchant (local)", "Craftsperson (Potter/Weaver/Smith)"
    ],
    industrialUp: [
        "Factory Worker", "Engineer (Mechanical/Civil)", "Scientist (Basic Research)",
        "Teacher/Educator", "Bureaucrat/Administrator", "Merchant (Regional/Global)",
        "Law Enforcer/Investigator", "Journalist/Record Keeper"
    ],
    informationUp: [
        "Programmer/Data Analyst", "Network Technician", "Virtual Reality Designer",
        "Information Broker", "Geneticist/Bio-engineer", "Psychologist/Sociologist",
        "Media Producer/Influencer"
    ],
    spacefaringUp: [
        "Pilot/Navigator", "Astronaut/Explorer", "Ship Engineer/Mechanic",
        "Planetary Surveyor", "Xeno-biologist/Xeno-linguist", "Diplomat/Ambassador",
        "Asteroid Miner", "Terraforming Specialist", "Station Commander", "FTL Drive Technician"
    ],
    advancedInterstellarUp: [
        "Astro-engineer (Megastructures)", "Energy Matrix Overseer", "Consciousness Uplift Facilitator",
        "Galactic Cartographer", "AI Symbiosis Coordinator", "Temporal Flow Analyst (speculative)",
        "Species Archivist (Living Library)"
    ],
    specificSocieties: [ // Examples for specific government/social types
        "Oracle/Diviner (Theocracy)", "Guild Master (Guild-based)", "Gladiator/Pit Fighter (Hierarchical/Militaristic)",
        "Philosopher-King's Advisor (Technocracy/Monarchy)", "Commune Organizer (Anarcho-syndicalist)",
        "Corporate Executive (Corporate Hegemony)", "Knight/Retainer (Feudal)", "Psionic Empath (Hive Mind/Psionic)"
    ]
};

// --- INDIVIDUAL PERSONALITY TRAITS/QUIRKS ---
export const personalityTraits = {
    positive: [
        "Curious", "Patient", "Honest", "Brave", "Kind", "Optimistic", "Logical", "Empathetic",
        "Resourceful", "Disciplined", "Humorous", "Adaptable", "Loyal", "Generous", "Wise"
    ],
    negative: [
        "Impatient", "Deceitful", "Cowardly", "Cruel", "Pessimistic", "Irrational", "Apathetic",
        "Stubborn", "Lazy", "Grumpy", "Rigid", "Suspicious", "Greedy", "Arrogant", "Naive"
    ],
    neutralOrQuirks: [
        "Formal", "Informal", "Quiet", "Talkative", "Serious", "Playful", "Cautious", "Impulsive",
        "Methodical", "Disorganized", "Skeptical", "Idealistic", "Stoic", "Emotional",
        "Collects strange objects", "Has an unusual pet/symbiote", "Speaks in metaphors", "Obsessed with minor details",
        "Prone to sudden insights", "Always fiddling with something", "Has a distinctive vocal tic", "Never makes eye contact (or species equivalent)",
        "Fascinated by specific alien concepts (e.g., human music, weather)", "Slightly paranoid"
    ]
};


// --- SPECIAL CHARACTERISTICS POOL ---
export const specialCharacteristicsPool = [
    { characteristic: "Telepathic Communication", details: "Can transmit and receive thoughts directly with others of their kind, and sometimes with other species, though often imprecisely.", tag: "[TRAIT_TELEPATHY_TAG]" },
    { characteristic: "Silicon-based Biochemistry", details: "Their biological processes are based on silicon compounds rather than carbon, allowing survival in extreme temperatures.", tag: "[TRAIT_SILICON_LIFE_TAG]" },
    { characteristic: "Natural Bioluminescence", details: "Emit light from specialized organs or skin patterns, used for communication, camouflage, or mating displays.", tag: "[TRAIT_BIOLUMINESCENCE_TAG]" },
    { characteristic: "Bio-Electric Discharge", details: "Can generate and discharge significant electrical currents for defense, hunting, or tool manipulation.", tag: "[TRAIT_BIOELECTRICITY_TAG]" },
    { characteristic: "Extreme Regeneration", details: "Capable of regenerating lost limbs or even significant portions of their body.", tag: "[TRAIT_REGENERATION_TAG]" },
    { characteristic: "Phase-Shifting/Cloaking", details: "Can temporarily become invisible or intangible by shifting their molecular structure or bending light.", tag: "[TRAIT_PHASESHIFT_TAG]" },
    { characteristic: "Symbiotic Relationship", details: "Live in a crucial, mutually beneficial relationship with another (possibly non-sentient) native organism.", tag: "[TRAIT_SYMBIOSIS_TAG]" },
    { characteristic: "Hive Mind/Collective Consciousness", details: "Individual minds are linked, contributing to a shared consciousness or group intelligence.", tag: "[TRAIT_HIVEMIND_TAG]" },
    { characteristic: "Psionic Abilities (Minor)", details: "Exhibit minor telekinetic or precognitive abilities, often uncontrolled or intuitive.", tag: "[TRAIT_PSIONICS_MINOR_TAG]" },
    { characteristic: "Adaptable Exoskeleton/Shell", details: "Can rapidly alter the density or composition of their outer shell in response to environmental threats.", tag: "[TRAIT_ADAPTIVE_SHELL_TAG]" },
    { characteristic: "Extreme Environmental Tolerance", details: "Adapted to survive in conditions lethal to most carbon-based life (e.g., vacuum, extreme radiation, high pressure).", tag: "[TRAIT_EXTREME_TOLERANCE_TAG]" },
    { characteristic: "Non-Verbal Language Dominance", details: "Primary communication relies on complex pheromones, color changes, or intricate dances rather than sound.", tag: "[TRAIT_NONVERBAL_LANG_TAG]" },
    { characteristic: "Lithovoric/Rock-Eating", details: "Derive sustenance from consuming and processing minerals and rocks.", tag: "[TRAIT_LITHOVORE_TAG]" },
    { characteristic: "Cyclical Lifecycle", details: "Undergo dramatic metamorphoses or distinct life stages (e.g., larval, chrysalis, adult).", tag: "[TRAIT_CYCLICAL_LIFE_TAG]" },
    { characteristic: "Naturally Armored", details: "Possess thick natural plating, spines, or other defensive physical structures.", tag: "[TRAIT_NATURAL_ARMOR_TAG]" }
];

// --- CULTURAL ASPECTS ---
export const culturalAspectsData = {
    language: {
        namePrefixes: ["Xyl'", "Kli'", "Gro'", "Vex", "Zor'", "Nym", "J'tak", "Floo", "Ryl", "Skree"],
        nameSuffixes: ["ian", "ese", "ic", "ani", "u", "os", "aki", "tek", "qor", "za"],
        structureTypes: [
            { value: "Agglutinative", description: "Words formed by joining morphemes together." },
            { value: "Isolating", description: "Words tend to be single morphemes." },
            { value: "Fusional/Inflectional", description: "Morphemes are often 'fused' and carry multiple pieces of grammatical information." },
            { value: "Polysynthetic", description: "Highly complex words formed from many morphemes, can express sentence-like meanings in a single word." },
            { value: "Oligosynthetic", description: "Very few morphemes (perhaps a few hundred) which combine to form all words." }
        ],
        phonologyNotes: [
            "Rich in clicks and sibilants, limited vowel range.",
            "Melodic with complex tonal patterns.",
            "Harsh, guttural sounds with many fricatives.",
            "Uses sub-vocalized rumbles and high-frequency whistles.",
            "Incorporates percussive elements made with appendages.",
            "Syntax heavily reliant on scent-markers accompanying vocalizations.",
            "No written form; relies on oral tradition and complex memory aids."
        ],
        communicationMethods: [
            "Vocalizations (speech, song, calls)",
            "Gestural language (e.g., using limbs, tentacles, antennae)",
            "Pheromonal signals",
            "Bioluminescent patterns/color shifts",
            "Telepathic exchange (if trait present)",
            "Tactile communication (touch-based)",
            "Complex percussive signals (e.g., drumming, tapping)"
        ]
    },
    government: {
        types: [
            { value: "Direct Democracy", weight: 5 }, { value: "Representative Republic", weight: 7 },
            { value: "Constitutional Monarchy", weight: 4 }, { value: "Absolute Monarchy/Despotism", weight: 3 },
            { value: "Oligarchy (Council of Elders/Wealthy/Military)", weight: 6 },
            { value: "Theocracy", weight: 5 },
            { value: "Technocracy/Meritocracy", weight: 6 },
            { value: "Anarcho-Syndicalist Commune", weight: 2 },
            { value: "Hive Mind Collective (Centralized or Decentralized)", weight: 3 },
            { value: "Corporate Hegemony/Plutocracy", weight: 4 },
            { value: "Feudal System", weight: 2 },
            { value: "Magocracy (Ruled by magic/psionic users)", weight: 1 }
        ],
        powerStructures: [
            "A council of elected representatives.", "A hereditary monarch with advisory bodies.",
            "A ruling priestly caste interpreting divine will.", "A small group of powerful families or corporations.",
            "Decisions made by those with proven expertise or contribution.", "No formal leaders; consensus through local assemblies.",
            "A single, all-powerful AI or collective intelligence.", "Warlords controlling distinct territories."
        ],
        citizenRightsConcepts: [
            "Universal suffrage and extensive personal freedoms.", "Rights tied to social status or lineage.",
            "Strict adherence to religious law defines rights.", "Few individual rights; emphasis on collective duty.",
            "Rights earned through service or achievement.", "Complete individual autonomy, minimal societal obligations."
        ]
    },
    economy: {
        systems: [
            { value: "Market Capitalism (Regulated or Laissez-faire)", weight: 6 },
            { value: "State-Controlled Socialism/Communism", weight: 4 },
            { value: "Barter-based system (no formal currency)", weight: 3 },
            { value: "Gift Economy (status through giving)", weight: 2 },
            { value: "Resource-based (direct allocation, post-scarcity for essentials)", weight: 5 },
            { value: "Guild-based Craftsmanship", weight: 3 },
            { value: "Information/Data as primary commodity", weight: 2 }
        ],
        currencyExamples: ["Energy Credits", "Standardized Data Units", "Bio-Tokens", "Precious Metals/Gems", "Favors/Reputation Score", "No formal currency", "Merit-Units"],
        keyIndustriesExamples: ["Asteroid Mining", "Information Brokerage", "Bio-Engineering", "Luxury Goods Crafting", "Energy Production (e.g., geothermal, fusion, Dyson swarm)", "Terraforming", "Xeno-Archaeology", "Philosophical Discourse Services", "Artistic Holography"]
    },
    religionPhilosophy: {
        beliefSystemNames: ["The Cosmic Weave", "Ancestral Echoes", "The Great Filter Cult", "Path of a Thousand Cycles", "The Void Singers", "Unity of Form", "The Architects' Legacy", "Cult of the Machine Spirit", "The Celestial Gardeners", "The Eternal Recurrence"],
        coreTenetsExamples: [
            "Belief in universal interconnectedness and reincarnation.", "Reverence for ancestors and ancient traditions.",
            "Conviction that all civilizations face existential tests.", "Focus on achieving perfect societal harmony.",
            "Worship of a cosmic entity or pantheon of gods.", "Pursuit of pure logic and eradication of emotion.",
            "Belief that reality is a simulation.", "Devotion to preserving all knowledge.",
            "Emphasis on individual enlightenment through asceticism.", "Sacred duty to explore and understand the cosmos."
        ],
        ritualsPracticesExamples: [
            "Daily meditative communion with nature/planet.", "Elaborate ancestor veneration ceremonies.",
            "Ritualistic combat or tests of skill.", "Mass pilgrimages to sacred sites.",
            "Complex astrological divination.", "Technological augmentation as a spiritual pursuit.",
            "Collective dream-sharing or psionic linking.", "Sacred consumption of psychoactive flora/fauna."
        ]
    },
    technologyLevels: [
        { value: "Pre-Industrial (Stone/Bronze/Iron Age equivalent)", weight: 1 },
        { value: "Early Industrial (Steam power, basic machinery)", weight: 2 },
        { value: "Industrial Age (Mass production, electricity)", weight: 3 },
        { value: "Information Age (Computers, global networks)", weight: 5 },
        { value: "Early Spacefaring (Planetary colonization, basic interplanetary travel)", weight: 7 },
        { value: "Interstellar (FTL capability, widespread star system colonization)", weight: 6 },
        { value: "Advanced Interstellar (Large-scale astro-engineering, energy mastery)", weight: 4 },
        { value: "Transcendent/Post-Biological (Difficult to comprehend, may involve energy beings, digital consciousness)", weight: 1 }
    ],
    socialStructures: [
        { value: "Egalitarian (minimal hierarchy, emphasis on equality)", weight: 5 },
        { value: "Hierarchical (clear ranks and social strata)", weight: 7 },
        { value: "Caste-based (rigid social divisions determined by birth)", weight: 3 },
        { value: "Clan-based/Tribal (loyalty to kinship groups)", weight: 4 },
        { value: "Meritocratic (status based on achievement/skill)", weight: 6 },
        { value: "Age-graded (status and roles determined by age group)", weight: 2 },
        { value: "Gender-defined roles (can be matriarchal, patriarchal, or other)", weight: 3 }
    ],
    artExpressions: [
        "Elaborate body painting and modification.", "Complex, polyphonic musical traditions.",
        "Monumental architecture and sculpture.", "Oral storytelling and epic poetry.",
        "Holographic light shows and immersive virtual realities.", "Kinetic sculptures powered by natural forces.",
        "Genetically engineered bioluminescent flora art.", "Abstract mathematical or data-driven art.",
        "Ritualistic dance and performance art.", "Scent-based art forms (olfactory compositions)."
    ]
};

// --- INTERACTION PROFILE ---
export const interactionProfileData = {
    initialDispositions: [
        { value: "Cautious and wary", weight: 7 },
        { value: "Curious and inquisitive", weight: 8 },
        { value: "Aggressive and territorial", weight: 3 },
        { value: "Fearful and skittish", weight: 4 },
        { value: "Welcoming and friendly", weight: 5 },
        { value: "Indifferent and aloof", weight: 6 },
        { value: "Analytical and detached", weight: 7 },
        { value: "Playful and mischievous", weight: 2 },
        { value: "Reverent and awestruck (by spacefarers)", weight: 1 },
        { value: "Condescending and arrogant", weight: 3 }
    ],
    communicationStyles: [
        "Literal and direct, struggles with idioms.", "Poetic and metaphorical, speaks in riddles.",
        "Highly logical and precise, uses technical terms.", "Emotive and expressive, uses many gestures/tones.",
        "Formal and ritualistic, follows strict protocols.", "Silent, communicates primarily through telepathy/non-verbal means.",
        "Uses a complex series of clicks, whistles, and chirps.", "Speaks in a monotone, emotionless voice.",
        "Constantly asks questions, eager to learn.", "Often pauses for long periods before responding."
    ],
    keyMotivationsExamples: [
        "Survival and Procreation", "Acquisition of Knowledge", "Territorial Expansion",
        "Spiritual Enlightenment", "Technological Advancement", "Trade and Resource Acquisition",
        "Artistic Expression and Creation", "Maintaining Cultural Purity", "Exploring the Unknown",
        "Seeking Allies", "Escaping a Dying World/System", "Fulfilling an Ancient Prophecy",
        "Understanding their place in the cosmos", "Protecting their homeworld at all costs"
    ]
};

console.log("alien_random_tables.js updated with Native Planet Name Parts (v3)");
