/* Demo threshold generator for neonatal bilirubin (illustrative only)
   Produces phototherapy and exchange thresholds with and without risk
   as simplified piecewise curves across 0–336 hours. */

(function(global){
  const HOURS_MAX = 336; // 14 days

  function makeCurve(baseStart, slopeEarly, slopeLate, cap){
    // Simple piecewise linear: steeper rise for first 72h, then slower
    const pts = [];
    for(let h=0; h<=HOURS_MAX; h+=6){
      const slope = h <= 72 ? slopeEarly : slopeLate;
      const val = Math.min(baseStart + slope * h, cap);
      pts.push({ x: h, y: Number(val.toFixed(2))});
    }
    return pts;
  }

  // Build curves per GA and risk profile
  // Note: These are NOT real AAP curves. Values are invented for demo.
  const curves = {};
  const gaList = [35,36,37,38,39,40];
  for(const ga of gaList){
    curves[ga] = {
      no_risk: {
        phototherapy: makeCurve(6 + (ga-35)*0.3, 0.10, 0.03, 22),
        exchange:     makeCurve(10 + (ga-35)*0.35, 0.11, 0.035, 28)
      },
      any_risk: {
        phototherapy: makeCurve(5 + (ga-35)*0.25, 0.09, 0.028, 20),
        exchange:     makeCurve(9 + (ga-35)*0.30, 0.10, 0.030, 26)
      }
    };
  }

  function getCurves(ga, risk){
    const g = curves[ga] || curves[40];
    if(risk === 'both') return g; // return both sets
    if(risk === 'any_risk') return { any_risk: g.any_risk };
    return { no_risk: g.no_risk };
  }

  function interpolateY(points, x){
    // linear interpolation on 6h grid
    if(x <= points[0].x) return points[0].y;
    if(x >= points[points.length-1].x) return points[points.length-1].y;
    for(let i=1;i<points.length;i++){
      const p0 = points[i-1], p1 = points[i];
      if(x <= p1.x){
        const t = (x - p0.x) / (p1.x - p0.x);
        return p0.y + t*(p1.y - p0.y);
      }
    }
    return points[points.length-1].y;
  }

  function recommendation({age, bili, ga, risk}){
    const sets = getCurves(ga, risk);
    let rec = { level: 'No value', detail: 'Provide bilirubin to assess.' };
    if(bili == null || isNaN(bili)) return rec;

    const assessSet = sets.any_risk || sets.no_risk; // choose one set if both
    const pt = interpolateY(assessSet.phototherapy, age);
    const ex = interpolateY(assessSet.exchange, age);

  if(bili >= ex) rec = { level: 'Exchange threshold or higher', detail: 'Escalate care and consider exchange transfusion.' };
  else if(bili >= pt) rec = { level: 'Phototherapy threshold', detail: 'Initiate phototherapy and monitor.' };
    else rec = { level: 'Below treatment threshold', detail: 'Routine monitoring and follow-up.' };

  return Object.assign({}, rec, { pt: Number(pt.toFixed(1)), ex: Number(ex.toFixed(1)) });
  }

  global.DemoThresholds = { getCurves, interpolateY, recommendation, HOURS_MAX };
})(window);
