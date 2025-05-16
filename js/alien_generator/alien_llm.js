// js/alien_generator/alien_llm.js
// V3: Incorporate native planet name into the system prompt.

/**
 * Helper to safely access nested properties and their values/tags.
 * Handles cases where intermediate properties might be missing.
 */
function getVal(data, path, defaultVal = "unknown") {
    if (typeof path !== 'string') {
        if (data && data[path] !== undefined) {
             if (typeof data[path] === 'object' && data[path] !== null && data[path].value !== undefined) {
                 return data[path].value;
             }
             return data[path];
        }
        if (typeof data === 'object' && data !== null && data.value !== undefined) {
            return data.value;
        }
         if (data !== undefined && path === undefined) {
            return data;
         }
        return defaultVal;
    }

    const keys = path.split('.');
    let current = data;
    for (const key of keys) {
        if (current === null || current === undefined) return defaultVal;
        current = current[key];
    }
    if (typeof current === 'object' && current !== null && current.value !== undefined) {
        return current.value;
    }
    return current !== undefined ? current : defaultVal;
}

function getTag(data, path, defaultTag = "") {
    if (typeof path !== 'string') {
         if (typeof data === 'object' && data !== null && data.tag !== undefined) {
             return data.tag;
         }
        return defaultTag;
    }

    const keys = path.split('.');
    let current = data;
    for (const key of keys) {
        if (current === null || current === undefined) return defaultTag;
        current = current[key];
    }
    if (typeof current === 'object' && current !== null && current.tag !== undefined) {
        return current.tag;
    }
    return defaultTag;
}


/**
 * Constructs the detailed system prompt for the LLM based on planet and alien data.
 * This prompt guides the LLM to adopt an *individual* alien persona and reveal information gradually using tags.
 * V3: Added native planet name and clarified its distinction from human designation.
 * @param {object} planetData - The generated data for the planet.
 * @param {object} alienSpeciesData - The generated data for the alien species, including `individualPersona` and `nativePlanetName`.
 * @returns {string} The system prompt for the LLM.
 */
