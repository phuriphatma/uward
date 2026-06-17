// Simple Iterative Curve Calibration Manager

class CurveCalibrationManager {
    constructor(chartPlotter) {
        this.chartPlotter = chartPlotter;
        this.calibrationMode = false;
        this.calibrationPoints = {};
        this.fittedCurves = {}; // Store the complete fitted curve data for each percentile
        this.currentCalibrationStep = 0;
        this.currentCurve = null;

        // Define the calibration sequence (order matters!)
        this.calibrationSequence = [
            // Height curves (top to bottom in chart)
            { id: 'height-P97', type: 'height', percentile: 'P97', description: 'Height P97 (tallest curve)' },
            { id: 'height-P90', type: 'height', percentile: 'P90', description: 'Height P90' },
            { id: 'height-P75', type: 'height', percentile: 'P75', description: 'Height P75' },
            { id: 'height-P50', type: 'height', percentile: 'P50', description: 'Height P50 (median)' },
            { id: 'height-P25', type: 'height', percentile: 'P25', description: 'Height P25' },
            { id: 'height-P10', type: 'height', percentile: 'P10', description: 'Height P10' },
            { id: 'height-P3', type: 'height', percentile: 'P3', description: 'Height P3 (shortest curve)' },
            
            // Weight curves (bottom to top in chart)
            { id: 'weight-P3', type: 'weight', percentile: 'P3', description: 'Weight P3 (lightest curve)' },
            { id: 'weight-P10', type: 'weight', percentile: 'P10', description: 'Weight P10' },
            { id: 'weight-P25', type: 'weight', percentile: 'P25', description: 'Weight P25' },
            { id: 'weight-P50', type: 'weight', percentile: 'P50', description: 'Weight P50 (median)' },
            { id: 'weight-P75', type: 'weight', percentile: 'P75', description: 'Weight P75' },
            { id: 'weight-P90', type: 'weight', percentile: 'P90', description: 'Weight P90' },
            { id: 'weight-P97', type: 'weight', percentile: 'P97', description: 'Weight P97 (heaviest curve)' }
        ];

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Automatically load magnetic curves when the page loads
        setTimeout(() => {
            this.loadCurvesForSex('Girl'); // Default to Girl curves to showcase new feature
        }, 1000); // Small delay to ensure page is fully loaded
    }
    
    loadCurvesForSex(sex) {
        // Load curves for specific sex
        const config = CHART_CONFIGS[sex];
        if (config && config.curvesDataSrc) {
            this.loadMagneticCurves(config.curvesDataSrc, sex);
        } else {
            console.error(`No curve data configuration found for ${sex}`);
        }
    }

    startCalibration() {
        this.calibrationMode = true;
        this.currentCalibrationStep = 0;
        this.calibrationPoints = {};

        // Start with first curve
        this.currentCurve = this.calibrationSequence[0];

        console.log('🎯 Starting simple iterative calibration');
        console.log('Current curve:', this.currentCurve);

        // Update UI
        document.getElementById('calibrationPanel').style.display = 'block';
        document.getElementById('currentCurveInfo').style.display = 'block';
        document.getElementById('currentCurveName').textContent = this.currentCurve.description;
        document.getElementById('calibrateMode').textContent = 'Exit Calibration';
        document.getElementById('calibrateMode').style.backgroundColor = '#dc3545';
        document.getElementById('nextCurve').style.display = 'none';

        document.getElementById('analysisStatus').innerHTML = 
            `🎯 Click anywhere on the <strong>${this.currentCurve.description}</strong> to trace it.`;

        // Enable canvas click handling
        console.log('Adding click event listener to canvas...');
        this.enableCanvasClickHandler();
    }

    enableCanvasClickHandler() {
        if (this.canvasClickHandler) {
            this.chartPlotter.canvas.removeEventListener('click', this.canvasClickHandler);
        }

        this.canvasClickHandler = (event) => {
            if (!this.calibrationMode || !this.currentCurve) return;

            const rect = this.chartPlotter.canvas.getBoundingClientRect();
            const scaleX = this.chartPlotter.canvas.width / rect.width;
            const scaleY = this.chartPlotter.canvas.height / rect.height;

            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;

            console.log(`🎯 Canvas clicked at (${x.toFixed(1)}, ${y.toFixed(1)})`);

            // Calibrate current curve
            this.calibrateCurve(this.currentCurve, x, y);
        };

        this.chartPlotter.canvas.addEventListener('click', this.canvasClickHandler);
    }

    calibrateCurve(step, x, y) {
        const curveId = step.id;
        
        if (!this.calibrationPoints[curveId]) {
            this.calibrationPoints[curveId] = [];
        }

        // Immediately fit the clicked point to the nearest black line
        const fittedPoint = this.fitPointToBlackLine(x, y);
        
        this.calibrationPoints[curveId].push(fittedPoint);

        console.log(`📍 Original click: (${x.toFixed(1)}, ${y.toFixed(1)})`);
        console.log(`📍 Fitted to black line: (${fittedPoint.x.toFixed(1)}, ${fittedPoint.y.toFixed(1)})`);
        console.log(`Points for ${curveId}:`, this.calibrationPoints[curveId].length);

        // Visual feedback - show both original click and fitted point
        this.drawCalibrationPoint(x, y, fittedPoint);

        // If we have multiple points, generate and display the fitted curve
        if (this.calibrationPoints[curveId].length >= 2) {
            this.generateAndDisplayCurve(step, this.calibrationPoints[curveId]);
        }

        // Show next curve button after first point
        if (this.calibrationPoints[curveId].length >= 1) {
            document.getElementById('nextCurve').style.display = 'inline-block';
            const pointCount = this.calibrationPoints[curveId].length;
            document.getElementById('analysisStatus').innerHTML = 
                `✅ <strong>${pointCount} point${pointCount > 1 ? 's' : ''}</strong> fitted to <strong>${step.description}</strong>! Click more points or "Next Curve".`;
        }

        // No auto-advance - user decides when to move to next curve
    }

