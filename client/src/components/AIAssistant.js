import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ════════════════════════════════════════════════════════════
// CIVICCONNECT AI ASSISTANT — FINAL COMBINED
// All 26 features from 6 modules
// ════════════════════════════════════════════════════════════

// ─── MODULE 2: Language Engine ────────────────────────────────────────────────

const TR = {
  'ta-IN': {
    greeting:       "வணக்கம்! 👋 நான் உங்கள் CivicConnect உதவியாளர். நீங்கள் புதிய பயனரா? பதிவு என்று சொல்லுங்கள், அல்லது கணக்கு இருந்தால் உள்நுழை என்று சொல்லுங்கள்!",
    newOrExisting:  "பதிவு செய்ய பதிவு என்று சொல்லுங்கள். கணக்கு இருந்தால் உள்நுழை என்று சொல்லுங்கள்!",
    askName:        "உங்கள் முழு பெயர் என்ன?",
    askEmail:       "உங்கள் email முகவரி என்ன?",
    askPassword:    "ஒரு password சொல்லுங்கள்.",
    askLocality:    "நீங்கள் எந்த பகுதியில் வசிக்கிறீர்கள்?",
    askAvatar:      "ஒரு avatar தேர்வு செய்யுங்கள். 1 சிங்கம் 2 புலி 3 நரி 4 ஓநாய் 5 கழுகு 6 வண்ணாத்திபூச்சி 7 டால்பின் 8 யூனிகார்ன்",
    registering:    "சரி! உங்கள் கணக்கை உருவாக்குகிறேன்...",
    askProblem:     "என்ன பிரச்சனையை report செய்ய விரும்புகிறீர்கள்? விவரிக்கவும்.",
    askDept:        "இது எந்த department? தண்ணீர், மின்சாரம், கழிவு, சாலைகள், சுகாதாரம் என்று சொல்லுங்கள்.",
    askLocation:    "பிரச்சனை எங்கு உள்ளது?",
    askImage:       "பிரச்சனையின் புகைப்படம் உள்ளதா? ஆம் அல்லது இல்லை சொல்லுங்கள்.",
    openCamera:     "படம் தேர்வுக்காக திறக்கிறேன்!",
    noPhoto:        "முதலில் புகைப்படம் எடுங்கள், பிறகு வாருங்கள்.",
    duplicateFound: (dept, loc) => `⚠️ "${loc}" பகுதியில் "${dept}" department-ல் இந்த பிரச்சனை ஏற்கனவே report செய்யப்பட்டுள்ளது! Upvote செய்வதன் மூலம் priority அதிகரிக்கும். Upvote செய்யலாமா?`,
    goLogin:        "உங்களை login பக்கத்திற்கு அழைத்துச் செல்கிறேன்!",
    goRegister:     "பதிவு பக்கத்திற்கு அழைத்துச் செல்கிறேன். படிவத்தை நிரப்ப உதவுவேன்!",
    goReport:       "புகார் பதிவு பக்கத்திற்கு அழைத்துச் செல்கிறேன்!",
    goDashboard:    "உங்கள் dashboard-க்கு அழைத்துச் செல்கிறேன்!",
    goFeed:         "சமூக feed-க்கு அழைத்துச் செல்கிறேன்!",
    goLeader:       "leaderboard-க்கு அழைத்துச் செல்கிறேன்!",
    notUnderstood:  "மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்லுங்கள்!",
    langSwitch:     "நீங்கள் மொழி மாற்றினீர்கள்! நாம் தொடரலாமா அல்லது மீண்டும் தொடங்கலாமா?",
    postLogin:      "வரவேற்கிறோம்! புகார் அளிக்கவா, உங்கள் புகார்களை பார்க்கவா, அல்லது community feed-க்கு செல்லவா?",
    midFlowRedirect:(q) => `சரி! இப்போது: ${q}`,
    confirmWord:    (w) => `நீங்கள் "${w}" என்று சொன்னீர்களா? ஆம் என்று சொல்லுங்கள்.`,
    fieldSaved:     (f,v) => `✅ ${f} "${v}" என்று சேமித்தேன்.`,
    tapMic:         "பேச தட்டுங்கள்",
    listening:      "கேட்கிறேன்...",
    speaking:       "பேசுகிறேன்...",
    thinking:       "யோசிக்கிறேன்...",
    typeHere:       "எந்த மொழியிலும் தட்டச்சு செய்யுங்கள்...",
    send:           "அனுப்பு",
  },
  'te-IN': {
    greeting:       "నమస్కారం! 👋 నేను మీ CivicConnect సహాయకుడిని. కొత్త వినియోగదారా? Register అని చెప్పండి, లేదా Login అని చెప్పండి!",
    newOrExisting:  "Register అని చెప్పండి కొత్త account కోసం లేదా Login అని చెప్పండి!",
    askName:        "మీ పూర్తి పేరు ఏమిటి?",
    askEmail:       "మీ email చిరునామా ఏమిటి?",
    askPassword:    "ఒక password చెప్పండి.",
    askLocality:    "మీరు ఏ ప్రాంతంలో నివసిస్తున్నారు?",
    askAvatar:      "ఒక avatar ఎంచుకోండి. 1 సింహం 2 పులి 3 నక్క 4 తోడేలు 5 గరుడ 6 సీతాకోకచిలుక 7 డాల్ఫిన్ 8 యూనికార్న్",
    registering:    "సరే! మీ account సృష్టిస్తున్నాను...",
    askProblem:     "మీరు ఏ సమస్యను report చేయాలనుకుంటున్నారు?",
    askDept:        "ఏ department? నీరు, విద్యుత్, వ్యర్థాలు, రోడ్లు, పారిశుద్ధ్యం అని చెప్పండి.",
    askLocation:    "సమస్య ఎక్కడ ఉంది?",
    askImage:       "ఫోటో మీ దగ్గర ఉందా? అవును లేదా కాదు చెప్పండి.",
    openCamera:     "Image picker తెరుస్తున్నాను!",
    noPhoto:        "ముందు ఫోటో తీయండి, తర్వాత వచ్చి report చేయండి.",
    duplicateFound: (dept, loc) => `⚠️ "${loc}" లో "${dept}" సమస్య ఇప్పటికే report చేయబడింది! Upvote చేయాలా?`,
    goLogin:        "Login పేజీకి తీసుకువెళ్తున్నాను!",
    goRegister:     "Registration పేజీకి తీసుకువెళ్తున్నాను!",
    goReport:       "ఫిర్యాదు నమోదు చేయడానికి తీసుకువెళ్తున్నాను!",
    goDashboard:    "మీ dashboard కి తీసుకువెళ్తున్నాను!",
    goFeed:         "Community feed కి తీసుకువెళ్తున్నాను!",
    goLeader:       "Leaderboard కి తీసుకువెళ్తున్నాను!",
    notUnderstood:  "క్షమించండి, అర్థం కాలేదు. మళ్ళీ చెప్పండి!",
    langSwitch:     "మీరు భాష మార్చారు! కొనసాగించాలా లేదా మళ్ళీ ప్రారంభించాలా?",
    postLogin:      "స్వాగతం! సమస్యను report చేయాలా, complaints చూడాలా?",
    midFlowRedirect:(q) => `సరే! ఇప్పుడు: ${q}`,
    confirmWord:    (w) => `మీరు "${w}" అన్నారా? అవును అని చెప్పండి.`,
    fieldSaved:     (f,v) => `✅ ${f}: "${v}" సేవ్ చేశాను.`,
    tapMic:         "మాట్లాడడానికి నొక్కండి",
    listening:      "వింటున్నాను...",
    speaking:       "మాట్లాడుతున్నాను...",
    thinking:       "ఆలోచిస్తున్నాను...",
    typeHere:       "ఏ భాషలోనైనా టైప్ చేయండి...",
    send:           "పంపు",
  },
  'ml-IN': {
    greeting:       "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ CivicConnect സഹായി. പുതിയ ഉപയോക്താവാണോ? Register എന്ന് പറയൂ, അല്ലെങ്കിൽ Login എന്ന് പറയൂ!",
    newOrExisting:  "Register എന്ന് പറയൂ അല്ലെങ്കിൽ Login എന്ന് പറയൂ!",
    askName:        "നിങ്ങളുടെ പൂർണ്ണ നാമം എന്താണ്?",
    askEmail:       "നിങ്ങളുടെ email വിലാസം എന്താണ്?",
    askPassword:    "ഒരു password പറയൂ.",
    askLocality:    "നിങ്ങൾ ഏത് പ്രദേശത്ത് താമസിക്കുന്നു?",
    askAvatar:      "ഒരു avatar തിരഞ്ഞെടുക്കൂ. 1 സിംഹം 2 കടുവ 3 കുറുക്കൻ 4 ചെന്നായ 5 കഴുകൻ 6 ശലഭം 7 ഡോൾഫിൻ 8 യൂണിക്കോൺ",
    registering:    "ശരി! നിങ്ങളുടെ account ഉണ്ടാക്കുന്നു...",
    askProblem:     "നിങ്ങൾ report ചെയ്യാൻ ആഗ്രഹിക്കുന്ന പ്രശ്നം എന്താണ്?",
    askDept:        "ഏത് department? വെള്ളം, വൈദ്യുതി, മാലിന്യം, റോഡുകൾ, ശുചിത്വം എന്ന് പറയൂ.",
    askLocation:    "പ്രശ്നം എവിടെ ആണ്?",
    askImage:       "ഫോട്ടോ ഉണ്ടോ? അതെ അല്ലെങ്കിൽ ഇല്ല പറയൂ.",
    openCamera:     "Image picker തുറക്കുന്നു!",
    noPhoto:        "ആദ്യം ഫോട്ടോ എടുക്കൂ, പിന്നീട് report ചെയ്യൂ.",
    duplicateFound: (dept, loc) => `⚠️ "${loc}" ൽ "${dept}" പ്രശ്നം ഇതിനകം report ചെയ്തിട്ടുണ്ട്! Upvote ചെയ്യണോ?`,
    goLogin:        "Login പേജിലേക്ക് കൊണ്ടുപോകുന്നു!",
    goRegister:     "Registration പേജിലേക്ക് കൊണ്ടുപോകുന്നു!",
    goReport:       "പരാതി നൽകാൻ കൊണ്ടുപോകുന്നു!",
    goDashboard:    "നിങ്ങളുടെ dashboard ലേക്ക് കൊണ്ടുപോകുന്നു!",
    goFeed:         "Community feed ലേക്ക് കൊണ്ടുപോകുന്നു!",
    goLeader:       "Leaderboard ലേക്ക് കൊണ്ടുപോകുന്നു!",
    notUnderstood:  "ക്ഷമിക്കണം, മനസ്സിലായില്ല. വീണ്ടും പറയൂ!",
    langSwitch:     "നിങ്ങൾ ഭാഷ മാറ്റി! തുടരണോ അതോ പുതുതായി ആരംഭിക്കണോ?",
    postLogin:      "സ്വാഗതം! ഒരു പ്രശ്നം report ചെയ്യണോ, complaints കാണണോ?",
    midFlowRedirect:(q) => `ശരി! ഇപ്പോൾ: ${q}`,
    confirmWord:    (w) => `നിങ്ങൾ "${w}" എന്ന് പറഞ്ഞോ? അതെ എന്ന് പറയൂ.`,
    fieldSaved:     (f,v) => `✅ ${f}: "${v}" സേവ് ചെയ്തു.`,
    tapMic:         "സംസാരിക്കാൻ ടാപ്പ് ചെയ്യൂ",
    listening:      "കേൾക്കുന്നു...",
    speaking:       "സംസാരിക്കുന്നു...",
    thinking:       "ചിന്തിക്കുന്നു...",
    typeHere:       "ഏത് ഭാഷയിലും ടൈപ്പ് ചെയ്യൂ...",
    send:           "അയക്കൂ",
  },
  'hi-IN': {
    greeting:       "नमस्ते! 👋 मैं आपका CivicConnect सहायक हूं। नए user हैं? Register बोलें, या Login बोलें!",
    newOrExisting:  "Register बोलें नया account के लिए, या Login बोलें!",
    askName:        "आपका पूरा नाम क्या है?",
    askEmail:       "आपका email क्या है?",
    askPassword:    "एक password बोलें।",
    askLocality:    "आप किस इलाके में रहते हैं?",
    askAvatar:      "एक avatar चुनें। 1 शेर 2 बाघ 3 लोमड़ी 4 भेड़िया 5 चील 6 तितली 7 डॉल्फिन 8 यूनिकॉर्न",
    registering:    "ठीक है! आपका account बना रहा हूं...",
    askProblem:     "आप कौन सी समस्या report करना चाहते हैं?",
    askDept:        "कौन सा department? पानी, बिजली, कचरा, सड़क, स्वच्छता बोलें।",
    askLocation:    "समस्या कहाँ है?",
    askImage:       "समस्या की फोटो है? हाँ या नहीं बोलें।",
    openCamera:     "Image picker खोल रहा हूं!",
    noPhoto:        "पहले फोटो लें, फिर वापस आएं।",
    duplicateFound: (dept, loc) => `⚠️ "${loc}" में "${dept}" की यह समस्या पहले से report हो चुकी है! Upvote करना चाहते हैं?`,
    goLogin:        "Login page पर ले जा रहा हूं!",
    goRegister:     "Registration page पर ले जा रहा हूं!",
    goReport:       "शिकायत दर्ज करने के लिए ले जा रहा हूं!",
    goDashboard:    "आपके dashboard पर ले जा रहा हूं!",
    goFeed:         "Community feed पर ले जा रहा हूं!",
    goLeader:       "Leaderboard पर ले जा रहा हूं!",
    notUnderstood:  "माफ करें, समझ नहीं आया। फिर से बोलें!",
    langSwitch:     "आपने भाषा बदली! क्या हम जारी रखें या नए सिरे से शुरू करें?",
    postLogin:      "स्वागत है! क्या आप कोई समस्या report करना चाहते हैं या अपनी complaints देखना चाहते हैं?",
    midFlowRedirect:(q) => `ठीक है! अब: ${q}`,
    confirmWord:    (w) => `क्या आपने "${w}" बोला? हाँ बोलें अगर सही है।`,
    fieldSaved:     (f,v) => `✅ ${f}: "${v}" सेव हो गया।`,
    tapMic:         "बात करने के लिए टैप करें",
    listening:      "सुन रहा हूं...",
    speaking:       "बोल रहा हूं...",
    thinking:       "सोच रहा हूं...",
    typeHere:       "किसी भी भाषा में टाइप करें...",
    send:           "भेजें",
  },
  'en-IN': {
    greeting:       "Hello! 👋 I'm your CivicConnect AI Assistant. New user? Say Register to create an account, or say Login if you already have one. I'll guide you every step!",
    newOrExisting:  "Say Register to create an account, or say Login if you have one!",
    askName:        "What is your full name?",
    askEmail:       "What is your email address?",
    askPassword:    "Please say a password for your account.",
    askLocality:    "Which area or locality do you live in?",
    askAvatar:      "Pick an avatar by number. 1 Lion 2 Tiger 3 Fox 4 Wolf 5 Eagle 6 Butterfly 7 Dolphin 8 Unicorn",
    registering:    "Perfect! Creating your account now...",
    askProblem:     "What problem do you want to report? Please describe it.",
    askDept:        "Which department? Say Water, Electricity, Waste, Roads, Sanitation or Other.",
    askLocation:    "Where exactly is the problem located?",
    askImage:       "Do you have a photo of the problem? Say Yes or No.",
    openCamera:     "Opening image picker for you!",
    noPhoto:        "Please take a photo of the problem first, then come back.",
    duplicateFound: (dept, loc) => `⚠️ A "${dept}" issue in "${loc}" has already been reported! Upvoting it will increase its priority. Would you like to upvote it?`,
    goLogin:        "Taking you to the login page!",
    goRegister:     "Taking you to register. I'll help you fill the form!",
    goReport:       "Taking you to report an issue!",
    goDashboard:    "Taking you to your dashboard!",
    goFeed:         "Taking you to the community feed!",
    goLeader:       "Taking you to the leaderboard!",
    notUnderstood:  "Sorry, I didn't understand. Please try again!",
    langSwitch:     "I noticed you switched language! Should we continue or start fresh?",
    postLogin:      "Welcome back! Would you like to report an issue, check your complaints, or go to the community feed?",
    midFlowRedirect:(q) => `Got it! Now, ${q}`,
    confirmWord:    (w) => `Did you say "${w}"? Please say yes to confirm.`,
    fieldSaved:     (f,v) => `✅ ${f} set to "${v}".`,
    tapMic:         "Tap to talk",
    listening:      "Listening...",
    speaking:       "Speaking...",
    thinking:       "Thinking...",
    typeHere:       "Type in any language...",
    send:           "Send",
  }
};

