// Computer Vision Chart Analyzer for Growth Chart Percentile Detection
class ChartAnalyzer {
    constructor(canvas, chartImage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.chartImage = chartImage;
        this.imageData = null;
        this.percentileCurves = {
            weight: {},
            height: {}
        };
        this.analysisCanvas = document.createElement('canvas');
        this.analysisCtx = this.analysisCanvas.getContext('2d');
        this.manualCalibration = false; // Flag for manual vs automatic detection
    }
    
    // Set manual calibration data (called from calibration manager)
    setManualCalibration(calibrationData) {
        this.percentileCurves = calibrationData;
        this.manualCalibration = true;
        console.log('📍 Manual calibration data applied to chart analyzer');
    }
    
    // Check if manual calibration is active
    hasManualCalibration() {
        return this.manualCalibration;
    }

    // Initialize analysis by capturing image data - improved text filtering
    async initializeAnalysis() {
        // Create a temporary canvas with the chart image
        this.analysisCanvas.width = this.chartImage.width;
        this.analysisCanvas.height = this.chartImage.height;
        this.analysisCtx.drawImage(this.chartImage, 0, 0);
        this.imageData = this.analysisCtx.getImageData(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        
        console.log('Chart analysis initialized. Image dimensions:', this.analysisCanvas.width, 'x', this.analysisCanvas.height);
        console.log('⚠️  Note: Automatic detection may confuse text with curves. Use manual calibration for accuracy.');
        
        // Only detect curves automatically if no manual calibration exists
        if (!this.hasManualCalibration()) {
            await this.detectPercentileCurves();
        } else {
            console.log('📍 Using manual calibration data instead of automatic detection.');
        }
    }
    
    // Check if manual calibration data exists
    hasManualCalibration() {
        // This will be updated when calibration is complete
        return false;
    }
    
    // Improved text vs curve filtering
    isTextLine(x, startY, endY) {
        // Check if this appears to be a text line
        let darkPixelCount = 0;
        let totalPixels = 0;
        let horizontalGaps = 0;
        let lastWasDark = false;
        
        for (let y = startY; y <= endY; y += 2) {
            totalPixels++;
            const color = this.getPixelColor(x, y);
            if (!color) continue;
            
            const brightness = (color.r + color.g + color.b) / 3;
            const isDark = brightness < 100;
            
            if (isDark) {
                darkPixelCount++;
                if (!lastWasDark) {
                    horizontalGaps++;
                }
                lastWasDark = true;
            } else {
                lastWasDark = false;
            }
        }
        
        const darkRatio = darkPixelCount / totalPixels;
        
        // Text lines typically have:
        // - Multiple gaps (letters)
        // - Lower overall dark pixel ratio
        // - Located in header area
        const isInHeaderArea = startY < 200;
        const hasTextCharacteristics = horizontalGaps > 3 && darkRatio < 0.3;
        
        return isInHeaderArea && hasTextCharacteristics;
    }
    
    // Enhanced curve detection that avoids text areas
    isLikelyCurvePixel(x, y) {
        const color = this.getPixelColor(x, y);
        if (!color) return false;
        
        // Skip obvious text areas
        if (y < 180) return false; // Header area with Name, DOB, HN
        if (y > 3400) return false; // Footer area
        
        // Growth chart curves are typically black/dark gray lines
        const brightness = (color.r + color.g + color.b) / 3;
        
        // More specific detection for black curve lines
        const isBlackish = color.r < 80 && color.g < 80 && color.b < 80;
        const isGrayish = brightness < 120 && Math.abs(color.r - color.g) < 20 && Math.abs(color.g - color.b) < 20;
        
        if (!isBlackish && !isGrayish) return false;
        
        // Check for grid lines (straight horizontal/vertical)
        if (this.isGridLine(x, y)) return false;
        
        // Check for line continuity - curves should have neighboring similar pixels
        let horizontalContinuity = 0;
        let verticalContinuity = 0;
        
        // Check horizontal continuity (important for growth curves)
        for (let dx = -3; dx <= 3; dx++) {
            if (dx === 0) continue;
            const neighborColor = this.getPixelColor(x + dx, y);
            if (neighborColor && this.isSimilarCurveColor(color, neighborColor)) {
                horizontalContinuity++;
            }
        }
        
        // Check vertical continuity for steep parts of curves
        for (let dy = -2; dy <= 2; dy++) {
            if (dy === 0) continue;
            const neighborColor = this.getPixelColor(x, y + dy);
            if (neighborColor && this.isSimilarCurveColor(color, neighborColor)) {
                verticalContinuity++;
            }
        }
        
        // Require some continuity to filter out noise and text
        return horizontalContinuity >= 2 || verticalContinuity >= 1;
    }
    
    // Detect grid lines to filter them out
    isGridLine(x, y) {
        const lineLength = 20;
        let horizontalSimilar = 0;
        let verticalSimilar = 0;
        
        const centerColor = this.getPixelColor(x, y);
        if (!centerColor) return false;
        
        // Check horizontal line
        for (let dx = -lineLength; dx <= lineLength; dx += 2) {
            const color = this.getPixelColor(x + dx, y);
            if (color && this.isSimilarCurveColor(centerColor, color)) {
                horizontalSimilar++;
            }
        }
        
        // Check vertical line
        for (let dy = -lineLength; dy <= lineLength; dy += 2) {
            const color = this.getPixelColor(x, y + dy);
            if (color && this.isSimilarCurveColor(centerColor, color)) {
                verticalSimilar++;
            }
        }
        
        // If too many similar pixels in straight lines, it's probably a grid
        return horizontalSimilar > 15 || verticalSimilar > 15;
    }

    // Get pixel color at specific coordinates
    getPixelColor(x, y) {
        if (x < 0 || x >= this.analysisCanvas.width || y < 0 || y >= this.analysisCanvas.height) {
            return null;
        }
        
        const index = (Math.floor(y) * this.analysisCanvas.width + Math.floor(x)) * 4;
        return {
            r: this.imageData.data[index],
            g: this.imageData.data[index + 1],
            b: this.imageData.data[index + 2],
            a: this.imageData.data[index + 3]
        };
    }

    // Calculate color similarity
    colorSimilarity(color1, color2, threshold = 50) {
        if (!color1 || !color2) return false;
        
        const rDiff = Math.abs(color1.r - color2.r);
        const gDiff = Math.abs(color1.g - color2.g);
        const bDiff = Math.abs(color1.b - color2.b);
        
        return (rDiff + gDiff + bDiff) < threshold;
    }

    // Detect if a pixel is likely part of a curve line - improved for growth charts
    isLikelyCurvePixel(x, y) {
        const color = this.getPixelColor(x, y);
        if (!color) return false;
        
        // Growth chart curves are typically black/dark gray lines
        const brightness = (color.r + color.g + color.b) / 3;
        
        // More specific detection for black curve lines
        const isBlackish = color.r < 80 && color.g < 80 && color.b < 80;
        const isGrayish = brightness < 120 && Math.abs(color.r - color.g) < 20 && Math.abs(color.g - color.b) < 20;
        
        if (!isBlackish && !isGrayish) return false;
        
        // Check for line continuity - curves should have neighboring similar pixels
        let horizontalContinuity = 0;
        let verticalContinuity = 0;
        
        // Check horizontal continuity (important for growth curves)
        for (let dx = -3; dx <= 3; dx++) {
            if (dx === 0) continue;
            const neighborColor = this.getPixelColor(x + dx, y);
            if (neighborColor && this.isSimilarCurveColor(color, neighborColor)) {
                horizontalContinuity++;
            }
        }
        
        // Check vertical continuity for steep parts of curves
        for (let dy = -2; dy <= 2; dy++) {
            if (dy === 0) continue;
            const neighborColor = this.getPixelColor(x, y + dy);
            if (neighborColor && this.isSimilarCurveColor(color, neighborColor)) {
                verticalContinuity++;
            }
        }
        
        // Require some continuity to filter out noise and text
        return horizontalContinuity >= 2 || verticalContinuity >= 1;
    }
    
    // Check if two colors are similar enough to be part of the same curve
    isSimilarCurveColor(color1, color2) {
        const threshold = 40;
        const rDiff = Math.abs(color1.r - color2.r);
        const gDiff = Math.abs(color1.g - color2.g);
        const bDiff = Math.abs(color1.b - color2.b);
        return (rDiff + gDiff + bDiff) < threshold;
    }

    // Trace a curve from a starting point
    traceCurve(startX, startY, direction = 'right') {
        const curvePoints = [];
        let currentX = startX;
        let currentY = startY;
        
        const maxPoints = 300; // Prevent infinite loops
        const stepSize = 3;
        
        for (let i = 0; i < maxPoints; i++) {
            // Look for the next curve point
            let foundNext = false;
            
            // Search in a small area around the current position
            for (let searchRadius = 1; searchRadius <= 5 && !foundNext; searchRadius++) {
                for (let angle = 0; angle < 360; angle += 15) {
                    const rad = (angle * Math.PI) / 180;
                    const testX = currentX + Math.cos(rad) * searchRadius;
                    const testY = currentY + Math.sin(rad) * searchRadius;
                    
                    if (this.isLikelyCurvePixel(testX, testY)) {
                        // Prefer points that continue in the general direction
                        const directionBonus = direction === 'right' ? 
                            (testX > currentX ? 2 : 0) : 
                            (testX < currentX ? 2 : 0);
                        
                        if (Math.random() * 10 + directionBonus > 7) {
                            curvePoints.push({ x: testX, y: testY });
                            currentX = testX;
                            currentY = testY;
                            foundNext = true;
                            break;
                        }
                    }
                }
            }
            
            if (!foundNext) {
                // Try moving in the general direction and look for curves
                currentX += direction === 'right' ? stepSize : -stepSize;
                
                // Look for curves in a vertical range around this X position
                for (let yOffset = -10; yOffset <= 10; yOffset++) {
                    if (this.isLikelyCurvePixel(currentX, currentY + yOffset)) {
                        currentY += yOffset;
                        curvePoints.push({ x: currentX, y: currentY });
                        foundNext = true;
                        break;
                    }
                }
            }
            
            if (!foundNext) break;
        }
        
        return curvePoints;
    }

    // Detect percentile curves in specific regions - improved systematic approach
    async detectPercentileCurves() {
        console.log('Starting improved percentile curve detection...');
        
        // Based on the chart image, define more precise regions
        // Height curves are in the upper portion, weight curves in the lower portion
        const heightRegion = { 
            startX: 400, endX: 2200, 
            startY: 200, endY: 1400,
            type: 'height'
        };
        const weightRegion = { 
            startX: 400, endX: 2200, 
            startY: 1500, endY: 3200,
            type: 'weight'
        };
        
        // Use systematic scanning approach
        this.percentileCurves.height = await this.systematicCurveDetection(heightRegion);
        this.percentileCurves.weight = await this.systematicCurveDetection(weightRegion);
        
        console.log('Detected height curves:', Object.keys(this.percentileCurves.height).length);
        console.log('Detected weight curves:', Object.keys(this.percentileCurves.weight).length);
        
        // Validate and refine detected curves
        this.validateAndRefineCurves();
    }
    
    // Systematic curve detection using grid sampling
    async systematicCurveDetection(region) {
        const curves = {};
        const gridSpacing = 25; // Sample every 25 pixels
        const curvePoints = [];
        
        // Sample the region systematically
        for (let x = region.startX; x <= region.endX; x += gridSpacing) {
            const columnCurves = this.findCurvesInColumn(x, region.startY, region.endY);
            
            // Add x coordinate to each point
            columnCurves.forEach(point => {
                curvePoints.push({ x: x, y: point.y, intensity: point.intensity });
            });
        }
        
        // Cluster points into curves based on Y-trajectory
        const clusteredCurves = this.clusterPointsIntoSmoothCurves(curvePoints);
        
        // Sort curves by average Y position and assign percentile labels
        const sortedCurves = clusteredCurves.sort((a, b) => {
            const avgYA = a.reduce((sum, p) => sum + p.y, 0) / a.length;
            const avgYB = b.reduce((sum, p) => sum + p.y, 0) / b.length;
            return region.type === 'height' ? avgYA - avgYB : avgYA - avgYB;
        });
        
        // Assign percentile labels (P97 is highest for height, lowest for weight)
        const percentileLabels = region.type === 'height' 
            ? ['P97', 'P90', 'P75', 'P50', 'P25', 'P10', 'P3']
            : ['P3', 'P10', 'P25', 'P50', 'P75', 'P90', 'P97'];
        
        sortedCurves.forEach((curve, index) => {
            if (index < percentileLabels.length && curve.length >= 10) {
                curves[percentileLabels[index]] = curve.sort((a, b) => a.x - b.x);
            }
        });
        
        return curves;
    }
    
    // Find curve points in a vertical column
    findCurvesInColumn(x, startY, endY) {
        const points = [];
        let inCurve = false;
        let curveStart = null;
        
        for (let y = startY; y <= endY; y += 2) {
            if (this.isLikelyCurvePixel(x, y)) {
                if (!inCurve) {
                    curveStart = y;
                    inCurve = true;
                } 
            } else {
                if (inCurve && curveStart !== null) {
                    // Found end of a curve segment
                    const curveY = curveStart + (y - curveStart) / 2; // Middle of the curve segment
                    const intensity = this.getCurveIntensity(x, curveY);
                    points.push({ y: curveY, intensity: intensity });
                    inCurve = false;
                    curveStart = null;
                }
            }
        }
        
        // Handle curve that extends to the edge
        if (inCurve && curveStart !== null) {
            const curveY = curveStart + (endY - curveStart) / 2;
            const intensity = this.getCurveIntensity(x, curveY);
            points.push({ y: curveY, intensity: intensity });
        }
        
        return points;
    }
    
    // Get curve intensity (darkness) at a point
    getCurveIntensity(x, y) {
        const color = this.getPixelColor(x, y);
        if (!color) return 0;
        return 255 - ((color.r + color.g + color.b) / 3); // Higher = darker
    }
    
    // Improved clustering for smooth curves
    clusterPointsIntoSmoothCurves(points) {
        if (points.length === 0) return [];
        
        const curves = [];
        const processed = new Set();
        const tolerance = 50; // Y-distance tolerance for same curve
        
        // Sort points by X coordinate for processing
        points.sort((a, b) => a.x - b.x);
        
        for (let i = 0; i < points.length; i++) {
            if (processed.has(i)) continue;
            
            const curve = [points[i]];
            processed.add(i);
            
            // Find points that follow a similar Y-trajectory
            let lastPoint = points[i];
            
            for (let j = i + 1; j < points.length; j++) {
                if (processed.has(j)) continue;
                
                const point = points[j];
                const xDiff = point.x - lastPoint.x;
                const yDiff = Math.abs(point.y - lastPoint.y);
                
                // Points should follow a reasonable trajectory
                if (xDiff <= 100 && yDiff <= tolerance) {
                    // Check if this point continues the curve trend
                    if (curve.length < 2 || this.isPointOnCurveTrend(curve, point)) {
                        curve.push(point);
                        processed.add(j);
                        lastPoint = point;
                    }
                }
            }
            
            // Only keep curves with sufficient points
            if (curve.length >= 8) {
                curves.push(curve);
            }
        }
        
        return curves;
    }
    
    // Check if a point follows the trend of existing curve points
    isPointOnCurveTrend(curve, newPoint) {
        if (curve.length < 2) return true;
        
        const len = curve.length;
        const p1 = curve[len - 2];
        const p2 = curve[len - 1];
        
        // Calculate expected Y based on trend
        const xProgress = (newPoint.x - p2.x) / (p2.x - p1.x);
        const expectedY = p2.y + (p2.y - p1.y) * xProgress;
        
        // Allow some deviation from expected trajectory
        const deviation = Math.abs(newPoint.y - expectedY);
        return deviation <= 30; // Adjust tolerance as needed
    }
    
    // Validate and refine detected curves
    validateAndRefineCurves() {
        // Remove curves that are too short or have gaps
        ['height', 'weight'].forEach(type => {
            const curves = this.percentileCurves[type];
            Object.keys(curves).forEach(percentile => {
                const curve = curves[percentile];
                if (curve.length < 10 || this.hasLargeGaps(curve)) {
                    console.log(`Removing invalid ${type} curve: ${percentile}`);
                    delete curves[percentile];
                } else {
                    // Smooth the curve
                    curves[percentile] = this.smoothCurve(curve);
                }
            });
        });
    }
    
    // Check if curve has large gaps
    hasLargeGaps(curve) {
        for (let i = 1; i < curve.length; i++) {
            const gap = curve[i].x - curve[i-1].x;
            if (gap > 150) return true; // Gap too large
        }
        return false;
    }
    
    // Smooth curve using simple averaging
    smoothCurve(curve) {
        if (curve.length <= 2) return curve;
        
        const smoothed = [curve[0]]; // Keep first point
        
        for (let i = 1; i < curve.length - 1; i++) {
            const avgY = (curve[i-1].y + curve[i].y + curve[i+1].y) / 3;
            smoothed.push({ x: curve[i].x, y: avgY });
        }
        
        smoothed.push(curve[curve.length - 1]); // Keep last point
        return smoothed;
    }

    // Find curves in a specific region
    findCurvesInRegion(region, sampleXPositions) {
        const curves = {};
        const potentialCurvePoints = [];
        
        // Sample the region to find potential curve points
        for (let x of sampleXPositions) {
            const columnPoints = [];
            
            for (let y = region.startY; y <= region.endY; y += 5) {
                if (this.isLikelyCurvePixel(x, y)) {
                    columnPoints.push({ x, y });
                }
            }
            
            // Group nearby points in the same column
            const groupedPoints = this.groupNearbyPoints(columnPoints, 20);
            potentialCurvePoints.push(...groupedPoints);
        }
        
        // Cluster points into potential curves
        const curveGroups = this.clusterPointsIntoCurves(potentialCurvePoints);
        
        // Assign percentile labels to curves (approximate)
        const sortedCurves = curveGroups.sort((a, b) => {
            const avgYA = a.reduce((sum, p) => sum + p.y, 0) / a.length;
            const avgYB = b.reduce((sum, p) => sum + p.y, 0) / b.length;
            return avgYA - avgYB; // Sort by average Y position
        });
        
        const percentileLabels = ['P3', 'P10', 'P25', 'P50', 'P75', 'P90', 'P97'];
        
        sortedCurves.forEach((curve, index) => {
            if (index < percentileLabels.length) {
                curves[percentileLabels[index]] = curve;
            }
        });
        
        return curves;
    }

    // Group nearby points together
    groupNearbyPoints(points, maxDistance) {
        const grouped = [];
        const processed = new Set();
        
        for (let i = 0; i < points.length; i++) {
            if (processed.has(i)) continue;
            
            const group = [points[i]];
            processed.add(i);
            
            for (let j = i + 1; j < points.length; j++) {
                if (processed.has(j)) continue;
                
                const distance = Math.sqrt(
                    Math.pow(points[i].x - points[j].x, 2) + 
                    Math.pow(points[i].y - points[j].y, 2)
                );
                
                if (distance <= maxDistance) {
                    group.push(points[j]);
                    processed.add(j);
                }
            }
            
            if (group.length > 1) {
                // Return the average point for the group
                const avgX = group.reduce((sum, p) => sum + p.x, 0) / group.length;
                const avgY = group.reduce((sum, p) => sum + p.y, 0) / group.length;
                grouped.push({ x: avgX, y: avgY });
            }
        }
        
        return grouped;
    }

    // Cluster points into curve lines
    clusterPointsIntoCurves(points) {
        const curves = [];
        const processed = new Set();
        
        for (let i = 0; i < points.length; i++) {
            if (processed.has(i)) continue;
            
            const curve = [points[i]];
            processed.add(i);
            
            // Find points that could belong to the same curve
            for (let j = 0; j < points.length; j++) {
                if (processed.has(j)) continue;
                
                // Check if point j could belong to the same curve as point i
                const yDiff = Math.abs(points[i].y - points[j].y);
                const xDiff = Math.abs(points[i].x - points[j].x);
                
                // Points on the same curve should have similar Y values for nearby X values
                if (xDiff < 200 && yDiff < 50) {
                    curve.push(points[j]);
                    processed.add(j);
                }
            }
            
            // Only keep curves with enough points
            if (curve.length >= 5) {
                // Sort points by X coordinate
                curve.sort((a, b) => a.x - b.x);
                curves.push(curve);
            }
        }
        
        return curves;
    }

    // Determine percentile for a given point - improved accuracy
    determinePercentile(x, y, type = 'weight') {
        const curves = this.percentileCurves[type];
        const curveNames = Object.keys(curves);
        
        if (curveNames.length === 0) {
            return 'Unable to determine - no curves detected';
        }
        
        // Find curve Y-values at this X coordinate using improved interpolation
        const curveYValues = {};
        
        for (let curveName of curveNames) {
            const curve = curves[curveName];
            const interpolatedY = this.getInterpolatedYAtX(curve, x);
            if (interpolatedY !== null) {
                curveYValues[curveName] = interpolatedY;
            }
        }
        
        if (Object.keys(curveYValues).length === 0) {
            return 'Unable to determine - no curve data at this age';
        }
        
        // Sort curves by Y value at this X position
        const sortedCurves = Object.entries(curveYValues)
            .sort(([, yA], [, yB]) => yA - yB)
            .map(([name]) => name);
        
        // Find where our point falls with improved precision
        const onCurveThreshold = 8; // Pixels tolerance for "on curve"
        const nearCurveThreshold = 15; // Pixels tolerance for "near curve"
        
        for (let i = 0; i < sortedCurves.length; i++) {
            const curveName = sortedCurves[i];
            const curveY = curveYValues[curveName];
            
            // Check if point is very close to this curve
            const distanceFromCurve = Math.abs(y - curveY);
            
            if (distanceFromCurve <= onCurveThreshold) {
                return `On ${curveName} curve (${this.getPercentileDescription(curveName)})`;
            }
            
            // Check if point is near this curve
            if (distanceFromCurve <= nearCurveThreshold) {
                return `Near ${curveName} curve (${this.getPercentileDescription(curveName)})`;
            }
            
            // Check if point is between this curve and the next
            if (i < sortedCurves.length - 1) {
                const nextCurveName = sortedCurves[i + 1];
                const nextCurveY = curveYValues[nextCurveName];
                
                if ((y > curveY && y < nextCurveY) || (y < curveY && y > nextCurveY)) {
                    const percent1 = this.getPercentileNumber(curveName);
                    const percent2 = this.getPercentileNumber(nextCurveName);
                    
                    // Calculate approximate percentile within the range
                    const totalRange = Math.abs(nextCurveY - curveY);
                    const pointPosition = Math.abs(y - curveY);
                    const ratio = pointPosition / totalRange;
                    
                    const estimatedPercentile = percent1 + ratio * (percent2 - percent1);
                    
                    return `Between ${curveName} and ${nextCurveName} (~${Math.round(estimatedPercentile)}th percentile)`;
                }
            }
        }
        
        // Handle edge cases with better descriptions
        if (sortedCurves.length > 0) {
            const firstCurve = sortedCurves[0];
            const lastCurve = sortedCurves[sortedCurves.length - 1];
            
            if (y < curveYValues[firstCurve]) {
                const firstPercent = this.getPercentileNumber(firstCurve);
                return type === 'height' 
                    ? `Above ${firstCurve} (>${firstPercent}th percentile - very tall)`
                    : `Below ${firstCurve} (>${firstPercent}th percentile - very light)`;
            } else if (y > curveYValues[lastCurve]) {
                const lastPercent = this.getPercentileNumber(lastCurve);
                return type === 'height'
                    ? `Below ${lastCurve} (<${lastPercent}th percentile - very short)`
                    : `Above ${lastCurve} (<${lastPercent}th percentile - very heavy)`;
            }
        }
        
        return 'Unable to determine percentile';
    }
    
    // Get improved interpolated Y value at specific X coordinate
    getInterpolatedYAtX(curve, targetX) {
        if (!curve || curve.length === 0) return null;
        
        // Find the two points that bracket our target X
        let leftPoint = null;
        let rightPoint = null;
        
        for (let i = 0; i < curve.length; i++) {
            const point = curve[i];
            
            if (point.x <= targetX) {
                leftPoint = point;
            }
            if (point.x >= targetX && rightPoint === null) {
                rightPoint = point;
                break;
            }
        }
        
        // If we have both points, interpolate
        if (leftPoint && rightPoint && leftPoint.x !== rightPoint.x) {
            const ratio = (targetX - leftPoint.x) / (rightPoint.x - leftPoint.x);
            return leftPoint.y + ratio * (rightPoint.y - leftPoint.y);
        }
        
        // If target X is exactly on a point
        if (leftPoint && leftPoint.x === targetX) {
            return leftPoint.y;
        }
        if (rightPoint && rightPoint.x === targetX) {
            return rightPoint.y;
        }
        
        // If we only have one side, extrapolate carefully
        if (leftPoint && !rightPoint) {
            // Use the nearest point if we're close enough
            if (Math.abs(targetX - leftPoint.x) <= 50) {
                return leftPoint.y;
            }
        }
        if (rightPoint && !leftPoint) {
            if (Math.abs(targetX - rightPoint.x) <= 50) {
                return rightPoint.y;
            }
        }
        
        return null;
    }
    
    // Get percentile number from label
    getPercentileNumber(percentileLabel) {
        const match = percentileLabel.match(/P(\d+)/);
        return match ? parseInt(match[1]) : 50;
    }
    
    // Get descriptive text for percentile
    getPercentileDescription(percentileLabel) {
        const descriptions = {
            'P3': '3rd percentile',
            'P10': '10th percentile', 
            'P25': '25th percentile',
            'P50': '50th percentile (median)',
            'P75': '75th percentile',
            'P90': '90th percentile',
            'P97': '97th percentile'
        };
        return descriptions[percentileLabel] || percentileLabel;
    }

    // Find the closest point on a curve at a given X coordinate
    findClosestPointAtX(curve, targetX) {
        if (!curve || curve.length === 0) return null;
        
        let closestPoint = null;
        let closestDistance = Infinity;
        
        for (let point of curve) {
            const distance = Math.abs(point.x - targetX);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
            }
        }
        
        // If no point is very close, interpolate between nearby points
        if (closestDistance > 50) {
            const leftPoints = curve.filter(p => p.x <= targetX);
            const rightPoints = curve.filter(p => p.x >= targetX);
            
            if (leftPoints.length > 0 && rightPoints.length > 0) {
                const leftPoint = leftPoints[leftPoints.length - 1];
                const rightPoint = rightPoints[0];
                
                // Linear interpolation
                const ratio = (targetX - leftPoint.x) / (rightPoint.x - leftPoint.x);
                const interpolatedY = leftPoint.y + ratio * (rightPoint.y - leftPoint.y);
                
                return { x: targetX, y: interpolatedY };
            }
        }
        
        return closestPoint;
    }

