// js/alien_generator/alien_portrait.js
// V22: Corrected antennae angle logic for consistent upward direction and symmetry.
// V21: Improved symmetry for head ornaments and limb base angles. Updated getBodyPointOnSilhouette.
// V20: Enhanced body shape and limb variety. Added getBodyPointOnSilhouette helper.
// V19: Restored full drawing logic, returns Data URL, added robust error checks.

import { getRandomElement, getRandomIntInRange, getRandomInRange, hslToRgb } from './alien_random_tables.js';

/**
 * Generates a detailed pixel art portrait and returns it as a Data URL.
 * @param {object} speciesData - The generated data for the alien species.
 * @param {object} planetData - The data for the planet (for environmental color hints).
 * @returns {string} A Data URL string representing the portrait, or an error indicator Data URL.
 */
export function generateAlienPortrait(speciesData, planetData) {
    console.log("[alien_portrait.js V22] generateAlienPortrait CALLED.");

    // --- Robust check for input data ---
    if (!speciesData || typeof speciesData !== 'object' || Object.keys(speciesData).length === 0) {
        console.error("[alien_portrait.js V22] ERROR: speciesData is invalid or empty.");
        return createErrorDataURL("Species Data Missing");
    }
    if (!planetData || typeof planetData !== 'object' || Object.keys(planetData).length === 0) {
        console.error("[alien_portrait.js V22] ERROR: planetData is invalid or empty.");
        return createErrorDataURL("Planet Data Missing");
    }
    if (!speciesData.physical || !speciesData.physical.bodyType || !speciesData.physical.bodyType.value ||
        !speciesData.physical.skinTexture || !speciesData.physical.skinTexture.value ||
        !speciesData.physical.appendages || !speciesData.physical.appendages.value ||
        !speciesData.physical.headFeatures || !speciesData.physical.headFeatures.value ||
        !speciesData.specialCharacteristics ||
        !planetData.surface || typeof planetData.surface.averageTemperature !== 'number') {
        console.error("[alien_portrait.js V22] ERROR: Essential properties missing in speciesData or planetData.");
        return createErrorDataURL("Core Data Invalid");
    }

    const canvasSize = 64;
    const pixelGridWidth = 64;
    const pixelGridHeight = 64;
    const scale = 1; // Drawing 1:1 on the 64x64 canvas

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error("[alien_portrait.js V22] CRITICAL ERROR: Failed to get 2D context.");
        return createErrorDataURL("CTX Fail");
    }
    ctx.imageSmoothingEnabled = false;

    const palette = determinePalette(speciesData, planetData);
    if (!palette) {
        console.error("[alien_portrait.js V22] Palette determination failed critically. Returning error portrait.");
        return createErrorDataURL("Palette Fail");
    }

    const { body: bodyColor, accent1, accent2, eye: eyeColor, pupil: pupilColor, eyeHighlight: eyeHighlightColor, feature: featureColor, background: backgroundColor } = palette;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const bodyGrid = Array(pixelGridHeight).fill(null).map(() => Array(pixelGridWidth).fill(0));

    // --- Body Shape Parameters ---
    let bodyWidthMax = Math.floor(pixelGridWidth * getRandomInRange(0.25, 0.52));
    bodyWidthMax = Math.max(10, bodyWidthMax - (bodyWidthMax % 2));
    const bodyHeightMax = Math.floor(pixelGridHeight * getRandomInRange(0.40, 0.65));

    const bodyStartX = Math.floor((pixelGridWidth - bodyWidthMax) / 2);
    const bodyStartY = Math.floor((pixelGridHeight - bodyHeightMax) / 2);

    const bodyType = speciesData.physical.bodyType.value.toLowerCase();
    let headHeightRatio = getRandomInRange(0.25, 0.42);
    if (bodyType.includes("avian") || bodyType.includes("reptilian")) headHeightRatio = getRandomInRange(0.20, 0.33);
    if (bodyType.includes("insectoid")) headHeightRatio = getRandomInRange(0.18, 0.30);
    let headHeight = Math.floor(bodyHeightMax * headHeightRatio);
    if (speciesData.physical.headFeatures.value.toLowerCase().includes("no distinct head")) {
        headHeight = Math.floor(bodyHeightMax * getRandomInRange(0.05, 0.15));
    }

    const segmentWidths = new Array(bodyHeightMax).fill(0);

    // --- Generate Base Body/Head Silhouette ---
    for (let y = 0; y < bodyHeightMax; y++) {
        let currentSegmentWidth = bodyWidthMax;

        if (y < headHeight) {
            const relYHead = y / headHeight;
            if (bodyType.includes("humanoid")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.70 + Math.sin(relYHead * Math.PI) * 0.30));
            } else if (bodyType.includes("avian")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.50 + Math.sin(relYHead * Math.PI * 0.8 + 0.2) * 0.35) * 0.80);
            } else if (bodyType.includes("reptilian")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.45 + (1 - Math.pow(relYHead, 1.2)) * 0.50));
            } else if (bodyType.includes("insectoid") || bodyType.includes("arachnoid")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.85 + Math.sin(relYHead * Math.PI * 0.7 + Math.PI * 0.15) * 0.20 + (relYHead < 0.4 ? 0.1 : -0.08)));
            } else if (bodyType.includes("crystalline")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.55 + (1 - Math.abs(relYHead - 0.5) * 2) * 0.45 * (Math.sin(relYHead * Math.PI * 3 + y) * 0.1 + 1)));
            } else if (bodyType.includes("molluscoid") || bodyType.includes("amorphous")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.60 + Math.sin(relYHead * Math.PI * 1.8 + y * 0.2) * 0.35 + getRandomInRange(-0.1, 0.1)));
            } else {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.60 + getRandomInRange(-0.15, 0.25) * Math.sin(relYHead * Math.PI * (1.3 + Math.random() * 0.7))));
            }
        } else {
            const relYTorso = (y - headHeight) / (bodyHeightMax - headHeight);
            if (bodyType.includes("humanoid")) {
                const shoulderFactor = Math.sin(Math.PI * Math.min(1, relYTorso * 2.2)) * 0.15;
                const waistFactor = Math.pow(relYTorso, 1.4) * 0.65;
                currentSegmentWidth = Math.floor(bodyWidthMax * (1.0 + shoulderFactor - waistFactor));
            } else if (bodyType.includes("avian")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (1.1 - Math.pow(relYTorso, 1.6) * 0.85));
            } else if (bodyType.includes("reptilian")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.90 - relYTorso * 0.50 + Math.sin(relYTorso * Math.PI * 2) * 0.05));
            } else if (bodyType.includes("insectoid") || bodyType.includes("arachnoid")) {
                const numSegments = getRandomIntInRange(2, 4);
                const segmentProgress = (relYTorso * numSegments) % 1.0;
                const pinchFactor = (bodyType.includes("insectoid") && relYTorso > 0.2 && relYTorso < 0.8) ? (0.40 + Math.sin(relYTorso * Math.PI * 1.5) * 0.15) : 0.9;
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.55 + Math.sin(segmentProgress * Math.PI) * 0.30) * pinchFactor);
            } else if (bodyType.includes("plant-like") || bodyType.includes("fungoid")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.45 + Math.sin(relYTorso * Math.PI * 2.8 + Math.random() * 2) * 0.35 + (1 - relYTorso) * 0.25 + Math.random() * 0.1));
            } else if (bodyType.includes("crystalline")) {
                const numFacets = getRandomIntInRange(3, 5);
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.6 + Math.abs(Math.sin(relYTorso * Math.PI * numFacets + y * 0.1)) * 0.35));
            } else if (bodyType.includes("molluscoid") || bodyType.includes("amorphous")) {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.75 + Math.sin(relYTorso * Math.PI * (1.5 + Math.random()) + y * 0.3 + Math.random()) * 0.25 + getRandomInRange(-0.15, 0.15)));
            } else {
                currentSegmentWidth = Math.floor(bodyWidthMax * (0.90 - relYTorso * 0.35 + Math.sin(relYTorso * Math.PI * 2.5 + Math.random()) * 0.18));
            }
        }
        currentSegmentWidth = Math.max(4, currentSegmentWidth - (currentSegmentWidth % 2));
        segmentWidths[y] = currentSegmentWidth;
        const xStartOffset = Math.floor((bodyWidthMax - currentSegmentWidth) / 2);

        for (let x = 0; x < currentSegmentWidth; x++) {
            const gridY = bodyStartY + y;
            const gridX = bodyStartX + xStartOffset + x;
            if (gridY >= 0 && gridY < pixelGridHeight && gridX >= 0 && gridX < pixelGridWidth) {
                bodyGrid[gridY][gridX] = 1;
            }
        }
    }

    addLimbs(bodyGrid, speciesData, bodyType, bodyStartX, bodyStartY, bodyWidthMax, bodyHeightMax, headHeight, segmentWidths, pixelGridWidth, pixelGridHeight);
    addSpecialPhysicalFeatures(bodyGrid, speciesData, bodyType, bodyStartX, bodyStartY, bodyWidthMax, bodyHeightMax, headHeight, segmentWidths, pixelGridWidth, pixelGridHeight);
    addFacialFeatures(bodyGrid, speciesData, bodyType, bodyStartY, headHeight, segmentWidths[Math.floor(headHeight * 0.5)] || bodyWidthMax, pixelGridWidth, pixelGridHeight);
    addAccents(bodyGrid, speciesData, bodyType, pixelGridWidth, pixelGridHeight);

    // --- Draw Grid to Canvas ---
    console.log("[alien_portrait.js V22] Starting to draw bodyGrid to canvas.");
    let pixelsDrawn = 0;
    for (let y = 0; y < pixelGridHeight; y++) {
        for (let x = 0; x < pixelGridWidth; x++) {
            let drawColor = null;
            switch (bodyGrid[y][x]) {
                case 1: drawColor = bodyColor; break;
                case 2: drawColor = accent1; break;
                case 3: drawColor = accent2; break;
                case 4: drawColor = eyeColor; break;
                case 5: drawColor = pupilColor; break;
                case 6: drawColor = eyeHighlightColor; break;
                case 7: drawColor = featureColor; break;
                case 8: drawColor = bodyColor; break;
                case 9: drawColor = accent1; break;
            }
            if (drawColor && drawColor !== backgroundColor) {
                ctx.fillStyle = drawColor;
                ctx.fillRect(x * scale, y * scale, scale, scale);
                pixelsDrawn++;
            }
        }
    }
    console.log(`[alien_portrait.js V22] Finished drawing grid. ${pixelsDrawn} non-background pixels drawn.`);

    if (pixelsDrawn === 0) {
        console.warn("[alien_portrait.js V22] No non-background pixels were drawn. Forcing a debug color.");
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    try {
        const dataURL = canvas.toDataURL();
        console.log("[alien_portrait.js V22] Successfully created Data URL. Length:", dataURL.length);
        return dataURL;
    } catch (e) {
        console.error("[alien_portrait.js V22] ERROR converting canvas to Data URL:", e);
        return createErrorDataURL("Data URL Fail");
    }
}