const LANG_DISPLAY = {
  'ta-IN':'🇮🇳 தமிழ்','te-IN':'🇮🇳 తెలుగు',
  'ml-IN':'🇮🇳 മലയാളം','hi-IN':'🇮🇳 हिंदी','en-IN':'🇬🇧 English',
};

const AVATARS = ['🦁','🐯','🦊','🐺','🦅','🦋','🐬','🦄'];

const DEPARTMENTS = ['Water','Electricity','Waste','Roads','Sanitation','Other'];

// Pre-computed particles
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  left:`${3+(i*4.1)%94}%`, top:`${3+(i*6.3)%94}%`,
  size:`${5+(i%5)*2}px`,
  color: i%4===0?'#fff':i%4===1?'#ffc107':i%4===2?'#e94560':'#00d4ff',
  dur:`${0.6+(i%6)*0.2}s`, delay:`${(i%6)*0.08}s`,
}));

// ─── Language detection (Module 2) ───────────────────────────────────────────
function detectLang(text, currentLang = 'en-IN') {
  const t = text.toLowerCase().trim();
  // Unicode script
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  // Romanized Tamil (feature 26)
  if (/\b(vanakkam|vanakam|vanakamm|vannakam|wanakkam|romba|nandri|tamizh|thamizh|sollunga|parunga|illai|illaa|seri|eppadi|naan|unna|ungaluku|neenga|vanga|ponga|thambi|akka|anna|amma|ayya|aamaa|pukaaru|pukaar|pugaar|pugaaru|pugar|theriyum|puriyala|paaru|sollu|yenna|yena|enna|inge|anga|enga|eppo|aama|konjam|thanni|tanni|minsaram|kazhuvu|salai|sugataram|padhivu|pugardharar|saalai)\b/.test(t)) return 'ta-IN';
  // Romanized Telugu
  if (/\b(namaskaram|cheppandi|avunu|kaadu|meeru|nenu|ikkade|akkade|telugu|ela|emiti|evaru|miku|nakku)\b/.test(t)) return 'te-IN';
  // Romanized Malayalam
  if (/\b(enthanu|sheriyanu|ningal|njaan|malayalam|athe|alle|ente|ingane|engane|adipoli|povuka|varuka)\b/.test(t)) return 'ml-IN';
  // Romanized Hindi
  if (/\b(namaste|namaskar|haan|nahi|nai|acha|achha|theek|mujhe|humko|karo|kya|hai|bolo|yaar|bhai|didi|kahan|kab|kyun|kaisa|abhi|bahut|bohot|hindi|paani|bijli|sadak|kachra|safai|shikayat)\b/.test(t)) return 'hi-IN';
  // Romanized English explicit identifiers
  if (/\b(english|hello|hi|hey|register|login|report|complaint|dashboard|feed|leaderboard|water|roads|electricity|sanitation)\b/.test(t)) return 'en-IN';
  
  // Default to the currently active language instead of abruptly switching to English
  return currentLang;
}