    // Visualize detected curves on the canvas - improved with debugging
    visualizeCurves(canvas, ctx) {
        const colors = {
            'P3': '#ff0000',
            'P10': '#ff4400', 
            'P25': '#ff8800',
            'P50': '#00aa00',
            'P75': '#0088ff',
            'P90': '#0044ff',
            'P97': '#8800ff'
        };
        
        // Draw height curves
        this.drawCurves(ctx, this.percentileCurves.height, colors, 'Height');
        
        // Draw weight curves  
        this.drawCurves(ctx, this.percentileCurves.weight, colors, 'Weight');
        
        // Add legend
        this.drawCurveLegend(ctx, colors);
    }

    // Draw curves on the canvas with improved styling
    drawCurves(ctx, curves, colors, label) {
        for (let [curveName, curve] of Object.entries(curves)) {
            if (curve.length < 2) continue;
            
            ctx.strokeStyle = colors[curveName] || '#999999';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(curve[0].x, curve[0].y);
            
            // Use smooth curves
            for (let i = 1; i < curve.length; i++) {
                if (i === curve.length - 1) {
                    ctx.lineTo(curve[i].x, curve[i].y);
                } else {
                    const midX = (curve[i].x + curve[i + 1].x) / 2;
                    const midY = (curve[i].y + curve[i + 1].y) / 2;
                    ctx.quadraticCurveTo(curve[i].x, curve[i].y, midX, midY);
                }
            }
            
            ctx.stroke();
            
            // Add label at multiple points for better visibility
            if (curve.length > 0) {
                const midPoint = curve[Math.floor(curve.length / 2)];
                const endPoint = curve[curve.length - 1];
                
                ctx.fillStyle = colors[curveName] || '#999999';
                ctx.font = 'bold 14px Arial';
                ctx.globalAlpha = 1;
                
                // Label at middle
                ctx.fillText(curveName, midPoint.x + 5, midPoint.y - 5);
                
                // Label at end
                ctx.fillText(curveName, endPoint.x + 5, endPoint.y);
            }
        }
        
        ctx.globalAlpha = 1;
    }
    
