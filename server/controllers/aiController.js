const axios = require('axios');

// ─── Timeout helper ───────────────────────────────────────────────────────────
const withTimeout = (promise, ms, fallback) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]).catch(() => fallback);

// ─── Comprehensive severity keywords ─────────────────────────────────────────
const SEVERITY = {
  Emergency: [
    // Flooding & water disasters
    'flood','flooding','inundation','submerged','waterlogged road','overflow',
    'sewage overflow','drain overflow','burst pipe','water gushing',
    // Fire & explosion
    'fire','burning','flames','smoke','explosion','blast','gas leak',
    // Structural collapse
    'collapse','collapsed','building collapse','wall collapse','fallen',
    'sinkhole','cave in','landslide','debris',
    // Electrical danger
    'electrocution','live wire','exposed wire','sparking','transformer fire',
    'electric shock','fallen pole','broken transformer',
    // Medical/safety emergency
    'accident','hazard','dangerous','critical','emergency','urgent',
    'toxic','chemical spill','oil spill','contamination',
    // Specific civic emergencies
    'broken manhole','open manhole','uncovered manhole',
    'sewage gushing','raw sewage','overflow drainage',
  ],
  High: [
    // Road issues
    'pothole','potholes','crater','road damage','road crack','broken road',
    'damaged road','road flooding','waterlogging','road cave','road blocked',
    'road obstruction','road hazard','missing road divider',
    // Water issues
    'leak','leaking','water leak','pipe leak','broken pipe','no water supply',
    'water contamination','dirty water','brown water','water shortage',
    // Electrical issues
    'streetlight broken','streetlight out','no power','power cut','blackout',
    'broken pole','damaged pole','wire hanging','exposed cable',
    // Waste & garbage
    'garbage','garbage pile','waste','waste dumping','illegal dumping',
    'overflowing bin','waste bin','trash','rubbish','filth','rotting waste',
    // Sanitation
    'blocked drain','clogged drain','drain blockage','sewage smell','stench',
    'open drain','overflowing drain','broken drain cover',
    // Trees & vegetation
    'fallen tree','uprooted tree','broken branch','tree blocking road',
  ],
  Medium: [
    // Road surface
    'crack','cracked','worn road','faded marking','road marking',
    'speed bump','broken speed bump','missing signboard','missing sign',
    // Water
    'water puddle','puddle','stagnant water','minor leak','dripping',
    // Electrical
    'flickering light','dim streetlight','intermittent power',
    // Waste
    'litter','littering','scattered garbage','minor dumping',
    // Sanitation
    'dirty public toilet','broken toilet','bad smell','odour',
    'graffiti','vandalism','damaged wall','broken bench',
    // Vegetation
    'overgrown','overgrown bush','tall grass','vegetation','weed',
    // General
    'mud','muddy','paint peeling','rust','rusted','faded',
  ],
  Low: [
    'minor','small issue','slight','surface damage','cosmetic',
    'paint','repainting','faded paint','dirty wall','stain',
    'broken tile','loose tile','cracked tile','pavement crack',
    'missing tile','broken footpath','footpath',
    'noise','complaint','suggestion','feedback','request',
  ],
};

