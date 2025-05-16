// js/planet_types/gas_giant.js

let noise3D; // Will be initialized by dynamic import in generate()

/** Helper function to get a random floating-point number in a specified range. */
function getRandomInRange(min, max) { return Math.random() * (max - min) + min; }
/** Helper function to get a random integer in a specified range. */
function getRandomIntInRange(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }

/** Generates a procedural, somewhat plausible name for a planet or moon. */
function generateCelestialName(isMoon = false, planetType = "Planet") {
    const prefixes = isMoon ? ["Luna", "Phobos", "Deimos", "Io", "Europa", "Ganymede", "Callisto", "Titan", "Rhea", "Iapetus", "Triton", "Charon", "Umbriel", "Titania", "Oberon", "Nereid", "Proteus", "Larissa", "Mimas", "Enceladus", "Hyperion", "Phoebe", "Janus", "Epimetheus", "Pandora", "Prometheus", "Miranda", "Ariel"] : 
                              ["Jove", "Saturnus", "Aegir", "Typhon", "Zeus", "Indra", "Raijin", "Perun", "Taranis", "Jupiter", "Chronos", "Ouranos", "Ymir", "Surtr", "Boreas", "Notus", "Aeolus", "Cyclonus", "Vortexia", "Galestorm", "Tempestus", "Fulminus", "Gigantor", "Skyfather"];
    const midfixes = isMoon ? ["Minor", "Parva", "Alpha", "Beta", "Major", "Prime", "Grave", "Lesser", "Tiny", "Little", "Rock"] : 
                              ["Maximus", "Grandis", "Colossus", "Gigantus", "Primus", "Magnus", "Imperator", "Rex", "Dominus", "Regal", "Vastus", "Titanus"];
    const suffixes = isMoon ? ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "Rock", "Orb", "Shard", "Shepherd", "Minor", "Fragment", "Pebble", "Dust", "Moonlet"] : 
                              ["Prime", "Major", "King", "Emperor", "Giant", "Behemoth", "System", "Dominion", "Vortex", "Storm", "Maelstrom", "Tempest", "Colossus", "Fury", "Monarch", "Leviathan", "Omega", "Alpha"];
    const designation = isMoon ? [`${String.fromCharCode(65 + getRandomIntInRange(0, 25))}`] : [ `${String.fromCharCode(65 + getRandomIntInRange(0, 25))}${String.fromCharCode(65 + getRandomIntInRange(0, 25))}-${getRandomIntInRange(1000, 9999)}`, `Star ${getRandomIntInRange(100,999)} Prime`, `Sector ${getRandomIntInRange(1,100)}/${planetType}`];
    let name = prefixes[getRandomIntInRange(0, prefixes.length - 1)];
    if (Math.random() < (isMoon ? 0.55 : 0.8)) { name += ` ${midfixes[getRandomIntInRange(0, midfixes.length - 1)]}`; }
    if (!isMoon || Math.random() < 0.8) { name += ` ${suffixes[getRandomIntInRange(0, suffixes.length - 1)]}`; }
    if (Math.random() < (isMoon ? 0.5 : 0.9)) { name += ` (${designation[getRandomIntInRange(0, designation.length-1)]})`;}
    return name;
}