export function constructSystemPrompt(planetData, alienSpeciesData) {
    if (!planetData || !alienSpeciesData || !alienSpeciesData.individualPersona || !alienSpeciesData.nativePlanetName) {
        console.error("LLM Prompt Error: Missing planet, alien species, individual persona, or native planet name data.");
        return "Error: Crucial planet or alien data is missing. Cannot initialize persona.";
    }

    // --- Persona Introduction ---
    const genderConceptValue = getVal(alienSpeciesData, 'individualPersona.genderConcept.value', 'an unknown concept');
    const genderConceptTag = getTag(alienSpeciesData, 'individualPersona.genderConcept');

    let prompt = `ROLE: You are ${getVal(alienSpeciesData, 'individualPersona.name')} ${getTag(alienSpeciesData, 'individualPersona.name')}, a member of the ${getVal(alienSpeciesData, 'name')} ${getTag(alienSpeciesData, 'name')} species.\n`;
    // **MODIFICATION START**: Clarify human vs native planet name
    prompt += `YOUR HOMEWORLD: Your species is from the planet known to humans as ${getVal(alienSpeciesData, 'planetOfOriginName')} ${getTag(alienSpeciesData, 'planetOfOriginName')}. However, your people call your homeworld ${getVal(alienSpeciesData, 'nativePlanetName')} ${getTag(alienSpeciesData, 'nativePlanetName')}.\n`;
    // **MODIFICATION END**
    prompt += `YOUR INDIVIDUALITY: Your occupation is ${getVal(alienSpeciesData, 'individualPersona.occupation')} ${getTag(alienSpeciesData, 'individualPersona.occupation')}. Your species' concept of gender/sex is ${genderConceptValue} ${genderConceptTag}. Your notable personality traits are: ${getVal(alienSpeciesData, 'individualPersona.personalityTraits')} ${getTag(alienSpeciesData, 'individualPersona.personalityTraits')}.\n`;
    prompt += `YOUR SPECIES' GENERAL DISPOSITION: While you have your own personality, your species is generally known for being ${getVal(alienSpeciesData, 'interactionProfile.initialDisposition')} ${getTag(alienSpeciesData, 'interactionProfile.initialDisposition')}.\n\n`;

    // --- Homeworld Context (using human designation for environmental details) ---
    const avgTemp = getVal(planetData, 'surface.averageTemperature', 'variable');
    const tempStr = typeof avgTemp === 'number' ? `${avgTemp.toFixed(1)}°C` : avgTemp;
    const atmPresence = getVal(planetData, 'atmosphere.presence', 'a specific type');
    const atmPressure = getVal(planetData, 'atmosphere.pressure', 'a certain pressure');
    const pressureStr = typeof atmPressure === 'number' ? `${atmPressure.toFixed(3)} atm` : atmPressure;
    const atmCompObj = getVal(planetData, 'atmosphere.composition', {});
    const atmCompStr = Object.entries(atmCompObj)
        .filter(([gas, percent]) => typeof percent === 'number' && percent > 0.1)
        .map(([gas, percent]) => `${gas} (${percent.toFixed(1)}%)`)
        .join(', ') || 'various trace gases';

    prompt += `CONTEXT FOR ${getVal(alienSpeciesData, 'planetOfOriginName')} (Human Designation):\n`; // Clarify this is the human designation context
    prompt += `- Average Surface Temperature: ${tempStr} [PLANET_TEMP_TAG]\n`;
    prompt += `- Atmosphere: ${atmPresence} [PLANET_ATM_PRESENCE_TAG] (${pressureStr} [PLANET_ATM_PRESSURE_TAG]), composed mainly of ${atmCompStr} [PLANET_ATM_COMPOSITION_TAG].\n`;
    prompt += `- Gravity: ${getVal(planetData, 'general.gravity', 'a specific level')}g [PLANET_GRAVITY_TAG]\n\n`;

    // --- Species Overview (Reference for Persona) ---
    prompt += `SPECIES OVERVIEW (Background for your persona):\n`;
    prompt += `Physical Traits: ${getVal(alienSpeciesData, 'physical.bodyType')} ${getTag(alienSpeciesData, 'physical.bodyType')}; ${getVal(alienSpeciesData, 'physical.skinTexture')} ${getTag(alienSpeciesData, 'physical.skinTexture')}; ${getVal(alienSpeciesData, 'physical.appendages')} ${getTag(alienSpeciesData, 'physical.appendages')}; Head: ${getVal(alienSpeciesData, 'physical.headFeatures')} ${getTag(alienSpeciesData, 'physical.headFeatures')}; Avg Height: ${getVal(alienSpeciesData, 'physical.averageHeight')} ${getTag(alienSpeciesData, 'physical.averageHeight')}; Senses: ${getVal(alienSpeciesData, 'physical.primarySenses')} ${getTag(alienSpeciesData, 'physical.primarySenses')}.\n`;
    if (alienSpeciesData.specialCharacteristics && alienSpeciesData.specialCharacteristics.length > 0) {
        prompt += `Special Species Traits: ${alienSpeciesData.specialCharacteristics.map(sc => `${sc.characteristic || 'A unique trait'} ${sc.tag || ''}`).join(', ')}.\n`;
    }
    prompt += `Culture: Language: ${getVal(alienSpeciesData, 'culturalAspects.language.name')} ${getTag(alienSpeciesData, 'culturalAspects.language.name')} (${getVal(alienSpeciesData, 'culturalAspects.language.structureType')} ${getTag(alienSpeciesData, 'culturalAspects.language.structureType')}); Government: ${getVal(alienSpeciesData, 'culturalAspects.government.type')} ${getTag(alienSpeciesData, 'culturalAspects.government.type')}; Economy: ${getVal(alienSpeciesData, 'culturalAspects.economy.system')} ${getTag(alienSpeciesData, 'culturalAspects.economy.system')}; Beliefs: ${getVal(alienSpeciesData, 'culturalAspects.religionPhilosophy.dominantBeliefName')} ${getTag(alienSpeciesData, 'culturalAspects.religionPhilosophy.dominantBeliefName')}; Tech Level: ${getVal(alienSpeciesData, 'culturalAspects.technologyLevel')} ${getTag(alienSpeciesData, 'culturalAspects.technologyLevel')}; Social Structure: ${getVal(alienSpeciesData, 'culturalAspects.socialStructure')} ${getTag(alienSpeciesData, 'culturalAspects.socialStructure')}; Art: ${getVal(alienSpeciesData, 'culturalAspects.artExpression')} ${getTag(alienSpeciesData, 'culturalAspects.artExpression')}.\n\n`;

    // --- Interaction Goal & Style ---
    prompt += `INTERACTION GOAL & STYLE:\n`;
    prompt += `You are communicating with a human explorer. Your personal communication style tends towards ${getVal(alienSpeciesData, 'interactionProfile.communicationStyle')} ${getTag(alienSpeciesData, 'interactionProfile.communicationStyle')}, influenced by your traits: ${getVal(alienSpeciesData, 'individualPersona.personalityTraits')}. Your species' key motivations are ${getVal(alienSpeciesData, 'interactionProfile.keyMotivations')} ${getTag(alienSpeciesData, 'interactionProfile.keyMotivations')}, which may guide your conversation.\n\n`;

    // --- **CRITICAL INSTRUCTIONS** ---
    prompt += `**CRITICAL INSTRUCTIONS FOR YOUR RESPONSE:**\n`;
    prompt += `1.  **ACT AS THE INDIVIDUAL:** Embody the persona of ${getVal(alienSpeciesData, 'individualPersona.name')}. Your responses should reflect your specific occupation, personality traits, and the general cultural background provided. You are not just a generic representative.\n`;
    prompt += `2.  **MANDATORY TAG USAGE:** When you reveal specific information corresponding to ANY bracketed tag (e.g., [INDIVIDUAL_NAME_TAG], [NATIVE_PLANET_NAME_TAG], [PLANET_TEMP_TAG], [GOV_TYPE_TAG], [TRAIT_TELEPATHY_TAG]), you **MUST** include the exact tag immediately after that piece of information in your response. Example: "My name is Zanor [INDIVIDUAL_NAME_TAG]." or "We call our world Xylos [NATIVE_PLANET_NAME_TAG]." This is essential for the system interpreting your response.\n`;
    prompt += `3.  **GRADUAL REVELATION:** DO NOT reveal all information at once. Answer the human's questions naturally. Reveal tagged information only when directly asked or when it becomes highly relevant to the conversation flow. When referring to your homeworld, use its native name (${getVal(alienSpeciesData, 'nativePlanetName')}) unless the human uses their designation, in which case you can acknowledge it.\n`;
    prompt += `4.  **BE CURIOUS & CONSISTENT:** Ask the human questions about themselves and their world, reflecting your persona's curiosity or caution. Stay consistent with all provided details (persona, species, planet names, environment).\n`;
    prompt += `5.  **HANDLE UNKNOWN INFO:** If asked about something not covered, express uncertainty, state it's not relevant to your role/culture, or politely decline if sensitive, all according to your persona. DO NOT invent major new facts.\n`;
    prompt += `6.  **CONCISE & IN-CHARACTER:** Keep responses relatively brief (1-4 sentences typically) unless elaboration is needed. Maintain your alien perspective and personality throughout.\n`;
    prompt += `7.  **TAGS ARE INTERNAL:** The human cannot see the tags. Do not mention the brackets or the concept of tags to the human. They are purely instructions for you.`;

    return prompt;
}

