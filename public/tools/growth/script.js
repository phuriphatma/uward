// Chart configurations for both boys and girls
const CHART_CONFIGS = {
    Girl: {
        imageSrc: 'Thai Growth Chart Girls 2-19 Years.png',
        curvesDataSrc: 'thai_growth_chart_girls_2_19_years_curves.json',
        // For girls dataset the raw array lists height curves first (tallest to shortest) then weight curves but in descending heavy-to-light order.
        // We want weight curves labeled P97->P3 according to provided ordering sequence (current heuristic made them ascend P3..P97).
        curveArrayOrder: {
            height: ['P97','P90','P75','P50','P25','P10','P3'],
            weight: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 2,
        maxAge: 19,
        chartType: 'AGE',
        // Weight reference points: (age 2, 5kg) = (236, 3307), (age 19, 90kg) = (2245, 1299)
        ageRef1: 2,
        weightRef1: 5,
        weightXRef1: 236,
        weightYRef1: 3307,
        
        ageRef2: 19,
        weightRef2: 90,
        weightXRef2: 2245,
        weightYRef2: 1299,
        
        // Height reference points: (age 2, 85cm) = (236, 2717), (age 19, 180cm) = (2245, 472.5)
        heightRef1: 85,
        heightXRef1: 236,
        heightYRef1: 2717,
        
        heightRef2: 180,
        heightXRef2: 2245,
        heightYRef2: 472.5
    },
    // Boy 2-19 years chart configuration (added). ASSUMPTION: Using same reference anchors as Girl chart until exact boy anchors provided.
    // If you have precise pixel anchors for (age, weight) & (age, height) for the boys chart image, replace the ageRef/weightRef/heightRef sets below.
    Boy: {
        imageSrc: 'Weight-and-height_Boys_2-19-years.png', // Existing boys 2-19 image in repo
        curvesDataSrc: 'thai_growth_chart_boys_2_19_years_curves.json', // Expected file (will fallback to girls if not found)
        curveArrayOrder: {
            height: ['P97','P90','P75','P50','P25','P10','P3'],
            weight: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 2,
        maxAge: 19,
        chartType: 'AGE',
        // Corrected anchors provided by user:
        // (Age 2y, Weight 5kg) = (236, 3307)
        // (Age 19y, Weight 90kg) = (2245, 1454)
        // (Age 2y, Height 85cm) = (236, 2762)
        // (Age 19y, Height 190cm) = (2245, 472.5)
        ageRef1: 2,
        weightRef1: 5,
        weightXRef1: 236,
        weightYRef1: 3307,
        ageRef2: 19,
        weightRef2: 90,
        weightXRef2: 2245,
        weightYRef2: 1454,
        heightRef1: 85,
        heightXRef1: 236,
        heightYRef1: 2762,
        heightRef2: 190,
        heightXRef2: 2245,
        heightYRef2: 472.5
    },
    Girl_0_2: {
        imageSrc: 'Thai Growth Chart Girls 0-2 Years.png',
        curvesDataSrc: 'thai_growth_chart_girls_0_2_years_curves.json',
        // Assuming same ordering convention: first 7 height (tallest to shortest), then 7 weight (heaviest to lightest)
        curveArrayOrder: {
            height: ['P97','P90','P75','P50','P25','P10','P3'],
            weight: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 0,
        maxAge: 2,
        chartType: 'AGE',
        // Provided reference points (age in months converted to years for age mapping):
        // (age 0 months, 2kg) = (236,3307), (age 24 months, 15kg) = (2245,1705)
        ageRef1: 0, // years
        weightRef1: 2,
        weightXRef1: 236,
        weightYRef1: 3307,
        ageRef2: 2, // 24 months
        weightRef2: 15,
        weightXRef2: 2245,
        weightYRef2: 1705,
        // Height/Length refs: (0m,45cm)=(236,2937.5), (24m,95cm)=(2245,472.5)
        heightRef1: 45,
        heightXRef1: 236,
        heightYRef1: 2937.5,
        heightRef2: 95,
        heightXRef2: 2245,
        heightYRef2: 472.5
    },
    Boy_0_2: {
        imageSrc: 'Thai Growth Chart Boys 0-2 Years.png',
        curvesDataSrc: 'thai_growth_chart_boys_0_2_years_curves.json',
        curveArrayOrder: {
            height: ['P97','P90','P75','P50','P25','P10','P3'],
            weight: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 0,
        maxAge: 2,
        chartType: 'AGE',
    // Provided reference points (age 0 months, 2kg)=(236,3307), (age24 months,15kg)=(2245,1705)
        // Provided reference points (age 0 months, 2kg)=(236,3307), (age24 months,15kg)=(2245,1705)
        ageRef1: 0,
        weightRef1: 2,
        weightXRef1: 236,
        weightYRef1: 3307,
        ageRef2: 2,
        weightRef2: 15,
        weightXRef2: 2245,
        weightYRef2: 1705,
        // Height/Length references (0m,45cm)=(236,2937.5), (24m,95cm)=(2245,472.5)
        heightRef1: 45,
        heightXRef1: 236,
        heightYRef1: 2937.5,
        heightRef2: 95,
        heightXRef2: 2245,
        heightYRef2: 472.5
    }
    ,Boy_WFH: {
        imageSrc: 'WFH_boy.png',
        curvesDataSrc: 'wfh_boy_curves.json',
        curveArrayOrder: {
            height: [],
            weight: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 2,
        maxAge: 19,
        chartType: 'WFH',
        ageRef1: 2,
        ageRef2: 19,
        // Weight-for-Height reference anchors (height,weight) -> pixels
        // (height 90cm, weight 10kg) = (236,3307); (height 180cm, weight 85kg) = (2244.5,472.5)
        weightRef1: 10,
        weightYRef1: 3307,
        weightXRef1: 236, // x corresponds to heightRef1 height 90
        heightRef1: 90,
        heightXRef1: 236,
        heightYRef1: 2937.5, // not used directly for x mapping (optionally can reflect length grid)
        weightRef2: 85,
        weightYRef2: 472.5,
        weightXRef2: 2244.5, // x corresponds to heightRef2 height 180
        heightRef2: 180,
        heightXRef2: 2244.5,
        heightYRef2: 472.5
    }
    ,Girl_WFH: {
        imageSrc: 'WFH_girl.png',
        curvesDataSrc: 'wfh_girl_curves.json',
        curveArrayOrder: {
            height: [],
            weight: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 2,
        maxAge: 19,
        chartType: 'WFH',
        ageRef1: 2,
        ageRef2: 19,
        // Provided Girl WFH anchors: (height 90cm, weight 10kg)=(236,3307); (height 170cm, weight 85kg)=(2244.5,472.5)
        weightRef1: 10,
        weightYRef1: 3307,
        weightXRef1: 236,
        heightRef1: 90,
        heightXRef1: 236,
        heightYRef1: 2937.5,
        weightRef2: 85,
        weightYRef2: 472.5,
        weightXRef2: 2244.5,
        heightRef2: 170,
        heightXRef2: 2244.5,
        heightYRef2: 472.5
    }
    ,Boy_HC: {
        imageSrc: 'HC_boy.png',
        curvesDataSrc: 'hc_boy_curves.json',
        curveArrayOrder: {
            head: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 0,
        maxAge: 5,
        chartType: 'HC',
        // Head circumference reference anchors (age years, HC cm)
        // (age 0y, 30cm)=(236,1831); (age 5y, 55cm)=(2244.5,472.5)
        ageRef1: 0,
        headRef1: 30,
        headXRef1: 236,
        headYRef1: 1831,
        ageRef2: 5,
        headRef2: 55,
        headXRef2: 2244.5,
        headYRef2: 472.5
    }
    ,Girl_HC: {
        imageSrc: 'HC_girl.png',
        curvesDataSrc: 'hc_girl_curves.json',
        curveArrayOrder: {
            head: ['P97','P90','P75','P50','P25','P10','P3']
        },
        minAge: 0,
        maxAge: 5,
        chartType: 'HC',
        // Head circumference reference anchors (age years, HC cm) provided by user
        ageRef1: 0,
        headRef1: 30,
        headXRef1: 236,
        headYRef1: 1831,
        ageRef2: 5,
        headRef2: 55,
        headXRef2: 2244.5,
        headYRef2: 472.5
    }
};

// Cache for curves per chart key (normalized like calibration manager but isolated per chart image)
const CHART_CURVES_CACHE = {};

async function loadCurvesForChartKey(chartKey) {
    if (CHART_CURVES_CACHE[chartKey]) return CHART_CURVES_CACHE[chartKey];
    const cfg = CHART_CONFIGS[chartKey];
    if (!cfg || !cfg.curvesDataSrc) return null;
    try {
        let resp = await fetch(cfg.curvesDataSrc);
        // Fallback: if Boy 2-19 curves file missing, temporarily reuse Girl curves (structure compatible)
        if (!resp.ok && chartKey === 'Boy') {
            console.warn(`Boy curves file ${cfg.curvesDataSrc} missing (${resp.status}); falling back to girl curves dataset.`);
            const girlCfg = CHART_CONFIGS['Girl'];
            if (girlCfg) {
                resp = await fetch(girlCfg.curvesDataSrc);
            }
        }
        if (!resp.ok) throw new Error(`Fetch ${cfg.curvesDataSrc} failed (${resp.status})`);
        const rawData = await resp.json();
        let normalized = {};
        if (rawData.curves) {
            if (Array.isArray(rawData.curves)) {
                const arr = rawData.curves;
                const order = cfg.curveArrayOrder || {};
                const hasHeadOnly = order.head && Object.keys(order).length === 1;
                if (hasHeadOnly) {
                    order.head.forEach((pct,i)=>{ normalized[`head-${pct}`] = {points: arr[i], percentile: pct, type:'head'}; });
                } else if (order.height && order.weight && (order.height.length + order.weight.length) === arr.length) {
                    order.height.forEach((pct,i)=>{ normalized[`height-${pct}`] = {points: arr[i], percentile: pct, type:'height'}; });
                    order.weight.forEach((pct,i)=>{ normalized[`weight-${pct}`] = {points: arr[order.height.length + i], percentile: pct, type:'weight'}; });
                } else {
                    // Fallback heuristic similar to calibration loader
                    if (arr.length === 14) {
                        const pctH = ['P97','P90','P75','P50','P25','P10','P3'];
                        const pctW = ['P3','P10','P25','P50','P75','P90','P97'];
                        for (let i=0;i<7;i++) normalized[`height-${pctH[i]}`] = {points: arr[i], percentile:pctH[i], type:'height'};
                        for (let i=0;i<7;i++) normalized[`weight-${pctW[i]}`] = {points: arr[7+i], percentile:pctW[i], type:'weight'};
                    } else {
                        arr.forEach((pts,i)=>{ normalized[`curve-${i}`]={points:pts, percentile:'P50', type:'weight'}; });
                    }
                }
            } else {
                normalized = rawData.curves; // already object
            }
        }
        // Normalize point objects
        /*
         * ASSUMPTION NOTE:
         * Raw curve arrays coming from *_curves.json are assumed to be ordered by segment groups:
         *   For AGE charts: first 7 HEIGHT percentiles in descending order P97->P3, then 7 WEIGHT percentiles also descending P97->P3.
         *   Some provided datasets (girls) originally listed weight in ascending order (P3..P97); we explicitly re-map using curveArrayOrder
         *   or fallback heuristic (see pctH/pctW arrays) to force semantic labels.
         * We rely on this ordering to label each sub-array without embedded metadata. If upstream format changes (e.g., order reversed
         * or mixed), update curveArrayOrder in CHART_CONFIGS entry to explicitly map percentile labels instead of using the heuristic.
         * Weight orientation when computing extremes/extrapolation is inferred later by comparing pixel Y of P97 vs P3 curves.
         */
        const fitted = {};
        Object.entries(normalized).forEach(([id,data])=>{
            const pts = (data.points||data).map(p=>({x:p[0], y:p[1]}));
            fitted[id] = {points: pts, percentile: data.percentile || 'P50', type: data.type || (id.startsWith('height')?'height': id.startsWith('weight')?'weight': id.startsWith('head')?'head':'weight')};
        });
        CHART_CURVES_CACHE[chartKey] = fitted;
        return fitted;
    } catch (e) {
        console.error('Curve load error for', chartKey, e);
        return null;
    }
}

function calculatePercentileFromCurves(curvesObj, x, y, measurementType) {
    if (!curvesObj) return null;
    const curves = Object.entries(curvesObj).filter(([id,c])=> c.type===measurementType);
    if (!curves.length) return null;
    const matches=[];
    for (const [cid, c] of curves) {
        const cy = interpolateYAtXLocal(c.points, x);
        if (cy!==null) {
            const dist = Math.abs(y-cy);
            const pctNum = parseFloat(c.percentile.substring(1));
            matches.push({curveId:cid, percentile:c.percentile, percentileNum:pctNum, curveY:cy, distance:dist});
        }
    }
    if (!matches.length) return null;
    matches.sort((a,b)=>a.distance-b.distance);
    const closest = matches[0];
    const yVals = matches.map(m=>m.curveY);
    const minY = Math.min(...yVals); const maxY=Math.max(...yVals);
    const ABS=7, EXT=8, EXACT_THRESHOLD=15, REL_FRAC=0.22;
    // orientation logic simplified (weight assumes orientation detection if needed)
    let orientationSign=-1;
    if (measurementType==='weight') {
        const p97=matches.find(m=>m.percentileNum===97); const p3=matches.find(m=>m.percentileNum===3);
        if (p97 && p3) orientationSign = (p97.curveY > p3.curveY)? +1 : -1;
    }
    if (measurementType==='height' || measurementType==='head' || (measurementType==='weight'&&orientationSign===-1)) {
        if (y < (minY-EXT)) return {percentile:97, displayPercentile:'>P97', type:'extreme', confidence:'medium'};
        if (y > (maxY+EXT)) return {percentile:3, displayPercentile:'<P3', type:'extreme', confidence:'medium'};
    } else if (measurementType==='weight') {
        if (y > (maxY+EXT)) return {percentile:97, displayPercentile:'>P97', type:'extreme', confidence:'medium'};
        if (y < (minY-EXT)) return {percentile:3, displayPercentile:'<P3', type:'extreme', confidence:'medium'};
    }
    // bracketing
    let upper=null, lower=null;
    for (const m of matches) {
        if (measurementType==='height' || measurementType==='head' || (measurementType==='weight'&&orientationSign===-1)) {
            if (m.curveY <= y && (!upper || m.curveY > upper.curveY)) upper=m;
            if (m.curveY >= y && (!lower || m.curveY < lower.curveY)) lower=m;
        } else {
            if (m.curveY >= y && (!upper || m.curveY < upper.curveY)) upper=m;
            if (m.curveY <= y && (!lower || m.curveY > lower.curveY)) lower=m;
        }
    }
    let yRange=null; if (upper && lower && upper.curveId!==lower.curveId) yRange=Math.abs(lower.curveY-upper.curveY);
    if (closest.distance <= ABS) return {percentile:closest.percentileNum, type:'exact', confidence:'high'};
    if (yRange && closest.distance <= EXACT_THRESHOLD) {
        const frac = closest.distance / yRange; if (frac <= REL_FRAC) return {percentile:closest.percentileNum, type:'exact', confidence:'high'};
    }
    if (upper && lower && upper.curveId!==lower.curveId && yRange>0) {
        const ratio = Math.abs(y-upper.curveY)/yRange;
        let interpolated;
        if (measurementType==='height' || measurementType==='head') {
            interpolated = upper.percentileNum - ratio*(upper.percentileNum-lower.percentileNum);
        } else {
            interpolated = orientationSign===-1 ? upper.percentileNum - ratio*(upper.percentileNum-lower.percentileNum)
                                               : upper.percentileNum + ratio*(lower.percentileNum-upper.percentileNum);
        }
        const pA=upper.percentileNum; const pB=lower.percentileNum; const low=Math.min(pA,pB); const high=Math.max(pA,pB);
        const distU=Math.abs(y-upper.curveY), distL=Math.abs(y-lower.curveY);
        const rangeType = (distU>20 && distL>20)?'range':'interpolated_with_range';
        return {percentile:interpolated, range:`P${low}-${high}`, type:rangeType, confidence:'high'};
    }
    return {percentile:closest.percentileNum, type:'extrapolated', confidence: closest.distance<50?'medium':'low'};
}

function interpolateYAtXLocal(points, targetX) {
    if (!points || points.length<2) return null;
    const sorted = points.slice().sort((a,b)=>a.x-b.x);
    for (let i=0;i<sorted.length-1;i++) {
        const p1=sorted[i], p2=sorted[i+1];
        if (p1.x<=targetX && targetX<=p2.x) {
            if (p2.x-p1.x===0) return p1.y;
            const ratio=(targetX-p1.x)/(p2.x-p1.x); return p1.y + ratio*(p2.y-p1.y);
        }
    }
    if (targetX < sorted[0].x) return sorted[0].y;
    if (targetX > sorted[sorted.length-1].x) return sorted[sorted.length-1].y;
    return null;
}

class GrowthChartPlotter {
    constructor() {
        // Single-chart mode removed; keep minimal properties for percentile calculations if needed
        this.canvas = null;
        this.ctx = null;
        this.chartImage = null;
        this.plotPoints = [];
        this.showCurves = true;
        this.calibrationManager = null;
        this.currentSex = 'Girl';
        this.originalWidth = 0;
        this.originalHeight = 0;
        // Load curves asynchronously; multi-plot uses per-chart loading
        this.setupEventListeners();
        this.preloadExampleData();
    }
    
    getCurrentConfig() {
        return CHART_CONFIGS[this.currentSex];
    }
    
    initializeChart() {
        this.loadChartForCurrentSex();
    }
    
    loadChartForCurrentSex() {
        // Retained for backward compatibility; no action needed since single view removed
    }
    
    resizeCanvas() {
        const container = document.getElementById('chartContainer');
        const maxWidth = container.parentElement.clientWidth - 40; // Account for padding
        const maxHeight = window.innerHeight * 0.8; // Max 80% of viewport height
        
        // Calculate scale to fit within container while maintaining aspect ratio
        const scaleX = maxWidth / this.originalWidth;
        const scaleY = maxHeight / this.originalHeight;
        this.scale = Math.min(scaleX, scaleY, 1); // Never scale up beyond original size
        
        this.canvas.width = this.originalWidth;
        this.canvas.height = this.originalHeight;
        this.canvas.style.width = (this.originalWidth * this.scale) + 'px';
        this.canvas.style.height = (this.originalHeight * this.scale) + 'px';
    }
    
    drawChart() {
        if(!this.canvas || !this.ctx){
            console.warn('drawChart skipped: canvas/context not ready');
            return;
        }
        try { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); } catch(e){ console.warn('clearRect failed in drawChart', e); }
        if (this.chartImage) {
            try { this.ctx.drawImage(this.chartImage, 0, 0); } catch(e){ console.warn('drawImage failed in drawChart', e); }
        }
        
        // Draw magnetic curves if available and curves are enabled
        if (this.calibrationManager && this.calibrationManager.fittedCurves && this.showCurves) {
            this.drawMagneticCurves();
        }
        
        this.drawPlotPoints();
    }
    
    drawMagneticCurves() {
        // Draw the magnetic curves on the chart
        const curves = this.calibrationManager.fittedCurves;
        
        // Colors for different percentiles
        const percentileColors = {
            'P3': '#800080',   // Purple
            'P10': '#ff00ff',  // Magenta
            'P25': '#00ffff',  // Cyan
            'P50': '#00ff00',  // Green
            'P75': '#ffff00',  // Yellow
            'P90': '#ffa500',  // Orange
            'P97': '#ff0000'   // Red
        };
        
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        
        for (const [curveId, curveData] of Object.entries(curves)) {
            if (curveData.method === 'magnetic_tracing' && curveData.points && curveData.points.length > 1) {
                const percentile = curveData.percentile;
                const color = percentileColors[percentile] || '#888888';
                
                this.ctx.strokeStyle = color;
                this.ctx.beginPath();
                
                // Draw the curve
                const firstPoint = curveData.points[0];
                this.ctx.moveTo(firstPoint.x, firstPoint.y);
                
                for (let i = 1; i < curveData.points.length; i++) {
                    const point = curveData.points[i];
                    this.ctx.lineTo(point.x, point.y);
                }
                
                this.ctx.stroke();
                
                // Add label for the curve
                if (curveData.points.length > 10) {
                    const labelPoint = curveData.points[Math.floor(curveData.points.length / 4)];
                    this.ctx.fillStyle = color;
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.fillText(percentile, labelPoint.x + 5, labelPoint.y - 5);
                }
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawFallbackChart() {
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(200, 400, 2100, 2800);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`${this.currentSex}s Growth Chart (2-19 years)`, 800, 100);
        this.ctx.fillText('Chart image not found - using coordinates only', 700, 200);
        this.ctx.fillText('Red dots = Weight, Blue dots = Height', 700, 300);
        
        this.drawPlotPoints();
    }
    
    setupEventListeners() {
        document.getElementById('growthForm').addEventListener('submit', (e) => {
            e.preventDefault();
            // Always refresh multi view (default) and single view if active
            this.refreshViews();
        });
        
        // New decoupled selectors
        const sexSelect = document.getElementById('sexSelect');
        const chartTypeSelect = document.getElementById('chartTypeSelect');
        const recomputeKey = () => {
            const sex = sexSelect.value; // Boy/Girl
            const chartType = chartTypeSelect.value; // age_2_19 | age_0_2 | wfh | hc
            let key;
            switch(chartType){
                case 'age_2_19': key = sex; break; // Boy or Girl
                case 'age_0_2': key = sex + '_0_2'; break;
                case 'wfh': key = sex + '_WFH'; break;
                case 'hc': key = sex + '_HC'; break;
            }
            const hidden = document.getElementById('sex');
            if (hidden.value !== key) {
                hidden.value = key;
                this.currentSex = key; // reuse existing variable name
                this.clearPoints();
                this.loadChartForCurrentSex();
                console.log('Switched to chart config', key);
            }
        };
        sexSelect.addEventListener('change', recomputeKey);
        chartTypeSelect.addEventListener('change', recomputeKey);

        // Age-based smart filtering of chart types
        const ageInputs = ['ageYears','ageMonths','ageDays'].map(id=>document.getElementById(id));
        const smartFilter = () => {
            const age = this.calculateAge();
            const ctSel = document.getElementById('chartTypeSelect');
            // Enable/disable options based on age
            [...ctSel.options].forEach(opt=>{
                if (opt.value === 'age_0_2') {
                    opt.disabled = age > 2.05; // a little buffer
                } else if (opt.value === 'hc') {
                    opt.disabled = age > 5.05; // HC only 0-5
                } else if (opt.value === 'wfh' || opt.value === 'age_2_19') {
                    // require age >=2 for WFH and 2-19 charts
                    opt.disabled = age < 2 - 0.02; // slight buffer
                }
            });
            // If current selection got disabled, switch to first enabled
            if (ctSel.selectedOptions[0].disabled) {
                const firstEnabled = [...ctSel.options].find(o=>!o.disabled);
                if (firstEnabled) { ctSel.value = firstEnabled.value; chartTypeSelect.dispatchEvent(new Event('change')); }
            }
        };
        ageInputs.forEach(inp=> inp.addEventListener('input', ()=>{ smartFilter(); this.refreshViews(); }));
        smartFilter();

        // Live update on measurement changes (weight, height, head circumference)
        const debounce = (fn, delay=220) => { let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), delay); }; };
        const measurementInputs = ['weight','height','headCircumference'].map(id=>document.getElementById(id));
        const debouncedRefresh = debounce(()=> this.refreshViews());
        measurementInputs.forEach(inp=> inp && inp.addEventListener('input', debouncedRefresh));

        // With only multi-chart mode remaining, trigger plot immediately on load & on changes
        this.handleMultiPlot();

    }

    refreshViews() {
    this.handleMultiPlot();
    }
    preloadExampleData() {
        // No prefill now; just ensure hidden key matches current selector defaults
        if (document.getElementById('sexSelect')) {
            this.currentSex = document.getElementById('sexSelect').value + (document.getElementById('chartTypeSelect').value==='age_0_2'?'_0_2': document.getElementById('chartTypeSelect').value==='wfh'? '_WFH': document.getElementById('chartTypeSelect').value==='hc'? '_HC': '');
            document.getElementById('sex').value = this.currentSex.startsWith('Girl')? 'Girl': 'Boy';
        }
    }
    
    calculateAge() {
        const years = parseFloat(document.getElementById('ageYears').value) || 0;
        const months = parseFloat(document.getElementById('ageMonths').value) || 0;
        const days = parseFloat(document.getElementById('ageDays').value) || 0;
        
        return years + (months / 12) + (days / 365);
    }
    
    mapAgeToX(age) {
        // Linear interpolation between reference points for age (same for both weight and height)
        const config = this.getCurrentConfig();
        // For HC charts, use headXRef values instead of weightXRef
        if (config.chartType === 'HC') {
            const { ageRef1, headXRef1, ageRef2, headXRef2 } = config;
            const slope = (headXRef2 - headXRef1) / (ageRef2 - ageRef1);
            return headXRef1 + slope * (age - ageRef1);
        } else {
            const { ageRef1, weightXRef1, ageRef2, weightXRef2 } = config;
            const slope = (weightXRef2 - weightXRef1) / (ageRef2 - ageRef1);
            return weightXRef1 + slope * (age - ageRef1);
        }
    }

    mapHeightToXForWFH(height) {
        const config = this.getCurrentConfig();
        const { heightRef1, heightXRef1, heightRef2, heightXRef2 } = config;
        const slope = (heightXRef2 - heightXRef1) / (heightRef2 - heightRef1);
        return heightXRef1 + slope * (height - heightRef1);
    }
    
    mapWeightToY(weight) {
        // Linear interpolation between reference points for weight
        const config = this.getCurrentConfig();
        const { weightRef1, weightYRef1, weightRef2, weightYRef2 } = config;
        const slope = (weightYRef2 - weightYRef1) / (weightRef2 - weightRef1);
        return weightYRef1 + slope * (weight - weightRef1);
    }
    
    mapHeightToY(height) {
        // Linear interpolation between reference points for height
        const config = this.getCurrentConfig();
        const { heightRef1, heightYRef1, heightRef2, heightYRef2 } = config;
        const slope = (heightYRef2 - heightYRef1) / (heightRef2 - heightRef1);
        return heightYRef1 + slope * (height - heightRef1);
    }

    // Mapping specifically for head circumference on HC charts
    mapHeadToY(headCircumference) {
        const config = this.getCurrentConfig();
        if (config.chartType !== 'HC') return null;
        const { headRef1, headYRef1, headRef2, headYRef2 } = config;
        const slope = (headYRef2 - headYRef1) / (headRef2 - headRef1);
        return headYRef1 + slope * (headCircumference - headRef1);
    }
    
    plotData() {
        const sex = document.getElementById('sex').value;
        const age = this.calculateAge();
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const headCircumference = parseFloat(document.getElementById('headCircumference').value);
        const config = this.getCurrentConfig();
        // Optional input mode: only proceed if minimum needed fields for this chart are present; otherwise skip silently
        let missingCore = false;
        if (config.chartType === 'HC') {
            if (isNaN(headCircumference)) missingCore = true;
        } else if (config.chartType === 'WFH') {
            if (isNaN(weight) || isNaN(height)) missingCore = true;
        } else { // AGE
            if (isNaN(weight) || isNaN(height)) missingCore = true;
        }
        if (missingCore) {
            console.log('Skipping plot: required fields for selected chart type not provided (optional mode).');
            return;
        }

        if (age < config.minAge || age > config.maxAge) {
            console.log(`Age ${age.toFixed(2)} outside allowable range ${config.minAge}-${config.maxAge} for this chart; skipping.`);
            return;
        }

        if (sex !== this.currentSex) {
            this.currentSex = sex;
            this.clearPoints();
            this.loadChartForCurrentSex();
            setTimeout(() => this.plotData(), 500);
            return;
        }

        let x;
        let weightY = null;
        let heightY = null;

        if (config.chartType === 'WFH') {
            x = this.mapHeightToXForWFH(height);
            weightY = this.mapWeightToY(weight); // weight plotted vs height
        } else if (config.chartType === 'HC') {
            x = this.mapAgeToX(age);
            const headY = this.mapHeadToY(headCircumference);
            weightY = headY; // reuse weightY slot for simplified downstream logic
        } else { // AGE
            x = this.mapAgeToX(age);
            weightY = this.mapWeightToY(weight);
            heightY = this.mapHeightToY(height);
        }

        // Percentile placeholders
        let weightPercentile = 'Magnetic curves loading...';
        let heightPercentile = 'Magnetic curves loading...';

        if (this.calibrationManager && this.calibrationManager.fittedCurves) {
            if (config.chartType === 'HC') {
                const headResult = this.calibrationManager.calculatePercentileForPoint(x, weightY, 'head');
                if (headResult) {
                    if (headResult.type === 'range') {
                        weightPercentile = `${headResult.range} (range, ${headResult.confidence} confidence)`;
                    } else {
                        weightPercentile = `P${headResult.percentile.toFixed(1)} (${headResult.type}, ${headResult.confidence} confidence)`;
                    }
                    console.log('🧲 Head circumference percentile from magnetic curves:', weightPercentile);
                }
            } else {
                const weightResult = this.calibrationManager.calculatePercentileForPoint(x, weightY, 'weight');
                const heightResult = (config.chartType === 'WFH' || heightY === null) ? null : this.calibrationManager.calculatePercentileForPoint(x, heightY, 'height');

                if (heightResult) {
                    if (heightResult.type === 'range') {
                        heightPercentile = `${heightResult.range} (range, ${heightResult.confidence} confidence)`;
                    } else {
                        heightPercentile = `P${heightResult.percentile.toFixed(1)} (${heightResult.type}, ${heightResult.confidence} confidence)`;
                    }
                    console.log('🧲 Height percentile from magnetic curves:', heightPercentile);
                }

                if (weightResult) {
                    if (weightResult.type === 'range') {
                        weightPercentile = `${weightResult.range} (range, ${weightResult.confidence} confidence)`;
                    } else {
                        weightPercentile = `P${weightResult.percentile.toFixed(1)} (${weightResult.type}, ${weightResult.confidence} confidence)`;
                    }
                    console.log('🧲 Weight percentile from magnetic curves:', weightPercentile);
                }
            }
        }

        this.plotPoints.push({
            chartType: config.chartType,
            x,
            weightY,
            heightY,
            age,
            weight,
            height,
            headCircumference,
            weightPercentile,
            heightPercentile,
            sex,
            timestamp: new Date()
        });

    // single-chart view removed
        this.displayResults(x, weightY, heightY, age, weight, height, headCircumference, weightPercentile, heightPercentile);
    }
    
    drawPlotPoints() {
        this.plotPoints.forEach((point, index) => {
            if (point.chartType === 'HC') {
                // Head circumference point (purple)
                this.ctx.fillStyle = '#800080';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.weightY, 6, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                // Weight point (red)
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.weightY, 6, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            if (point.chartType === 'AGE' && point.heightY !== null) {
                // Height point (blue) and connecting line
                this.ctx.fillStyle = '#0066cc';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.heightY, 6, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([3, 3]);
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.weightY);
                this.ctx.lineTo(point.x, point.heightY);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            // Label
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${index + 1}`, point.x + 10, point.weightY - 10);
        });
    }
    
    displayResults(x, weightY, heightY, age, weight, height, headCircumference, weightPercentile, heightPercentile) {
        const resultsDiv = document.getElementById('results');
        const resultsContent = document.getElementById('resultsContent');
        
        // Calculate percentiles using magnetic curves only
        let magneticWeightPercentile = null;
        let magneticHeightPercentile = null;
        
        const config = this.getCurrentConfig();
        if (this.calibrationManager && this.calibrationManager.calculatePercentileForPoint) {
            if (config.chartType === 'HC') {
                magneticWeightPercentile = this.calibrationManager.calculatePercentileForPoint(x, weightY, 'head');
                magneticHeightPercentile = null;
            } else {
                magneticWeightPercentile = this.calibrationManager.calculatePercentileForPoint(x, weightY, 'weight');
                magneticHeightPercentile = (config.chartType === 'WFH' || heightY === null) ? null : this.calibrationManager.calculatePercentileForPoint(x, heightY, 'height');
            }
        }
        
        // Build the results display using only magnetic curves
        let percentileDisplayHTML = '';
        if (magneticWeightPercentile || magneticHeightPercentile) {
            if (config.chartType === 'HC') {
                percentileDisplayHTML = `
                <strong>📊 Head Circumference Percentile (Magnetic Curves):</strong><br>
                <div style="background: #e8f5e8; padding: 8px; border-radius: 4px; margin: 5px 0; border-left: 4px solid #28a745;">
                    ${magneticWeightPercentile ? `<strong>Head:</strong> <span style="color: #800080;">●</span> ${this.formatPercentileResult(magneticWeightPercentile)}` : ''}
                </div>`;
            } else {
                percentileDisplayHTML = `
                <strong>📊 Percentile Analysis (Magnetic Curves):</strong><br>
                <div style="background: #e8f5e8; padding: 8px; border-radius: 4px; margin: 5px 0; border-left: 4px solid #28a745;">
                    ${magneticWeightPercentile ? `<strong>Weight:</strong> <span style="color: #ff0000;">●</span> ${this.formatPercentileResult(magneticWeightPercentile)}<br>` : ''}
                    ${magneticHeightPercentile ? `<strong>Height:</strong> <span style="color: #0066cc;">●</span> ${this.formatPercentileResult(magneticHeightPercentile)}` : ''}
                </div>`;
            }
        } else {
            // More detailed loading status
            let statusMessage = '';
            if (!this.calibrationManager) {
                statusMessage = 'Calibration manager not initialized. Please refresh the page.';
            } else if (!this.calibrationManager.fittedCurves || Object.keys(this.calibrationManager.fittedCurves).length === 0) {
                statusMessage = 'Magnetic curves are loading automatically. Please wait a moment and try plotting again.';
            } else {
                statusMessage = 'Percentile calculation failed. Please check console for errors.';
            }
            
            percentileDisplayHTML = `
                <strong>📊 Percentile Analysis:</strong><br>
                <div style="background: #fff3cd; padding: 8px; border-radius: 4px; margin: 5px 0; border-left: 4px solid #ffc107;">
                    ${statusMessage}
                </div>`;
        }
        
        // config already defined above
        let referenceHTML = '';
        if (config.chartType === 'WFH') {
            referenceHTML = `Weight: (Height ${config.heightRef1}cm, ${config.weightRef1}kg) = (${config.weightXRef1}, ${config.weightYRef1})<br>
            Weight: (Height ${config.heightRef2}cm, ${config.weightRef2}kg) = (${config.weightXRef2}, ${config.weightYRef2})`;
        } else if (config.chartType === 'HC') {
            referenceHTML = `Head: (Age ${config.ageRef1}y, ${config.headRef1}cm) = (${config.headXRef1}, ${config.headYRef1})<br>
            Head: (Age ${config.ageRef2}y, ${config.headRef2}cm) = (${config.headXRef2}, ${config.headYRef2})`;
        } else {
            referenceHTML = `Weight: (Age ${config.ageRef1}, ${config.weightRef1}kg) = (${config.weightXRef1}, ${config.weightYRef1})<br>
            Weight: (Age ${config.ageRef2}, ${config.weightRef2}kg) = (${config.weightXRef2}, ${config.weightYRef2})`;
        }
        resultsContent.innerHTML = `
            <strong>Plotted Points:</strong><br>
            Age: ${age.toFixed(2)} years<br>
            ${config.chartType === 'HC' ? '' : `Weight: ${isNaN(weight) ? '-' : weight} kg<br>`}
            ${config.chartType === 'HC' ? '' : `Height: ${isNaN(height) ? '-' : height} cm<br>`}
            ${headCircumference ? `Head Circumference: ${headCircumference} cm<br>` : ''}
            <br>
            ${percentileDisplayHTML}
            <br>
            <strong>Chart Coordinates:</strong><br>
            X (${config.chartType === 'WFH' ? 'Height' : 'Age'}): ${x.toFixed(1)} pixels<br>
            ${config.chartType === 'HC' ? `Y (Head): ${weightY.toFixed(1)} pixels <span style=\"color: #800080;\">●</span><br>` : `Y (Weight): ${weightY.toFixed(1)} pixels <span style=\"color: #ff0000;\">●</span><br>`}
            ${config.chartType === 'AGE' && heightY !== null ? `Y (Height): ${heightY.toFixed(1)} pixels <span style=\"color: #0066cc;\">●</span><br>` : ''}
            <br>
            <strong>Reference Points (${this.currentSex}):</strong><br>
            ${referenceHTML}<br>
            ${config.chartType === 'AGE' ? `Height: (Age ${config.ageRef1}, ${config.heightRef1}cm) = (${config.heightXRef1}, ${config.heightYRef1})<br>Height: (Age ${config.ageRef2}, ${config.heightRef2}cm) = (${config.heightXRef2}, ${config.heightYRef2})` : ''}
        `;
        
        resultsDiv.style.display = 'block';
        
        // Update the percentile panel using magnetic curves
        this.updatePercentilePanel(null, null, magneticWeightPercentile, magneticHeightPercentile);
    }
    
    formatPercentileResult(result) {
        if (!result) return 'Not available';
        
        if (result.type === 'extreme' && result.displayPercentile) {
            return `${result.displayPercentile} (${result.type}, ${result.confidence} confidence)`;
        } else if (result.type === 'range') {
            return `${result.range} (P${result.percentile.toFixed(1)}, ${result.confidence} confidence)`;
        } else if (result.type === 'interpolated_with_range') {
            return `${result.range} (P${result.percentile.toFixed(1)}, ${result.confidence} confidence)`;
        } else if (result.percentile !== null) {
            return `P${result.percentile.toFixed(1)} (${result.type}, ${result.confidence} confidence)`;
        } else {
            return 'Not available';
        }
    }
    
    updatePercentilePanel(weightPercentile, heightPercentile, calibratedWeightPercentile, calibratedHeightPercentile) {
        const panel = document.getElementById('percentilePanel');
        if (!panel) return;
        const boxes = {
            height: document.getElementById('heightPercentileDisplay'),
            weight: document.getElementById('weightPercentileDisplay'),
            wfh: document.getElementById('wfhPercentileDisplay'),
            head: document.getElementById('headPercentileDisplay')
        };
        const config = this.getCurrentConfig();
        panel.style.display = 'block';
        const header = document.getElementById('percentileHeader');
        if (header){
            header.textContent = (config.chartType==='WFH')?'📊 Weight-for-Height Percentile':(config.chartType==='HC'?'📊 Head Circumference Percentile':'📊 Percentile Analysis');
        }
        const parseStr = (s)=>{ if(!s) return null; const m=s.match(/P(\d+\.?\d*)/); if(m) return {type:'specific', value:parseFloat(m[1]), display:`P${parseFloat(m[1]).toFixed(1)}`}; return null; };
        const hInfo = calibratedHeightPercentile? calibratedHeightPercentile : parseStr(heightPercentile);
        const wInfo = calibratedWeightPercentile? calibratedWeightPercentile : parseStr(weightPercentile);
        // Reset all
        Object.values(boxes).forEach(el=>{ if(el){ el.textContent='-'; el.style.background='rgba(255,255,255,0.2)'; }});

        const colorize = (el, val, type, displayExt) => {
            if(!el) return; if (type==='extreme') { el.style.background='rgba(255,0,0,0.3)'; el.textContent=displayExt; return; }
            if (typeof val==='number') el.style.background=this.getPercentileColor(val,0.3);
        };
        // AGE
        if (config.chartType==='AGE') {
            if (wInfo) {
                if (wInfo.type==='extreme' && wInfo.displayPercentile) { boxes.weight.textContent=wInfo.displayPercentile; colorize(boxes.weight,null,'extreme',wInfo.displayPercentile); }
                else { boxes.weight.textContent=(wInfo.range?`${wInfo.range} (P${wInfo.percentile.toFixed(1)})`:`P${wInfo.percentile.toFixed(1)}`); colorize(boxes.weight,wInfo.percentile); }
            }
            if (hInfo) {
                if (hInfo.type==='extreme' && hInfo.displayPercentile) { boxes.height.textContent=hInfo.displayPercentile; colorize(boxes.height,null,'extreme',hInfo.displayPercentile); }
                else { boxes.height.textContent=(hInfo.range?`${hInfo.range} (P${hInfo.percentile.toFixed(1)})`:`P${hInfo.percentile.toFixed(1)}`); colorize(boxes.height,hInfo.percentile); }
            }
            // Optional head
            const headVal = parseFloat(document.getElementById('headCircumference').value);
            if (!isNaN(headVal)) {
                const sexKey = this.currentSex.startsWith('Girl')? 'Girl_HC':'Boy_HC';
                const hcCfg = CHART_CONFIGS[sexKey];
                if (hcCfg) {
                    const headX = (()=>{ const slope=(hcCfg.headXRef2-hcCfg.headXRef1)/(hcCfg.ageRef2-hcCfg.ageRef1); return hcCfg.headXRef1 + slope*(this.calculateAge()-hcCfg.ageRef1); })();
                    const headY = (()=>{ const slope=(hcCfg.headYRef2-hcCfg.headYRef1)/(hcCfg.headRef2-hcCfg.headRef1); return hcCfg.headYRef1 + slope*(headVal-hcCfg.headRef1); })();
                    const headPct = this.calibrationManager?.calculatePercentileForPoint(headX, headY, 'head');
                    if (headPct && boxes.head) {
                        if (headPct.type==='extreme' && headPct.displayPercentile) { boxes.head.textContent=headPct.displayPercentile; colorize(boxes.head,null,'extreme',headPct.displayPercentile); }
                        else { boxes.head.textContent=`P${headPct.percentile.toFixed(1)}` + (headPct.range?` (${headPct.range})`: ''); colorize(boxes.head,headPct.percentile); }
                    }
                }
            }
        } else if (config.chartType==='WFH') {
            if (wInfo) {
                if (wInfo.type==='extreme' && wInfo.displayPercentile) { boxes.wfh.textContent=wInfo.displayPercentile; colorize(boxes.wfh,null,'extreme',wInfo.displayPercentile); }
                else { boxes.wfh.textContent=(wInfo.range?`${wInfo.range} (P${wInfo.percentile.toFixed(1)})`:`P${wInfo.percentile.toFixed(1)}`); colorize(boxes.wfh,wInfo.percentile); }
            }
        } else if (config.chartType==='HC') {
            if (wInfo) { // wInfo actually head here
                if (wInfo.type==='extreme' && wInfo.displayPercentile) { boxes.head.textContent=wInfo.displayPercentile; colorize(boxes.head,null,'extreme',wInfo.displayPercentile); }
                else { boxes.head.textContent=(wInfo.range?`${wInfo.range} (P${wInfo.percentile.toFixed(1)})`:`P${wInfo.percentile.toFixed(1)}`); colorize(boxes.head,wInfo.percentile); }
            }
        }
        const details = document.getElementById('percentileDetails');
        if (details) details.textContent='Magnetic curves based percentile computation';
    }
    
    getPercentileColor(percentile, alpha = 1.0) {
        // Color coding for percentiles: red for extreme values, green for normal range
        if (percentile < 3 || percentile > 97) {
            return `rgba(255, 0, 0, ${alpha})`; // Red for extreme
        } else if (percentile < 10 || percentile > 90) {
            return `rgba(255, 165, 0, ${alpha})`; // Orange for concerning
        } else if (percentile >= 25 && percentile <= 75) {
            return `rgba(0, 255, 0, ${alpha})`; // Green for normal
        } else {
            return `rgba(255, 255, 0, ${alpha})`; // Yellow for watch
        }
    }
    
    clearPoints() {
        this.plotPoints = [];
    // single-chart view removed
        document.getElementById('results').style.display = 'none';
        document.getElementById('percentilePanel').style.display = 'none';
        
        // Update status
        document.getElementById('analysisStatus').innerHTML = 
            `✅ ${this.currentSex} chart ready! Magnetic curves loaded for accurate percentile calculation.`;
    }
    
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chartPlotter = new GrowthChartPlotter();
    
    // Initialize calibration manager
    window.chartPlotter.calibrationManager = new CurveCalibrationManager(window.chartPlotter);

    // Explicitly load curves for the initial sex (supports dynamic sex default)
    if (window.chartPlotter && window.chartPlotter.currentSex) {
        const sex = window.chartPlotter.currentSex;
        const config = CHART_CONFIGS[sex];
        if (config && window.chartPlotter.calibrationManager.loadCurvesForSex) {
            window.chartPlotter.calibrationManager.loadCurvesForSex(sex);
        }
    }
    
    // Add clear points button functionality
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All Points';
    clearButton.style.marginTop = '10px';
    clearButton.style.backgroundColor = '#dc3545';
    clearButton.onclick = () => window.chartPlotter.clearPoints();
    
    document.querySelector('.form-section').appendChild(clearButton);

    // Multi-plot button logic
    const multiBtn = document.getElementById('multiPlotBtn');
    if (multiBtn) {
        multiBtn.addEventListener('click', () => {
            if (window.chartPlotter && typeof window.chartPlotter.handleMultiPlot === 'function') {
                window.chartPlotter.handleMultiPlot();
            }
        });
    }
    // Clear buttons functionality
    document.querySelectorAll('[data-clear-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-clear-target');
            const el = document.getElementById(targetId);
            if (el) {
                el.value='';
                // After clearing, propagate recalculation
                if (window.chartPlotter) window.chartPlotter.refreshViews();
            }
        });
    });
    // One-click clear all age inputs
    const clearAgeAll = document.getElementById('clearAgeAllBtn');
    if (clearAgeAll) {
        clearAgeAll.addEventListener('click', () => {
            ['ageYears','ageMonths','ageDays'].forEach(id=>{ const f=document.getElementById(id); if(f) f.value=''; });
            if (window.chartPlotter) window.chartPlotter.refreshViews();
        });
    }
}); // End DOMContentLoaded

GrowthChartPlotter.prototype.handleMultiPlot = function() {
    const age = this.calculateAge();
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const headCircumference = parseFloat(document.getElementById('headCircumference').value);
    const multiContainer = document.getElementById('multiChartsContainer');
    if (!multiContainer) return; multiContainer.innerHTML='';
    const selectedKey = document.getElementById('sex').value || this.currentSex; const baseSex = selectedKey.startsWith('Girl')?'Girl':'Boy';
    // Helper: compute Weight-for-Height % using P50 inversion method
    const computeWeightForHeightPercent = async (sexBase, targetHeight, currentWeight) => {
        if (isNaN(targetHeight) || isNaN(currentWeight)) return null;
        // Candidate age chart keys in order of preference: broad ("Boy"/"Girl"), explicit _2_19 (if ever added), then _0_2
        const candidates = [sexBase, `${sexBase}_2_19`, `${sexBase}_0_2`];
        let chosenKey=null, chosenCfg=null;
        for (const k of candidates) {
            const cfg = CHART_CONFIGS[k];
            if (!cfg) continue;
            if (cfg.chartType !== 'AGE') continue;
            const hMin = Math.min(cfg.heightRef1, cfg.heightRef2);
            const hMax = Math.max(cfg.heightRef1, cfg.heightRef2);
            if (targetHeight >= hMin && targetHeight <= hMax) { chosenKey=k; chosenCfg=cfg; break; }
        }
        if (!chosenKey) { // fallback to first existing AGE chart
            for (const k of candidates) { if (CHART_CONFIGS[k] && CHART_CONFIGS[k].chartType==='AGE'){ chosenKey=k; chosenCfg=CHART_CONFIGS[k]; break; } }
        }
        if (!chosenKey || !chosenCfg) return null;
        try {
            const curves = await loadCurvesForChartKey(chosenKey);
            if (!curves) return null;
            const height50 = Object.values(curves).find(c=>c.type==='height' && c.percentile==='P50');
            const weight50 = Object.values(curves).find(c=>c.type==='weight' && c.percentile==='P50');
            if (!height50 || !weight50) return null;
            // Mapping helpers (pixel -> domain)
            const pxToAge = (px) => {
                // Prefer weight X anchors if present, else height anchors
                const x1 = chosenCfg.weightXRef1 ?? chosenCfg.heightXRef1;
                const x2 = chosenCfg.weightXRef2 ?? chosenCfg.heightXRef2;
                return chosenCfg.ageRef1 + (px - x1) * (chosenCfg.ageRef2 - chosenCfg.ageRef1) / (x2 - x1);
            };
            const pyToHeight = (py) => {
                return chosenCfg.heightRef1 + (py - chosenCfg.heightYRef1) * (chosenCfg.heightRef2 - chosenCfg.heightRef1) / (chosenCfg.heightYRef2 - chosenCfg.heightYRef1);
            };
            const pyToWeight = (py) => {
                return chosenCfg.weightRef1 + (py - chosenCfg.weightYRef1) * (chosenCfg.weightRef2 - chosenCfg.weightRef1) / (chosenCfg.weightYRef2 - chosenCfg.weightYRef1);
            };
            // Build ordered domain arrays for height50
            const hPts = height50.points.map(p=>({ age:pxToAge(p.x), height:pyToHeight(p.y) })).sort((a,b)=>a.age-b.age);
            // Ensure height monotonic assumption for inversion: search for segment containing targetHeight
            let ageAtMedianHeight=null;
            for (let i=0;i<hPts.length-1;i++) {
                const h1=hPts[i].height, h2=hPts[i+1].height;
                // Check if targetHeight lies between (inclusive) regardless of direction
                if ((targetHeight>=Math.min(h1,h2)) && (targetHeight<=Math.max(h1,h2)) && h1!==h2) {
                    const frac=(targetHeight - h1)/(h2 - h1);
                    ageAtMedianHeight = hPts[i].age + frac*(hPts[i+1].age - hPts[i].age);
                    break;
                }
            }
            if (ageAtMedianHeight===null) return null; // outside range
            // Interpolate weight P50 at that age
            const wPts = weight50.points.map(p=>({ age:pxToAge(p.x), weight:pyToWeight(p.y) })).sort((a,b)=>a.age-b.age);
            let weight50AtAge=null;
            for (let i=0;i<wPts.length-1;i++) {
                const a1=wPts[i].age, a2=wPts[i+1].age;
                if (ageAtMedianHeight>=a1 && ageAtMedianHeight<=a2 && a1!==a2) {
                    const frac=(ageAtMedianHeight - a1)/(a2 - a1);
                    weight50AtAge = wPts[i].weight + frac*(wPts[i+1].weight - wPts[i].weight);
                    break;
                }
            }
            if (weight50AtAge===null || weight50AtAge<=0) return null;
            const percent = (currentWeight / weight50AtAge) * 100;
            return { ageAtMedianHeight, weight50AtAge, percent, sourceChart: chosenKey };
        } catch(e){ console.warn('WFH% computation error', e); return null; }
    };
    const applicable = Object.entries(CHART_CONFIGS).filter(([key,cfg])=>{
        if(!key.startsWith(baseSex)) return false;
        // Age gating per chart type
        if (cfg.chartType==='AGE') {
            const isZeroToTwo = key.endsWith('_0_2');
            if (isZeroToTwo) { if (age > 2.05) return false; }
            else { if (age < 1.98) return false; }
            // Allow single-measure plotting: need at least one of weight or height
            return (!isNaN(weight) || !isNaN(height));
        } else if (cfg.chartType==='WFH') {
            if (age < 1.98) return false; return !isNaN(weight)&&!isNaN(height);
        } else if (cfg.chartType==='HC') {
            if (age > 5.05) return false; return !isNaN(headCircumference);
        }
        return false;

    });
    multiContainer.style.display='grid';
    const aggregate=[]; const promises=[];
    // Show panel early placeholder
    const panel=document.getElementById('percentilePanel');
    if(panel){ panel.style.display='block'; const h=document.getElementById('percentileHeader'); if(h) h.textContent='📊 Combined Percentile Analysis (loading...)'; }
    if (typeof this.updateMultiPercentilePanel==='function') this.updateMultiPercentilePanel([]);

    applicable.forEach(([key,cfg])=>{
            const card=document.createElement('div');
            card.style.background='#fff'; card.style.border='1px solid #ddd'; card.style.borderRadius='8px'; card.style.padding='10px'; card.style.display='flex'; card.style.flexDirection='column'; card.style.gap='6px';
            const title=document.createElement('div'); title.innerHTML=`<strong>${key}</strong> <small style="color:#666;">(${cfg.chartType})</small>`; card.appendChild(title);
            const canvas=document.createElement('canvas');
            // Temporary initial size; will be resized on image load for higher resolution
            canvas.width=10; canvas.height=10; canvas.style.border='1px solid #ccc'; card.appendChild(canvas); const ctx=canvas.getContext('2d');
            const img=new Image();
            const p=new Promise(resolve=>{
                img.onload=async ()=>{
                    // Determine target scale for multi-chart preview (higher resolution but not full size)
                    const targetScale = 0.55; // ~55% of original width/height
                    const baseWidth = Math.round(img.naturalWidth * targetScale);
                    const baseHeight = Math.round(img.naturalHeight * targetScale);
                    canvas.width = baseWidth; // high-res backing store
                    canvas.height = baseHeight;
                    // Responsive display: let grid/card define width; maintain aspect ratio
                    canvas.style.width = '100%';
                    canvas.style.maxWidth = baseWidth + 'px';
                    canvas.style.height = 'auto';
                    canvas.style.display = 'block';
                    if(ctx){
                        try { ctx.clearRect(0,0,baseWidth,baseHeight); } catch(e){ console.warn('clearRect failed (ctx maybe null)', e); }
                        try { ctx.drawImage(img,0,0,baseWidth,baseHeight); } catch(e){ console.warn('drawImage failed', e); }
                    } else {
                        console.warn('Canvas context missing for chart', key);
                    }
                    const mapLinear=(val,v1,p1,v2,p2)=>{ const slope=(p2-p1)/(v2-v1); return p1 + slope*(val - v1); };
                    let x, weightY=null, heightY=null;
                    if (cfg.chartType==='WFH') { if(!isNaN(height)&&!isNaN(weight)){ x=mapLinear(height,cfg.heightRef1,cfg.heightXRef1,cfg.heightRef2,cfg.heightXRef2); weightY=mapLinear(weight,cfg.weightRef1,cfg.weightYRef1,cfg.weightRef2,cfg.weightYRef2);} }
                    else if (cfg.chartType==='HC') { if(!isNaN(headCircumference)){ x=mapLinear(age,cfg.ageRef1,cfg.headXRef1,cfg.ageRef2,cfg.headXRef2); weightY=mapLinear(headCircumference,cfg.headRef1,cfg.headYRef1,cfg.headRef2,cfg.headYRef2);} }
                    else {
                        // AGE chart: allow plotting with only one measurement present
                        x = mapLinear(age,cfg.ageRef1,cfg.weightXRef1,cfg.ageRef2,cfg.weightXRef2);
                        if(!isNaN(weight)) weightY=mapLinear(weight,cfg.weightRef1,cfg.weightYRef1,cfg.weightRef2,cfg.weightYRef2);
                        if(!isNaN(height)) heightY=mapLinear(height,cfg.heightRef1,cfg.heightYRef1,cfg.heightRef2,cfg.heightYRef2);
                    }
                    const curves=await loadCurvesForChartKey(key);
                    if(curves){
                        ctx.lineWidth=1.4; ctx.globalAlpha=0.82; const percentileColors={'P3':'#800080','P10':'#ff00ff','P25':'#00ffff','P50':'#00ff00','P75':'#ffff00','P90':'#ffa500','P97':'#ff0000'};
                        for(const c of Object.values(curves)){
                            if(c.type==='head'&&cfg.chartType!=='HC') continue; if(c.type==='height'&&cfg.chartType==='WFH') continue;
                            ctx.beginPath();
                            for(let i=0;i<c.points.length;i++){
                                const px=c.points[i].x*(canvas.width/img.naturalWidth);
                                const py=c.points[i].y*(canvas.height/img.naturalHeight);
                                if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
                            }
                            ctx.strokeStyle=percentileColors[c.percentile]||'#888';
                            ctx.stroke();
                        }
                        ctx.globalAlpha=1;
                    }
                    if(typeof x!=='undefined'){
                        const scaledX = x * (canvas.width / img.naturalWidth);
                        ctx.font='10px Arial'; ctx.textBaseline='middle';
                        const ageYears = age.toFixed(2).replace(/\.00$/,'');
                        // Draw weight point if available
                        if(weightY!==null){
                            const scaledWeightY=weightY*(canvas.height/ img.naturalHeight);
                            ctx.fillStyle=(cfg.chartType==='HC')?'#800080':'#ff0000';
                            ctx.beginPath(); ctx.arc(scaledX,scaledWeightY,5,0,2*Math.PI); ctx.fill();
                            if(cfg.chartType==='AGE'){
                                const wLabel=`Age ${ageYears}y, W ${weight}kg`;
                                ctx.fillStyle='#ff0000'; ctx.fillText(wLabel, scaledX+10, scaledWeightY-8);
                            } else if(cfg.chartType==='WFH') {
                                const wLabel=`Ht ${height}cm, W ${weight}kg`;
                                ctx.fillStyle='#ff0000'; ctx.fillText(wLabel, scaledX+10, scaledWeightY-8);
                            } else if(cfg.chartType==='HC') {
                                const hcLabel=`Age ${age.toFixed(2)}y, HC ${headCircumference}cm`;
                                ctx.fillStyle='#800080'; ctx.fillText(hcLabel, scaledX+10, scaledWeightY-8);
                            }
                        }
                        // Draw height point if available (AGE chart only)
                        if(cfg.chartType==='AGE' && heightY!==null){
                            const scaledHeightY=heightY*(canvas.height/ img.naturalHeight);
                            ctx.fillStyle='#0066cc'; ctx.beginPath(); ctx.arc(scaledX,scaledHeightY,5,0,2*Math.PI); ctx.fill();
                            if(weightY!==null){
                                // Connect if both present
                                const scaledWeightY=weightY*(canvas.height/ img.naturalHeight);
                                ctx.strokeStyle='#666'; ctx.setLineDash([2,2]); ctx.beginPath(); ctx.moveTo(scaledX,scaledWeightY); ctx.lineTo(scaledX,scaledHeightY); ctx.stroke(); ctx.setLineDash([]);
                            }
                            const hLabel=`Age ${ageYears}y, Ht ${height}cm`;
                            ctx.fillStyle='#0066cc'; ctx.fillText(hLabel, scaledX+10, (weightY!==null? (scaledHeightY+8): (scaledHeightY-8)));
                        }
                    }
                    // Independent percentile calculations for available measures
                    let weightPct=null, heightPct=null;
                    if(curves && typeof x!=='undefined'){
                        if(cfg.chartType==='HC' && weightY!==null){
                            weightPct=calculatePercentileFromCurves(curves,x,weightY,'head');
                        } else if(cfg.chartType==='WFH' && weightY!==null){
                            weightPct=calculatePercentileFromCurves(curves,x,weightY,'weight');
                        } else if(cfg.chartType==='AGE'){
                            if(weightY!==null) weightPct=calculatePercentileFromCurves(curves,x,weightY,'weight');
                            if(heightY!==null) heightPct=calculatePercentileFromCurves(curves,x,heightY,'height');
                        }
                    }
                    const metricsRow=document.createElement('div'); metricsRow.style.display='flex'; metricsRow.style.flexWrap='wrap'; metricsRow.style.gap='6px';
                    const buildBadge=(label,result)=>{ if(!result) return null; let text; if(result.type==='extreme'&&result.displayPercentile) text=`${label}: ${result.displayPercentile}`; else { text=`${label}: P${result.percentile.toFixed(1)}`; if(result.type==='range'||result.type==='interpolated_with_range') text+=` (${result.range})`; } const badge=document.createElement('span'); badge.textContent=text; badge.style.fontSize='11px'; badge.style.padding='3px 6px'; badge.style.borderRadius='12px'; badge.style.background='#eef2f7'; badge.style.border='1px solid #d0d7de'; badge.style.lineHeight='1.2'; const accent=label.startsWith('W/H')?'#6f42c1':(label.startsWith('Head')?'#800080':(label.startsWith('Height')?'#0066cc':'#ff0000')); badge.style.boxShadow=`inset 0 0 0 2px ${accent}20`; if(result.percentile!==undefined){ const p=result.percentile; if(p<3||p>97) badge.style.background='#ffe5e5'; else if(p<10||p>90) badge.style.background='#ffeccc'; else if(p>=25&&p<=75) badge.style.background='#e2f7e2'; } return badge; };
                    if(cfg.chartType==='HC') { const b=buildBadge('Head',weightPct); if(b) metricsRow.appendChild(b); }
                    else if(cfg.chartType==='WFH') {
                        const wfhBadge = buildBadge('W/H',weightPct);
                        if (wfhBadge) metricsRow.appendChild(wfhBadge);
                        const extremeWfh = (weightPct && ((weightPct.percentile && (weightPct.percentile>97 || weightPct.percentile<3)) || (weightPct.type==='extreme' && weightPct.displayPercentile && (weightPct.displayPercentile.includes('>P97') || weightPct.displayPercentile.includes('<P3')))));
                        if(extremeWfh) console.log('WFH extreme detected, computing W/H%...', {weight, height, chart:key, percentile: weightPct.percentile, display: weightPct.displayPercentile});
                        if (extremeWfh) {
                            computeWeightForHeightPercent(baseSex, height, weight).then(ratioInfo=>{
                                if (!ratioInfo) return;
                                const pctInt = Math.round(ratioInfo.percent);
                                console.log('WFH% computation result', ratioInfo);
                                // annotate underlying result object so aggregate table & panel can use it
                                if (weightPct) weightPct.wfhPercent = ratioInfo.percent;
                                if (wfhBadge && wfhBadge.textContent.indexOf('%)')===-1) {
                                    wfhBadge.textContent += ` (${pctInt}%)`;
                                } else {
                                    const badge=document.createElement('span');
                                    badge.textContent = `W/H%: ${pctInt}%`;
                                    badge.style.fontSize='11px'; badge.style.padding='3px 6px'; badge.style.borderRadius='12px'; badge.style.background='#f0eefc'; badge.style.border='1px solid #d0d7de'; badge.style.lineHeight='1.2'; badge.style.boxShadow='inset 0 0 0 2px #6f42c120';
                                    metricsRow.appendChild(badge);
                                }
                                const wfhPanelBox = document.getElementById('wfhPercentileDisplay');
                                if (wfhPanelBox && !/\(\d+%\)/.test(wfhPanelBox.textContent)) {
                                    wfhPanelBox.textContent = wfhPanelBox.textContent.replace(/\s*$/, '') + ` (${pctInt}%)`;
                                }
                                try {
                                    const resultsContent = document.getElementById('resultsContent');
                                    if (resultsContent) {
                                        const existing = resultsContent.querySelector('[data-wfh-process="1"]');
                                        if (existing) existing.remove();
                                        const box = document.createElement('div');
                                        box.setAttribute('data-wfh-process','1');
                                        box.style.marginTop='12px';
                                        box.style.fontSize='12px';
                                        box.style.lineHeight='1.4';
                                        const r = ratioInfo;
                                        const extremeLabel = (weightPct.percentile && weightPct.percentile<3) || (weightPct.displayPercentile && weightPct.displayPercentile.includes('<P3')) ? '<=P3' : '>=P97';
                                        box.innerHTML = `<div style=\"padding:10px;border:1px solid #d0d7de;border-radius:8px;background:#fafbfc;\"><strong>W/H% Derivation (${extremeLabel})</strong><br>`+
                                            `Input Height: <strong>${height} cm</strong><br>`+
                                            `Input Weight: <strong>${weight} kg</strong><br>`+
                                            `Selected AGE Chart: <code>${r.sourceChart}</code><br>`+
                                            `Interpolated Age at Median Height (P50 Height): <strong>${r.ageAtMedianHeight.toFixed(3)} years</strong><br>`+
                                            `Interpolated Median (P50) Weight at that Age: <strong>${r.weight50AtAge.toFixed(2)} kg</strong><br>`+
                                            `Formula: (Observed Weight / Median Weight_at_same_height_age) * 100<br>`+
                                            `= (${weight} / ${r.weight50AtAge.toFixed(2)}) * 100 = <strong>${r.percent.toFixed(1)}%</strong>`+
                                            `<div style=\"margin-top:4px;color:#555;\">This percentage contextualizes how far ${(extremeLabel==='<=P3')?'below':'above'} the median weight the child is for the stature-equivalent age derived from the median height curve.</div>`+
                                            `</div>`;
                                        resultsContent.appendChild(box);
                                        const resultsDiv=document.getElementById('results'); if(resultsDiv) resultsDiv.style.display='block';
                                    }
                                } catch(procErr){ console.warn('Failed to render W/H% process details', procErr); }
                            });
                        }
                    } else {
                        // AGE chart: append only existing badges; instrument single-measure cases
                        if(weightPct){ const wb=buildBadge('Weight',weightPct); if(wb) metricsRow.appendChild(wb); }
                        if(heightPct){ const hb=buildBadge('Height',heightPct); if(hb) metricsRow.appendChild(hb); }
                        if(!weightPct || !heightPct){
                            console.debug('Single-measure percentile info', {chart:key, haveWeight:!!weightPct, haveHeight:!!heightPct, weightValue:weight, heightValue:height});
                        }
                    }
                    // Extra: if AGE chart and weight extreme (<P3 or >P97), compute % of median weight at this age
                    if (cfg.chartType==='AGE' && weightPct && ((weightPct.percentile && (weightPct.percentile<3 || weightPct.percentile>97)) || (weightPct.type==='extreme' && weightPct.displayPercentile))) {
                        try {
                            const curves = await loadCurvesForChartKey(key);
                            if (curves) {
                                const weight50 = Object.values(curves).find(c=>c.type==='weight' && c.percentile==='P50');
                                if (weight50 && typeof x!=='undefined') {
                                    // Interpolate median weight at this exact age (x pixel)
                                    // Map pixel x back to age domain using weight anchors
                                    const pxToAge = (pxVal)=> cfg.ageRef1 + (pxVal - cfg.weightXRef1) * (cfg.ageRef2 - cfg.ageRef1)/(cfg.weightXRef2 - cfg.weightXRef1);
                                    const targetAge = pxToAge(x);
                                    const pxToWeight = (py)=> cfg.weightRef1 + (py - cfg.weightYRef1)*(cfg.weightRef2-cfg.weightRef1)/(cfg.weightYRef2-cfg.weightYRef1);
                                    const wPts = weight50.points.map(p=>({ age: pxToAge(p.x), wt: pxToWeight(p.y) })).sort((a,b)=>a.age-b.age);
                                    let medianAtAge=null;
                                    for (let i=0;i<wPts.length-1;i++) {
                                        const a1=wPts[i].age, a2=wPts[i+1].age;
                                        if (targetAge>=a1 && targetAge<=a2 && a1!==a2) {
                                            const frac=(targetAge - a1)/(a2 - a1);
                                            medianAtAge = wPts[i].wt + frac*(wPts[i+1].wt - wPts[i].wt);
                                            break;
                                        }
                                    }
                                    if (medianAtAge!==null && medianAtAge>0 && !isNaN(weight)) {
                                        const pctOfMedian = (weight/medianAtAge)*100;
                                        if (weightPct) weightPct.percentOfMedian = pctOfMedian;
                                        // Find existing weight badge
                                        const weightBadge = Array.from(metricsRow.querySelectorAll('span')).find(sp=>sp.textContent.startsWith('Weight:'));
                                        if (weightBadge && !/\(\d+%\)/.test(weightBadge.textContent)) {
                                            weightBadge.textContent += ` (${pctOfMedian.toFixed(0)}%)`;
                                        } else if(!weightBadge){
                                            const badge=document.createElement('span');
                                            badge.textContent=`Weight%: ${pctOfMedian.toFixed(0)}%`; // already contains % only once
                                            badge.style.fontSize='11px'; badge.style.padding='3px 6px'; badge.style.borderRadius='12px'; badge.style.background='#f0eefc'; badge.style.border='1px solid #d0d7de'; badge.style.lineHeight='1.2'; badge.style.boxShadow='inset 0 0 0 2px #ff000020';
                                            metricsRow.appendChild(badge);
                                        }
                                        // Append derivation details in results
                                        const resultsContent = document.getElementById('resultsContent');
                                        if (resultsContent) {
                                            const existing = resultsContent.querySelector('[data-weight-extreme-process="1"]');
                                            if (existing) existing.remove();
                                            const box=document.createElement('div');
                                            box.setAttribute('data-weight-extreme-process','1');
                                            box.style.marginTop='12px'; box.style.fontSize='12px'; box.style.lineHeight='1.4';
                                            box.innerHTML = `<div style=\"padding:10px;border:1px solid #d0d7de;border-radius:8px;background:#fff8f8;\"><strong>Weight Extreme % of Median</strong><br>`+
                                                `Age: <strong>${targetAge.toFixed(3)} years</strong><br>`+
                                                `Observed Weight: <strong>${weight} kg</strong><br>`+
                                                `Interpolated Median (P50) Weight at Age: <strong>${medianAtAge.toFixed(2)} kg</strong><br>`+
                                                `Formula: (Observed / Median) * 100 = (${weight} / ${medianAtAge.toFixed(2)}) * 100 = <strong>${pctOfMedian.toFixed(1)}%</strong><br>`+
                                                `<div style=\"margin-top:4px;color:#555;\">Provides quantitative context for deviation when percentile is beyond standard range (P3–P97).</div>`+
                                                `</div>`;
                                            resultsContent.appendChild(box);
                                            const resultsDiv=document.getElementById('results'); if(resultsDiv) resultsDiv.style.display='block';
                                        }
                                        // Panel augmentation: add % of P50 if not already
                                        const weightPanelBox = document.getElementById('weightPercentileDisplay');
                                        if (weightPanelBox && !/\(\d+%\)/.test(weightPanelBox.textContent)) {
                                            weightPanelBox.textContent = weightPanelBox.textContent.replace(/\s*$/, '') + ` (${pctOfMedian.toFixed(0)}%)`;
                                        }
                                    }
                                }
                            }
                        } catch(extErr){ console.warn('Extreme weight median % computation failed', extErr); }
                    }
                    // Extra: if AGE chart and height extreme (<P3 or >P97), compute % of median height at this age
                    if (cfg.chartType==='AGE' && heightPct && ((heightPct.percentile && (heightPct.percentile<3 || heightPct.percentile>97)) || (heightPct.type==='extreme' && heightPct.displayPercentile))) {
                        try {
                            const curves = await loadCurvesForChartKey(key);
                            if (curves) {
                                const height50 = Object.values(curves).find(c=>c.type==='height' && c.percentile==='P50');
                                if (height50 && typeof x!=='undefined' && heightY!==null) {
                                    const pxToAge = (pxVal)=> cfg.ageRef1 + (pxVal - cfg.weightXRef1) * (cfg.ageRef2 - cfg.ageRef1)/(cfg.weightXRef2 - cfg.weightXRef1);
                                    const targetAge = pxToAge(x);
                                    const pyToHeight = (py)=> cfg.heightRef1 + (py - cfg.heightYRef1)*(cfg.heightRef2-cfg.heightRef1)/(cfg.heightYRef2-cfg.heightYRef1);
                                    const hPts = height50.points.map(p=>({ age: pxToAge(p.x), ht: pyToHeight(p.y) })).sort((a,b)=>a.age-b.age);
                                    let medianHtAtAge=null;
                                    for (let i=0;i<hPts.length-1;i++) {
                                        const a1=hPts[i].age, a2=hPts[i+1].age;
                                        if (targetAge>=a1 && targetAge<=a2 && a1!==a2) {
                                            const frac=(targetAge - a1)/(a2 - a1);
                                            medianHtAtAge = hPts[i].ht + frac*(hPts[i+1].ht - hPts[i].ht);
                                            break;
                                        }
                                    }
                                    if (medianHtAtAge!==null && medianHtAtAge>0 && !isNaN(height)) {
                                        const pctOfMedian = (height/medianHtAtAge)*100;
                                        if (heightPct) heightPct.percentOfMedian = pctOfMedian;
                                        // Find existing height badge
                                        const heightBadge = Array.from(metricsRow.querySelectorAll('span')).find(sp=>sp.textContent.startsWith('Height:'));
                                        if (heightBadge && !/\(\d+%\)/.test(heightBadge.textContent)) {
                                            heightBadge.textContent += ` (${pctOfMedian.toFixed(0)}%)`;
                                        } else if(!heightBadge){
                                            const badge=document.createElement('span');
                                            badge.textContent=`Height%: ${pctOfMedian.toFixed(0)}%`;
                                            badge.style.fontSize='11px'; badge.style.padding='3px 6px'; badge.style.borderRadius='12px'; badge.style.background='#eef7ff'; badge.style.border='1px solid #d0d7de'; badge.style.lineHeight='1.2'; badge.style.boxShadow='inset 0 0 0 2px #0066cc20';
                                            metricsRow.appendChild(badge);
                                        }
                                        // Derivation details in results
                                        const resultsContent = document.getElementById('resultsContent');
                                        if (resultsContent) {
                                            const existing = resultsContent.querySelector('[data-height-extreme-process="1"]');
                                            if (existing) existing.remove();
                                            const box=document.createElement('div'); box.setAttribute('data-height-extreme-process','1'); box.style.marginTop='12px'; box.style.fontSize='12px'; box.style.lineHeight='1.4';
                                            box.innerHTML = `<div style=\"padding:10px;border:1px solid #d0d7de;border-radius:8px;background:#f5faff;\"><strong>Height Extreme % of Median</strong><br>`+
                                                `Age: <strong>${targetAge.toFixed(3)} years</strong><br>`+
                                                `Observed Height: <strong>${height} cm</strong><br>`+
                                                `Interpolated Median (P50) Height at Age: <strong>${medianHtAtAge.toFixed(2)} cm</strong><br>`+
                                                `Formula: (Observed / Median) * 100 = (${height} / ${medianHtAtAge.toFixed(2)}) * 100 = <strong>${pctOfMedian.toFixed(1)}%</strong><br>`+
                                                `<div style=\"margin-top:4px;color:#555;\">Quantifies deviation when height percentile lies outside standard range (P3–P97).</div>`+
                                                `</div>`;
                                            resultsContent.appendChild(box);
                                            const resultsDiv=document.getElementById('results'); if(resultsDiv) resultsDiv.style.display='block';
                                        }
                                        // Panel augmentation
                                        const heightPanelBox = document.getElementById('heightPercentileDisplay');
                                        if (heightPanelBox && !/\(\d+%\)/.test(heightPanelBox.textContent)) {
                                            heightPanelBox.textContent = heightPanelBox.textContent.replace(/\s*$/, '') + ` (${pctOfMedian.toFixed(0)}%)`;
                                        }
                                    }
                                }
                            }
                        } catch(extErr){ console.warn('Extreme height median % computation failed', extErr); }
                    }
                    card.appendChild(metricsRow);
                    // Push available percentiles (weight and/or height independently)
                    if(weightPct) aggregate.push({chart:key, measure: cfg.chartType==='HC'?'Head':(cfg.chartType==='WFH'?'W/H':'Weight'), result:weightPct});
                    if(heightPct) aggregate.push({chart:key, measure:'Height', result:heightPct});
                    resolve();
                };
            });
            img.src=cfg.imageSrc; multiContainer.appendChild(card); promises.push(p);
        });

        console.log('Applicable charts for multi-plot:', applicable.map(a=>a[0]));
        Promise.all(promises).then(()=>{
            if(aggregate.length){
                const resultsDiv=document.getElementById('results'); const resultsContent=document.getElementById('resultsContent'); resultsDiv.style.display='block';
                const summarize=r=>{ 
                    if(r.result.type==='extreme'&&r.result.displayPercentile){
                        let base=r.result.displayPercentile; 
                        if(r.result.wfhPercent && !base.match(/\(\d+%\)/)) base += ` (${Math.round(r.result.wfhPercent)}%)`;
                        if(r.result.percentOfMedian) base += ` (${r.result.percentOfMedian.toFixed(0)}%)`;
                        return base; 
                    }
                    let base=`P${r.result.percentile.toFixed(1)}`; 
                    if(r.result.range) base+=` (${r.result.range})`; 
                    if(r.result.wfhPercent) base += ` (${Math.round(r.result.wfhPercent)}%)`;
                    if(r.result.percentOfMedian) base += ` (${r.result.percentOfMedian.toFixed(0)}%)`;
                    return base; 
                };
                const rows=aggregate.map(r=>`<tr><td>${r.chart}</td><td>${r.measure}</td><td>${summarize(r)}</td><td>${r.result.type}</td><td>${r.result.confidence}</td></tr>`).join('');
                const table=`<div style=\"margin-top:12px;\"><strong>Aggregate Percentiles</strong><table style=\"width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;\">`+
                `<thead><tr style=\\"background:#eee\\"><th style=\\"text-align:left;padding:4px;\\">Chart</th><th style=\\"text-align:left;padding:4px;\\">Measure</th><th style=\\"text-align:left;padding:4px;\\">Percentile</th><th style=\\"text-align:left;padding:4px;\\">Type</th><th style=\\"text-align:left;padding:4px;\\">Confidence</th></tr></thead>`+
                `<tbody>${rows}</tbody></table></div>`;
                const existing=resultsContent.querySelectorAll('[data-aggregate-table=\"1\"]'); existing.forEach(el=>el.remove());
                const wrapper=document.createElement('div'); wrapper.setAttribute('data-aggregate-table','1'); wrapper.innerHTML=table; resultsContent.appendChild(wrapper);
            }
            if (typeof this.updateMultiPercentilePanel==='function') this.updateMultiPercentilePanel(aggregate);
        });
    // End handleMultiPlot
};

