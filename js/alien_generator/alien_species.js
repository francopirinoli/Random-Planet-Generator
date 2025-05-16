// js/alien_generator/alien_species.js
// V3: Added native planet name generation.

import {
    speciesNameParts,
    physicalTraits,
    specialCharacteristicsPool,
    culturalAspectsData,
    interactionProfileData,
    individualNameParts,
    genderConcepts,
    occupations,
    personalityTraits,
    nativePlanetNameParts, // Import new data for native planet names
    getWeightedRandom,
    getRandomUniqueItems,
    getRandomElement,
    getRandomInRange,
    getRandomIntInRange
} from './alien_random_tables.js';


/**
 * Generates a procedural name for the alien species.
 * @returns {string} The generated species name.
 */
function generateSpeciesName() {
    const prefix = getRandomElement(speciesNameParts.prefixes);
    const midfix = Math.random() < 0.4 ? getRandomElement(speciesNameParts.midfixes) : ""; // Optional midfix
    const suffix = getRandomElement(speciesNameParts.suffixes);
    return `${prefix}${midfix}${suffix}`;
}

/**
 * Generates a procedural name for the alien language.
 * @returns {string} The generated language name.
 */
function generateLanguageName() {
    const prefix = getRandomElement(culturalAspectsData.language.namePrefixes);
    const suffix = getRandomElement(culturalAspectsData.language.nameSuffixes);
    let name = prefix + suffix;
    if (Math.random() < 0.3) {
        const connectors = ["'a", "i'", "el", "on", "u"];
        name = prefix + getRandomElement(connectors) + suffix;
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Generates a procedural name for an individual alien.
 * @returns {string} The generated individual name.
 */
function generateIndividualName() {
    const first = getRandomElement(individualNameParts.firstSyllables);
    const middle = Math.random() < 0.6 ? getRandomElement(individualNameParts.middleSyllables) : ""; // More chance for middle syllable
    const last = getRandomElement(individualNameParts.lastSyllables);
    if (!middle && Math.random() < 0.2) {
        return `${first}${last}${getRandomElement(individualNameParts.lastSyllables)}`;
    }
    return `${first}${middle}${last}`;
}

/**
 * Generates a procedural native name for the alien's home planet.
 * @returns {string} The generated native planet name.
 */
function generateNativePlanetName() {
    if (Math.random() < 0.2 && nativePlanetNameParts.singleWordNames.length > 0) { // 20% chance for a single word name
        return getRandomElement(nativePlanetNameParts.singleWordNames);
    }

    let name = "";
    const numPrefixes = getRandomIntInRange(1, 2);
    for (let i = 0; i < numPrefixes; i++) {
        name += getRandomElement(nativePlanetNameParts.prefixes);
    }

    if (Math.random() < 0.65) { // 65% chance of having a midfix
        name += getRandomElement(nativePlanetNameParts.midfixes);
    }

    name += getRandomElement(nativePlanetNameParts.suffixes);

    // Basic capitalization: Capitalize first letter, ensure no double caps from parts.
    // More sophisticated capitalization might be needed if parts can start with caps.
    // For now, make first letter uppercase and the rest lowercase, then join.
    // This simple approach might not be ideal for all naming conventions.
    // A better approach would be to ensure parts are lowercase and then capitalize the final result.
    // Assuming parts are generally lowercase or will be handled by this:
    if (name.length > 0) {
        // Split by potential capital letters if midfixes/suffixes might introduce them
        // and then join with spaces if that's the desired style, or just capitalize first.
        // For simplicity, let's just capitalize the very first letter of the combined string.
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        // Alternative: if parts are distinct words:
        // name = name.split(/(?=[A-Z])/).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
        // For now, simple first letter capitalization of the combined string.
    }
    // A quick check to prevent overly long names if too many parts combine.
    if (name.length > 20 && nativePlanetNameParts.singleWordNames.length > 0) {
        return getRandomElement(nativePlanetNameParts.singleWordNames); // Fallback to single word if too long
    }
    if (name.length === 0 && nativePlanetNameParts.singleWordNames.length > 0){ // Fallback if somehow empty
        return getRandomElement(nativePlanetNameParts.singleWordNames);
    }
    if (name.length === 0) return "Homeworld"; // Absolute fallback

    return name;
}


/**
 * Generates the individual persona details for the contacted alien.
 * @param {object} speciesData - The already generated data for the species (for context like tech level).
 * @returns {object} An object containing the individual's details (name, gender, occupation, traits).
 */
function generateIndividualPersona(speciesData) {
    const persona = {};
    persona.name = { value: generateIndividualName(), tag: "[INDIVIDUAL_NAME_TAG]" };
    const genderObj = getWeightedRandom(genderConcepts);
    persona.genderConcept = {
        value: genderObj.value,
        description: genderObj.description,
        tag: "[INDIVIDUAL_GENDER_TAG]"
    };

    const techLevel = speciesData.culturalAspects.technologyLevel.value.toLowerCase();
    let possibleOccupations = [...occupations.anyLevel];
    if (techLevel.includes("industrial")) possibleOccupations.push(...occupations.industrialUp);
    if (techLevel.includes("information")) possibleOccupations.push(...occupations.informationUp);
    if (techLevel.includes("spacefaring")) possibleOccupations.push(...occupations.spacefaringUp);
    if (techLevel.includes("advanced interstellar") || techLevel.includes("transcendent")) possibleOccupations.push(...occupations.advancedInterstellarUp);

    const govType = speciesData.culturalAspects.government.type.value.toLowerCase();
    const socialStructure = speciesData.culturalAspects.socialStructure.value.toLowerCase();
    if (govType.includes("theocracy")) possibleOccupations.push(...occupations.specificSocieties.filter(o => o.includes("Oracle") || o.includes("Priest")));
    if (socialStructure.includes("guild")) possibleOccupations.push(...occupations.specificSocieties.filter(o => o.includes("Guild")));

    const uniqueOccupations = [...new Set(possibleOccupations)];
    persona.occupation = { value: getRandomElement(uniqueOccupations), tag: "[INDIVIDUAL_OCCUPATION_TAG]" };

    const numTraits = getRandomIntInRange(1, 3);
    const chosenTraits = [];
    for (let i = 0; i < numTraits; i++) {
        const traitTypeRoll = Math.random();
        let traitPool;
        if (traitTypeRoll < 0.4) traitPool = personalityTraits.positive;
        else if (traitTypeRoll < 0.7) traitPool = personalityTraits.negative;
        else traitPool = personalityTraits.neutralOrQuirks;
        let trait;
        do { trait = getRandomElement(traitPool); } while (chosenTraits.includes(trait));
        chosenTraits.push(trait);
    }
    persona.personalityTraits = { value: chosenTraits.join(", "), tag: "[INDIVIDUAL_TRAITS_TAG]" };
    return persona;
}


/**
 * Generates the complete data object for an alien species, including an individual persona.
 * @param {object} planetData - Data about the planet the species inhabits.
 * @returns {object} The speciesData object, now including an `individualPersona`.
 */
export function generateAlienSpecies(planetData) {
    const speciesData = {};

    // --- Species Name & Origin ---
    speciesData.name = { value: generateSpeciesName(), tag: "[SPECIES_NAME_TAG]" };
    // This is the HUMAN-KNOWN designation for the planet
    speciesData.planetOfOriginName = { value: planetData.general.name, tag: "[PLANET_NAME_TAG_REF]" };
    // This is the NATIVE name the species uses for their planet
    speciesData.nativePlanetName = { value: generateNativePlanetName(), tag: "[NATIVE_PLANET_NAME_TAG]" };


    // --- Physical Traits ---
    speciesData.physical = {};
    speciesData.physical.bodyType = { value: getWeightedRandom(physicalTraits.bodyTypes), tag: "[PHYS_BODY_TYPE_TAG]" };
    speciesData.physical.skinTexture = { value: getWeightedRandom(physicalTraits.skinTextures), tag: "[PHYS_SKIN_TAG]" };

    const limbCountObj = getWeightedRandom(physicalTraits.appendages.limbCounts);
    let appendageDescValue = `${limbCountObj} limbs`;
    if (limbCountObj > 0 && limbCountObj !== "multiple (10+)") {
        const numLimbTypes = getRandomIntInRange(1, 2);
        const chosenLimbTypes = getRandomUniqueItems(physicalTraits.appendages.limbTypes, numLimbTypes);
        appendageDescValue += ` (types: ${chosenLimbTypes.join(", ")})`;
    } else if (limbCountObj === 0) {
        appendageDescValue = getRandomElement(["Serpentine body, no distinct limbs", "Slug-like form, no distinct limbs", "Amorphous, primarily pseudopods for locomotion"]);
    }
    speciesData.physical.appendages = { value: appendageDescValue, tag: "[PHYS_APPENDAGES_TAG]" };

    speciesData.physical.headFeatures = {
        value: getRandomElement(physicalTraits.appendages.headFeatures),
        tag: "[PHYS_HEAD_FEATURES_TAG]"
    };

    const heightRange = getRandomElement(physicalTraits.heightRanges);
    speciesData.physical.averageHeight = { value: `${getRandomInRange(heightRange.min, heightRange.max).toFixed(1)} meters (${heightRange.description})`, tag: "[PHYS_HEIGHT_TAG]" };

    const lifespanRange = getRandomElement(physicalTraits.lifespanRanges);
    speciesData.physical.lifespan = { value: `${getRandomIntInRange(lifespanRange.min, lifespanRange.max)} standard years (${lifespanRange.description})`, tag: "[PHYS_LIFESPAN_TAG]" };

    const numSenses = getRandomIntInRange(1, 3);
    speciesData.physical.primarySenses = { value: getRandomUniqueItems(physicalTraits.primarySenses, numSenses).join(", "), tag: "[PHYS_SENSES_TAG]" };

    // --- Special Characteristics ---
    const numSpecialChars = getRandomIntInRange(1, 3);
    speciesData.specialCharacteristics = getRandomUniqueItems(specialCharacteristicsPool, numSpecialChars).map(sc => ({
        characteristic: sc.characteristic,
        details: sc.details,
        tag: sc.tag
    }));

    // --- Cultural Aspects ---
    speciesData.culturalAspects = {};
    speciesData.culturalAspects.language = {
        name: { value: generateLanguageName(), tag: "[LANG_NAME_TAG]" },
        structureType: { value: getRandomElement(culturalAspectsData.language.structureTypes).value, tag: "[LANG_STRUCTURE_TYPE_TAG]" },
        phonologyNotes: { value: getRandomElement(culturalAspectsData.language.phonologyNotes), tag: "[LANG_PHONOLOGY_TAG]" },
        communicationMethod: { value: getRandomElement(culturalAspectsData.language.communicationMethods), tag: "[LANG_COMM_METHOD_TAG]" }
    };
    const govTypeObj = getWeightedRandom(culturalAspectsData.government.types);
    speciesData.culturalAspects.government = {
        type: { value: govTypeObj, tag: "[GOV_TYPE_TAG]" },
        powerStructure: { value: getRandomElement(culturalAspectsData.government.powerStructures), tag: "[GOV_POWER_STRUCTURE_TAG]" },
        citizenRights: { value: getRandomElement(culturalAspectsData.government.citizenRightsConcepts), tag: "[GOV_CITIZEN_RIGHTS_TAG]" }
    };
    speciesData.culturalAspects.economy = {
        system: { value: getWeightedRandom(culturalAspectsData.economy.systems), tag: "[ECON_SYSTEM_TAG]" },
        currency: { value: getRandomElement(culturalAspectsData.economy.currencyExamples), tag: "[ECON_CURRENCY_TAG]" },
        keyIndustries: { value: getRandomUniqueItems(culturalAspectsData.economy.keyIndustriesExamples, getRandomIntInRange(1,3)).join(", "), tag: "[ECON_INDUSTRIES_TAG]" }
    };
    speciesData.culturalAspects.religionPhilosophy = {
        dominantBeliefName: { value: getRandomElement(culturalAspectsData.religionPhilosophy.beliefSystemNames), tag: "[BELIEF_NAME_TAG]" },
        coreTenets: { value: getRandomElement(culturalAspectsData.religionPhilosophy.coreTenetsExamples), tag: "[BELIEF_TENETS_TAG]" },
        ritualsPractices: { value: getRandomElement(culturalAspectsData.religionPhilosophy.ritualsPracticesExamples), tag: "[BELIEF_RITUALS_TAG]" }
    };
    speciesData.culturalAspects.technologyLevel = { value: getWeightedRandom(culturalAspectsData.technologyLevels), tag: "[TECH_LEVEL_TAG]" };
    speciesData.culturalAspects.socialStructure = { value: getWeightedRandom(culturalAspectsData.socialStructures), tag: "[SOCIAL_STRUCTURE_TAG]" };
    speciesData.culturalAspects.artExpression = { value: getRandomElement(culturalAspectsData.artExpressions), tag: "[ART_EXPRESSION_TAG]" };

    // --- Interaction Profile (Species Norms) ---
    speciesData.interactionProfile = {};
    speciesData.interactionProfile.initialDisposition = { value: getWeightedRandom(interactionProfileData.initialDispositions), tag: "[DISPOSITION_INITIAL_TAG]" };
    speciesData.interactionProfile.communicationStyle = { value: getRandomElement(interactionProfileData.communicationStyles), tag: "[COMM_STYLE_TAG]" };
    speciesData.interactionProfile.keyMotivations = { value: getRandomUniqueItems(interactionProfileData.keyMotivationsExamples, getRandomIntInRange(1,3)).join("; "), tag: "[MOTIVATION_KEYS_TAG]" };

    // --- Simple Planet Influence ---
    if (planetData.surface.averageTemperature > 100 && speciesData.specialCharacteristics.length < 3) {
        const heatTrait = { characteristic: "Exceptional Heat Resistance", details: "Possesses biological adaptations to thrive in extremely high temperatures found on their homeworld.", tag: "[TRAIT_HEAT_RESISTANCE_TAG]" };
        if (!speciesData.specialCharacteristics.some(sc => sc.tag === heatTrait.tag)) {
            speciesData.specialCharacteristics.push(heatTrait);
        }
    }
     if (planetData.general.gravity < 0.5 && speciesData.physical.averageHeight.value.includes("Human-sized")) {
         speciesData.physical.averageHeight.value = speciesData.physical.averageHeight.value.replace("Human-sized", "Tall and gracile due to low gravity");
    }
    if (planetData.general.type === "Ocean Planet" || planetData.general.type === "Ice World") {
        if (Math.random() < 0.7 && !speciesData.physical.bodyType.value.toLowerCase().includes("aquatic")) {
            speciesData.physical.bodyType.value = getRandomElement(["Aquatic Mammalian (Whale-like)", "Aquatic Fish-like", "Amphibious Humanoid", "Molluscoid (Cephalopod-like)"]);
            speciesData.physical.appendages.value = getRandomElement(["Powerful fins and tail fluke", "Multiple prehensile tentacles", "Webbed limbs and streamlined body"]);
            if (!speciesData.specialCharacteristics.some(sc => sc.characteristic.toLowerCase().includes("aquatic")) && speciesData.specialCharacteristics.length < 3) {
                 speciesData.specialCharacteristics.push({ characteristic: "Aquatic Adaptation", details: "Fully adapted to an aquatic or semi-aquatic lifestyle, capable of breathing underwater or holding breath for extended periods.", tag: "[TRAIT_AQUATIC_ADAPT_TAG]" });
            }
        }
    }

    // --- Generate and Add Individual Persona ---
    speciesData.individualPersona = generateIndividualPersona(speciesData);

    console.log("Generated Alien Species Data (incl. Individual Persona & Native Planet Name):", JSON.parse(JSON.stringify(speciesData)));
    return speciesData;
}

console.log("alien_species.js updated with native planet name generation (v3)");