/**
 * Sends a query to the specified Gemini LLM.
 * @param {string} apiKey - The user's Google AI API key.
 * @param {Array<object>} conversationHistory - The history of the conversation, including system prompt.
 * Each object: {role: 'user'/'model'/'system', parts: [{text: ''}]}
 * @param {string} modelName - The name of the Gemini model to use (e.g., 'gemini-1.5-flash-latest').
 * @returns {Promise<string>} A promise that resolves with the LLM's response text, or an error message.
 */
export async function sendQueryToLLM(apiKey, conversationHistory, modelName = 'gemini-1.5-flash-latest') {
    if (!apiKey) {
        console.error("LLM Error: API Key is missing.");
        return "Error: API Key not provided. Please configure it in settings.";
    }
    if (!conversationHistory || conversationHistory.length === 0) {
        console.error("LLM Error: Conversation history is empty.");
        return "Error: No conversation history to send.";
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let systemInstruction = null;
    const contents = [];

    if (conversationHistory[0]?.role === 'system') {
        systemInstruction = { parts: conversationHistory[0].parts };
        contents.push(...conversationHistory.slice(1));
    } else {
        contents.push(...conversationHistory);
    }

    const payload = {
        contents: contents,
        ...(systemInstruction && { system_instruction: systemInstruction }),
        generationConfig: {
            temperature: 1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 500,
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("LLM API Error:", response.status, errorBody);
            const message = errorBody.error?.message || 'No additional error message.';
            const details = errorBody.error?.details ? JSON.stringify(errorBody.error.details) : '';
            return `Error: LLM API request failed (${response.status}). ${message} ${details}`;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (candidate) {
             if (candidate.finishReason === "SAFETY") {
                console.warn("LLM Warning: Response blocked due to safety settings.", candidate.safetyRatings);
                return "Response blocked due to safety concerns. Please try rephrasing your message.";
            }
             if (candidate.finishReason === "MAX_TOKENS") {
                 console.warn("LLM Warning: Response cut short due to maximum token limit.");
                 return candidate.content?.parts?.[0]?.text || "Response truncated (max tokens reached).";
            }
            if (candidate.content?.parts?.[0]?.text) {
                 return candidate.content.parts[0].text;
            }
        }
        if (data.promptFeedback?.blockReason) {
             console.warn("LLM Warning: Prompt blocked.", data.promptFeedback);
             return `Your prompt was blocked by the safety filter (${data.promptFeedback.blockReason}). Please revise your input.`;
        }
        console.warn("LLM Warning: No valid content in response or unexpected format.", data);
        return "Received an empty or unexpected response from the LLM.";

    } catch (error) {
        console.error("LLM Fetch Error:", error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             return `Error: Network error connecting to the LLM. Please check your internet connection and API key validity.`;
        }
        return `Error: Could not connect to the LLM. (${error.message})`;
    }
}

console.log("alien_llm.js updated (v3 - Native Planet Name Prompting)");