/** HSL to RGB color conversion helper */
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; } 
    else {
        const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/** Helper to create an error texture */
function createErrorTexture(message = "ERR", width = 64, height = 32) {
    console.warn(`createErrorTexture called: ${message}`);
    const c = document.createElement('canvas'); c.width = width; c.height = height;
    const ctx = c.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = 'magenta'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'black'; ctx.font = `${Math.min(height / 3, 10)}px Arial`; ctx.textAlign = 'center';
    ctx.fillText('TEX ERR', c.width/2, c.height/2 - height/6); ctx.fillText(message.substring(0,10), c.width/2, c.height/2 + height/6);
    return c;
}

/** Generates a procedural moon texture using 3D Simplex noise. */
function generateMoonTexture(options = {}) { 
    if (!options.noise3D) return createErrorTexture("NoMoonNoise3D");
    const currentNoise3D = options.noise3D;
    try {
        const width = 512; const height = 256;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("MoonCtxFail");
        const baseGrey = getRandomIntInRange(70, 160); 
        const craterColorDark = Math.max(0, baseGrey - getRandomIntInRange(40, 70));
        const craterColorLight = Math.min(255, baseGrey + getRandomIntInRange(20, 40));
        const baseFreq = getRandomInRange(2.5, 6.0); 
        const craterFreq = getRandomInRange(7.0, 18.0); 
        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u = x_px / width; const v = y_px / height; const phi_loop = u * 2 * Math.PI; const theta_loop = v * Math.PI; 
                const nx = Math.sin(theta_loop) * Math.cos(phi_loop); const ny = Math.sin(theta_loop) * Math.sin(phi_loop); const nz = Math.cos(theta_loop);
                let surfaceNoise = (currentNoise3D(nx * baseFreq, ny * baseFreq, nz * baseFreq) + 1) / 2; 
                let craterNoise = (currentNoise3D(nx * craterFreq + 50, ny * craterFreq + 50, nz * craterFreq + 50) + 1) / 2;
                let color = baseGrey + (surfaceNoise - 0.5) * 50; 
                if (craterNoise > 0.70) { color = craterColorLight * (craterNoise - 0.70) * 3.33 + color * (1 - (craterNoise - 0.70) * 3.33) ; } 
                else if (craterNoise < 0.30 && craterNoise > 0.05) { color = craterColorDark * (0.30 - craterNoise) * 4.0 + color * (1- (0.30 - craterNoise) * 4.0); }
                color = Math.max(0, Math.min(255, color)); ctx.fillStyle = `rgb(${Math.floor(color)}, ${Math.floor(color)}, ${Math.floor(color)})`; ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        return canvas;
    } catch (error) { console.error("Error in generateMoonTexture:", error); return createErrorTexture("MoonTexFail"); }
}

/**
 * Generates a texture for a single atmospheric layer of a Gas Giant - V10 Smoothed Bands & Refined Warping.
 * @param {object} options - Configuration options.
 */
function generateSingleAtmosphericLayerTexture(options = {}) {
    if (!options.noise3D) return createErrorTexture(`NoNoiseL${options.layerIndex}`);
    const currentNoise3D = options.noise3D;

    try {
        const width = options.layerIndex === 0 ? 1024 : 768; 
        const height = options.layerIndex === 0 ? 512 : 384;
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return createErrorTexture(`CtxFailL${options.layerIndex}`, width, height);

        const selectedPalette = options.palettes[getRandomIntInRange(0, options.palettes.length - 1)];
        const radiusScale = 1.0 / (options.planetRadius * 1.1); // More subtle scaling

        // Layer-specific noise parameters
        let latWarpFreq, latWarpStrength, // For distorting latitude for band color lookup
            flowWarpFreq, flowWarpStrength, // For primary 3D domain warping of patterns
            patternFreq, patternOctaves, patternPersistence,
            detailFreq, detailOctaves, detailPersistence,
            stormChance, baseAlpha, colorVariance;
        
        if (options.layerIndex === 0) { // Base Layer: Defines main structure
            latWarpFreq = getRandomInRange(0.2, 0.5) * radiusScale; latWarpStrength = getRandomInRange(0.1, 0.2); // Weaker, smoother lat warp
            flowWarpFreq = getRandomInRange(0.25, 0.6) * radiusScale; flowWarpStrength = getRandomInRange(0.6, 1.3) * options.planetRadius;
            patternFreq = getRandomInRange(0.7, 1.5) * radiusScale; patternOctaves = 4; patternPersistence = 0.52; // Fewer octaves for smoother patterns
            detailFreq = patternFreq * getRandomInRange(3.5, 6); detailOctaves = 2; detailPersistence = 0.48;
            stormChance = 0.6; baseAlpha = 1.0; colorVariance = 60;
        } else { // Upper Layers: Add detail and motion, more transparent
            latWarpFreq = getRandomInRange(0.4, 0.8) * radiusScale; latWarpStrength = getRandomInRange(0.05, 0.15);
            flowWarpFreq = getRandomInRange(0.4, 1.0) * radiusScale; flowWarpStrength = getRandomInRange(0.8, 1.9) * options.planetRadius;
            patternFreq = getRandomInRange(1.0, 2.2) * radiusScale; patternOctaves = 3; patternPersistence = 0.45;
            detailFreq = patternFreq * getRandomInRange(4, 7); detailOctaves = 2; detailPersistence = 0.42;
            stormChance = 0.1 * (options.layerIndex + 1); baseAlpha = getRandomInRange(0.03, 0.20); colorVariance = 30;
        }
        const lacunarity = 1.95; // Slightly lower lacunarity for smoother fBm

        const hasGreatStorm = Math.random() < stormChance && options.layerIndex === 0;
        const stormLat = getRandomInRange(-0.3, 0.3); 
        const stormLon = Math.random() * 2 * Math.PI;
        const stormRadius = getRandomInRange(0.08, 0.20) * options.planetRadius; 
        const stormColor = hslToRgb(getRandomInRange(0,15)/360, getRandomInRange(0.9,1.0), getRandomInRange(0.25,0.4));
        const stormRotationStrength = getRandomInRange(0.8, 2.0);

        const fBm = (x, y, z, initialFreq, oct, pers, lac) => {
            let t = 0; let a = 1.0; let f = initialFreq; let maxA = 0;
            for (let i = 0; i < oct; i++) { t += currentNoise3D(x * f, y * f, z * f) * a; maxA += a; a *= pers; f *= lac; }
            return maxA === 0 ? 0 : t / maxA;
        };
        
        for (let y_px = 0; y_px < height; y_px++) {
            for (let x_px = 0; x_px < width; x_px++) {
                const u_norm = x_px / width; const v_norm = y_px / height; 
                const phi = u_norm * 2 * Math.PI; const theta = v_norm * Math.PI; 

                let pX = Math.sin(theta) * Math.cos(phi); 
                let pY = Math.sin(theta) * Math.sin(phi);
                let pZ = Math.cos(theta); 

                // --- 1. Distort Latitude (v_norm) for Band Color Selection ---
                let polarFactor = Math.pow(Math.sin(theta), 0.4); // Stronger attenuation at poles
                
                let lat_warp_val = fBm(pX * 1.5, pY * 1.5, pZ * 0.8, latWarpFreq, 2, 0.5, lacunarity) * latWarpStrength * polarFactor;
                let effective_v_for_bands = Math.max(0, Math.min(1, v_norm + lat_warp_val));

                // --- 2. Primary 3D Domain Warping for Flow Patterns ---
                const warpX = fBm(pX + 1.1, pY + 2.2, pZ + 3.3, flowWarpFreq, 3, 0.5, lacunarity) * flowWarpStrength * polarFactor;
                const warpY = fBm(pX + 11.1, pY + 12.2, pZ + 13.3, flowWarpFreq, 3, 0.5, lacunarity) * flowWarpStrength * polarFactor;
                const warpZ_flow = fBm(pX + 21.1, pY + 22.2, pZ + 23.3, flowWarpFreq * 0.5, 2, 0.5, lacunarity) * flowWarpStrength * 0.15 * polarFactor;

                const warpedPx = pX + warpX;
                const warpedPy = pY + warpY;
                const warpedPz = pZ + warpZ_flow;

                // --- 3. Generate Main Pattern Noise using Warped Coords ---
                let mainPatternVal = (fBm(warpedPx, warpedPy, warpedPz, patternFreq, patternOctaves, patternPersistence, lacunarity) + 1) / 2; // 0 to 1
                
                // --- 4. Color Selection and Blending (Smoothed Bands) ---
                let fractionalBandIndex = effective_v_for_bands * (selectedPalette.bands.length - 1);
                let bandIdx1 = Math.floor(fractionalBandIndex);
                let bandIdx2 = Math.min(bandIdx1 + 1, selectedPalette.bands.length - 1);
                let bandLerp = fractionalBandIndex - bandIdx1;

                let color1 = selectedPalette.bands[bandIdx1];
                let color2 = selectedPalette.bands[bandIdx2];
                
                let r_band = color1.r * (1 - bandLerp) + color2.r * bandLerp;
                let g_band = color1.g * (1 - bandLerp) + color2.g * bandLerp;
                let b_band = color1.b * (1 - bandLerp) + color2.b * bandLerp;

                // Modulate this base band color with the mainPatternVal for swirls
                // Example: Shift lightness and slightly blend with another palette color for swirls
                let swirlColorIndex = (bandIdx1 + Math.floor(mainPatternVal * 1.5) + 1) % selectedPalette.bands.length;
                let swirlColor = selectedPalette.bands[swirlColorIndex];
                let swirlMix = Math.pow(mainPatternVal, 1.8) * 0.4; // How much swirl color to mix in

                let r = r_band * (1 - swirlMix) + swirlColor.r * swirlMix;
                let g = g_band * (1 - swirlMix) + swirlColor.g * swirlMix;
                let b = b_band * (1 - swirlMix) + swirlColor.b * swirlMix;
                
                // Adjust lightness based on mainPatternVal to create highlights/shadows in swirls
                const lightnessAdjust = (mainPatternVal - 0.5) * (colorVariance * 0.6);
                r += lightnessAdjust; g += lightnessAdjust; b += lightnessAdjust;


                // --- 5. Fine Detail Noise (Optional for performance on upper layers) ---
                if (detailOctaves > 0 && options.layerIndex < 2) { 
                    let detailVal = fBm(warpedPx, warpedPy, warpedPz, detailFreq, detailOctaves, detailPersistence, lacunarity); 
                    const detailMod = detailVal * (colorVariance * 0.2); 
                    r += detailMod; g += detailMod; b += detailMod;
                }

                // --- 6. Great Storm ---
                if (hasGreatStorm) {
                    const stormCenter3D = { x: Math.cos(stormLon) * Math.cos(stormLat * Math.PI/2), y: Math.sin(stormLon) * Math.cos(stormLat * Math.PI/2), z: Math.sin(stormLat * Math.PI/2) };
                    const dx = pX - stormCenter3D.x; const dy = pY - stormCenter3D.y; const dz = pZ - stormCenter3D.z;
                    const distToStormSqr = dx*dx + dy*dy + dz*dz; 
                    const stormRadiusWorldSqr = stormRadius * stormRadius;

                    if (distToStormSqr < stormRadiusWorldSqr) {
                        const distFactor = Math.sqrt(distToStormSqr) / stormRadius; 
                        const stormInfluence = Math.pow(1.0 - distFactor, 2.0); // Stronger influence near center
                        
                        const angleToCenter = Math.atan2(pY - stormCenter3D.y, pX - stormCenter3D.x);
                        const swirlOffset = stormInfluence * stormRadius * 0.3 * stormRotationStrength; // How much to displace for swirl
                        const swirlAngle = angleToCenter + Math.PI / 2 + distFactor * 10 * stormRotationStrength; // Add rotation
                        
                        // Sample storm's internal texture at a slightly swirled coordinate
                        const stormSampleX = warpedPx + Math.cos(swirlAngle) * swirlOffset;
                        const stormSampleY = warpedPy + Math.sin(swirlAngle) * swirlOffset;
                        
                        let stormInternalNoise = (fBm(stormSampleX, stormSampleY, warpedPz, detailFreq * 1.8, 3, 0.55, lacunarity) + 1) / 2;
                        
                        const sr = stormColor.r + (stormInternalNoise - 0.5) * 80;
                        const sg = stormColor.g + (stormInternalNoise - 0.5) * 80;
                        const sb = stormColor.b + (stormInternalNoise - 0.5) * 80;

                        r = r * (1 - stormInfluence) + sr * stormInfluence;
                        g = g * (1 - stormInfluence) + sg * stormInfluence;
                        b = b * (1 - stormInfluence) + sb * stormInfluence;
                    }
                }
                
                // Make base layer mostly opaque, upper layers more transparent and wispy
                let finalAlpha = baseAlpha;
                if (options.layerIndex > 0) {
                    finalAlpha *= (0.1 + mainPatternVal * 0.3 + ((fBm(warpedPx, warpedPy, warpedPz, detailFreq*1.2, 2, 0.5, lacunarity)+1)/2) * 0.2);
                } else { // Base layer
                    finalAlpha *= (0.85 + mainPatternVal * 0.15); // Ensure base is mostly opaque but with some density variation
                }

                ctx.fillStyle = `rgba(${Math.floor(Math.max(0,Math.min(255,r)))}, ${Math.floor(Math.max(0,Math.min(255,g)))}, ${Math.floor(Math.max(0,Math.min(255,b)))}, ${Math.min(1.0, Math.max(0, finalAlpha)).toFixed(3)})`;
                ctx.fillRect(x_px, y_px, 1, 1);
            }
        }
        console.log(`Gas Giant Atm Layer ${options.layerIndex} V10 Fluid Texture Generated.`);
        return canvas;
    } catch (error) {
        console.error(`Error in generateSingleAtmosphericLayerTexture V10 (Layer ${options.layerIndex}):`, error);
        return createErrorTexture(`GGAtmFailL${options.layerIndex}`, width, height);
    }
}

/** Generates a procedural ring texture. */
function generateRingTexture(options = {}) { /* ... (same as previous version) ... */ 
    if (!options.noise3D) return createErrorTexture("NoRingNoise");
    const currentNoise3D = options.noise3D;
    try {
        const width = 1024; const height = 128;  
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) return createErrorTexture("RingCtxFail");
        const baseHue = getRandomInRange(20, 60); const baseSaturation = getRandomInRange(10, 40); const baseLightness = getRandomInRange(40, 70);
        const densityVariationFreq = getRandomInRange(20, 50); const gapFrequency = getRandomInRange(5, 15); 
        for (let x = 0; x < width; x++) {
            const u = x / width; 
            let gapFactor = (currentNoise3D(u * gapFrequency, 10, 20) + 1) / 2; gapFactor = Math.pow(gapFactor, 3.0); 
            for (let y = 0; y < height; y++) {
                const v = y / height; 
                let density = (currentNoise3D(u * densityVariationFreq, v * 5, 30) + 1) / 2; 
                density = density * (1 - gapFactor * 0.8); density = Math.pow(density, 1.5); 
                let alpha = density * getRandomInRange(0.3, 0.9); alpha = Math.min(alpha, 0.85); 
                if (alpha > 0.02) {
                    const lightnessVariation = (density - 0.5) * 30; const finalLightness = Math.max(0, Math.min(100, baseLightness + lightnessVariation));
                    const color = hslToRgb(baseHue/360, baseSaturation/100, finalLightness/100);
                    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha.toFixed(3)})`; ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        console.log("Ring Texture Generated."); return canvas;
    } catch (error) { console.error("Error in generateRingTexture:", error); return createErrorTexture("RingTexFail", 1024, 128); }
}

/** Main function to generate Gas Giant planet data. */
export async function generate() {
    if (!noise3D) {
        try {
            const SimplexNoiseModule = await import('https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js');
            noise3D = SimplexNoiseModule.createNoise3D();
            console.log("SimplexNoise 3D loaded successfully for Gas Giant.");
        } catch (e) {
            console.error("Failed to load SimplexNoise for Gas Giant:", e);
            noise3D = () => Math.random() * 2 - 1;
            alert("Critical error: Failed to load noise library. Planet textures will be very basic or fail.");
        }
    }

    const radiusEarthUnits = getRandomInRange(6, 18); 
    const massEarthUnits = getRandomInRange(50, 3000); 
    const densityGcm3 = getRandomInRange(0.5, 2.0); 
    const EARTH_RADIUS_KM = 6371; const EARTH_MASS_KG = 5.972e24; const GRAVITATIONAL_CONSTANT_M3_KG_S2 = 6.67430e-11; const EARTH_GRAVITY_MS2 = 9.80665;
    const radiusKm = radiusEarthUnits * EARTH_RADIUS_KM; const massKg = massEarthUnits * EARTH_MASS_KG; const radiusM = radiusKm * 1000;
    const surfaceGravityMs2 = (GRAVITATIONAL_CONSTANT_M3_KG_S2 * massKg) / Math.pow(radiusM, 2);
    const surfaceGravityG = surfaceGravityMs2 / EARTH_GRAVITY_MS2; 
    const rotationPeriodHours = getRandomInRange(6, 16); 
    const orbitalPeriodDays = getRandomInRange(1000, 60000); const axialTiltDegrees = getRandomInRange(0, 45); 
    const effectiveTemperatureC = getRandomInRange(-220, -60); 
    const atmComposition = { H2: getRandomInRange(65, 92), He: getRandomInRange(7, 30), CH4: getRandomInRange(0.05, 3.0), NH3: getRandomInRange(0.005, 2.0), H2O: getRandomInRange(0.005, 1.0), OtherTrace: getRandomInRange(0.01, 0.8) };
    let totalComp = Object.values(atmComposition).reduce((s, v) => s + v, 0); if (totalComp > 0) for (const gas in atmComposition) atmComposition[gas] = (atmComposition[gas] / totalComp) * 100;
    const weatherNotes = `Characterized by powerful, deep-seated zonal jets creating highly dynamic and turbulent atmospheric bands. Massive, persistent storm systems, vortices, and complex cloud structures are prevalent. Effective temperature: ${effectiveTemperatureC}°C.`;

    const atmosphericLayers = [];
    const numLayers = getRandomIntInRange(2, 3); 
    const palettes = [ 
        { bands: [hslToRgb(25/360,0.7,0.65), hslToRgb(35/360,0.65,0.75), hslToRgb(15/360,0.6,0.6), hslToRgb(40/360,0.7,0.7), hslToRgb(10/360,0.75,0.55), hslToRgb(50/360,0.6,0.8)]}, 
        { bands: [hslToRgb(210/360,0.75,0.55), hslToRgb(225/360,0.7,0.65), hslToRgb(235/360,0.85,0.45), hslToRgb(200/360,0.65,0.6), hslToRgb(190/360,0.8,0.5), hslToRgb(245/360,0.8,0.5)]}, 
        { bands: [hslToRgb(40/360,0.3,0.8), hslToRgb(48/360,0.25,0.85), hslToRgb(35/360,0.4,0.75), hslToRgb(52/360,0.3,0.88), hslToRgb(60/360,0.2,0.82), hslToRgb(30/360,0.35,0.7)]}, 
        { bands: [hslToRgb(280/360,0.65,0.6), hslToRgb(190/360,0.6,0.65), hslToRgb(40/360,0.75,0.6), hslToRgb(320/360,0.6,0.5), hslToRgb(250/360,0.7,0.55), hslToRgb(10/360,0.7,0.65)]}, 
        { bands: [hslToRgb(5/360,0.8,0.5), hslToRgb(18/360,0.85,0.55), hslToRgb(340/360,0.75,0.45), hslToRgb(15/360,0.7,0.6), hslToRgb(0/360,0.75,0.4), hslToRgb(30/360,0.82,0.48)]} 
    ];

    for (let i = 0; i < numLayers; i++) {
        const layerTexture = generateSingleAtmosphericLayerTexture({ noise3D, layerIndex: i, palettes, planetRadius: radiusEarthUnits });
        if (layerTexture) {
            atmosphericLayers.push({
                textureCanvas: layerTexture,
                uvSpeedX: (Math.random() - 0.5) * 0.000015 * (numLayers - i + 2) * (i % 2 === 0 ? 1.0 : -1.0), 
                uvSpeedY: (Math.random() - 0.5) * 0.000005 * (numLayers - i + 2) * (i % 2 === 0 ? -0.8 : 0.8),
                opacity: i === 0 ? 1.0 : getRandomInRange(0.08, 0.40), // Upper layers more transparent
                altitudeFactor: 1.0 + i * getRandomInRange(0.0010, 0.0035), 
            });
        }
    }
    
    const hasRings = Math.random() < 0.8; 
    let ringsData = null;
    if (hasRings) {
        const ringInnerRadiusFactor = getRandomInRange(1.25, 2.2); 
        const ringOuterRadiusFactor = ringInnerRadiusFactor + getRandomInRange(0.5, 4.0); 
        ringsData = { hasRings: true, textureCanvasRing: generateRingTexture({ noise3D }), innerRadius: radiusEarthUnits * ringInnerRadiusFactor, outerRadius: radiusEarthUnits * ringOuterRadiusFactor, opacity: getRandomInRange(0.25, 0.7)};
    }

    let moons = [];
    const maxPossibleMoons = getRandomIntInRange(12, 60); 
    let baseMoonChance = 0.75 + (massEarthUnits / 2500); 
    for (let i = 0; i < maxPossibleMoons; i++) {
        if (Math.random() < baseMoonChance / Math.sqrt(i + 1.5)) { 
            const moonRadius = radiusEarthUnits * getRandomInRange(0.0015, 0.08); 
            let moonOrbitalDistance = radiusEarthUnits * getRandomInRange(ringsData && ringsData.hasRings ? (ringsData.outerRadius/radiusEarthUnits * 1.3) : 2.0, 40.0); 
            const moonOrbitalSpeed = getRandomInRange(0.000015, 0.0008) / Math.sqrt(moonOrbitalDistance / radiusEarthUnits);
            const moonInitialAngle = Math.random() * 2 * Math.PI; const moonInclination = (Math.random() - 0.5) * Math.PI / 8; 
            const moonTexture = generateMoonTexture({ noise3D });
            if (moonTexture) { moons.push({ name: generateCelestialName(true, "Gas Giant Moon"), radius: moonRadius, orbitalDistance: moonOrbitalDistance, orbitalSpeed: moonOrbitalSpeed, initialAngle: moonInitialAngle, inclination: moonInclination, textureCanvasMoon: moonTexture, shininess: getRandomIntInRange(1, 25) }); }
        }
    }

    const planetData = {
        general: { name: generateCelestialName(false, "Gas Giant"), type: "Gas Giant", mass: massEarthUnits, radius: radiusEarthUnits, density: densityGcm3, gravity: surfaceGravityG, rotationPeriod: rotationPeriodHours, orbitalPeriod: orbitalPeriodDays, axialTilt: axialTiltDegrees, },
        atmosphere: { presence: "Very Dense", pressure: ">1000 atm (core)", composition: atmComposition, weatherNotes: weatherNotes, },
        surface: { averageTemperature: effectiveTemperatureC, surfaceLiquid: "None (Metallic Hydrogen deeper)", dominantTerrainFeatures: "Dynamic atmospheric bands, powerful zonal jets, large-scale vortices, and long-lived storm systems.", },
        life: { probabilityOfLife: 0.000001, detectedIntelligentLife: false, }, 
        visuals: {
            radius: radiusEarthUnits,
            atmosphericLayers: atmosphericLayers, 
            textureCanvasCloud: null, cloudOpacity: 0, 
            ringsData: ringsData, moons: moons,
            shininess: getRandomIntInRange(2, 12), 
        }
    };
    return planetData;
}