/** Creates a Data URL for an error indicator canvas. */
function createErrorDataURL(message = "ERR") {
    const errorCanvasSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = errorCanvasSize;
    canvas.height = errorCanvasSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'rgb(255,0,0)';
        ctx.fillRect(0, 0, errorCanvasSize, errorCanvasSize);
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message.substring(0,10), errorCanvasSize/2, errorCanvasSize/2 - 5);
        ctx.fillText("PORTRAIT", errorCanvasSize/2, errorCanvasSize/2 + 5);
        try {
            return canvas.toDataURL();
        } catch (e) {
            console.error("[alien_portrait.js V22] Error converting error canvas to Data URL:", e);
        }
    }
    return "data:,";
}


/** Determines a color palette. */
function determinePalette(speciesData, planetData) {
    const fallbackPalette = {
        body: 'rgb(128,128,128)', accent1: 'rgb(150,150,150)', accent2: 'rgb(100,100,100)',
        eye: 'rgb(0,255,0)', pupil: 'rgb(0,100,0)', eyeHighlight: 'rgb(100,255,100)',
        feature: 'rgb(200,200,200)', background: 'rgb(0,0,0)'
    };

    try {
        let baseHue, baseSaturation, baseLightness;
        const skin = speciesData.physical.skinTexture.value.toLowerCase();
        const bodyType = speciesData.physical.bodyType.value.toLowerCase();

        if (skin.includes("chitin") || skin.includes("exoskeleton") || bodyType.includes("crystalline") || skin.includes("rocky") || bodyType.includes("mineral-based")) {
            baseHue = getRandomInRange(0, 360);
            baseSaturation = getRandomInRange(0.05, 0.5);
            baseLightness = getRandomInRange(0.20, 0.60);
            if (bodyType.includes("crystalline")) baseSaturation = getRandomInRange(0.4, 0.8);
        } else if (skin.includes("scale") || bodyType.includes("reptilian") || bodyType.includes("fish-like")) {
            baseHue = getRandomInRange(60, 270);
            baseSaturation = getRandomInRange(0.30, 0.85);
            baseLightness = getRandomInRange(0.25, 0.65);
        } else if (skin.includes("feather") || bodyType.includes("avian")) {
            baseHue = Math.random() * 360;
            baseSaturation = getRandomInRange(0.40, 0.95);
            baseLightness = getRandomInRange(0.45, 0.85);
        } else if (skin.includes("gelatinous") || bodyType.includes("molluscoid") || bodyType.includes("amorphous")) {
            baseHue = getRandomInRange(120, 340);
            baseSaturation = getRandomInRange(0.45, 0.95);
            baseLightness = getRandomInRange(0.40, 0.80);
        } else if (bodyType.includes("plant-like") || bodyType.includes("fungoid")) {
            baseHue = getRandomInRange(20, 190);
            baseSaturation = getRandomInRange(0.25, 0.80);
            baseLightness = getRandomInRange(0.15, 0.60);
        } else {
            baseHue = getRandomInRange(0, 360);
            baseSaturation = getRandomInRange(0.10, 0.70);
            baseLightness = getRandomInRange(0.25, 0.75);
        }

        if (planetData.surface.averageTemperature > 80) {
            baseHue = (baseHue + getRandomInRange(-20, 40) + 360) % 360;
            baseLightness = Math.min(0.85, baseLightness + getRandomInRange(0.05, 0.15));
            baseSaturation = Math.max(0.05, baseSaturation - getRandomInRange(0.1, 0.25));
        } else if (planetData.surface.averageTemperature < -40) {
            baseHue = (baseHue + 180 + getRandomInRange(-40, 40) + 360) % 360;
            baseLightness = Math.max(0.10, baseLightness - getRandomInRange(0.05, 0.2));
            baseSaturation = Math.min(0.95, baseSaturation + getRandomInRange(0.05, 0.2));
        }

        const bodyRGB = hslToRgb(baseHue / 360, baseSaturation, baseLightness);
        const accent1Hue = (baseHue + getRandomInRange(25, 70) * (Math.random() < 0.5 ? 1 : -1) + 360) % 360;
        const accent1Sat = Math.max(0.1, Math.min(1.0, baseSaturation + getRandomInRange(-0.25, 0.35)));
        const accent1Light = Math.max(0.1, Math.min(0.9, baseLightness + getRandomInRange(-0.25, 0.30)));
        const accent1RGB = hslToRgb(accent1Hue / 360, accent1Sat, accent1Light);

        let accent2Hue, accent2Sat, accent2Light;
        if (Math.random() < 0.5) {
            accent2Hue = (baseHue + getRandomInRange(130, 230) * (Math.random() < 0.5 ? 1 : -1) + 360) % 360;
            accent2Sat = Math.max(0.1, Math.min(1.0, baseSaturation + getRandomInRange(-0.3, 0.25)));
            accent2Light = Math.max(0.1, Math.min(0.9, baseLightness + getRandomInRange(-0.3, 0.20)));
        } else {
            accent2Hue = (accent1Hue + getRandomInRange(-20, 20) + 360) % 360;
            accent2Sat = Math.max(0.05, Math.min(1.0, accent1Sat + getRandomInRange(-0.1, 0.1)));
            accent2Light = (accent1Light > 0.5) ? Math.max(0.05, accent1Light - getRandomInRange(0.15, 0.3)) : Math.min(0.95, accent1Light + getRandomInRange(0.15, 0.3));
        }
        const accent2RGB = hslToRgb(accent2Hue / 360, accent2Sat, accent2Light);

        let eyeHue = (baseHue + 180 + getRandomInRange(-100, 100) + 360) % 360;
        let eyeSaturation = getRandomInRange(0.55, 1.0);
        let eyeLightness = getRandomInRange(0.40, 0.90);
        if (speciesData.specialCharacteristics.some(sc => sc.characteristic.toLowerCase().includes("bioluminescence"))) {
            eyeSaturation = getRandomInRange(0.9, 1.0); eyeLightness = getRandomInRange(0.70, 0.95);
        }
        if (Math.abs(eyeHue - baseHue) < 35 && Math.abs(eyeLightness - baseLightness) < 0.15) {
            eyeLightness = (baseLightness > 0.5) ? Math.max(0.15, baseLightness - 0.35) : Math.min(0.85, baseLightness + 0.35);
            eyeHue = (eyeHue + getRandomInRange(30, 90) * (Math.random() < 0.5 ? 1 : -1) + 360) % 360;
        }
        const eyeRGB = hslToRgb(eyeHue/360, eyeSaturation, eyeLightness);
        const pupilRGB = hslToRgb(eyeHue/360, Math.min(1.0, eyeSaturation * 1.05), Math.max(0.01, eyeLightness * 0.25));
        const eyeHighlightRGB = hslToRgb(eyeHue/360, Math.max(0, eyeSaturation * 0.3), Math.min(1.0, eyeLightness * 1.3 + 0.3));

        const featureHue = (baseHue + getRandomInRange(5, 35) * (Math.random() < 0.5 ? 1 : -1) + 360) % 360;
        const featureSat = Math.max(0.05, baseSaturation - getRandomInRange(0.1, 0.3));
        const featureLight = (baseLightness > 0.5) ? Math.max(0.05, baseLightness - getRandomInRange(0.1, 0.25)) : Math.min(0.95, baseLightness + getRandomInRange(0.1, 0.25));
        const featureRGB = hslToRgb(featureHue/360, featureSat, featureLight);

        return {
            body: `rgb(${bodyRGB.r},${bodyRGB.g},${bodyRGB.b})`,
            accent1: `rgb(${accent1RGB.r},${accent1RGB.g},${accent1RGB.b})`,
            accent2: `rgb(${accent2RGB.r},${accent2RGB.g},${accent2RGB.b})`,
            eye: `rgb(${eyeRGB.r},${eyeRGB.g},${eyeRGB.b})`,
            pupil: `rgb(${pupilRGB.r},${pupilRGB.g},${pupilRGB.b})`,
            eyeHighlight: `rgb(${eyeHighlightRGB.r},${eyeHighlightRGB.g},${eyeHighlightRGB.b})`,
            feature: `rgb(${featureRGB.r},${featureRGB.g},${featureRGB.b})`,
            background: 'rgb(0,0,0)'
        };
    } catch (error) {
        console.error("[alien_portrait.js V22] Error in determinePalette:", error);
        return fallbackPalette;
    }
}