// Fuzzy normalization for pronunciation variants
const FUZZY = {
  'pukaar':'pugaar','pugar':'pugaar','pukaaru':'pugaar','pugaaru':'pugaar',
  'vanakam':'vanakkam','vanakamm':'vanakkam','vannakam':'vanakkam',
  'pathivu':'register','padivu':'register','pativu':'register',
  'ulnuzhai':'login','lohgin':'login',
  'aama':'yes','aamaa':'yes','aam':'yes','seri':'yes','sari':'yes',
  'illai':'no','illa':'no','illaa':'no',
  'haan':'yes','han':'yes',
  'nahi':'no','nai':'no','nahin':'no',
  'thanni':'water','tanni':'water','paani':'water','jal':'water',
  'minsaram':'electricity','current':'electricity','bijli':'electricity',
  'kazhuvu':'waste','kachara':'waste',
  'salai':'roads','sadak':'roads',
};
function fuzzy(text) {
  return text.toLowerCase().split(/\s+/).map(w => FUZZY[w]||w).join(' ');
}

const KW = {
  GREET:    ['hello','hi','hey','helo','vanakkam','vanakam','namaste','namaskar','start','help','civic','romba','enna','yenna'],
  REGISTER: ['register','sign up','new account','create account','pathivu','padivu','pativu','புதிய','पंजीकरण'],
  LOGIN:    ['login','log in','sign in','ulnuzhai','உள்நுழை'],
  REPORT:   ['report','complaint','problem','issue','pugaar','pukaar','pugar','shikayat','pothole','flood','garbage','broken'],
  DASHBOARD:['dashboard','my account','my complaints','என் பக்கம்'],
  FEED:     ['feed','community','public','சமூகம்'],
  LEADER:   ['leaderboard','ranking','top users','லீடர்'],
  YES:      ['yes','yeah','yep','ok','okay','sure','aama','aamaa','aam','seri','sari','haan','ha','avunu','athe','ஆம்','हाँ'],
  NO:       ['no','nope','illai','illa','illaa','nahi','nai','kaadu','alle','இல்லை','नहीं'],
};
function has(text, list) {
  const n = fuzzy(text);
  return list.some(w => n.includes(w.toLowerCase()));
}