// ─── Department keyword mapping ───────────────────────────────────────────────
// Maps Vision API labels to the CORRECT department
const DEPARTMENT_KEYWORDS = {
  Water: [
    'water','pipe','drain','flood','flooding','leak','leaking','puddle',
    'sewage','drainage','plumbing','valve','tap','fountain','stream',
    'river','waterway','irrigation','moisture','wet','liquid',
    'water supply','water tank','water meter','broken pipe','burst pipe',
    'water contamination','stagnant water','water logging','waterlogged',
  ],
  Electricity: [
    'electricity','electric','electrical','wire','cable','pole','transformer',
    'streetlight','street light','lamp post','power line','power pole',
    'generator','switchboard','meter box','circuit','fuse','voltage',
    'light','lighting','illumination','bulb','LED','neon','spark',
    'blackout','power cut','outage','darkness','dark street',
  ],
  Waste: [
    'garbage','waste','trash','rubbish','litter','dump','dumping',
    'bin','dustbin','garbage bin','waste bin','compost','landfill',
    'plastic','bottle','bag','packaging','debris','junk','scrap',
    'decompose','rot','rotting','smell','odour','stench','pollution',
    'fly tipping','illegal dumping','overflowing',
  ],
  Roads: [
    'road','street','highway','path','pavement','footpath','sidewalk',
    'pothole','crack','asphalt','concrete','tar','gravel','lane',
    'intersection','junction','crossing','signal','traffic','divider',
    'speed bump','sign','signboard','marking','zebra crossing',
    'bridge','flyover','overpass','underpass','tunnel',
    'broken road','damaged road','road cave','road blocked',
  ],
  Sanitation: [
    'toilet','bathroom','restroom','latrine','urinal','sanitation',
    'hygiene','clean','cleaning','sweeping','broom','mop',
    'public toilet','community toilet','open defecation',
    'manhole','sewer','sewage','septic','drainage','drain cover',
    'rat','rodent','pest','mosquito','insect','vector',
    'dirty','filthy','unhygienic','contaminated area',
  ],
};

// ─── Detect correct department from Vision labels ─────────────────────────────
const detectCorrectDepartment = (detectedItems) => {
  const scores = {};
  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    scores[dept] = 0;
    for (const item of detectedItems) {
      for (const keyword of keywords) {
        if (item.includes(keyword) || keyword.includes(item)) {
          scores[dept] += 1;
        }
      }
    }
  }
  // Return department with highest score, null if all zero
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : null;
};

// ─── Detect severity from Vision labels ──────────────────────────────────────
const detectSeverity = (detectedItems) => {
  for (const severity of ['Emergency', 'High', 'Medium', 'Low']) {
    const keywords = SEVERITY[severity];
    const match = detectedItems.some(item =>
      keywords.some(keyword => item.includes(keyword) || keyword.includes(item))
    );
    if (match) return severity;
  }
  return 'Medium'; // Default
};

// ─── Main: Analyze image severity + department ────────────────────────────────
exports.analyzeImageSeverity = async (imageUrl, filedDepartment = null) => {
  try {
    // Call Vision API with 10 second timeout
    const response = await withTimeout(
      axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
        {
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: 'LABEL_DETECTION',       maxResults: 20 },
              { type: 'OBJECT_LOCALIZATION',   maxResults: 10 },
              { type: 'IMAGE_PROPERTIES',      maxResults: 5  },
              { type: 'SAFE_SEARCH_DETECTION'               },
            ],
          }],
        },
        { timeout: 10000 }
      ),
      10000,
      null // fallback if timeout
    );

    // If timed out or failed — return safe defaults immediately
    if (!response) {
      console.log('Vision API timed out — using default severity');
      return { severity: 'Medium', correctDepartment: null, labels: [] };
    }

    const resp    = response.data.responses[0];
    const labels  = (resp.labelAnnotations              || []).map(l => l.description.toLowerCase());
    const objects = (resp.localizedObjectAnnotations    || []).map(o => o.name.toLowerCase());

    // Combine all detected items
    const detectedItems = [...new Set([...labels, ...objects])];

    console.log('✅ Vision AI Detected:', detectedItems);

    // Detect severity
    const severity = detectSeverity(detectedItems);

    // Detect correct department from image
    const correctDepartment = detectCorrectDepartment(detectedItems);

    // Check if filed in wrong department
    let wrongDepartment = false;
    let suggestedDepartment = null;

    if (
      filedDepartment &&
      correctDepartment &&
      correctDepartment !== filedDepartment &&
      correctDepartment !== 'Other'
    ) {
      wrongDepartment    = true;
      suggestedDepartment = correctDepartment;
      console.log(`⚠️ Wrong department! Filed under ${filedDepartment} but image suggests ${correctDepartment}`);
    }

    return {
      severity,
      correctDepartment,
      wrongDepartment,
      suggestedDepartment,
      labels: detectedItems,
    };

  } catch (error) {
    console.log('Vision API Error:', error.message);
    // Never block complaint submission — return safe defaults
    return { severity: 'Medium', correctDepartment: null, labels: [] };
  }
};