/** Helper to draw a line of pixels with thickness, checking bounds. */
function drawLine(grid, x1, y1, x2, y2, colorVal, thickness, gridW, gridH, allowOverwrite = false) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;
    let curX = x1;
    let curY = y1;

    const effectiveThickness = Math.max(1, thickness);
    const halfThickness = Math.floor(effectiveThickness / 2);

    while (true) {
        for (let t = -halfThickness; t <= halfThickness; t++) {
            let drawX = curX, drawY = curY;
            if (dx > dy) {
                drawY = curY + t;
            } else if (dy > dx) {
                drawX = curX + t;
            } else {
                drawX = curX + (t % 2 === 0 ? Math.round(t*0.707) : Math.floor(t*0.707));
                drawY = curY + (t % 2 !== 0 ? Math.round(t*0.707) : Math.floor(t*0.707));
            }

            if (drawX >= 0 && drawX < gridW && drawY >= 0 && drawY < gridH &&
                (grid[drawY][drawX] === 0 || grid[drawY][drawX] === 1 || allowOverwrite || (grid[drawY][drawX] === 8 && colorVal === 8) ) ) {
                grid[drawY][drawX] = colorVal;
            }
        }

        if ((curX === x2) && (curY === y2)) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; curX += sx; }
        if (e2 < dx) { err += dx; curY += sy; }
    }
}

/**
 * Helper function to find the X-coordinate on the silhouette of the body.
 * @param {number} targetY - The Y-coordinate for which to find the silhouette edge.
 * @param {number} side - -1 for left edge, 1 for right edge, 0 for center.
 * @param {number} bodyDrawX - The starting X offset of the body drawing area.
 * @param {number} bodyDrawY - The starting Y offset of the body drawing area.
 * @param {number} bodyMaxVisualWidth - The maximum visual width of the body's bounding box.
 * @param {number} bodyMaxVisualHeight - The maximum visual height of the body.
 * @param {Array<number>} segmentWidths - Array of actual drawn widths for each Y segment.
 * @returns {number} The X-coordinate of the silhouette/center, or the bounding box center if not found.
 */
function getBodyPointOnSilhouette(targetY, side, bodyDrawX, bodyDrawY, bodyMaxVisualWidth, bodyMaxVisualHeight, segmentWidths) {
    const yIndexInBody = targetY - bodyDrawY;

    if (yIndexInBody >= 0 && yIndexInBody < bodyMaxVisualHeight && yIndexInBody < segmentWidths.length) {
        const currentSegmentWidth = segmentWidths[yIndexInBody];
        const xStartOffsetForSegment = Math.floor((bodyMaxVisualWidth - currentSegmentWidth) / 2);
        if (side === -1) { // Left edge
            return bodyDrawX + xStartOffsetForSegment;
        } else if (side === 1) { // Right edge
            return bodyDrawX + xStartOffsetForSegment + currentSegmentWidth - 1;
        } else { // side === 0, Center of the segment
            return bodyDrawX + xStartOffsetForSegment + Math.floor(currentSegmentWidth / 2);
        }
    }
    // Fallback if targetY is outside the drawn body or segmentWidths is too short
    return bodyDrawX + Math.floor(bodyMaxVisualWidth / 2);
}