    // Draw legend for detected curves
    drawCurveLegend(ctx, colors) {
        const legendX = 50;
        const legendY = 50;
        const lineHeight = 20;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(legendX - 10, legendY - 10, 180, 180);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(legendX - 10, legendY - 10, 180, 180);
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Detected Curves:', legendX, legendY + 10);
        
        let yOffset = 30;
        Object.entries(colors).forEach(([percentile, color]) => {
            ctx.fillStyle = color;
            ctx.fillRect(legendX, legendY + yOffset, 15, 3);
            
            ctx.fillStyle = '#333';
            ctx.font = '11px Arial';
            ctx.fillText(`${percentile} (${this.getPercentileDescription(percentile)})`, 
                        legendX + 20, legendY + yOffset + 8);
            yOffset += lineHeight;
        });
    }
    
    // Debug function to show detection process
    debugCurveDetection(x, y) {
        console.log(`\n🔍 Debug: Checking pixel at (${x}, ${y})`);
        
        const color = this.getPixelColor(x, y);
        if (!color) {
            console.log('❌ No color data');
            return;
        }
        
        console.log(`🎨 Color: R:${color.r} G:${color.g} B:${color.b}`);
        
        const brightness = (color.r + color.g + color.b) / 3;
        console.log(`💡 Brightness: ${brightness.toFixed(1)}`);
        
        const isLikely = this.isLikelyCurvePixel(x, y);
        console.log(`📈 Is likely curve pixel: ${isLikely}`);
        
        if (isLikely) {
            console.log('✅ This pixel would be detected as part of a curve');
        }
    }
    
    // Add a manually calibrated curve to the analyzer
    addCalibratedCurve(percentile, type, curvePoints) {
        if (!this.percentileCurves[type]) {
            this.percentileCurves[type] = {};
        }
        
        this.percentileCurves[type][percentile] = curvePoints;
        this.manualCalibration = true;
        
        console.log(`📍 Added calibrated curve: ${type} ${percentile} with ${curvePoints.length} points`);
    }
}

// Export for use in main script
window.ChartAnalyzer = ChartAnalyzer;