    fitPointToBlackLine(x, y, searchRadius = 20) {
        const imageData = this.chartPlotter.ctx.getImageData(0, 0, 
            this.chartPlotter.canvas.width, this.chartPlotter.canvas.height);
        
        // Get current curve info to determine line thickness
        const step = this.calibrationSequence[this.currentCalibrationStep];
        const percentile = step.percentile;
        
        // Define which percentiles have thick vs thin lines
        const thickLinePercentiles = ['P97', 'P50', 'P3'];
        const isThickLine = thickLinePercentiles.includes(percentile);
        
        // Adjust search parameters based on line thickness
        const brightnessThreshold = isThickLine ? 60 : 40; // Higher threshold for thick lines
        const minLineWidth = isThickLine ? 2 : 1; // Minimum width to consider as line
        
        console.log(`🔍 Searching for ${isThickLine ? 'THICK' : 'thin'} line (${percentile}) with brightness < ${brightnessThreshold}`);
        
        let bestPoint = { x, y };
        let minDistance = Infinity;
        let bestScore = -1; // Score based on line quality
        
        // Search in a radius around the clicked point
        for (let dx = -searchRadius; dx <= searchRadius; dx += 1) {
            for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
                const testX = Math.round(x + dx);
                const testY = Math.round(y + dy);
                
                // Check bounds
                if (testX < 0 || testX >= this.chartPlotter.canvas.width || 
                    testY < 0 || testY >= this.chartPlotter.canvas.height) continue;
                
                // Check if this point is part of a line with appropriate thickness
                const lineScore = this.calculateLineScore(imageData, testX, testY, brightnessThreshold, minLineWidth);
                
                if (lineScore > 0) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const combinedScore = lineScore / (1 + distance * 0.1); // Prefer closer points slightly
                    
                    if (combinedScore > bestScore) {
                        bestScore = combinedScore;
                        minDistance = distance;
                        bestPoint = { x: testX, y: testY };
                    }
                }
            }
        }
        
        console.log(`🎯 Fitted point from (${x.toFixed(1)}, ${y.toFixed(1)}) to (${bestPoint.x.toFixed(1)}, ${bestPoint.y.toFixed(1)}), distance: ${minDistance.toFixed(1)}, score: ${bestScore.toFixed(2)}`);
        return bestPoint;
    }

    calculateLineScore(imageData, x, y, brightnessThreshold, minLineWidth) {
        // Check if the point itself is dark enough
        const pixelIndex = (y * this.chartPlotter.canvas.width + x) * 4;
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness >= brightnessThreshold) {
            return 0; // Not dark enough
        }
        
        // Check line thickness in both horizontal and vertical directions
        let horizontalWidth = this.measureLineWidth(imageData, x, y, 1, 0, brightnessThreshold); // Horizontal
        let verticalWidth = this.measureLineWidth(imageData, x, y, 0, 1, brightnessThreshold);   // Vertical
        
        // Also check diagonal directions for better line detection
        let diagonal1Width = this.measureLineWidth(imageData, x, y, 1, 1, brightnessThreshold);   // Diagonal /
        let diagonal2Width = this.measureLineWidth(imageData, x, y, 1, -1, brightnessThreshold);  // Diagonal \
        
        // Take the maximum width found in any direction
        const maxWidth = Math.max(horizontalWidth, verticalWidth, diagonal1Width, diagonal2Width);
        
        // Score based on how well the width matches expectations
        if (maxWidth < minLineWidth) {
            return 0; // Too thin
        }
        
        // Higher score for lines that match expected thickness better
        const widthScore = Math.min(maxWidth / (minLineWidth * 2), 3); // Cap at 3x expected width
        const darknessScore = (brightnessThreshold - brightness) / brightnessThreshold; // Darker = better
        
        return widthScore * darknessScore;
    }

    measureLineWidth(imageData, centerX, centerY, deltaX, deltaY, brightnessThreshold) {
        let width = 1; // Count the center pixel
        
        // Measure in positive direction
        for (let i = 1; i <= 5; i++) {
            const testX = centerX + deltaX * i;
            const testY = centerY + deltaY * i;
            
            if (testX < 0 || testX >= this.chartPlotter.canvas.width || 
                testY < 0 || testY >= this.chartPlotter.canvas.height) break;
            
            const pixelIndex = (testY * this.chartPlotter.canvas.width + testX) * 4;
            const r = imageData.data[pixelIndex];
            const g = imageData.data[pixelIndex + 1];
            const b = imageData.data[pixelIndex + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness < brightnessThreshold) {
                width++;
            } else {
                break;
            }
        }
        
        // Measure in negative direction
        for (let i = 1; i <= 5; i++) {
            const testX = centerX - deltaX * i;
            const testY = centerY - deltaY * i;
            
            if (testX < 0 || testX >= this.chartPlotter.canvas.width || 
                testY < 0 || testY >= this.chartPlotter.canvas.height) break;
            
            const pixelIndex = (testY * this.chartPlotter.canvas.width + testX) * 4;
            const r = imageData.data[pixelIndex];
            const g = imageData.data[pixelIndex + 1];
            const b = imageData.data[pixelIndex + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness < brightnessThreshold) {
                width++;
            } else {
                break;
            }
        }
        
        return width;
    }

    generateAndDisplayCurve(step, points) {
        if (points.length < 2) return;
        
        // Sort points by x-coordinate
        const sortedPoints = points.sort((a, b) => a.x - b.x);
        
        // Generate smooth curve using spline interpolation
        const curvePoints = this.generateSmoothCurve(sortedPoints);
        
        // Save the fitted curve data for later percentile calculations
        this.fittedCurves[step.id] = {
            percentile: step.percentile,
            type: step.type,
            curvePoints: curvePoints,
            calibrationPoints: [...sortedPoints], // Keep original calibration points too
            description: step.description
        };
        
        console.log(`💾 Saved fitted curve data for ${step.id} with ${curvePoints.length} points`);
        
        // Draw the fitted curve
        this.drawFittedCurve(curvePoints, step);
    }

    generateSmoothCurve(points) {
        if (points.length < 3) return points;
        
        const curvePoints = [];
        const step = 2; // Pixel steps for smooth curve
        
        for (let x = points[0].x; x <= points[points.length - 1].x; x += step) {
            const y = this.interpolateY(x, points);
            curvePoints.push({ x, y });
        }
        
        return curvePoints;
    }
    
    interpolateY(x, points) {
        // Simple linear interpolation between closest points
        for (let i = 0; i < points.length - 1; i++) {
            if (x >= points[i].x && x <= points[i + 1].x) {
                const ratio = (x - points[i].x) / (points[i + 1].x - points[i].x);
                return points[i].y + ratio * (points[i + 1].y - points[i].y);
            }
        }
        // Extrapolate if outside range
        if (x < points[0].x) return points[0].y;
        return points[points.length - 1].y;
    }

    drawFittedCurve(curvePoints, step) {
        const ctx = this.chartPlotter.ctx;
        
        // Choose color based on curve type
        const isHeight = step.type === 'height';
        ctx.strokeStyle = isHeight ? '#00ff00' : '#0066ff'; // Green for height, blue for weight
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        ctx.beginPath();
        curvePoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    }

    drawCalibrationPoint(originalX, originalY, fittedPoint = null) {
        const ctx = this.chartPlotter.ctx;
        
        // Draw original click point in red (semi-transparent)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(originalX, originalY, 4, 0, 2 * Math.PI);
        ctx.fill();

        // If we have a fitted point, show it prominently
        if (fittedPoint) {
            // Draw fitted point in bright green
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(fittedPoint.x, fittedPoint.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw line connecting original to fitted point
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(originalX, originalY);
            ctx.lineTo(fittedPoint.x, fittedPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    nextCurve() {
        this.currentCalibrationStep++;

        if (this.currentCalibrationStep >= this.calibrationSequence.length) {
            // All curves calibrated
            this.finishCalibration();
            return;
        }

        this.currentCurve = this.calibrationSequence[this.currentCalibrationStep];
        
        console.log('Moving to next curve:', this.currentCurve);

        // Update UI
        document.getElementById('currentCurveName').textContent = this.currentCurve.description;
        document.getElementById('nextCurve').style.display = 'none';
        document.getElementById('analysisStatus').innerHTML = 
            `🎯 Click anywhere on the <strong>${this.currentCurve.description}</strong> to trace it.`;

        // Redraw chart with all previous calibrated curves
        this.chartPlotter.drawChart();
        this.redrawWithCalibratedCurves();
    }

    finishCalibration() {
        console.log('🎉 Calibration complete!');
        console.log('Final calibration points:', this.calibrationPoints);

        // Process and add all calibrated curves to the analyzer
        for (const [curveId, points] of Object.entries(this.calibrationPoints)) {
            if (points.length > 0) {
                const curve = this.calibrationSequence.find(c => c.id === curveId);
                if (curve) {
                    this.processCalibratedCurve(curve, points);
                }
            }
        }

        this.exitCalibration();
    }

    processCalibratedCurve(curve, rawPoints) {
        if (rawPoints.length < 2) return;

        // Sort points by x-coordinate (age)
        const sortedPoints = rawPoints.sort((a, b) => a.x - b.x);

        // Check if auto-fitting is enabled
        const autoFitEnabled = document.getElementById('autoFitCurves').checked;
        
        let processedPoints = sortedPoints;
        if (autoFitEnabled) {
            // Apply curve fitting to align with black lines
            processedPoints = this.fitCurveToBlackLines(sortedPoints);
            console.log(`🎯 Auto-fitting applied to ${curve.description}`);
        }

        // Create smooth curve from processed points
        const smoothedPoints = this.smoothCurvePoints(processedPoints);

        // Add to chart analyzer
        if (this.chartPlotter.chartAnalyzer) {
            this.chartPlotter.chartAnalyzer.addCalibratedCurve(
                curve.percentile, 
                curve.type, 
                smoothedPoints
            );
        }

        const fitStatus = autoFitEnabled ? "fitted and " : "";
        console.log(`✅ Processed ${fitStatus}calibrated curve: ${curve.description} with ${smoothedPoints.length} points`);
    }

    smoothCurvePoints(points) {
        if (points.length < 3) return points;

        const smoothed = [];
        const windowSize = Math.min(3, points.length);

        for (let i = 0; i < points.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(points.length, start + windowSize);
            
            let sumX = 0, sumY = 0, count = 0;
            for (let j = start; j < end; j++) {
                sumX += points[j].x;
                sumY += points[j].y;
                count++;
            }

            smoothed.push({
                x: sumX / count,
                y: sumY / count
            });
        }

        return smoothed;
    }

    // Curve fitting algorithm to align points with black lines in the chart
    fitCurveToBlackLines(points) {
        if (!points || points.length < 2) return points;

        const canvas = this.chartPlotter.canvas;
        const ctx = this.chartPlotter.ctx;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const fittedPoints = points.map(point => {
            return this.findNearestBlackLine(point.x, point.y, data, canvas.width, canvas.height);
        });

        console.log(`🎯 Curve fitting applied: adjusted ${fittedPoints.length} points`);
        return fittedPoints;
    }

    // Find the nearest black line pixel to a given point
    findNearestBlackLine(x, y, imageData, width, height) {
        const searchRadius = 15; // pixels to search around the point
        let bestPoint = { x, y };
        let bestScore = 0;

        // Search in a circular area around the point
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const testX = Math.round(x + dx);
                const testY = Math.round(y + dy);

                // Check if point is within canvas bounds
                if (testX < 0 || testX >= width || testY < 0 || testY >= height) continue;

                // Check if this point is part of a black line
                const lineScore = this.getBlackLineScore(testX, testY, imageData, width, height);
                
                if (lineScore > bestScore) {
                    bestScore = lineScore;
                    bestPoint = { x: testX, y: testY };
                }
            }
        }

        return bestPoint;
    }

    // Calculate how likely a pixel is to be part of a black curve line
    getBlackLineScore(x, y, imageData, width, height) {
        const index = (y * width + x) * 4;
        const r = imageData[index];
        const g = imageData[index + 1];
        const b = imageData[index + 2];

        // Check if pixel is dark (black or dark gray)
        const brightness = (r + g + b) / 3;
        if (brightness > 100) return 0; // Too bright to be a curve line

        // Check for line continuity - look for neighboring dark pixels
        let continuityScore = 0;
        const checkRadius = 2;

        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                if (dx === 0 && dy === 0) continue;

                const checkX = x + dx;
                const checkY = y + dy;

                if (checkX < 0 || checkX >= width || checkY < 0 || checkY >= height) continue;

                const checkIndex = (checkY * width + checkX) * 4;
                const checkR = imageData[checkIndex];
                const checkG = imageData[checkIndex + 1];
                const checkB = imageData[checkIndex + 2];
                const checkBrightness = (checkR + checkG + checkB) / 3;

                if (checkBrightness < 100) {
                    continuityScore += 1;
                }
            }
        }

        // Score based on darkness and line continuity
        const darknessScore = Math.max(0, 100 - brightness);
        return darknessScore + (continuityScore * 10);
    }

    exitCalibration() {
        this.calibrationMode = false;
        this.currentCurve = null;

        // Update UI
        document.getElementById('calibrationPanel').style.display = 'none';
        document.getElementById('calibrateMode').textContent = 'Calibrate Curves';
        document.getElementById('calibrateMode').style.backgroundColor = '#28a745';

        document.getElementById('analysisStatus').innerHTML = 
            '🎯 Calibration mode exited. Click "Calibrate Curves" to start.';

        // Remove canvas click handler
        if (this.canvasClickHandler) {
            this.chartPlotter.canvas.removeEventListener('click', this.canvasClickHandler);
            this.canvasClickHandler = null;
        }

        // Redraw chart clean
        this.chartPlotter.drawChart();
    }

    redrawWithCalibratedCurves() {
        // Draw all calibrated curves so far
        const ctx = this.chartPlotter.ctx;
        
        for (const [curveId, points] of Object.entries(this.calibrationPoints)) {
            if (points.length > 1) {
                const curve = this.calibrationSequence.find(c => c.id === curveId);
                if (curve) {
                    ctx.strokeStyle = curve.type === 'height' ? '#0066cc' : '#cc6600';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.7;

                    ctx.beginPath();
                    const sortedPoints = points.sort((a, b) => a.x - b.x);
                    ctx.moveTo(sortedPoints[0].x, sortedPoints[0].y);
                    
                    for (let i = 1; i < sortedPoints.length; i++) {
                        ctx.lineTo(sortedPoints[i].x, sortedPoints[i].y);
                    }
                    
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // Draw individual calibration points
        ctx.fillStyle = 'red';
        for (const points of Object.values(this.calibrationPoints)) {
            for (const point of points) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    // Function to calculate what percentile a plotted point represents
    calculatePercentileAtPoint(age, value, measurementType) {
        if (!this.fittedCurves || Object.keys(this.fittedCurves).length === 0) {
            console.warn("No calibrated curves available for percentile calculation");
            return null;
        }

        // Filter curves by measurement type (height or weight)
        const relevantCurves = Object.values(this.fittedCurves)
            .filter(curve => curve.type === measurementType);

        if (relevantCurves.length === 0) {
            console.warn(`No calibrated curves found for ${measurementType}`);
            return null;
        }

        // Convert age to x-coordinate (this depends on your chart's age scale)
        const x = this.chartPlotter.ageToX ? this.chartPlotter.ageToX(age) : age;
        
        // Get the values at this age for each percentile curve
        const percentileValues = [];
        
        for (const curve of relevantCurves) {
            const valueAtAge = this.getValueAtX(x, curve.curvePoints);
            if (valueAtAge !== null) {
                percentileValues.push({
                    percentile: parseInt(curve.percentile.substring(1)), // Remove 'P' prefix
                    value: valueAtAge,
                    curveId: curve.percentile
                });
            }
        }

        // Sort by percentile
        percentileValues.sort((a, b) => a.percentile - b.percentile);

        // Find where the plotted value fits
        const result = this.interpolatePercentile(value, percentileValues);
        
        console.log(`📊 Point (age: ${age}, ${measurementType}: ${value}) is at approximately P${result.percentile.toFixed(1)}`);
        
        return result;
    }

    getValueAtX(x, curvePoints) {
        if (!curvePoints || curvePoints.length === 0) return null;
        
        // Find the closest points
        for (let i = 0; i < curvePoints.length - 1; i++) {
            if (x >= curvePoints[i].x && x <= curvePoints[i + 1].x) {
                // Linear interpolation
                const ratio = (x - curvePoints[i].x) / (curvePoints[i + 1].x - curvePoints[i].x);
                return curvePoints[i].y + ratio * (curvePoints[i + 1].y - curvePoints[i].y);
            }
        }
        
        // Extrapolate if outside range
        if (x < curvePoints[0].x) return curvePoints[0].y;
        if (x > curvePoints[curvePoints.length - 1].x) return curvePoints[curvePoints.length - 1].y;
        
        return null;
    }

    interpolatePercentile(value, percentileValues) {
        if (percentileValues.length === 0) return { percentile: 50, confidence: 'low' };
        
        // Convert chart y-coordinates to actual values (this depends on your chart's value scale)
        const chartValue = this.chartPlotter.valueToY ? 
            this.chartPlotter.valueToY(value) : value;
        
        // Find where this value fits among the percentile curves
        for (let i = 0; i < percentileValues.length - 1; i++) {
            const lower = percentileValues[i];
            const upper = percentileValues[i + 1];
            
            // Check if value is between these two percentiles
            if (chartValue >= lower.value && chartValue <= upper.value) {
                // Interpolate between the two percentiles
                const ratio = (chartValue - lower.value) / (upper.value - lower.value);
                const interpolatedPercentile = lower.percentile + ratio * (upper.percentile - lower.percentile);
                
                return {
                    percentile: interpolatedPercentile,
                    confidence: 'high',
                    between: `P${lower.percentile} and P${upper.percentile}`,
                    lowerCurve: lower.curveId,
                    upperCurve: upper.curveId
                };
            }
        }
        
        // Value is outside the range of calibrated curves
        if (chartValue < percentileValues[0].value) {
            return {
                percentile: Math.max(0, percentileValues[0].percentile - 5),
                confidence: 'low',
                note: `Below P${percentileValues[0].percentile} (extrapolated)`
            };
        } else {
            return {
                percentile: Math.min(100, percentileValues[percentileValues.length - 1].percentile + 5),
                confidence: 'low',
                note: `Above P${percentileValues[percentileValues.length - 1].percentile} (extrapolated)`
            };
        }
    }

    // Helper function to get all calibrated curve data
    getCalibratedCurves() {
        return this.fittedCurves;
    }

    // Helper function to export calibration data
    exportCalibrationData() {
        const exportData = {
            calibrationPoints: this.calibrationPoints,
            fittedCurves: this.fittedCurves,
            exportDate: new Date().toISOString(),
            curveCount: Object.keys(this.fittedCurves).length
        };
        
        console.log("📤 Calibration Data:", exportData);
        return exportData;
    }

    async loadMagneticCurves(curvesDataSrc = './magnetic_curves_webapp.json', sex = 'Boy') {
        // Load manually traced magnetic curves and integrate them
        
        try {
            console.log(`🧲 Loading magnetic traced curves for ${sex}...`);
            
            // Fetch the magnetic curves data
            const response = await fetch(curvesDataSrc);
            if (!response.ok) {
                throw new Error(`Failed to load magnetic curves data: ${response.status}`);
            }
            
            const rawData = await response.json();
            console.log(`📊 Raw curve data loaded for ${sex}:`, rawData);

            // Normalize dataset structure
            // Expected original structure (boys): { curves: { 'height-P97': {points:[...] ...} } }
            // Girls file appears to provide: { curves: [ [ [x,y], ... ], [ ... ] ] } without metadata
            let normalizedCurves = {};
            if (rawData.curves) {
                if (Array.isArray(rawData.curves)) {
                    const arr = rawData.curves;
                    const total = arr.length;
                    const chartConfigs = typeof CHART_CONFIGS !== 'undefined' ? CHART_CONFIGS : window.CHART_CONFIGS;
                    const sexConfig = chartConfigs ? chartConfigs[sex] : null;
                    const orderMeta = sexConfig && sexConfig.curveArrayOrder ? sexConfig.curveArrayOrder : null;

                    const hasHeadOnly = orderMeta && orderMeta.head && Object.keys(orderMeta).length === 1; // HC chart
                    const expectedTotal = hasHeadOnly
                        ? orderMeta.head.length
                        : (orderMeta && orderMeta.height && orderMeta.weight
                            ? orderMeta.height.length + orderMeta.weight.length
                            : null);

                    if (orderMeta && expectedTotal === total) {
                        if (hasHeadOnly) {
                            for (let i = 0; i < orderMeta.head.length; i++) {
                                const pct = orderMeta.head[i];
                                normalizedCurves[`head-${pct}`] = { points: arr[i], percentile: pct, type: 'head' };
                            }
                            console.log(`ℹ️ Applied explicit head curveArrayOrder mapping for ${sex}`);
                        } else {
                            // height + weight mapping
                            for (let i = 0; i < orderMeta.height.length; i++) {
                                const pct = orderMeta.height[i];
                                normalizedCurves[`height-${pct}`] = { points: arr[i], percentile: pct, type: 'height' };
                            }
                            for (let i = 0; i < orderMeta.weight.length; i++) {
                                const pct = orderMeta.weight[i];
                                normalizedCurves[`weight-${pct}`] = { points: arr[orderMeta.height.length + i], percentile: pct, type: 'weight' };
                            }
                            console.log(`ℹ️ Applied explicit curveArrayOrder mapping for ${sex}`);
                        }
                    } else {
                        // Heuristics / fallback
                        if (hasHeadOnly) {
                            // If counts mismatch, still map sequentially as head curves
                            arr.forEach((curvePts, idx) => {
                                const pct = orderMeta && orderMeta.head[idx] ? orderMeta.head[idx] : `P50`;
                                normalizedCurves[`head-${pct}`] = { points: curvePts, percentile: pct, type: 'head' };
                            });
                            console.warn(`⚠️ Head curve count mismatch for ${sex}; mapped sequentially.`);
                        } else {
                            const pctOrderHeight = ['P97','P90','P75','P50','P25','P10','P3'];
                            const pctOrderWeight = ['P3','P10','P25','P50','P75','P90','P97'];
                            if (total === 14) {
                                for (let i=0;i<7;i++) {
                                    normalizedCurves[`height-${pctOrderHeight[i]}`] = { points: arr[i], percentile: pctOrderHeight[i], type: 'height' };
                                }
                                for (let i=0;i<7;i++) {
                                    normalizedCurves[`weight-${pctOrderWeight[i]}`] = { points: arr[7+i], percentile: pctOrderWeight[i], type: 'weight' };
                                }
                                console.log(`ℹ️ Applied heuristic curve mapping for ${sex}`);
                            } else {
                                arr.forEach((curvePts, idx) => {
                                    const type = idx < total/2 ? 'height' : 'weight';
                                    normalizedCurves[`${type}-curve-${idx}`] = { points: curvePts, percentile: 'P50', type };
                                });
                                console.warn(`⚠️ Fallback generic mapping used for ${sex}; unexpected curve count ${total}`);
                            }
                        }
                    }
                } else {
                    normalizedCurves = rawData.curves; // already object
                }
            } else {
                throw new Error('Curves key missing in dataset');
            }

            // Convert normalized curves to internal format
            this.calibrationPoints = {};
            this.fittedCurves = {};
            let loadedCount = 0;
            for (const [curveId, curveData] of Object.entries(normalizedCurves)) {
                const points = (curveData.points || curveData).map(pt => ({ x: pt[0], y: pt[1] }));
                let inferredType = curveData.type;
                if (!inferredType) {
                    if (curveId.startsWith('height')) inferredType = 'height';
                    else if (curveId.startsWith('weight')) inferredType = 'weight';
                    else if (curveId.startsWith('head')) inferredType = 'head';
                    else inferredType = 'weight';
                }
                this.fittedCurves[curveId] = {
                    points,
                    method: 'magnetic_tracing',
                    confidence: 1.0,
                    pointCount: points.length,
                    detectionMethod: 'Manual Magnetic Tracing',
                    percentile: curveData.percentile || 'P50',
                    type: inferredType,
                    source: 'magnetic_curves',
                    sex
                };
                this.calibrationPoints[curveId] = [];
                loadedCount++;
            }

            console.log(`🎉 Successfully normalized and loaded ${loadedCount} curves for ${sex}`);
            // Summary of weight curve order
            const weightIds = Object.keys(this.fittedCurves).filter(id => id.startsWith('weight-')).sort((a,b)=>{
                // Sort by percentile numeric descending for readability
                const pa=parseInt(a.split('-')[1].substring(1));
                const pb=parseInt(b.split('-')[1].substring(1));
                return pb-pa;
            });
            console.log(`📑 Weight curve IDs (descending):`, weightIds);
            const headIds = Object.keys(this.fittedCurves).filter(id => id.startsWith('head-'));
            if (headIds.length) {
                console.log(`🧠 Head curve IDs:`, headIds);
            }
            const statusEl = document.getElementById('analysisStatus');
            if (statusEl) statusEl.innerHTML = `✅ ${sex} curves loaded (${loadedCount})`;
            
            // Notify the chart plotter that curves are ready
            if (this.chartPlotter && this.chartPlotter.drawChart) {
                this.chartPlotter.drawChart();
            }
            
        } catch (error) {
            console.error("❌ Error loading magnetic curves:", error);
            const statusEl = document.getElementById('analysisStatus');
            if (statusEl) statusEl.innerHTML = `❌ Failed loading curves: ${error.message}`;
        }
    }
    
    visualizeMagneticCurves() {
        // Visualize the loaded magnetic curves on the chart
        
        // Clear any existing curve overlays
        const existingOverlays = document.querySelectorAll('.magnetic-curve-overlay');
        existingOverlays.forEach(overlay => overlay.remove());
        
        // Colors for different percentiles and types
        const heightColors = {
            'P97': '#ff0000',    // Red
            'P90': '#ff6600',    // Orange Red
            'P75': '#ff9900',    // Orange
            'P50': '#00ff00',    // Green
            'P25': '#0099ff',    // Light Blue
            'P10': '#0066ff',    // Blue
            'P3': '#0000ff'      // Dark Blue
        };
        
        const weightColors = {
            'P97': '#cc0000',    // Dark Red
            'P90': '#cc4400',    // Dark Orange Red
            'P75': '#cc6600',    // Dark Orange
            'P50': '#009900',    // Dark Green
            'P25': '#006699',    // Dark Light Blue
            'P10': '#004499',    // Dark Blue
            'P3': '#000099'      // Navy Blue
        };
        
        const chartContainer = document.querySelector('#chartContainer') || document.body;
        
        for (const [curveId, curveData] of Object.entries(this.fittedCurves)) {
            if (curveData.method === 'magnetic_tracing') {
                const percentile = curveData.percentile;
                const type = curveData.type;
                const colors = type === 'height' ? heightColors : weightColors;
                const color = colors[percentile] || '#888888';
                
                // Create SVG overlay for the curve
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('magnetic-curve-overlay');
                svg.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 150;
                `;
                
                // Create path for the curve
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const pathData = this.createPathFromPoints(curveData.points);
                
                path.setAttribute('d', pathData);
                path.setAttribute('stroke', color);
                path.setAttribute('stroke-width', '3');
                path.setAttribute('fill', 'none');
                path.setAttribute('opacity', '0.9');
                
                svg.appendChild(path);
                
                // Add label
                if (curveData.points.length > 10) {
                    const labelPoint = curveData.points[Math.floor(curveData.points.length / 4)];
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', labelPoint.x);
                    text.setAttribute('y', labelPoint.y - 10);
                    text.setAttribute('fill', color);
                    text.setAttribute('font-family', 'Arial');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', 'bold');
                    text.textContent = `${type.charAt(0).toUpperCase()}${percentile}`;
                    
                    svg.appendChild(text);
                }
                
                chartContainer.appendChild(svg);
            }
        }
        
        console.log(`🎨 Visualized ${Object.keys(this.fittedCurves).length} magnetic curves`);
    }
    
    calculatePercentileForPoint(x, y, measurementType = 'height') {
        // Calculate what percentile a plotted point falls on using magnetic curves
        
        const curves = Object.entries(this.fittedCurves).filter(([id, data]) => 
            data.method === 'magnetic_tracing' && data.type === measurementType
        );
        
        if (curves.length === 0) {
            console.warn(`No ${measurementType} curves available for percentile calculation`);
            return null;
        }
        
        console.log(`🧮 Calculating percentile for point (${x}, ${y}) [${measurementType}]`);
        
        // Find the closest curve and interpolate
        const matches = [];
        
        for (const [curveId, curveData] of curves) {
            const curveY = this.interpolateYAtX(curveData.points, x);
            
            if (curveY !== null) {
                const distance = Math.abs(y - curveY);
                const percentileNum = parseFloat(curveData.percentile.substring(1)); // P97 -> 97
                
                matches.push({
                    percentile: curveData.percentile,
                    percentileNum: percentileNum,
                    curveId: curveId,
                    curveY: curveY,
                    distance: distance
                });
            }
        }
        
        if (matches.length === 0) {
            return null;
        }
        // Sort by distance first so we can decide if we are effectively ON a curve before any extreme classification
        matches.sort((a, b) => a.distance - b.distance);
        const closest = matches[0];

        // Thresholds (tunable)
        const EXACT_DISTANCE_THRESHOLD = 15;      // legacy broad threshold
        const ABSOLUTE_EXACT_DISTANCE = 7;         // strict exact threshold
        const RELATIVE_MAX_EXACT_FRACTION = 0.22;  // max fraction of gap to still call exact
        const EXTREME_MARGIN = 8;                  // margin for extreme classification outside band

        // Determine potential extremes only after ruling out an exact match
        const yValues = matches.map(m => m.curveY);
        const minY = Math.min(...yValues); // visually top
        const maxY = Math.max(...yValues); // visually bottom

        // Dynamically determine orientation for measurement type.
        // orientation.sign: +1 means higher percentile has greater Y (downwards); -1 means higher percentile has smaller Y (upwards)
        let orientationSign = -1; // default similar to height assumption
        if (measurementType === 'weight') {
            const p97 = matches.find(m => m.percentileNum === 97);
            const p3 = matches.find(m => m.percentileNum === 3);
            if (p97 && p3) {
                orientationSign = (p97.curveY > p3.curveY) ? +1 : -1;
                console.log(`🧭 Weight orientation detected: P97.y=${p97.curveY.toFixed(1)} vs P3.y=${p3.curveY.toFixed(1)} -> sign=${orientationSign}`);
            }
        }

    if (measurementType === 'height' || measurementType === 'head') {
            // height: higher percentile (P97) should have smaller y values (toward top). Extreme only if well above.
            if (y < (minY - EXTREME_MARGIN)) {
                console.log(`⏫ Point above highest ${measurementType} curve by more than margin: showing >P97`);
                return {
                    percentile: 97,
                    displayPercentile: '>P97',
                    confidence: 'medium',
                    type: 'extreme',
                    extreme: 'above',
                    curve: matches.find(m => m.percentileNum === 97)?.curveId || closest.curveId,
                    distance: Math.abs(y - minY)
                };
            }
            if (y > (maxY + EXTREME_MARGIN)) {
                console.log(`⏬ Point below lowest ${measurementType} curve by more than margin: showing <P3`);
                return {
                    percentile: 3,
                    displayPercentile: '<P3',
                    confidence: 'medium',
                    type: 'extreme',
                    extreme: 'below',
                    curve: matches.find(m => m.percentileNum === 3)?.curveId || closest.curveId,
                    distance: Math.abs(y - maxY)
                };
            }
    } else if (measurementType === 'weight') {
            // Use detected orientation
            if (orientationSign === +1) {
                // Higher percentile lower on chart (bigger Y)
                if (y > (maxY + EXTREME_MARGIN)) {
                    console.log(`⏬ Point heavier than P97 by margin: >P97`);
                    return { percentile: 97, displayPercentile: '>P97', confidence: 'medium', type: 'extreme', extreme: 'above', curve: matches.find(m=>m.percentileNum===97)?.curveId||closest.curveId, distance: Math.abs(y-maxY) };
                }
                if (y < (minY - EXTREME_MARGIN)) {
                    console.log(`⏫ Point lighter than P3 by margin: <P3`);
                    return { percentile: 3, displayPercentile: '<P3', confidence: 'medium', type: 'extreme', extreme: 'below', curve: matches.find(m=>m.percentileNum===3)?.curveId||closest.curveId, distance: Math.abs(y-minY) };
                }
            } else {
                // Higher percentile higher on chart (smaller Y) – same logic as height but for weight
                if (y < (minY - EXTREME_MARGIN)) {
                    console.log(`⏫ Point above (better than) highest weight curve by margin: >P97`);
                    return { percentile: 97, displayPercentile: '>P97', confidence: 'medium', type: 'extreme', extreme: 'above', curve: matches.find(m=>m.percentileNum===97)?.curveId||closest.curveId, distance: Math.abs(y-minY) };
                }
                if (y > (maxY + EXTREME_MARGIN)) {
                    console.log(`⏬ Point below (lower than) lowest weight curve by margin: <P3`);
                    return { percentile: 3, displayPercentile: '<P3', confidence: 'medium', type: 'extreme', extreme: 'below', curve: matches.find(m=>m.percentileNum===3)?.curveId||closest.curveId, distance: Math.abs(y-maxY) };
                }
            }
        }
        
    // Not extreme: continue with interpolation / exact determination below
        
        // Find the two curves that bracket the point vertically
        let upperCurve = null;
        let lowerCurve = null;
        
    for (const match of matches) {
            if (measurementType === 'height' || (measurementType === 'weight' && orientationSign === -1)) {
                // Higher percentile => smaller Y
                if (match.curveY <= y && (upperCurve === null || match.curveY > upperCurve.curveY)) upperCurve = match; // just above point
                if (match.curveY >= y && (lowerCurve === null || match.curveY < lowerCurve.curveY)) lowerCurve = match; // just below point
            } else {
                // orientationSign +1: higher percentile => larger Y
                if (match.curveY >= y && (upperCurve === null || match.curveY < upperCurve.curveY)) upperCurve = match; // just below visually
                if (match.curveY <= y && (lowerCurve === null || match.curveY > lowerCurve.curveY)) lowerCurve = match; // just above visually
            }
        }
        
        // Determine yRange for relative exact decision
        let yRange = null;
        if (upperCurve && lowerCurve && upperCurve.curveId !== lowerCurve.curveId) {
            yRange = Math.abs(lowerCurve.curveY - upperCurve.curveY);
        }

        // Decide if we should classify as exact AFTER finding bracketing so we can use relative distance
        if (closest.distance <= ABSOLUTE_EXACT_DISTANCE) {
            return { percentile: closest.percentileNum, confidence: 'high', type: 'exact', curve: closest.curveId, distance: closest.distance };
        }
        if (yRange && closest.distance <= EXACT_DISTANCE_THRESHOLD) {
            const fraction = closest.distance / yRange;
            if (fraction <= RELATIVE_MAX_EXACT_FRACTION) {
                console.log(`🎯 Exact by relative fraction: dist=${closest.distance.toFixed(1)} yRange=${yRange.toFixed(1)} frac=${fraction.toFixed(2)}`);
                return { percentile: closest.percentileNum, confidence: 'high', type: 'exact', curve: closest.curveId, distance: closest.distance };
            } else {
                console.log(`ℹ️ Not exact (fraction ${fraction.toFixed(2)} > ${RELATIVE_MAX_EXACT_FRACTION}) -> will interpolate/range`);
            }
        }

        // Check if point is bracketed between two curves
        if (upperCurve && lowerCurve && upperCurve.curveId !== lowerCurve.curveId) {
            if (yRange > 0) {
                const distanceToUpper = Math.abs(y - upperCurve.curveY);
                const distanceToLower = Math.abs(y - lowerCurve.curveY);
                
                // If the point is reasonably far from both curves (more than 20 pixels from each),
                // show it as a range between the two curves, but still calculate interpolated value
                if (distanceToUpper > 20 && distanceToLower > 20) {
                    console.log(`📊 Point is between ${upperCurve.percentile} and ${lowerCurve.percentile} (range)`);
                }

                // Calculate interpolated percentile (same math either branch now unified)
                const ratio = Math.abs(y - upperCurve.curveY) / yRange;
                let interpolatedPercentile;
                if (measurementType === 'height') {
                    interpolatedPercentile = upperCurve.percentileNum - ratio * (upperCurve.percentileNum - lowerCurve.percentileNum);
                } else {
                    interpolatedPercentile = orientationSign === -1
                        ? upperCurve.percentileNum - ratio * (upperCurve.percentileNum - lowerCurve.percentileNum)
                        : upperCurve.percentileNum + ratio * (lowerCurve.percentileNum - upperCurve.percentileNum);
                }

                // Always produce ascending range Pmin-max (second without leading P)
                const pA = upperCurve.percentileNum;
                const pB = lowerCurve.percentileNum;
                const low = Math.min(pA, pB);
                const high = Math.max(pA, pB);
                const rangeFormat = `P${low}-${high}`;
                const rangeType = (distanceToUpper > 20 && distanceToLower > 20) ? 'range' : 'interpolated_with_range';
                return {
                    percentile: interpolatedPercentile,
                    confidence: 'high',
                    type: rangeType,
                    range: rangeFormat,
                    upperCurve: upperCurve.curveId,
                    lowerCurve: lowerCurve.curveId,
                    distanceToUpper: distanceToUpper,
                    distanceToLower: distanceToLower
                };
            }
        }
        
        // If not bracketed, extrapolate from closest curve
        console.log(`📈 Point extrapolated from ${closest.percentile} (distance: ${closest.distance.toFixed(1)}px)`);
        return {
            percentile: closest.percentileNum,
            confidence: closest.distance < 50 ? 'medium' : 'low',
            type: 'extrapolated',
            curve: closest.curveId,
            distance: closest.distance
        };
    }
    
    interpolateYAtX(points, targetX) {
        // Interpolate Y value at given X coordinate along a curve
        
        if (!points || points.length < 2) {
            return null;
        }
        
        // Sort points by X coordinate
        const sortedPoints = points.slice().sort((a, b) => a.x - b.x);
        
        // Find the two points that bracket the target X
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const p1 = sortedPoints[i];
            const p2 = sortedPoints[i + 1];
            
            if (p1.x <= targetX && targetX <= p2.x) {
                // Linear interpolation
                if (p2.x - p1.x === 0) {
                    return p1.y;
                }
                const ratio = (targetX - p1.x) / (p2.x - p1.x);
                return p1.y + ratio * (p2.y - p1.y);
            }
        }
        
        // If target_x is outside the curve range, extrapolate from nearest end
        if (targetX < sortedPoints[0].x) {
            return sortedPoints[0].y;
        } else if (targetX > sortedPoints[sortedPoints.length - 1].x) {
            return sortedPoints[sortedPoints.length - 1].y;
        }
        
        return null;
    }
}

// Make the class available globally
window.CurveCalibrationManager = CurveCalibrationManager;