// Update the main stacked percentile panel based on multi-plot aggregate results
GrowthChartPlotter.prototype.updateMultiPercentilePanel = function(aggregate){
    const panel = document.getElementById('percentilePanel');
    if(!panel) return;
    // Build first-seen measurement map
    const measurementMap = {};
    aggregate.forEach(entry => {
        // Record first occurrence for each measure (Weight, Height, W/H, Head)
        if (!measurementMap[entry.measure]) measurementMap[entry.measure] = entry.result;
    });
    panel.style.display='block';
    const header = document.getElementById('percentileHeader');
    if (header) header.textContent = '📊 Combined Percentile Analysis';
    const boxes = {
        weight: document.getElementById('weightPercentileDisplay'),
        height: document.getElementById('heightPercentileDisplay'),
        wfh: document.getElementById('wfhPercentileDisplay'),
        head: document.getElementById('headPercentileDisplay')
    };
    const valueBoxes = {
        weight: document.getElementById('weightValueDisplay'),
        height: document.getElementById('heightValueDisplay'),
        wfh: document.getElementById('wfhValueDisplay'),
        head: document.getElementById('headValueDisplay')
    };
    // Reset
    Object.values(boxes).forEach(el=>{ if(el){ el.textContent='-'; el.style.background='rgba(255,255,255,0.2)'; }});
    // Extract raw input values for display
    const rawWeight = parseFloat(document.getElementById('weight').value);
    const rawHeight = parseFloat(document.getElementById('height').value);
    const rawHead = parseFloat(document.getElementById('headCircumference').value);

    const formatPct = (res) => {
        if(!res) return '-';
        if(res.type==='extreme' && res.displayPercentile) return `${res.displayPercentile}`;
        if(res.percentile !== undefined) {
            if (res.range) return `${res.range} (P${res.percentile.toFixed(1)})`;
            return `P${res.percentile.toFixed(1)}`;
        }
        return '-';
    };
    const applyComposite = (pctEl, valueEl, label, value, unit, res) => {
        if(!pctEl) return;
        if(valueEl) valueEl.textContent = isNaN(value)? '-' : `${value}${unit}`;
        if(!res){ pctEl.textContent='-'; pctEl.style.background='rgba(255,255,255,0.15)'; return; }
        let pctStr = formatPct(res);
        pctEl.textContent = pctStr;
        if(res.type==='extreme' && res.displayPercentile) pctEl.style.background='rgba(255,0,0,0.3)';
        else if(res.percentile !== undefined) pctEl.style.background=this.getPercentileColor(res.percentile,0.25);
    };

    // Order: weight, height, W/H, HC
    // If only one of weight/height exists, still attempt to show its percentile (measurementMap entry)
    applyComposite(boxes.weight, valueBoxes.weight, 'Weight', rawWeight, 'kg', measurementMap['Weight']);
    applyComposite(boxes.height, valueBoxes.height, 'Height', rawHeight, 'cm', measurementMap['Height']);
    // For W/H, show derived value if both weight & height exist (e.g., 55kg/160cm) else '-'
    if (!isNaN(rawWeight) && !isNaN(rawHeight)) {
        valueBoxes.wfh.textContent = `${rawWeight}kg/${rawHeight}cm`;
    } else if (valueBoxes.wfh) {
        valueBoxes.wfh.textContent='-';
    }
    applyComposite(boxes.wfh, valueBoxes.wfh, 'W/H', NaN, '', measurementMap['W/H']);
    // If W/H extreme, trigger percentage computation (panel-side safety)
    const wfhRes = measurementMap['W/H'];
    // Fallback: if extreme but no displayPercentile given, synthesize <P3 or >P97
    if (wfhRes && !wfhRes.displayPercentile && wfhRes.percentile!==undefined && (wfhRes.percentile<3 || wfhRes.percentile>97)) {
        wfhRes.displayPercentile = wfhRes.percentile<3? '<P3' : '>P97';
        if (boxes.wfh && boxes.wfh.textContent==='-') boxes.wfh.textContent = wfhRes.displayPercentile;
    }
    const rawW = rawWeight, rawH = rawHeight;
    if (wfhRes && ( (wfhRes.percentile && (wfhRes.percentile>97 || wfhRes.percentile<3)) || (wfhRes.type==='extreme' && wfhRes.displayPercentile && (wfhRes.displayPercentile.indexOf('>P97')!==-1 || wfhRes.displayPercentile.indexOf('<P3')!==-1)) ) ) {
        // Attempt to append (%) if not already present
        if (boxes.wfh && boxes.wfh.textContent.indexOf('%)')===-1 && !isNaN(rawW) && !isNaN(rawH)) {
            const sexSel = document.getElementById('sex');
            const baseSex = (sexSel && sexSel.value && sexSel.value.startsWith('Girl'))? 'Girl':'Boy';
            // Reuse computeWeightForHeightPercent defined on window.chartPlotter.handleMultiPlot scope is not accessible here, so lightweight reimplementation using cached curves
            (async ()=>{
                const candidates=[baseSex, `${baseSex}_2_19`, `${baseSex}_0_2`];
                let chosenKey=null, cfg=null;
                for(const k of candidates){ const c=CHART_CONFIGS[k]; if(c && c.chartType==='AGE'){ const hMin=Math.min(c.heightRef1,c.heightRef2); const hMax=Math.max(c.heightRef1,c.heightRef2); if(rawH>=hMin && rawH<=hMax){ chosenKey=k; cfg=c; break; } } }
                if(!chosenKey){ for(const k of candidates){ const c=CHART_CONFIGS[k]; if(c && c.chartType==='AGE'){ chosenKey=k; cfg=c; break; } } }
                if(!cfg) return;
                const curves = await loadCurvesForChartKey(chosenKey);
                if(!curves) return;
                const h50=Object.values(curves).find(c=>c.type==='height' && c.percentile==='P50');
                const w50=Object.values(curves).find(c=>c.type==='weight' && c.percentile==='P50');
                if(!h50||!w50) return;
                const pxToAge=(px)=>{ const x1=cfg.weightXRef1 ?? cfg.heightXRef1; const x2=cfg.weightXRef2 ?? cfg.heightXRef2; return cfg.ageRef1 + (px - x1)*(cfg.ageRef2-cfg.ageRef1)/(x2-x1); };
                const pyToHeight=(py)=> cfg.heightRef1 + (py - cfg.heightYRef1)*(cfg.heightRef2-cfg.heightRef1)/(cfg.heightYRef2-cfg.heightYRef1);
                const pyToWeight=(py)=> cfg.weightRef1 + (py - cfg.weightYRef1)*(cfg.weightRef2-cfg.weightRef1)/(cfg.weightYRef2-cfg.weightYRef1);
                const hPts=h50.points.map(p=>({age:pxToAge(p.x), h:pyToHeight(p.y)})).sort((a,b)=>a.age-b.age);
                let ageAt=null; for(let i=0;i<hPts.length-1;i++){ const h1=hPts[i].h,h2=hPts[i+1].h; if(rawH>=Math.min(h1,h2)&&rawH<=Math.max(h1,h2)&&h1!==h2){ const f=(rawH-h1)/(h2-h1); ageAt=hPts[i].age + f*(hPts[i+1].age-hPts[i].age); break; } }
                if(ageAt===null) return;
                const wPts=w50.points.map(p=>({age:pxToAge(p.x), w:pyToWeight(p.y)})).sort((a,b)=>a.age-b.age);
                let w50At=null; for(let i=0;i<wPts.length-1;i++){ const a1=wPts[i].age,a2=wPts[i+1].age; if(ageAt>=a1&&ageAt<=a2&&a1!==a2){ const f=(ageAt-a1)/(a2-a1); w50At=wPts[i].w + f*(wPts[i+1].w-wPts[i].w); break; } }
                if(!w50At||w50At<=0) return;
                const pct=Math.round(rawW / w50At *100);
                wfhRes.wfhPercent = pct;
                if (boxes.wfh && !/\(\d+%\)/.test(boxes.wfh.textContent)) {
                    boxes.wfh.textContent = boxes.wfh.textContent + ` (${pct}%)`;
                }
            })();
        }
    }
    applyComposite(boxes.head, valueBoxes.head, 'HC', rawHead, 'cm', measurementMap['Head']);
    // Append compact percent to panel weight/height if extreme percentOfMedian available
    const weightRes = measurementMap['Weight'];
    if (weightRes && weightRes.percentOfMedian && boxes.weight && !/\(\d+%\)/.test(boxes.weight.textContent) && ( (weightRes.percentile&& (weightRes.percentile<3||weightRes.percentile>97)) || weightRes.type==='extreme')) {
        boxes.weight.textContent = boxes.weight.textContent.replace(/\s*$/, '') + ` (${weightRes.percentOfMedian.toFixed(0)}%)`;
    }
    const heightRes = measurementMap['Height'];
    if (heightRes && heightRes.percentOfMedian && boxes.height && !/\(\d+%\)/.test(boxes.height.textContent) && ( (heightRes.percentile&& (heightRes.percentile<3||heightRes.percentile>97)) || heightRes.type==='extreme')) {
        boxes.height.textContent = boxes.height.textContent.replace(/\s*$/, '') + ` (${heightRes.percentOfMedian.toFixed(0)}%)`;
    }
    const details = document.getElementById('percentileDetails');
    if(details) details.textContent = 'Magnetic curves based percentile computation (multi-chart)';
};