// ─── Department detection (Module 4) ─────────────────────────────────────────
const DEPT_KW = {
  Water:       ['water','thanni','tanni','paani','jal','vellam','thaneer','thanir','thannir','kudineer'],
  Electricity: ['electricity','current','light','power','bijli','minsaram','minsaaram','mincharam'],
  Waste:       ['waste','garbage','trash','kachra','kazhuvu','kuppai','kuppay'],
  Roads:       ['road','roads','pothole','sadak','salai','saalai','theru'],
  Sanitation:  ['sanitation','drain','sewer','swachh','sugataram','sugaatharam','saakkadai','saakadai'],
};
function extractDept(text) {
  const n = fuzzy(text);
  for (const [dept, kws] of Object.entries(DEPT_KW)) {
    if (kws.some(k => n.includes(k))) return dept;
  }
  return 'Other';
}

// ─── Avatar extraction (Module 3) ────────────────────────────────────────────
const AVATAR_MAP = {
  '1':0,'one':0,'lion':0,'singam':0,'sher':0,'simham':0,
  '2':1,'two':1,'tiger':1,'puli':1,'bagh':1,
  '3':2,'three':2,'fox':2,'nari':2,'lomdi':2,'nakka':2,
  '4':3,'four':3,'wolf':3,'onai':3,'bhediya':3,'todelu':3,
  '5':4,'five':4,'eagle':4,'kazhugu':4,'cheel':4,'garuda':4,
  '6':5,'six':5,'butterfly':5,'vannatipuchi':5,'titli':5,
  '7':6,'seven':6,'dolphin':6,
  '8':7,'eight':7,'unicorn':7,'yunikaarn':7,'yunikorn':7,
};
function extractAvatar(text) {
  const words = text.toLowerCase().split(/\s+/);
  for (const w of words) {
    if (AVATAR_MAP[w] !== undefined) return AVATARS[AVATAR_MAP[w]];
  }
  const numMatch = text.match(/\b([1-8])\b/);
  if (numMatch) return AVATARS[parseInt(numMatch[1])-1];
  return AVATARS[0];
}

// ─── Form input sanitizer (Module 3) ─────────────────────────────────────────
function sanitize(text) {
  return text
    .replace(/[\u0B80-\u0BFF]/g,'')
    .replace(/[\u0C00-\u0C7F]/g,'')
    .replace(/[\u0D00-\u0D7F]/g,'')
    .replace(/[\u0900-\u097F]/g,'')
    .trim();
}
function normalizeEmail(text) {
  return text.replace(/\s+at\s+/gi,'@').replace(/\s+dot\s+/gi,'.').replace(/\s/g,'').toLowerCase();
}