/** Adds limbs to the body grid. */
function addLimbs(grid, speciesData, bodyType, bodyDrawX, bodyDrawY, bodyW, bodyH, headH, segmentWidths, gridW, gridH) {
    try {
        const limbColorVal = 8;
        const appendageDesc = speciesData.physical.appendages.value.toLowerCase();
        let numTotalLimbs = 0;

        if (appendageDesc.includes("no distinct limbs") || appendageDesc.includes("serpentine")) return;

        const limbMatch = appendageDesc.match(/(\d+)\s*limbs/);
        if (limbMatch) {
            numTotalLimbs = parseInt(limbMatch[1], 10);
        } else if (appendageDesc.includes("tentacles")) {
            numTotalLimbs = getRandomIntInRange(4, 10);
        } else {
            numTotalLimbs = (bodyType.includes("insectoid") || bodyType.includes("arachnoid")) ? getRandomIntInRange(6, 8) : getRandomIntInRange(2, 4);
        }
        numTotalLimbs = Math.max(0, numTotalLimbs);

        let upperLimbPairs = 0, lowerLimbPairs = 0, midLimbPairs = 0;
        const limbStyleRoll = Math.random();
        let limbStyle = limbStyleRoll < 0.33 ? 'slender' : limbStyleRoll < 0.66 ? 'standard' : 'robust';
        if (appendageDesc.includes("robust") || appendageDesc.includes("powerful")) limbStyle = 'robust';
        if (appendageDesc.includes("slender") || appendageDesc.includes("delicate")) limbStyle = 'slender';

        if (bodyType.includes("humanoid") || (bodyType.includes("reptilian") && numTotalLimbs <= 4) || bodyType.includes("avian")) {
            upperLimbPairs = (numTotalLimbs >= 2) ? 1 : 0;
            lowerLimbPairs = (numTotalLimbs >= 4 && !bodyType.includes("avian")) ? 1 : (bodyType.includes("avian") && numTotalLimbs >=2 ? 1 : 0);
             if (numTotalLimbs === 2 && !bodyType.includes("avian") && Math.random() < 0.5) {
                lowerLimbPairs = 1; upperLimbPairs = 0;
            }
        } else if (bodyType.includes("insectoid") || bodyType.includes("arachnoid") || (bodyType.includes("reptilian") && numTotalLimbs > 4)) {
            const totalPairs = Math.floor(numTotalLimbs / 2);
            if (totalPairs <= 0) return;
            if (totalPairs === 1) {
                 if (Math.random() < 0.5) upperLimbPairs = 1; else lowerLimbPairs = 1;
            } else if (totalPairs === 2) {
                upperLimbPairs = 1; lowerLimbPairs = 1;
            } else {
                upperLimbPairs = getRandomIntInRange(1, Math.max(1, Math.floor(totalPairs / 2)));
                midLimbPairs = getRandomIntInRange(0, Math.max(0, Math.floor(totalPairs / 3) - (upperLimbPairs > 1 ? 1 : 0) ));
                lowerLimbPairs = totalPairs - upperLimbPairs - midLimbPairs;
                if (lowerLimbPairs < 0) {
                    midLimbPairs = Math.max(0, midLimbPairs + lowerLimbPairs);
                    lowerLimbPairs = 0;
                    if (midLimbPairs < 0) {upperLimbPairs += midLimbPairs; midLimbPairs = 0;}
                }
                if (upperLimbPairs + midLimbPairs + lowerLimbPairs < totalPairs && totalPairs > 0) {
                    lowerLimbPairs = totalPairs - upperLimbPairs - midLimbPairs;
                }
            }
        } else if (bodyType.includes("molluscoid") && appendageDesc.includes("tentacles")) {
            // Tentacle logic handled below
        } else {
            const totalPairs = Math.floor(numTotalLimbs / 2);
            if (totalPairs <= 0) return;
            upperLimbPairs = getRandomIntInRange(0, totalPairs);
            lowerLimbPairs = totalPairs - upperLimbPairs;
        }

        const shoulderYBase = bodyDrawY + headH + Math.floor((bodyH - headH) * getRandomInRange(0.05, 0.20));
        const midTorsoYBase = bodyDrawY + headH + Math.floor((bodyH - headH) * getRandomInRange(0.40, 0.60));
        const hipYBase = bodyDrawY + bodyH - Math.floor(bodyH * getRandomInRange(0.05, 0.20));

        if (bodyType.includes("molluscoid") && appendageDesc.includes("tentacles")) {
            const numTentacles = numTotalLimbs;
            for (let i = 0; i < numTentacles; i++) {
                const attachRelY = getRandomInRange(0.15, 0.95);
                const attachY = bodyDrawY + Math.floor(bodyH * attachRelY);
                const side = (i % 2 === 0) ? -1 : 1;
                const attachX = getBodyPointOnSilhouette(attachY, side, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths);
                const tentacleLength = getRandomIntInRange(15, 40);
                let tX = attachX; let tY = attachY;
                const curveDirBase = side * getRandomInRange(0.8, 2.2) * (Math.random() < 0.5 ? 1 : -1);
                const thickness = limbStyle === 'slender' ? getRandomIntInRange(1,2) : limbStyle === 'robust' ? getRandomIntInRange(3,5) : getRandomIntInRange(2,4);

                for (let l = 0; l < tentacleLength; l++) {
                    const segmentProgress = l / tentacleLength;
                    const segmentAngle = curveDirBase * (0.05 + Math.sin(l * (0.1 + Math.random()*0.1) + i * 0.7 + Math.random()) * (0.7 + Math.random()*0.5) );
                    const stepX = Math.round(Math.cos(segmentAngle) * side * (1.0 + Math.random()*0.4) + (Math.random() - 0.5) * 1.2);
                    const stepY = 1 + Math.round(Math.sin(segmentAngle) * (0.8 + Math.random()*0.4) + (Math.random() - 0.45) * 1.1);
                    const currentThickness = Math.max(1, Math.floor(thickness * (1 - segmentProgress * 0.7)));
                    drawLine(grid, tX, tY, tX + stepX, tY + stepY, limbColorVal, currentThickness, gridW, gridH, true);
                    tX += stepX; tY += stepY;
                    if (tY >= gridH - 1 || tX < -5 || tX > gridW + 4 || l > tentacleLength * 1.5) break;
                }
            }
            return;
        }

        const drawLimbWithSegments = (startX, startY, totalLength, initialThickness, baseAngleHorizontal, verticalTilt, side, numSegments, isLeg = false) => {
            let currentX = startX;
            let currentY = startY;
            const segmentLength = Math.max(3, Math.floor(totalLength / numSegments));

            for (let s = 0; s < numSegments; s++) {
                let segAngle;
                if (isLeg) {
                    segAngle = (Math.PI / 2) + verticalTilt * side;
                    segAngle += (s > 0 ? (Math.random() - 0.5) * 0.4 : 0);
                } else {
                    segAngle = baseAngleHorizontal + verticalTilt;
                    segAngle += (s > 0 ? (Math.random() - 0.5) * 0.75 : (Math.random() - 0.5) * 0.2);
                }
                const segThickness = Math.max(1, initialThickness - Math.floor(s * (initialThickness / (numSegments +1) )*0.8 ));
                const endX = Math.round(currentX + Math.cos(segAngle) * segmentLength);
                const endY = Math.round(currentY + Math.sin(segAngle) * segmentLength);
                drawLine(grid, currentX, currentY, endX, endY, limbColorVal, segThickness, gridW, gridH);
                currentX = endX;
                currentY = endY;
            }

            let endFeatureSizeX = Math.max(1, initialThickness + (limbStyle === 'robust' ? 1 : 0));
            let endFeatureSizeY = Math.max(1, initialThickness + (limbStyle === 'robust' ? 1 : 0));
            if (appendageDesc.includes("claw") || appendageDesc.includes("talon")) {
                const numClaws = getRandomIntInRange(1,3);
                for(let c=0; c<numClaws; c++){
                    const clawAngleOffset = (Math.random() -0.5) * 0.8;
                    const finalAngle = (isLeg ? (Math.PI/2 + verticalTilt * side) : (baseAngleHorizontal + verticalTilt)) + clawAngleOffset;
                    const clawLength = getRandomIntInRange(2,4);
                    drawLine(grid, currentX, currentY,
                             Math.round(currentX + Math.cos(finalAngle) * clawLength),
                             Math.round(currentY + Math.sin(finalAngle) * clawLength),
                             limbColorVal, 1, gridW, gridH, true);
                }
            } else if (appendageDesc.includes("pincer")) {
                const pincerArmLength = getRandomIntInRange(2,3);
                const finalAngleBase = isLeg ? (Math.PI/2 + verticalTilt * side) : (baseAngleHorizontal + verticalTilt);
                for(let p=-1; p<=1; p+=2){
                     drawLine(grid, currentX, currentY,
                             Math.round(currentX + Math.cos(finalAngleBase + p*0.5) * pincerArmLength),
                             Math.round(currentY + Math.sin(finalAngleBase + p*0.5) * pincerArmLength),
                             limbColorVal, Math.max(1, initialThickness-1), gridW, gridH, true);
                }
            } else if (appendageDesc.includes("manipulator") || appendageDesc.includes("hand")) {
                endFeatureSizeX = Math.max(2, initialThickness + 1 + (limbStyle === 'robust' ? 1 : 0));
                endFeatureSizeY = Math.max(2, initialThickness + (limbStyle === 'robust' ? 1 : 0));
                 for(let ex = -Math.floor(endFeatureSizeX/2); ex <= Math.ceil(endFeatureSizeX/2); ex++) {
                    for(let ey = -Math.floor(endFeatureSizeY/2); ey <= Math.ceil(endFeatureSizeY/2); ey++) {
                         const featurePixelY = currentY + ey;
                         const featurePixelX = currentX + ex;
                         if (featurePixelY >=0 && featurePixelY < gridH && featurePixelX >=0 && featurePixelX < gridW && grid[featurePixelY][featurePixelX] === 0 && Math.random() < 0.7) grid[featurePixelY][featurePixelX] = limbColorVal;
                    }
                }
            } else if (appendageDesc.includes("hoof") && isLeg) {
                endFeatureSizeX = Math.max(2, initialThickness + 2);
                endFeatureSizeY = Math.max(1, initialThickness);
                 for(let ex = -Math.floor(endFeatureSizeX/2); ex <= Math.ceil(endFeatureSizeX/2); ex++) {
                    for(let ey = 0; ey < endFeatureSizeY; ey++) {
                         const featurePixelY = currentY + ey;
                         const featurePixelX = currentX + ex;
                         if (featurePixelY >=0 && featurePixelY < gridH && featurePixelX >=0 && featurePixelX < gridW && grid[featurePixelY][featurePixelX] === 0) grid[featurePixelY][featurePixelX] = limbColorVal;
                    }
                }
            } else if ((appendageDesc.includes("pad") || appendageDesc.includes("feet") || appendageDesc.includes("foot")) && isLeg) {
                endFeatureSizeX = Math.max(2, initialThickness + 1);
                endFeatureSizeY = Math.max(1, initialThickness);
                 for(let ex = -Math.floor(endFeatureSizeX/2); ex <= Math.ceil(endFeatureSizeX/2); ex++) {
                    for(let ey = 0; ey < endFeatureSizeY; ey++) {
                         const featurePixelY = currentY + ey;
                         const featurePixelX = currentX + ex;
                         if (featurePixelY >=0 && featurePixelY < gridH && featurePixelX >=0 && featurePixelX < gridW && grid[featurePixelY][featurePixelX] === 0 && Math.random() < 0.8) grid[featurePixelY][featurePixelX] = limbColorVal;
                    }
                }
            } else {
                if (Math.random() < 0.8) {
                    const endSize = Math.max(1, Math.floor(initialThickness * 0.8));
                    for(let ex = -Math.floor(endSize/2); ex <= Math.ceil(endSize/2); ex++) {
                        for(let ey = -Math.floor(endSize/2); ey <= Math.ceil(endSize/2); ey++) {
                             const endPixelY = currentY + ey;
                             const endPixelX = currentX + ex;
                             if (endPixelY >=0 && endPixelY < gridH && endPixelX >=0 && endPixelX < gridW && grid[endPixelY][endPixelX] === 0) grid[endPixelY][endPixelX] = limbColorVal;
                        }
                    }
                }
            }
        };

        const armBaseVerticalTiltRange = 0.6;
        const pairHorizontalAngleOffsetUpper = (Math.random() - 0.5) * 0.4;
        const pairVerticalTiltUpper = (Math.random() - 0.5) * armBaseVerticalTiltRange;
        const pairHorizontalAngleOffsetMid = (Math.random() - 0.5) * 0.8;
        const pairVerticalTiltMid = (Math.random() - 0.5) * 0.7;
        const pairLegStanceAngle = getRandomInRange(0.01, 0.40);


        for (let pair = 0; pair < upperLimbPairs; pair++) {
            let limbLength, limbThickness;
            if (limbStyle === 'slender') { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.50), Math.floor(bodyH * 0.85)); limbThickness = getRandomIntInRange(1, 2); }
            else if (limbStyle === 'robust') { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.30), Math.floor(bodyH * 0.60)); limbThickness = getRandomIntInRange(3, 6); }
            else { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.40), Math.floor(bodyH * 0.70)); limbThickness = getRandomIntInRange(2, 4); }

            const attachY = shoulderYBase + pair * (limbThickness + getRandomIntInRange(2,5));
            if (attachY >= bodyDrawY + bodyH - 3 || attachY < bodyDrawY + Math.floor(headH*0.5) ) continue;

            for (let side = -1; side <= 1; side += 2) {
                const attachX = getBodyPointOnSilhouette(attachY, side, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths);
                const baseArmAngleHorizontal = (side === -1 ? Math.PI - pairHorizontalAngleOffsetUpper : pairHorizontalAngleOffsetUpper);

                if (bodyType.includes("avian") && pair === 0 && (appendageDesc.includes("wing") || appendageDesc.includes("membranous"))) {
                    let currentWingX = attachX;
                    let currentWingY = attachY;
                    const numWingSegments = getRandomIntInRange(2,4);
                    const wingSpan = limbLength * getRandomIntInRange(2.5, 4.5);
                    const segmentLength = Math.floor(wingSpan / numWingSegments);
                    let currentAngle = ((Math.random() * 0.25 - 0.12) + (side === -1 ? Math.PI : 0)) + pairVerticalTiltUpper;

                    for (let ws = 0; ws < numWingSegments; ws++) {
                        const currentWingThickness = Math.max(1, limbThickness + 2 - Math.floor(ws * 1.5));
                        const endX = Math.round(currentWingX + Math.cos(currentAngle) * segmentLength);
                        const endY = Math.round(currentWingY + Math.sin(currentAngle) * segmentLength);
                        drawLine(grid, currentWingX, currentWingY, endX, endY, limbColorVal, currentWingThickness, gridW, gridH, true);
                        const fillIterations = Math.floor(segmentLength * 0.8);
                        for (let f = 0; f < fillIterations; f++) {
                            const progress = f / fillIterations;
                            const lineStartX = Math.round(currentWingX + (endX - currentWingX) * progress);
                            const lineStartY = Math.round(currentWingY + (endY - currentWingY) * progress);
                            const membraneReach = Math.max(1, Math.floor(segmentLength * getRandomInRange(0.5, 1.0) * (1 - progress * 0.6) + currentWingThickness * 0.7));
                            drawLine(grid, lineStartX, lineStartY,
                                     Math.round(lineStartX + Math.cos(currentAngle + Math.PI / 2 * side * getRandomInRange(0.8,1.2)) * membraneReach),
                                     Math.round(lineStartY + Math.sin(currentAngle + Math.PI / 2 * side * getRandomInRange(0.8,1.2)) * membraneReach),
                                     limbColorVal, 1, gridW, gridH, true);
                        }
                        currentWingX = endX; currentWingY = endY;
                        currentAngle += (getRandomInRange(0.4, 0.8)) * side * (Math.random() < 0.7 ? 1 : -0.5);
                    }
                } else {
                    drawLimbWithSegments(attachX, attachY, limbLength, limbThickness, baseArmAngleHorizontal, pairVerticalTiltUpper, side, getRandomIntInRange(1, 3));
                }
            }
        }

        for (let pair = 0; pair < midLimbPairs; pair++) {
            let limbLength, limbThickness;
            if (limbStyle === 'slender') { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.35), Math.floor(bodyH * 0.70)); limbThickness = 1; }
            else if (limbStyle === 'robust') { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.25), Math.floor(bodyH * 0.50)); limbThickness = getRandomIntInRange(2, 5); }
            else { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.30), Math.floor(bodyH * 0.60)); limbThickness = getRandomIntInRange(2, 3); }

            const attachY = midTorsoYBase + pair * (limbThickness + getRandomIntInRange(3,6)) + getRandomIntInRange(-5, 5);
            if (attachY >= bodyDrawY + bodyH - 5 || attachY <= bodyDrawY + headH + 5) continue;

            for (let side = -1; side <= 1; side += 2) {
                const attachX = getBodyPointOnSilhouette(attachY, side, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths);
                const midLimbBaseAngleHorizontal = (side === -1 ? Math.PI - pairHorizontalAngleOffsetMid : pairHorizontalAngleOffsetMid);
                drawLimbWithSegments(attachX, attachY, limbLength, limbThickness, midLimbBaseAngleHorizontal, pairVerticalTiltMid, side, getRandomIntInRange(2, 3), Math.random() < 0.3);
            }
        }
        if (bodyType.includes("fish-like") || (bodyType.includes("aquatic") && (appendageDesc.includes("fin") || appendageDesc.includes("flipper")))) {
            const numPairedFins = getRandomIntInRange(1,3);
            for (let pair = 0; pair < numPairedFins; pair++){
                const finBaseLength = getRandomIntInRange(6,18);
                const finProjection = getRandomIntInRange(10,25);
                const attachY = midTorsoYBase + getRandomIntInRange(-Math.floor(bodyH*0.25), Math.floor(bodyH*0.25)) + pair * getRandomIntInRange(8,15);
                if (attachY < bodyDrawY + headH || attachY > bodyDrawY + bodyH -3) continue;

                const pairFinAngleRandomness = (Math.random()-0.5)*0.8;

                for(let side = -1; side <= 1; side+=2){
                     const attachX = getBodyPointOnSilhouette(attachY, side, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths);
                     const finAngle = (side === -1 ? Math.PI : 0) + pairFinAngleRandomness + (Math.PI/2 * (Math.random()-0.5)*0.4);

                     for(let i=0; i<finBaseLength; i++){
                         const currentAttachY = attachY + Math.round(Math.sin(finAngle)*i) - Math.floor(finBaseLength * Math.sin(finAngle)/2);
                         const currentAttachX = attachX + Math.round(Math.cos(finAngle)*i) - Math.floor(finBaseLength * Math.cos(finAngle)/2);
                         if(currentAttachY < bodyDrawY + headH *0.5 || currentAttachY >= bodyDrawY+bodyH) continue;

                         const finTipX = currentAttachX + Math.round(Math.cos(finAngle + (Math.PI/2 * side * 0.8) ) * finProjection * (0.5 + Math.sin(i/finBaseLength * Math.PI)*0.5) );
                         const finTipY = currentAttachY + Math.round(Math.sin(finAngle + (Math.PI/2 * side * 0.8) ) * finProjection * (0.5 + Math.sin(i/finBaseLength * Math.PI)*0.5) );
                         drawLine(grid, currentAttachX, currentAttachY, finTipX, finTipY, limbColorVal, getRandomIntInRange(1,2), gridW, gridH, true);
                         for(let l=0; l < Math.max(Math.abs(finTipX-currentAttachX), Math.abs(finTipY-currentAttachY)); l++){
                             const progress = l / (Math.max(Math.abs(finTipX-currentAttachX), Math.abs(finTipY-currentAttachY)) || 1);
                             const fillX = Math.round(currentAttachX + (finTipX - currentAttachX) * progress);
                             const fillY = Math.round(currentAttachY + (finTipY - currentAttachY) * progress);
                             if(grid[fillY] && grid[fillY][fillX] === 0 && Math.random() < 0.6) grid[fillY][fillX] = limbColorVal;
                         }
                     }
                }
            }
            for(let medianFinType = 0; medianFinType < 2; medianFinType++){
                if(Math.random() < 0.75){
                    const finLength = getRandomIntInRange(15,35);
                    const finMaxHeight = getRandomIntInRange(6,16);
                    const attachActualY = bodyDrawY + headH * (medianFinType === 0 ? 0.1 : 0.9) + Math.floor((bodyH-headH) * (medianFinType === 0 ? 0.2 : 0.8) );
                    const yIndexForSilhouette = Math.max(0, Math.min(segmentWidths.length -1, attachActualY - bodyDrawY));
                    const attachXStart = getBodyPointOnSilhouette(attachActualY, 0, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths) - Math.floor(finLength/2);

                    for(let i=0; i<finLength; i++){
                        const currentFinH = Math.max(1, Math.floor(finMaxHeight * (Math.sin( (i/finLength) * Math.PI * getRandomInRange(0.8,1.2)) + 0.30) ));
                        const currentAttachX = attachXStart + i;
                        for(let h=0; h < currentFinH; h++){
                            const fy = attachActualY + h * (medianFinType === 0 ? -1: 1) ;
                            if(fy >=0 && fy < gridH && currentAttachX >=0 && currentAttachX < gridW && grid[fy][currentAttachX] === 0) grid[fy][currentAttachX] = limbColorVal;
                        }
                    }
                }
            }
            if (Math.random() < 0.9 && !appendageDesc.includes("no tail")) {
                const tailBaseY = bodyDrawY + bodyH - getRandomIntInRange(1,3);
                const yIndexForTail = Math.max(0, Math.min(segmentWidths.length -1, tailBaseY - bodyDrawY));
                const tailBaseX = getBodyPointOnSilhouette(tailBaseY, 0, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths);
                const finSpread = getRandomIntInRange(10,28);
                const finLength = getRandomIntInRange(8,20);
                const finType = Math.random();

                for(let i=-Math.floor(finSpread/2); i <= Math.ceil(finSpread/2); i++){
                    let tipYOffset = finLength;
                    if(finType < 0.33) {
                        tipYOffset = finLength * (1 - Math.pow(Math.abs(i)/(finSpread/2 || 1), 2)) * (i < 0 ? 0.7 : 1);
                    } else if (finType < 0.66) {
                        tipYOffset = finLength * (Math.abs(i) > finSpread/4 ? 1 : 0.5 * (1 - Math.pow(Math.abs(i)/(finSpread/4 || 1), 1.5)) );
                    } else {
                         tipYOffset = finLength * Math.sqrt(1 - Math.pow(Math.abs(i)/(finSpread/2 || 1), 2));
                    }
                    tipYOffset = Math.max(2, tipYOffset);
                    drawLine(grid, tailBaseX, tailBaseY, tailBaseX + i, tailBaseY + Math.floor(tipYOffset), limbColorVal, getRandomIntInRange(1,3), gridW, gridH, true);
                }
            }

        } else {
            for (let pair = 0; pair < lowerLimbPairs; pair++) {
                let limbLength, limbThickness;
                if (limbStyle === 'slender') { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.45), Math.floor(bodyH * 0.70)); limbThickness = getRandomIntInRange(1,2); }
                else if (limbStyle === 'robust') { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.30), Math.floor(bodyH * 0.55)); limbThickness = getRandomIntInRange(3, 6); }
                else { limbLength = getRandomIntInRange(Math.floor(bodyH * 0.38), Math.floor(bodyH * 0.62)); limbThickness = getRandomIntInRange(2, 4); }

                const attachY = hipYBase - pair * (limbThickness + getRandomIntInRange(1,4));
                if (attachY < bodyDrawY + headH + Math.floor((bodyH-headH)*0.3)) continue;

                for (let side = -1; side <= 1; side += 2) {
                    const attachX = getBodyPointOnSilhouette(attachY, side, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths);
                    drawLimbWithSegments(attachX, attachY, limbLength, limbThickness, (Math.PI / 2), pairLegStanceAngle, side, getRandomIntInRange(1, 3), true);
                }
            }
        }
    } catch (error) {
        console.error("[alien_portrait.js V22] Error in addLimbs:", error);
    }
}


/** Adds special physical features like horns, antennae. */
function addSpecialPhysicalFeatures(grid, speciesData, bodyType, bodyDrawX, bodyDrawY, bodyW, bodyH, headH, segmentWidths, gridW, gridH, drawTailOnly = false) {
    if (drawTailOnly) return;
    try {
        const featureColorVal = 9;
        const headFeaturesDesc = speciesData.physical.headFeatures.value.toLowerCase();

        // Horns, Crests, Spines
        if (headFeaturesDesc.includes("horn") || headFeaturesDesc.includes("crest") || headFeaturesDesc.includes("spine")) {
            const numFeatures = headFeaturesDesc.includes("crested") ? getRandomIntInRange(2, 7) : getRandomIntInRange(1, 4);
            const featureLengthBase = getRandomIntInRange(3, 12);
            const baseThickness = headFeaturesDesc.includes("spines") ? getRandomIntInRange(1, 2) : getRandomIntInRange(1, 4);
            
            // Common upward angle for the pair/group, with slight overall randomness
            const commonBaseUpwardAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.15; 
            // Symmetrical splay factor for pairs/groups
            const pairSplayMagnitude = (Math.random() * 0.4 + 0.1); // How much they angle outwards from the commonBaseUpwardAngle

            for (let i = 0; i < numFeatures; i++) {
                const attachRelYHead = getRandomInRange(-0.2, 0.25);
                const attachY = bodyDrawY + Math.floor(headH * attachRelYHead);
                if (attachY < bodyDrawY - 2) continue;

                const yIndexInBody = Math.max(0, Math.min(segmentWidths.length - 1, attachY - bodyDrawY));
                let attachX;
                let featureAngle;

                if (numFeatures === 1 || (numFeatures % 2 !== 0 && i === Math.floor(numFeatures / 2))) { // Single or middle feature
                    attachX = getBodyPointOnSilhouette(attachY, 0, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths);
                    featureAngle = commonBaseUpwardAngle + (Math.random() - 0.5) * 0.05; // Minimal deviation for single central horn
                } else { // Paired features
                    const sideForPair = (i < Math.floor(numFeatures/2)) ? -1 : 1; // Determine side for pairing
                    const pairIndex = (i < Math.floor(numFeatures/2)) ? i : i - Math.ceil(numFeatures/2); // Index within the pair set
                    
                    attachX = getBodyPointOnSilhouette(attachY, 0, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths) + 
                              Math.floor(segmentWidths[yIndexInBody] * (0.1 + pairIndex * 0.12) * sideForPair);
                    featureAngle = commonBaseUpwardAngle + (pairSplayMagnitude * sideForPair);
                }
                attachX = Math.max(0, Math.min(gridW - 1, attachX));

                let prevHX = attachX, prevHY = attachY;
                const featureLength = featureLengthBase * getRandomInRange(0.7, 1.3);

                for (let l = 0; l < featureLength; l++) {
                    const currentThickness = Math.max(1, baseThickness - Math.floor(l / (featureLength / baseThickness + 0.1)));
                    // Standard angle interpretation: 0 is right, positive is CCW. -PI/2 is up.
                    const hY = prevHY + Math.round(Math.sin(featureAngle) * 1.1); 
                    const hX = prevHX + Math.round(Math.cos(featureAngle) * 1.1); 

                    drawLine(grid, prevHX, prevHY, hX, hY, featureColorVal, currentThickness, gridW, gridH, true);
                    prevHX = hX; prevHY = hY;
                    if (hY < -3 || hX < -3 || hX > gridW + 2) break;
                }
            }
        }

        // Antennae
        if (headFeaturesDesc.includes("antennae")) {
            const antennaeLengthBase = getRandomIntInRange(8, 20);
            const antennaeThickness = getRandomIntInRange(1, 2);
            const numAntennaePairs = getRandomIntInRange(1,2);
            
            // Define base upward direction and splay for the pair for symmetry
            const baseUpwardDirection = -Math.PI / 2 + (Math.random() - 0.5) * 0.2; // Mostly up, slight common tilt
            const pairSplayMagnitude = Math.PI / 5 + (Math.random() - 0.5) * (Math.PI / 8); // How much each splays outwards from vertical

            for (let p = 0; p < numAntennaePairs; p++) {
                for (let side = -1; side <= 1; side += 2) { // side is -1 for left, 1 for right
                    const attachRelYHead = getRandomInRange(-0.1, 0.35) + p * 0.1;
                    const attachY = bodyDrawY + Math.floor(headH * attachRelYHead);
                    if (attachY < bodyDrawY -1) continue;

                    const attachX = getBodyPointOnSilhouette(attachY, side, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths) + side * Math.floor(antennaeThickness/2);

                    let prevAX = attachX; let prevAY = attachY;
                    const antennaeLength = antennaeLengthBase * getRandomInRange(0.8, 1.2);
                    
                    // Calculate base angle for this specific antenna (symmetrical splay)
                    const baseAngle = baseUpwardDirection + (side * pairSplayMagnitude);

                    for (let l = 0; l < antennaeLength; l++) {
                        // Symmetrical waving motion
                        const waveFactor = Math.sin(l * 0.15 + p * 0.5 + side * l * 0.03) * 0.4 * side; // Reduced and symmetrical wave
                        const segmentAngle = baseAngle + waveFactor;
                        
                        // Standard polar to cartesian: Y decreases upwards
                        const aY = prevAY + Math.round(Math.sin(segmentAngle) * 1.5); 
                        const aX = prevAX + Math.round(Math.cos(segmentAngle) * 1.5);
                        
                        drawLine(grid, prevAX, prevAY, aX, aY, featureColorVal, antennaeThickness, gridW, gridH, true);
                        prevAX = aX; prevAY = aY;

                        if (l === Math.floor(antennaeLength) - 1 && Math.random() < 0.7) { // Tip feature
                            const bulbSize = getRandomIntInRange(1, antennaeThickness + 1);
                            for (let by = -Math.floor((bulbSize - 1) / 2); by <= Math.ceil((bulbSize - 1) / 2); by++) {
                                for (let bx = -Math.floor((bulbSize - 1) / 2); bx <= Math.ceil((bulbSize - 1) / 2); bx++) {
                                    if (grid[aY + by] && grid[aY + by][aX + bx] !== undefined && grid[aY + by][aX + bx] === 0) {
                                        grid[aY + by][aX + bx] = featureColorVal;
                                    }
                                }
                            }
                        }
                        if (aY < -4 || aX < -4 || aX >= gridW + 4) break;
                    }
                }
            }
        }
        if (speciesData.specialCharacteristics.some(sc => sc.characteristic.toLowerCase().includes("natural armor")) ||
            speciesData.physical.skinTexture.value.toLowerCase().includes("plates") ||
            speciesData.physical.skinTexture.value.toLowerCase().includes("exoskeleton") && Math.random() < 0.3) {
            const numPlates = getRandomIntInRange(2, 8);
            for (let i = 0; i < numPlates; i++) {
                const plateAttachY = bodyDrawY + getRandomIntInRange(Math.floor(headH * 0.5), bodyH - 3);
                if (plateAttachY >= bodyDrawY + bodyH || plateAttachY < bodyDrawY) continue;

                const side = Math.random() < 0.5 ? -1 : 1;
                const plateAttachX = getBodyPointOnSilhouette(plateAttachY, side, bodyDrawX, bodyDrawY, bodyW, bodyH, segmentWidths) + side * getRandomIntInRange(-1,2);

                const plateWidth = getRandomIntInRange(2, 7);
                const plateHeight = getRandomIntInRange(2, 6);

                if (grid[plateAttachY] && grid[plateAttachY][plateAttachX] !== 0) {
                    for (let py = 0; py < plateHeight; py++) {
                        for (let px = 0; px < plateWidth; px++) {
                            const currentPlateY = plateAttachY + py - Math.floor(plateHeight/2);
                            const currentPlateX = plateAttachX + px - Math.floor(plateWidth/2);
                            if (currentPlateY >=0 && currentPlateY < gridH && currentPlateX >=0 && currentPlateX < gridW &&
                                grid[currentPlateY][currentPlateX] !== 0 &&
                                Math.random() < 0.75) {
                                grid[currentPlateY][currentPlateX] = 9;
                            }
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error("[alien_portrait.js V22] Error in addSpecialPhysicalFeatures:", error);
    }
}


/** Adds facial features. */
function addFacialFeatures(grid, speciesData, bodyType, bodyGridStartY, headRegionH, headWidthAtMid, gridW, gridH) {
    try {
        const headFeaturesDesc = speciesData.physical.headFeatures.value.toLowerCase();
        const headMidX = Math.floor(gridW / 2);

        let numEyes = 2;
        let eyeSizeX = getRandomIntInRange(2, 6);
        let eyeSizeY = getRandomIntInRange(2, 5);
        let pupilType = (Math.random() < 0.35) ? 'slit' : (Math.random() < 0.7 ? 'dot' : 'none');

        if (bodyType.includes("insectoid") || bodyType.includes("arachnoid") || headFeaturesDesc.includes("compound")) {
            pupilType = 'none';
        }
        if (headFeaturesDesc.includes("no visible eyes")) {
            numEyes = 0;
        } else if (headFeaturesDesc.includes("single occulus") || headFeaturesDesc.includes("cycloptic")) {
            numEyes = 1;
            eyeSizeX = Math.max(6, getRandomIntInRange(Math.floor(headWidthAtMid * 0.40), Math.floor(headWidthAtMid * 0.75)));
            eyeSizeY = Math.max(5, getRandomIntInRange(Math.floor(eyeSizeX * 0.40), eyeSizeX * 0.70));
        } else if (headFeaturesDesc.includes("multiple eyes")) {
            numEyes = getRandomIntInRange(3, 8);
            eyeSizeX = getRandomIntInRange(1, 4);
            eyeSizeY = getRandomIntInRange(1, 4);
        } else if (headFeaturesDesc.includes("compound eyes")) {
            numEyes = 2;
            eyeSizeX = getRandomIntInRange(Math.max(5, Math.floor(headWidthAtMid * 0.30)), Math.max(8, Math.floor(headWidthAtMid * 0.55)));
            eyeSizeY = getRandomIntInRange(Math.max(3, Math.floor(headRegionH * 0.25)), Math.max(7, Math.floor(headRegionH * 0.50)));
        }

        const eyeVerticalCenterBase = bodyGridStartY + Math.floor(headRegionH * getRandomInRange(0.35, 0.55));

        for (let i = 0; i < numEyes; i++) {
            let eyeCenterX, currentEyeSizeX = eyeSizeX, currentEyeSizeY = eyeSizeY;
            let eyeVerticalCenter = eyeVerticalCenterBase + getRandomIntInRange(-Math.floor(headRegionH*0.05), Math.floor(headRegionH*0.05));

            if (numEyes === 1) {
                eyeCenterX = headMidX;
            } else {
                const eyePairIndex = Math.floor(i / 2);
                const side = (i % 2 === 0) ? -1 : 1;
                let horizontalOffsetFactor = 0.12;

                if (numEyes === 2) horizontalOffsetFactor = getRandomInRange(0.15, 0.25);
                else if (numEyes === 3 && i > 0) horizontalOffsetFactor = getRandomInRange(0.18, 0.28);
                else if (numEyes === 4) horizontalOffsetFactor = 0.10 + eyePairIndex * getRandomIntInRange(0.12, 0.18);
                else if (numEyes >= 5) {
                    horizontalOffsetFactor = 0.08 + (eyePairIndex % Math.max(1, Math.floor(numEyes/3))) * getRandomIntInRange(0.10, 0.15);
                    eyeVerticalCenter += Math.floor(i / (numEyes > 5 ? 3:2)) * (currentEyeSizeY + getRandomIntInRange(1,2)) - Math.floor(headRegionH*0.1);
                }

                if ((numEyes === 3 || numEyes === 5 || numEyes === 7) && i === 0) eyeCenterX = headMidX;
                else eyeCenterX = headMidX + Math.floor(headWidthAtMid * horizontalOffsetFactor * side * getRandomInRange(0.8, 1.2));
            }
            eyeCenterX = Math.max(Math.floor(currentEyeSizeX / 2), Math.min(gridW - 1 - Math.floor(currentEyeSizeX / 2), eyeCenterX));
            eyeVerticalCenter = Math.max(bodyGridStartY + Math.floor(currentEyeSizeY/2), Math.min(bodyGridStartY + headRegionH - Math.floor(currentEyeSizeY/2), eyeVerticalCenter));

            for (let yOff = -Math.floor((currentEyeSizeY - 1) / 2); yOff <= Math.ceil((currentEyeSizeY - 1) / 2); yOff++) {
                for (let xOff = -Math.floor((currentEyeSizeX - 1) / 2); xOff <= Math.ceil((currentEyeSizeX - 1) / 2); xOff++) {
                    if ( (Math.pow(xOff / (currentEyeSizeX/2 || 1) , 2) + Math.pow(yOff / (currentEyeSizeY/2 || 1), 2)) > 1.1 && currentEyeSizeX > 1 && currentEyeSizeY > 1) continue;
                    const curY = eyeVerticalCenter + yOff;
                    const curX = eyeCenterX + xOff;
                    if (curY >= 0 && curY < gridH && curX >= 0 && curX < gridW && (grid[curY][curX] === 1 || grid[curY][curX] === 9) ) {
                        if (headFeaturesDesc.includes("compound eyes")) {
                            grid[curY][curX] = ((curX % 2 === curY % 2) || Math.random() < 0.6) ? 4 : 5;
                        } else {
                            grid[curY][curX] = 4;
                        }
                    }
                }
            }
            if (pupilType !== 'none' && currentEyeSizeX > 1 && currentEyeSizeY > 1 && !headFeaturesDesc.includes("compound eyes")) {
                const pupilCenterY = eyeVerticalCenter + getRandomIntInRange(-1,1);
                const pupilCenterX = eyeCenterX + getRandomIntInRange(-1,1);
                const pupilThickness = Math.max(1, Math.floor(Math.min(currentEyeSizeX, currentEyeSizeY) / getRandomInRange(2.2, 3.5)));

                if (pupilType === 'slit') {
                    const isVerticalSlit = Math.random() < 0.5;
                    if (isVerticalSlit && currentEyeSizeY > 1) {
                        for (let ySlit = -Math.floor((currentEyeSizeY - 1) / 2.5); ySlit <= Math.ceil((currentEyeSizeY - 1) / 2.5); ySlit++) {
                            for (let t = -Math.floor((pupilThickness - 1) / 2); t <= Math.ceil((pupilThickness - 1) / 2); t++)
                                if (grid[pupilCenterY + ySlit] && grid[pupilCenterY + ySlit][pupilCenterX + t] === 4) grid[pupilCenterY + ySlit][pupilCenterX + t] = 5;
                        }
                    } else if (!isVerticalSlit && currentEyeSizeX > 1) {
                         for (let xSlit = -Math.floor((currentEyeSizeX - 1) / 2.5); xSlit <= Math.ceil((currentEyeSizeX - 1) / 2.5); xSlit++) {
                            for (let t = -Math.floor((pupilThickness - 1) / 2); t <= Math.ceil((pupilThickness - 1) / 2); t++)
                                if (grid[pupilCenterY + t] && grid[pupilCenterY + t][pupilCenterX + xSlit] === 4) grid[pupilCenterY + t][pupilCenterX + xSlit] = 5;
                        }
                    }
                } else if (pupilType === 'dot') {
                    for (let py = -Math.floor((pupilThickness) / 2); py <= Math.ceil((pupilThickness - 1) / 2); py++) {
                        for (let px = -Math.floor((pupilThickness) / 2); px <= Math.ceil((pupilThickness - 1) / 2); px++) {
                            if ( (Math.pow(px / (pupilThickness/2 || 1),2) + Math.pow(py / (pupilThickness/2 || 1),2)) > 1.1 && pupilThickness > 1) continue;
                            if (grid[pupilCenterY + py] && grid[pupilCenterY + py][pupilCenterX + px] === 4) grid[pupilCenterY + py][pupilCenterX + px] = 5;
                        }
                    }
                }
                if (Math.random() < 0.85) {
                    const hlY = eyeVerticalCenter - Math.floor((currentEyeSizeY - 1) / 2) + getRandomIntInRange(0,1);
                    const hlX = eyeCenterX - Math.floor((currentEyeSizeX - 1) / 2) + getRandomIntInRange(0,1);
                    if (grid[hlY] && grid[hlY][hlX] && (grid[hlY][hlX] === 4 || grid[hlY][hlX] === 5)) {
                        grid[hlY][hlX] = 6;
                        if (currentEyeSizeX > 3 && Math.random() < 0.5 && grid[hlY] && grid[hlY][hlX + 1] && (grid[hlY][hlX + 1] === 4 || grid[hlY][hlX + 1] === 5)) grid[hlY][hlX + 1] = 6;
                    }
                }
            }
        }

        if (!headFeaturesDesc.includes("no distinct head") && (headFeaturesDesc.includes("mandibles") || headFeaturesDesc.includes("proboscis") || Math.random() < 0.85) ) {
            const featureY = bodyGridStartY + Math.floor(headRegionH * getRandomInRange(0.65, 0.85));
            let featureWidth = getRandomIntInRange(Math.max(3, Math.floor(headWidthAtMid * 0.25)), Math.floor(headWidthAtMid * 0.70));
            let featureHeight = getRandomIntInRange(1, 4);
            const featureStartX = headMidX - Math.floor(featureWidth / 2);

            if (headFeaturesDesc.includes("mandibles")) {
                featureHeight = getRandomIntInRange(2,5);
                for(let side = -1; side <=1; side+=2){
                    for(let m = 0; m < featureWidth/2; m++){
                        drawLine(grid, featureStartX + featureWidth/2 + (m*side), featureY - Math.floor(featureHeight/3) + Math.abs(m),
                                      featureStartX + featureWidth/2 + (m*side) + (getRandomIntInRange(1,3)*side), featureY + Math.floor(featureHeight/2) - Math.abs(m) + getRandomIntInRange(0,2),
                                      7, getRandomIntInRange(1,2), gridW, gridH, true);
                    }
                }
            } else if (headFeaturesDesc.includes("proboscis")) {
                const proboscisLength = getRandomIntInRange(3, headRegionH);
                drawLine(grid, headMidX, featureY, headMidX + getRandomIntInRange(-2,2), featureY + proboscisLength, 7, getRandomIntInRange(1,3), gridW, gridH, true);
            } else {
                for (let fy = 0; fy < featureHeight; fy++) {
                    for (let fx = 0; fx < featureWidth; fx++) {
                        if (fy === 0 && (fx < 1 || fx > featureWidth -2) && featureHeight > 1) continue;
                        if (fy === featureHeight -1 && (fx < 1 || fx > featureWidth-2) && featureHeight > 1) continue;
                        const curY = featureY + fy;
                        const curX = featureStartX + fx;
                        if (curY < gridH && curX >= 0 && curX < gridW && (grid[curY][curX] === 1 || grid[curY][curX] === 9)) {
                            grid[curY][curX] = 7;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("[alien_portrait.js V22] Error in addFacialFeatures:", error);
    }
}

/** Adds accent colors/patterns. */
function addAccents(grid, speciesData, bodyType, gridW, gridH) {
    try {
        const skinTexture = speciesData.physical.skinTexture.value.toLowerCase();

        for (let y = 0; y < gridH; y++) {
            for (let x = 0; x < gridW; x++) {
                const currentPixelVal = grid[y][x];
                if (currentPixelVal === 1 || currentPixelVal === 8 || currentPixelVal === 9) {
                    let accentProb = 0.01;
                    const chosenAccent = (Math.random() < 0.6) ? 2 : 3;

                    if (skinTexture.includes("patterned") || skinTexture.includes("bioluminescent")) accentProb = 0.06;
                    else if (skinTexture.includes("scales")) accentProb = 0.05;
                    else if (skinTexture.includes("chitin") || skinTexture.includes("exoskeleton")) accentProb = 0.04;
                    else if (bodyType.includes("crystalline") || bodyType.includes("mineral-based")) accentProb = 0.07;
                    else if (bodyType.includes("plant-like") || bodyType.includes("fungoid")) accentProb = 0.05;
                    else if (skinTexture.includes("fur")) accentProb = 0.025;

                    if (Math.random() < accentProb) {
                        let canPlaceAccent = true;
                        let emptyNeighbors = 0;
                        let featureNeighbor = false;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const ny = y + dy; const nx = x + dx;
                                if (ny < 0 || ny >= gridH || nx < 0 || nx >= gridW || grid[ny][nx] === 0) {
                                    emptyNeighbors++;
                                } else if (grid[ny][nx] >= 4 && grid[ny][nx] <= 7) {
                                    featureNeighbor = true;
                                }
                            }
                        }
                        if ((emptyNeighbors > 5 && currentPixelVal === 1) || featureNeighbor) {
                            canPlaceAccent = false;
                        }

                        if (canPlaceAccent) {
                            if (skinTexture.includes("scales") && (x * 2 + y * 3) % 9 < 2) {
                                grid[y][x] = chosenAccent;
                            } else if ((skinTexture.includes("chitin") || bodyType.includes("insectoid")) && (y % getRandomIntInRange(8, 14) <= 1 || x % getRandomIntInRange(8,14) <=1) && Math.random() < 0.08) {
                                grid[y][x] = chosenAccent;
                            } else if (bodyType.includes("crystalline") && Math.random() < 0.08 && ((x * 3 + y * 2) % 13 < 2 || (x*2 - y*3)%11 < 2) ) {
                                grid[y][x] = chosenAccent;
                            } else if (skinTexture.includes("fur") && Math.random() < 0.04) {
                                grid[y][x] = chosenAccent;
                            } else if (bodyType.includes("plant-like") && Math.random() < 0.06) {
                                grid[y][x] = chosenAccent;
                            } else if (Math.random() < 0.015) {
                                 grid[y][x] = chosenAccent;
                            }
                        }
                    }
                    if (speciesData.specialCharacteristics.some(sc => sc.characteristic.toLowerCase().includes("bioluminescence"))) {
                        if (Math.random() < 0.0025 && (grid[y][x] === 1 || grid[y][x] === 8 || grid[y][x] === 9 || grid[y][x] === 2 || grid[y][x] === 3 )) {
                            grid[y][x] = (Math.random() < 0.5 ? 2:3);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("[alien_portrait.js V22] Error in addAccents:", error);
    }
}

console.log("alien_portrait.js loaded (V22 - Corrected Antennae Direction).");