// ─── Duplicate check (Module 4) ──────────────────────────────────────────────
async function checkDuplicate(department, locality, token) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/complaints?department=${encodeURIComponent(department)}&locality=${encodeURIComponent(locality)}`,
      { headers: token ? { Authorization:`Bearer ${token}` } : {} }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const complaints = data.complaints || [];
    return complaints.find(c =>
      c.department === department &&
      c.locality?.toLowerCase() === locality?.toLowerCase() &&
      c.status !== 'Resolved' &&
      (Date.now() - new Date(c.createdAt).getTime()) < 7*24*60*60*1000
    ) || null;
  } catch { return null; }
}

// ─── Speech synthesis (Module 2) ─────────────────────────────────────────────
function speakOut(text, lang, onStart, onEnd) {
  if (!text) return;
  window.speechSynthesis.cancel();
  const go = () => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang; utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const v =
      voices.find(v => v.lang === lang) ||
      voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
      voices.find(v => v.lang === 'hi-IN') ||
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en')) || null;
    if (v) utt.voice = v;
    utt.onstart = () => onStart?.();
    utt.onend   = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utt);
  };
  window.speechSynthesis.getVoices().length > 0
    ? go()
    : (window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged=null; go(); });
}

// ─── Chat save (Module 6) ─────────────────────────────────────────────────────
async function saveChat(role, text, lang, token) {
  if (!token) return;
  try {
    await fetch('http://localhost:5000/api/chat/save', {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ role, text, language: lang }),
    });
  } catch(_) {}
}

// ─── Navigation Animation (Module 1) ─────────────────────────────────────────
function NavAnimation({ active, onDone }) {
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [active, onDone]);

  // Generate deterministic but pseudo-random streaks
  const Streaks = Array.from({ length: 15 }, (_, i) => ({
    top: `${5 + (i * 6)}%`,
    width: `${200 + (i * 50)}px`,
    height: `${1 + (i % 3)}px`,
    delay: (i % 4) * 0.15,
    duration: 0.6 + (i % 5) * 0.2,
    opacity: 0.3 + (i % 4) * 0.15
  }));

  // Glowing particles caught in wind
  const Particles = Array.from({ length: 25 }, (_, i) => ({
    top: `${10 + (i * 3.5)}%`,
    size: `${2 + (i % 4)}px`,
    delay: (i % 5) * 0.1,
    duration: 0.8 + (i % 4) * 0.2,
  }));

  return (
    <AnimatePresence>
      {active && (
        <motion.div
           initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
           animate={{ opacity: 1, backdropFilter: 'blur(35px)' }}
           exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
           transition={{ duration: 0.5 }}
           style={{
             position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none',
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             background: 'rgba(10, 15, 30, 0.6)', overflow: 'hidden'
           }}
        >
           {/* Hyper-realistic Wind Streaks */}
           {Streaks.map((s, i) => (
             <motion.div
               key={`streak-${i}`}
               initial={{ x: '-150vw', opacity: 0, rotate: -3 }}
               animate={{ x: '150vw', opacity: s.opacity, rotate: 3 }}
               exit={{ opacity: 0 }}
               transition={{ duration: s.duration, ease: 'linear', delay: s.delay }}
               style={{
                 position: 'absolute', top: s.top, width: s.width, height: s.height,
                 background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                 boxShadow: '0 0 20px rgba(255,255,255,0.6)',
                 borderRadius: '50%'
               }}
             />
           ))}

           {/* Dust Particles in Wind */}
           {Particles.map((p, i) => (
             <motion.div
               key={`part-${i}`}
               initial={{ x: '-100vw', y: 0, opacity: 0 }}
               animate={{ x: '150vw', y: -100, opacity: [0, 1, 0] }}
               transition={{ duration: p.duration, ease: 'linear', delay: p.delay }}
               style={{
                 position: 'absolute', top: p.top, width: p.size, height: p.size,
                 background: '#fff', borderRadius: '50%',
                 boxShadow: '0 0 10px #fff, 0 0 20px rgba(0, 150, 255, 0.6)'
               }}
             />
           ))}

           {/* Central Glass Text Panel */}
           <motion.div
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 1.1, y: -20, filter: 'blur(10px)' }}
             transition={{ duration: 0.6 }}
             style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
           >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: '72px', filter: 'drop-shadow(0 0 40px rgba(0,163,255,0.8))', display: 'inline-block' }}
              >
                🌍
              </motion.div>
              <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, marginTop: '20px', textShadow: '0 0 40px rgba(255,255,255,0.8)', letterSpacing: '8px', textTransform:'uppercase' }}>
                 CivicConnect
              </h2>
              <p style={{ color:'rgba(255,255,255,0.6)', marginTop:'8px', fontSize:'14px', letterSpacing:'3px', textTransform:'uppercase' }}>
                 AI Routing Enabled
              </p>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypingDots() {
  return (
    <div style={S.typingWrap}>
      {[0,1,2].map(i=>(
        <div key={i} style={{...S.dot,animation:`typDot 1.2s ease ${i*0.2}s infinite`}}/>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AIAssistant({ onFormFill, onImageRequest }) {
  const [isOpen,      setIsOpen]      = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [inputText,   setInputText]   = useState('');
  const [language,    setLanguage]    = useState('en-IN');
  const [navAnim,     setNavAnim]     = useState(false);
  const [navDest,     setNavDest]     = useState(null);
  const [hasGreeted,  setHasGreeted]  = useState(false);
  const [flowActive,  setFlowActive]  = useState(false);
  const [pendingDupe, setPendingDupe] = useState(null); // duplicate complaint found

  // Refs — no stale closures
  const langRef     = useRef('en-IN');
  const flowRef     = useRef(null);     // 'register'|'complaint'|null
  const stepRef     = useRef(0);
  const dataRef     = useRef({});       // accumulated form data
  const recRef      = useRef(null);
  const bottomRef   = useRef(null);
  const navigate    = useNavigate();
  const token       = localStorage.getItem('token');
  const isLoggedIn  = !!token;

  const t = (l) => TR[l||langRef.current] || TR['en-IN'];

  useEffect(() => { langRef.current = language; }, [language]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // ── Proactive greeting on open (Feature 2, 3) ────────────────────────────
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      const msg = isLoggedIn ? t().postLogin : t().greeting;
      addDirect('assistant', msg);
      setTimeout(() => speakOut(msg, langRef.current, ()=>setIsSpeaking(true), ()=>setIsSpeaking(false)), 400);
    }
  }, [isOpen]); // eslint-disable-line

  // ── Chat helpers ─────────────────────────────────────────────────────────
  const addDirect = (role, text) => setMessages(p => [...p, { role, text }]);
  const addMsg    = (role, text) => {
    setMessages(p => [...p, { role, text }]);
    saveChat(role, text, langRef.current, token);
  };
  const say = (text, lang) => {
    const l = lang || langRef.current;
    addMsg('assistant', text);
    speakOut(text, l, ()=>setIsSpeaking(true), ()=>setIsSpeaking(false));
  };

  // ── Navigation with animation (Feature 4) ────────────────────────────────
  const goTo = (path, msg, lang) => {
    say(msg, lang);
    setTimeout(() => { setNavAnim(true); setNavDest(path); }, 900);
  };
  const handleNavDone = useCallback(() => {
    setNavAnim(false);
    setNavDest(prev => { if (prev) navigate(prev); return null; });
  }, [navigate]);

  // ── Set flow (syncs ref + state) ─────────────────────────────────────────
  const setFlow = (name) => {
    flowRef.current = name;
    setFlowActive(!!name);
    if (!name) { stepRef.current = 0; dataRef.current = {}; }
  };

  // ── Language switch (Feature 8, 22) ──────────────────────────────────────
  const switchLang = (l) => {
    if (l === langRef.current) return false;
    const wasInFlow = !!flowRef.current;
    langRef.current = l;
    setLanguage(l);
    if (wasInFlow) {
      // Mid-flow switch — ask continue or restart (Feature 22)
      say(TR[l]?.langSwitch || TR['en-IN'].langSwitch, l);
    } else {
      // Not in flow — just re-greet in new language
      say(TR[l]?.greeting || TR['en-IN'].greeting, l);
    }
    return true;
  };

  // ── Process user input ───────────────────────────────────────────────────
  const processInput = async (text) => {
    const detected = detectLang(text, langRef.current);

    // Language switch detection (Feature 5, 6, 7)
    if (detected !== langRef.current) {
      const switched = switchLang(detected);
      if (switched && !flowRef.current) return; // greeted in new lang, done
    }

    const lang = langRef.current;
    const tr   = t(lang);

    // ── Mid-flow handling (Feature 21) ──────────────────────────────────
    if (flowRef.current) {
      // Check if user asked something off-topic mid-flow
      const isOffTopic = (
        text.split(' ').length > 4 &&
        (has(text, KW.GREET) || has(text, KW.FEED) || has(text, KW.LEADER) ||
         text.includes('?') || /\b(what|why|how|when|where|who|kya|enna|yenna)\b/.test(text.toLowerCase()))
      );

      if (isOffTopic && !has(text, KW.YES) && !has(text, KW.NO)) {
        // Answer their question briefly then redirect back
        const flowStepQ = {
          register: [tr.askName,tr.askEmail,tr.askPassword,tr.askLocality,tr.askAvatar],
          complaint:[tr.askProblem,tr.askDept,tr.askLocation,tr.askImage],
        };
        const currentQ = flowStepQ[flowRef.current]?.[stepRef.current] || '';
        say(`${tr.midFlowRedirect(currentQ)}`, lang);
        return;
      }

      // Continue flow
      handleFlowStep(text, lang);
      return;
    }

    // ── Handle pending duplicate (Feature 17) ──────────────────────────
    if (pendingDupe) {
      if (has(text, KW.YES)) {
        setPendingDupe(null);
        navigate(`/complaint/${pendingDupe._id}`);
        say(tr.goReport, lang);
      } else {
        setPendingDupe(null);
        say(tr.askProblem, lang);
        setFlow('complaint');
        stepRef.current = 0;
      }
      return;
    }

    // ── General commands ────────────────────────────────────────────────
    if (has(text, KW.GREET)) {
      say(tr.greeting, lang);
      return;
    }
    if (has(text, KW.REGISTER)) {
      setFlow('register'); stepRef.current = 0; dataRef.current = {};
      goTo('/register', tr.goRegister, lang);
      setTimeout(() => say(tr.askName, lang), 2600);
      return;
    }
    if (has(text, KW.LOGIN)) {
      goTo('/login', tr.goLogin, lang);
      return;
    }
    if (has(text, KW.REPORT)) {
      if (!isLoggedIn) { goTo('/login', tr.goLogin, lang); return; }
      setFlow('complaint'); stepRef.current = 0; dataRef.current = {};
      goTo('/submit', tr.goReport, lang);
      setTimeout(() => say(tr.askProblem, lang), 2600);
      return;
    }
    if (has(text, KW.DASHBOARD)) { goTo('/dashboard', tr.goDashboard, lang); return; }
    if (has(text, KW.FEED))      { goTo('/feed',      tr.goFeed,      lang); return; }
    if (has(text, KW.LEADER))    { goTo('/leaderboard',tr.goLeader,   lang); return; }

    say(isLoggedIn ? tr.postLogin : tr.newOrExisting, lang);
  };

  // ── Flow step handler ─────────────────────────────────────────────────
  const handleFlowStep = async (text, lang) => {
    const tr   = t(lang);
    const step = stepRef.current;
    const flow = flowRef.current;
    const clean = sanitize(text);

    if (flow === 'register') {
      if (step === 0) {
        if (clean.length < 2) { say(tr.askName, lang); return; }
        const name = clean.replace(/\b\w/g, c => c.toUpperCase());
        dataRef.current.name = name;
        if (onFormFill) onFormFill({ name });
        stepRef.current = 1;
        say(`${tr.fieldSaved('Name', name)} ${tr.askEmail}`, lang);
      } else if (step === 1) {
        const email = normalizeEmail(clean);
        dataRef.current.email = email;
        if (onFormFill) onFormFill({ email });
        stepRef.current = 2;
        say(`${tr.fieldSaved('Email', email)} ${tr.askPassword}`, lang);
      } else if (step === 2) {
        if (clean.length < 3) { say(tr.askPassword, lang); return; }
        dataRef.current.password = clean;
        if (onFormFill) onFormFill({ password: clean });
        stepRef.current = 3;
        say(`${tr.fieldSaved('Password', '••••••')} ${tr.askLocality}`, lang);
      } else if (step === 3) {
        if (clean.length < 2) { say(tr.askLocality, lang); return; }
        const locality = clean.replace(/\b\w/g, c => c.toUpperCase());
        dataRef.current.locality = locality;
        if (onFormFill) onFormFill({ locality });
        stepRef.current = 4;
        say(`${tr.fieldSaved('Locality', locality)} ${tr.askAvatar}`, lang);
      } else if (step === 4) {
        const avatar = extractAvatar(text);
        dataRef.current.avatar = avatar;
        if (onFormFill) onFormFill({ avatar });
        say(tr.registering, lang);
        setFlow(null);
        setTimeout(() => { if (onFormFill) onFormFill({ submit: true }); }, 1500);
      }
    }

    if (flow === 'complaint') {
      if (step === 0) {
        if (clean.length < 3) { say(tr.askProblem, lang); return; }
        dataRef.current.title = clean;
        dataRef.current.description = clean;
        if (onFormFill) onFormFill({ title: clean, description: clean });
        stepRef.current = 1;
        say(tr.askDept, lang);
      } else if (step === 1) {
        const dept = extractDept(text);
        dataRef.current.department = dept;
        if (onFormFill) onFormFill({ department: dept });
        stepRef.current = 2;
        say(`${tr.fieldSaved('Department', dept)} ${tr.askLocation}`, lang);
      } else if (step === 2) {
        if (clean.length < 2) { say(tr.askLocation, lang); return; }
        const locality = clean.replace(/\b\w/g, c => c.toUpperCase());
        dataRef.current.locality = locality;
        if (onFormFill) onFormFill({ locality });
        const dup = await checkDuplicate(dataRef.current.department, locality, token);
        if (dup) {
          setPendingDupe(dup);
          say(tr.duplicateFound(dataRef.current.department, locality), lang);
          setFlow(null);
          return;
        }
        stepRef.current = 3;
        say(`${tr.fieldSaved('Location', locality)} ${tr.askImage}`, lang);
      } else if (step === 3) {
        if (has(text, KW.YES)) {
          say(tr.openCamera, lang);
          if (onImageRequest) onImageRequest();
          stepRef.current = 4;
        } else {
          say(tr.noPhoto, lang);
          setFlow(null);
        }
      } else if (step === 4) {
        // Summary — show all details and ask confirmation
        const d = dataRef.current;
        const summary = lang === 'ta-IN'
          ? 'சரி! இதோ நீங்கள் கொடுத்த விவரங்கள்: தலைப்பு: ' + d.title + ', department: ' + d.department + ', இடம்: ' + d.locality + '. இந்த விவரங்கள் சரியா? ஆம் என்று சொன்னால் submit செய்கிறேன்.'
          : lang === 'hi-IN'
          ? 'ठीक है! आपकी जानकारी: शीर्षक: ' + d.title + ', विभाग: ' + d.department + ', स्थान: ' + d.locality + '. क्या यह सही है? हाँ बोलें तो submit करूंगा।'
          : 'Here is a summary of your complaint. Title: ' + d.title + '. Department: ' + d.department + '. Location: ' + d.locality + '. Is everything correct? Say Yes to submit, or tell me what needs to be changed.';
        say(summary, lang);
        stepRef.current = 5;
      } else if (step === 5) {
        // Confirmation
        if (has(text, KW.YES)) {
          const confirmMsg = lang === 'ta-IN' ? 'சரி! உங்கள் புகாரை submit செய்கிறேன்!'
            : lang === 'hi-IN' ? 'ठीक है! शिकायत submit कर रहा हूं!'
            : 'Submitting your complaint now!';
          say(confirmMsg, lang);
          if (onFormFill) onFormFill({ submit: true });
          setFlow(null);
        } else {
          // User wants changes
          const changeMsg = lang === 'ta-IN' ? 'என்ன மாற்றம் வேண்டும்? தலைப்பு அல்லது இடம் என்று சொல்லுங்கள்.'
            : lang === 'hi-IN' ? 'क्या बदलना है? शीर्षक या स्थान बोलें।'
            : 'What would you like to change? Say the field — title, location, or description.';
          say(changeMsg, lang);
          stepRef.current = 6;
        }
      } else if (step === 6) {
        // Apply field change then go back to summary
        const lower = text.toLowerCase();
        if (lower.includes('title') || lower.includes('thalaipu') || lower.includes('shirshak')) {
          const newTitle = clean.replace(/title|thalaipu|shirshak/gi,'').trim() || clean;
          dataRef.current.title = newTitle;
          if (onFormFill) onFormFill({ title: newTitle });
        } else if (lower.includes('location') || lower.includes('locality') || lower.includes('idam') || lower.includes('sthan')) {
          const newLoc = clean.replace(/location|locality|idam|sthan/gi,'').trim().replace(/\b\w/g,c=>c.toUpperCase()) || clean;
          dataRef.current.locality = newLoc;
          if (onFormFill) onFormFill({ locality: newLoc });
        } else if (lower.includes('description') || lower.includes('vivaram')) {
          dataRef.current.description = clean;
          if (onFormFill) onFormFill({ description: clean });
        }
        // Go back to summary
        stepRef.current = 4;
        const d = dataRef.current;
        const updatedSummary = lang === 'ta-IN'
          ? 'மாற்றம் செய்தேன்! இப்போது: தலைப்பு: ' + d.title + ', இடம்: ' + d.locality + '. இது சரியா?'
          : lang === 'hi-IN'
          ? 'बदलाव कर दिया! अब: शीर्षक: ' + d.title + ', स्थान: ' + d.locality + '. क्या यह ठीक है?'
          : 'Updated! Now: Title: ' + d.title + ', Location: ' + d.locality + '. Is this correct? Say Yes to submit.';
        say(updatedSummary, lang);
        stepRef.current = 5;
      }
    }
  };

  // ── Speech recognition (Feature 5–11, 26) ────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { say('Please use Google Chrome for voice features! 🎤'); return; }

    const rec = new SR();
    rec.lang            = 'en-IN'; // Always en-IN → Roman script → English form data (Feature 12, 25)
    rec.continuous      = false;
    rec.interimResults  = false;
    rec.maxAlternatives = 5;

    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') say('Please allow microphone access in Chrome settings! 🎙️');
      else say(t().notUnderstood);
    };
    rec.onresult = (e) => {
      // Collect all alternatives (Feature 9 — any pronunciation)
      const alts = [];
      for (let i = 0; i < e.results[0].length; i++) {
        alts.push({ text: e.results[0][i].transcript.trim(), conf: e.results[0][i].confidence });
      }
      if (!alts.length) return;

      const best    = alts.sort((a,b) => b.conf - a.conf)[0].text;
      const allText = alts.map(a => a.text).join(' ');
      // Detect from combined alternatives for better accuracy (Feature 9, 10)
      const detected = detectLang(allText, langRef.current);

      addMsg('user', best);

      // CRITICAL FIX: Never change language mid-flow.
      // When user is filling a form (name/email/locality etc),
      // locality names like "Anna Nagar", "Tambaram", "Tiruppur"
      // must NOT trigger a language switch. Language is locked
      // to whatever was detected when the user first greeted.
      if (flowRef.current) {
        // Mid-flow: ignore language detection entirely, use current lang
        handleFlowStep(best, langRef.current);
      } else {
        // Not in flow: safe to detect and switch language
        if (detected !== langRef.current) {
          switchLang(detected);
          return; // switchLang already greeted in new language
        }
        processInput(best);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch { say(t().notUnderstood); }
  };

  const stopListening = () => { recRef.current?.stop(); setIsListening(false); };

  // ── Text submit ───────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    addMsg('user', text);
    // Same fix: never switch language mid-flow from typed input
    if (flowRef.current) {
      handleFlowStep(text, langRef.current);
    } else {
      processInput(text);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────
  const tr = t();
  const status = isListening ? tr.listening
    : isSpeaking             ? tr.speaking
    : flowActive             ? `📝 Step ${stepRef.current+1}`
    : '● Online';

  const quickBtns = isLoggedIn
    ? [
        {icon:'📸',label:'Report',    msg:'I want to report a civic issue'},
        {icon:'📋',label:'Complaints',msg:'Show my complaints'},
        {icon:'🌍',label:'Community', msg:'Go to community feed'},
        {icon:'🏆',label:'Leaderboard',msg:'Go to leaderboard'},
      ]
    : [
        {icon:'📝',label:'Register',  msg:'I want to register'},
        {icon:'🔐',label:'Login',     msg:'I want to login'},
        {icon:'📸',label:'Report',    msg:'I want to report a problem'},
        {icon:'❓',label:'Help',      msg:'What can you do?'},
      ];

  const btnBg = isListening
    ? '#e94560'
    : 'linear-gradient(135deg,#0f3460,#e94560)';

  return (
    <>
      <NavAnimation active={navAnim} onDone={handleNavDone} />

      {/* ── Floating button — BOTTOM RIGHT, bigger (Feature 1, 24) ── */}
      <div style={S.floatWrap}>
        <motion.button
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: (isListening||isSpeaking) ? 1.08 : 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            ...S.fab,
            background: btnBg,
          }}
          onClick={() => setIsOpen(o => !o)}
          title="CivicConnect AI Assistant"
        >
          <span style={{fontSize:30}}>{isListening?'🔴':isSpeaking?'🔊':'🤖'}</span>
          <span style={S.fabLabel}>AI Assistant</span>
        </motion.button>
      </div>

      {/* ── Chat window — BOTTOM RIGHT, large (Feature 1, 24) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="glass-card"
            style={S.window}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >

          {/* Header */}
          <div style={S.header}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={S.avatarCircle}>🤖</div>
              <div>
                <p style={S.hName}>CivicConnect AI</p>
                <p style={S.hStatus}>
                  <span style={{...S.statusDot, background: isListening?'#e94560':isSpeaking?'#ffc107':'#28a745'}}/>
                  {status}
                </p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={S.langPill}>{LANG_DISPLAY[language]}</span>
              <button style={S.xBtn} onClick={()=>setIsOpen(false)}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div style={S.msgs}>
            {messages.map((m,i) => (
              <div key={i} style={{
                ...S.bubble,
                alignSelf:  m.role==='user'?'flex-end':'flex-start',
                background: m.role==='user'
                  ? 'linear-gradient(135deg,#0f3460,#1565c0)'
                  : '#f0f2f5',
                color: m.role==='user'?'#fff':'#222',
                borderBottomRightRadius: m.role==='user'?4:16,
                borderBottomLeftRadius:  m.role==='user'?16:4,
              }}>
                {m.role==='assistant'&&(
                  <button style={S.replayBtn} onClick={()=>speakOut(m.text,langRef.current,()=>setIsSpeaking(true),()=>setIsSpeaking(false))}>🔊</button>
                )}
                {m.text}
              </div>
            ))}
            {isListening && (
              <div style={{...S.bubble,alignSelf:'flex-start',background:'#fff3e0',color:'#e65100',fontSize:12}}>
                🎤 {tr.listening}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick buttons */}
          {!flowActive && (
            <div style={S.quickRow}>
              {quickBtns.map((b,i) => (
                <button key={i} style={S.qBtn}
                  onClick={() => { addMsg('user',b.msg); processInput(b.msg); }}>
                  {b.icon} {b.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={S.inputRow}>
            <form onSubmit={handleSubmit} style={{display:'flex',flex:1,gap:8}}>
              <input
                style={S.input}
                value={inputText}
                onChange={e=>setInputText(e.target.value)}
                placeholder={tr.typeHere}
              />
              <button type="submit" style={S.sendBtn}>{tr.send} ➤</button>
            </form>
            <button
              style={{...S.micBtn, background: isListening?'linear-gradient(135deg,#e94560,#c62828)':'linear-gradient(135deg,#0f3460,#1565c0)'}}
              onClick={isListening?stopListening:startListening}
              title={isListening?'Stop':'Speak'}
            >
              {isListening?'⏹':'🎤'}
            </button>
          </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Styles (Module 1) ────────────────────────────────────────────────────────
const S = {
  // Navigation animation
  navOverlay: {
    position:'fixed',inset:0,zIndex:99999,
    background:'linear-gradient(135deg,#0a0a1a,#0f3460,#1a1a2e)',
    display:'flex',alignItems:'center',justifyContent:'center',
    overflow:'hidden',animation:'navFade 2s ease forwards',
  },
  navLine: { position:'absolute',left:0,height:'3px',borderRadius:'2px' },
  navTitle:{ color:'#fff',fontWeight:800,fontSize:26,margin:'0 0 6px',letterSpacing:2 },
  navRing: {
    position:'absolute',width:200,height:200,borderRadius:'50%',
    border:'2px solid rgba(255,255,255,0.08)',borderTop:'2px solid #e94560',
    animation:'spin 1.5s linear infinite',
  },

  // Floating button — bottom RIGHT (Feature 1)
  floatWrap: {
    position:'fixed',bottom:28,right:28,
    display:'flex',flexDirection:'column',alignItems:'center',
    zIndex:9999,
  },
  fab: {
    width:80,height:80,borderRadius:'50%',
    border:'1px solid rgba(255,255,255,0.1)',color:'#fff',
    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
    cursor:'pointer',transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',gap:2,
    boxShadow:'0 0 30px rgba(15, 52, 96, 0.6), inset 0 0 20px rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  },
  fabLabel: { fontSize:9,fontWeight:700,letterSpacing:0.5,textTransform:'uppercase',opacity:0.9 },

  // Chat window — bottom RIGHT, 420×580 (Feature 1, 24)
  window: {
    position:'fixed',bottom:120,right:28,
    width:420,height:580,
    borderRadius:24,
    display:'flex',flexDirection:'column',zIndex:9998,overflow:'hidden',
    padding: 0,
    border: '1px solid rgba(255,255,255,0.1)',
  },

  header: {
    background:'rgba(255,255,255,0.05)',
    borderBottom:'1px solid rgba(255,255,255,0.05)',
    padding:'16px 18px',
    display:'flex',justifyContent:'space-between',alignItems:'center',
    flexShrink:0,
  },
  avatarCircle: {
    width:44,height:44,borderRadius:'50%',
    background:'rgba(255,255,255,0.1)',
    display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
    border: '1px solid rgba(255,255,255,0.2)'
  },
  hName:    {margin:0,fontWeight:800,fontSize:16,color:'#fff'},
  hStatus:  {margin:0,fontSize:12,color:'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',gap:6,marginTop:2},
  statusDot:{width:8,height:8,borderRadius:'50%',display:'inline-block', boxShadow:'0 0 8px currentColor'},
  langPill: {background:'rgba(255,255,255,0.1)',color:'#fff',padding:'4px 12px',borderRadius:12,fontSize:12,whiteSpace:'nowrap', border:'1px solid rgba(255,255,255,0.1)'},
  xBtn:     {background:'rgba(255,255,255,0.1)',color:'#fff',border:'none',width:30,height:30,borderRadius:'50%',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center', transition:'all 0.2s'},

  msgs:     {flex:1,padding:'16px',overflowY:'auto',display:'flex',flexDirection:'column',gap:12, background:'rgba(0,0,0,0.2)'},
  bubble:   {padding:'12px 16px',borderRadius:16,maxWidth:'84%',fontSize:14,lineHeight:1.5,wordBreak:'break-word',position:'relative', boxShadow:'0 2px 10px rgba(0,0,0,0.1)'},
  replayBtn:{background:'none',border:'none',cursor:'pointer',fontSize:12,float:'right',marginLeft:8,opacity:0.6},

  typingWrap:{display:'flex',gap:5,padding:'12px 16px',alignSelf:'flex-start',background:'rgba(255,255,255,0.05)',borderRadius:16,borderBottomLeftRadius:4},
  dot:      {width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,0.5)'},

  quickRow: {display:'flex',gap:8,padding:'12px 16px',background:'rgba(255,255,255,0.02)',borderTop:'1px solid rgba(255,255,255,0.05)',overflowX:'auto',flexShrink:0},
  qBtn:     {background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'8px 16px',cursor:'pointer',fontSize:13,whiteSpace:'nowrap',flexShrink:0,fontWeight:600,color:'#fff',transition:'all 0.2s'},

  inputRow: {padding:'16px',background:'rgba(255,255,255,0.03)',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',gap:12,alignItems:'center',flexShrink:0},
  input:    {flex:1,padding:'12px 16px',borderRadius:24,border:'1px solid rgba(255,255,255,0.1)',fontSize:14,outline:'none',background:'rgba(0,0,0,0.3)',color:'#fff'},
  sendBtn:  {background:'var(--primary)',color:'#fff',border:'none',padding:'12px 20px',borderRadius:24,cursor:'pointer',fontSize:14,fontWeight:700,flexShrink:0,whiteSpace:'nowrap', boxShadow:'0 0 15px var(--primary-glow)'},
  micBtn:   {width:50,height:50,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',flexShrink:0,boxShadow:'0 4px 15px rgba(0,0,0,0.3)',transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'},
};