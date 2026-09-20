// Client-side Grasping Telemetry & Simplification Engine

export interface GraspingTelemetry {
  scoreOutOf10: number; // 1.0 to 10.0
  totalInteractions: number;
  mockTestsCompleted: number;
  avgWrittenScorePercent: number;
  responseVelocity: string;
  focusSpanMinutes: number;
  retentionRatePercent: number;
  simplificationLang: string;
  autoSimplifyEnabled: boolean;
}

export const SUPPORTED_LANGUAGES = [
  { code: "en_eli5", label: "English (ELI5 Plain Intuition)" },
  { code: "hi", label: "Hindi (सरल हिंदी व्याख्या)" },
  { code: "es", label: "Spanish (Español Simplificado)" },
  { code: "te", label: "Telugu (సులభమైన తెలుగు)" },
  { code: "ta", label: "Tamil (எளிய தமிழ்)" },
  { code: "ml", label: "Malayalam (ലളിതമായ മലയാളം)" },
  { code: "bn", label: "Bengali (সহজ বাংলা)" },
  { code: "fr", label: "French (Français Simplifié)" },
  { code: "de", label: "German (Einfaches Deutsch)" },
];

const STORAGE_KEY_GRASPING = "sarvajna_grasping_telemetry";
const STORAGE_KEY_LANG = "sarvajna_simplify_lang";
const STORAGE_KEY_THEME = "sarvajna_theme";
const CONTENT_DEPTH_MODE_KEY = "sarvajna_content_depth_mode";

export type ContentDepthMode = "auto" | "low" | "medium" | "high";

export function getStoredGraspingScore(): number {
  if (typeof window === "undefined") return 4.8;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GRASPING);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.scoreOutOf10 === "number") {
        return parsed.scoreOutOf10;
      }
    }
  } catch {}
  return 4.8; // Baseline: < 5 on scale of 10 for new students needing intuition
}

export function setStoredGraspingScore(score: number): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredGraspingTelemetry();
    current.scoreOutOf10 = Math.max(1.0, Math.min(10.0, Math.round(score * 10) / 10));
    current.totalInteractions += 1;
    localStorage.setItem(STORAGE_KEY_GRASPING, JSON.stringify(current));
  } catch {}
}

export function getStoredGraspingTelemetry(): GraspingTelemetry {
  if (typeof window === "undefined") {
    return {
      scoreOutOf10: 4.8,
      totalInteractions: 14,
      mockTestsCompleted: 6,
      avgWrittenScorePercent: 68,
      responseVelocity: "1.1x",
      focusSpanMinutes: 25,
      retentionRatePercent: 68,
      simplificationLang: "en_eli5",
      autoSimplifyEnabled: true,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_GRASPING);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const initial: GraspingTelemetry = {
    scoreOutOf10: 4.8,
    totalInteractions: 14,
    mockTestsCompleted: 6,
    avgWrittenScorePercent: 68,
    responseVelocity: "1.1x",
    focusSpanMinutes: 25,
    retentionRatePercent: 68,
    simplificationLang: getStoredSimplificationLang(),
    autoSimplifyEnabled: true,
  };
  try {
    localStorage.setItem(STORAGE_KEY_GRASPING, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function getStoredSimplificationLang(): string {
  if (typeof window === "undefined") return "en_eli5";
  return localStorage.getItem(STORAGE_KEY_LANG) || "en_eli5";
}

export function setStoredSimplificationLang(lang: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_LANG, lang);
  const current = getStoredGraspingTelemetry();
  current.simplificationLang = lang;
  localStorage.setItem(STORAGE_KEY_GRASPING, JSON.stringify(current));
}

export function getStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(STORAGE_KEY_THEME) as "dark" | "light") || "dark";
}

export function setStoredTheme(theme: "dark" | "light"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.body.classList.remove("dark");
    document.body.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    document.body.classList.remove("light");
    document.body.classList.add("dark");
  }
}

// Multi-lingual zero-jargon simplification database
const SIMPLIFICATION_KNOWLEDGE: Record<string, Record<string, string>> = {
  tcp: {
    en_eli5:
      "Simple English Analogy: Think of TCP like sending certified letters. First, you wave and ask 'Can I speak?'. They wave back and say 'Yes, I hear you, can you hear me?'. You say 'Yes, message coming!'. If letters start getting lost on the road, you drive at half speed so the roads don't get blocked.",
    hi:
      "सरल हिंदी व्याख्या: टीसीपी को ऐसे समझें जैसे आप किसी को महत्वपूर्ण पत्र भेज रहे हों। पहले आप पूछते हैं 'क्या आप सुन रहे हैं?'. वह जवाब देते हैं 'हाँ, क्या आप मुझे सुन सकते हैं?'. फिर आप मुख्य संदेश भेजते हैं। अगर रास्ते में जाम लगता है, तो आप संदेश भेजने की गति आधी कर देते हैं ताकि कोई पत्र खो न जाए।",
    es:
      "Explicación Sencilla en Español: Imagina que TCP es como una llamada telefónica formal. Primero dices '¿Me escuchas?'. La otra persona responde 'Sí, te escucho, ¿tú a mí?'. Tú dices 'Perfecto, allá va el mensaje'. Si la red se satura, reduces la velocidad a la mitad para evitar perder datos.",
    te:
      "సులభమైన తెలుగు వివరణ: TCP అంటే ఇద్దరు వ్యక్తులు మాట్లాడుకోవడం లాంటిది. మొదట 'నేను మాట్లాడేది వినిపిస్తుందా?' అని అడుగుతాము. అవతలి వ్యక్తి 'వినిపిస్తుంది, నా మాట నీకు వినపడుతోందా?' అని బదులిస్తారు. ట్రాఫిక్ ఎక్కువైతే మెల్లగా పంపుతారు, ఏ డేటా పోకుండా చూస్తారు.",
    ta:
      "எளிய தமிழ் விளக்கம்: TCP என்பது ஒருவருக்கொருவர் பேசும் தொலைபேசி அழைப்பு போன்றது. முதலில் 'கேட்கிறதா?' என்று கேட்கிறோம். அவர்கள் 'கேட்கிறது, நான் பேசுவது கேட்கிறதா?' என்பார்கள். நெரிசல் ஏற்பட்டால் மெதுவாக அனுப்புவோம்.",
    ml:
      "ലളിതമായ മലയാളം വിവരണം: TCP എന്നത് രജിസ്റ്റേർഡ് തപാൽ അയക്കുന്നത് പോലെയാണ്. ആദ്യം വിവരങ്ങൾ അയക്കാൻ അനുവാദം ചോദിക്കുന്നു. മറ്റേയാൾ സമ്മതിച്ചാൽ സന്ദേശം അയക്കുന്നു. ട്രാഫിക് ഉണ്ടെങ്കിൽ വേഗത പകുതിയാക്കി ഡാറ്റ നഷ്ടപ്പെടാതെ സൂക്ഷിക്കുന്നു.",
    bn:
      "সহজ বাংলা ব্যাখ্যা: টিসিপি হলো একটি নির্ভরযোগ্য চিঠি পাঠানোর মতো। প্রথমে নিশ্চিত করা হয় যে প্রাপক প্রস্তুত কিনা। কোনো প্যাকেট হারিয়ে গেলে গতি কমিয়ে সাবধানে পুনরায় পাঠানো হয়।",
    fr:
      "Explication Simple en Français: Pensez à TCP comme à un appel poli. On vérifie d'abord que les deux personnes s'entendent, puis on envoie les données. Si la route est encombrée, on ralentit pour ne rien perdre.",
    de:
      "Einfache Deutsche Erklärung: TCP funktioniert wie ein Einschreiben. Zuerst wird geprüft, ob der Empfänger bereit ist. Bei Überlastung wird die Sendegeschwindigkeit halbiert, damit keine Daten verloren gehen.",
  },
  subnet: {
    en_eli5:
      "Simple English Analogy: An IP address is like a postal address with a street name and a house number. Subnetting is dividing one large neighborhood into smaller private streets so mail arrives much faster without confusion.",
    hi:
      "सरल हिंदी व्याख्या: आईपी पता आपके घर के पते जैसा है जिसमें मोहल्ला और मकान नंबर होता है। सबनेटिंग का मतलब है एक बड़े मोहल्ले को छोटी गलियों में बांटना ताकि चिट्ठी सही जगह बिना देरी के पहुंचे।",
    es:
      "Explicación Sencilla en Español: Una dirección IP es como la calle y el número de tu casa. Subnetting divide un barrio grande en calles privadas más pequeñas para que el correo llegue rápido y seguro.",
    te:
      "సులభమైన తెలుగు వివరణ: IP చిరునామా అంటే ఊరు పేరు మరియు ఇంటి నంబర్ లాంటిది. సబ్నెటింగ్ ద్వారా ఒక పెద్ద ప్రాంతాన్ని చిన్న వీధులుగా విభజించి లేఖలను సులభంగా చేరుస్తారు.",
    ta:
      "எளிய தமிழ் விளக்கம்: IP முகவரி என்பது தெருப் பெயர் மற்றும் வீட்டு எண் போன்றது. ஒரு பெரிய பகுதியை சிறிய பகுதிகளாக பிரிப்பதே சப்நெட்டிங் ஆகும்.",
    ml:
      "ലളിതമായ മലയാളം വിവരണം: IP അഡ്രസ് എന്നത് വീട്ടുപേരും വീട്ടുനമ്പറും പോലെയാണ്. ഒരു വലിയ പ്രദേശത്തെ ചെറിയ ബ്ലോക്കുകളായി തിരിക്കുന്നതിനെയാണ് സബ്നെറ്റിംഗ് എന്ന് പറയുന്നത്.",
    bn:
      "সহজ বাংলা ব্যাখ্যা: আইপি ঠিকানা হলো পাড়ার নাম এবং বাড়ির নম্বর। একটি বড় নেটওয়ার্ককে ছোট ছোট ভাগে ভাগ করাই হলো সাবনেটিং।",
    fr:
      "Explication Simple en Français: Une adresse IP est comme une rue et un numéro. Le sous-réseau divise un grand quartier en petites allées pour un acheminement direct et sans encombre.",
    de:
      "Einfache Deutsche Erklärung: Eine IP-Adresse ist wie Straße und Hausnummer. Subnetting teilt ein großes Viertel in kleine Straßen auf, damit Datenpakete schneller ankommen.",
  },
  sliding: {
    en_eli5:
      "Simple English Analogy: Imagine passing packages along a human chain. In Stop-and-Wait, you wait for a thumbs up for every single box before handing the next. In Sliding Window, you send 5 boxes in a row so nobody stands around waiting!",
    hi:
      "सरल हिंदी व्याख्या: सोचिए कि आप हाथों-हाथ बक्से पहुंचा रहे हैं। एक-एक करके भेजने के बजाय आप एक साथ 4-5 बक्से आगे बढ़ा देते हैं, ताकि कोई खाली न बैठे और काम तेजी से हो।",
    es:
      "Explicación Sencilla en Español: Como pasar cajas en una cadena humana. En lugar de esperar confirmación por cada caja individual, envías 4 o 5 seguidas para aprovechar todo el tiempo.",
    te:
      "సులభమైన తెలుగు వివరణ: ఒకరు ఇంకొకరికి వరుసగా వస్తువులు అందించడం లాంటిది. ఒక్కో దానికి ఎదురుచూడకుండా ఒకేసారి 4-5 వస్తువులను పంపి వేగాన్ని పెంచుతారు.",
    ta:
      "எளிய தமிழ் விளக்கம்: வரிசையாக பொருட்களை கைமாற்றுவது போன்றது. ஒவ்வொன்றாக காத்திருக்காமல் ஒரே நேரத்தில் பல பொருட்களை அனுப்பி நேரத்தை மிச்சப்படுத்துகிறோம்.",
    ml:
      "ലളിതമായ മലയാളം വിവരണം: ആളുകൾ നിരയായി നിന്ന് പെട്ടികൾ കൈമാറുന്നത് പോലെ. ഓരോ പെട്ടിക്കും കാത്തിരിക്കാതെ ഒരേസമയം പല പെട്ടികൾ അയച്ച് സമയം ലാഭിക്കുന്നു.",
    bn:
      "সহজ বাংলা ব্যাখ্যা: একসাথে কয়েকটি প্যাকেট পর্যায়ক্রমে পাঠিয়ে দেওয়া যাতে কোনো সময় অপচয় না হয়।",
    fr:
      "Explication Simple en Français: Au lieu d'attendre la confirmation pour chaque paquet, on en envoie 4 ou 5 d'affilée pour maximiser la vitesse.",
    de:
      "Einfache Deutsche Erklärung: Anstatt auf jedes einzelne Paket zu warten, sendet man mehrere Pakete hintereinander, um die Leitung voll auszunutzen.",
  },
  dns: {
    en_eli5:
      "Simple English Analogy: DNS is the phonebook of the Internet. You know your friend's name (google.com), and the phonebook looks up their real telephone number (142.250.190.46) so you can connect instantly.",
    hi:
      "सरल हिंदी व्याख्या: डीएनएस इंटरनेट की टेलीफोन डायरी है। आपको अपने दोस्त का नाम (google.com) याद रहता है, और डीएनएस उसका वास्तविक नंबर (आईपी) खोजकर आपको तुरंत जोड़ देता है।",
    es:
      "Explicación Sencilla en Español: DNS es como la agenda de contactos de tu teléfono. Tú buscas el nombre del amigo (google.com) y el sistema encuentra su número real (la IP) para llamarlo.",
    te:
      "సులభమైన తెలుగు వివరణ: DNS అంటే ఇంటర్నెట్ యొక్క ఫోన్ డైరెక్టరీ. మనం వెబ్‌సైట్ పేరు టైప్ చేస్తే, అది దాని అసలు IP నంబర్‌ను వెతికి కనెక్ట్ చేస్తుంది.",
    ta:
      "எளிய தமிழ் விளக்கம்: DNS என்பது இணையத்தின் தொலைபேசி டைரக்டரி ஆகும். பெயர் கொடுத்தால் அது உண்மையான எண்ணைக் கண்டுபிடித்து இணைக்கும்.",
    ml:
      "ലളിതമായ മലയാളം വിവരണം: ഇന്റർനെറ്റിന്റെ ഫോൺ ബുക്കാണ് DNS. നമ്മൾ പേര് പറയുമ്പോൾ യഥാർത്ഥ ഐപി അഡ്രസ് കണ്ടുപിടിച്ചു നൽകുന്നു.",
    bn:
      "সহজ বাংলা ব্যাখ্যা: ডিএনএস হলো ইন্টারনেটের ফোনবুক। ডোমেইন নামের বিপরীতে সঠিক আইপি অ্যাড্রেস খুঁজে বের করে সংযোগ দেয়।",
    fr:
      "Explication Simple en Français: Le DNS est l'annuaire d'Internet. Vous tapez le nom du site, et il trouve le bon numéro IP pour vous connecter.",
    de:
      "Einfache Deutsche Erklärung: DNS ist das Telefonbuch des Internets. Es übersetzt Website-Namen in echte IP-Adressen.",
  },
  database: {
    en_eli5:
      "Simple English Analogy: Normalization is like organizing your closet. Instead of dumping shirts, shoes, and socks into one giant messy pile where things get lost, you put socks in one drawer, shirts in another, and label them so you can find anything in 2 seconds.",
    hi:
      "सरल हिंदी व्याख्या: डेटाबेस नॉर्मलाइजेशन अपनी अलमारी व्यवस्थित करने जैसा है। सब कपड़े एक ढेर में फेंकने के बजाय, आप शर्ट और मोज़े अलग-अलग खानों में रखते हैं ताकि कोई सामान न खोए।",
    es:
      "Explicación Sencilla en Español: La normalización de base de datos es como ordenar tu armario en cajones separados para encontrar todo al instante sin duplicados ni desorden.",
    te:
      "సులభమైన తెలుగు వివరణ: డేటాబేస్ నార్మలైజేషన్ అంటే ఇంట్లో వస్తువులను పద్ధతిగా అమర్చుకోవడం. అన్నీ ఒకేచోట వేయకుండా విడివిడిగా భద్రపరుస్తారు.",
    ta:
      "எளிய தமிழ் விளக்கம்: பொருட்களை ஒழுங்காக அடுக்கி வைப்பது போன்றது. நகல் தகவல்களைத் தவிர்த்து எளிதாகக் கண்டுபிடிக்கும்படி அமைப்பது.",
    ml:
      "ലളിതമായ മലയാളം വിവരണം: സാധനങ്ങൾ അലമാരയിൽ അടുക്കി സൂക്ഷിക്കുന്നത് പോലെ. വിവരങ്ങൾ ഇരട്ടിയാവാതെ കൃത്യമായി ക്രമീകരിക്കുന്നു.",
    bn:
      "সহজ বাংলা ব্যাখ্যা: ডাটাবেজ নরমালাইজেশন হলো অপ্রয়োজনীয় তথ্যের পুনরাবৃত্তি কমিয়ে সবকিছু সাজিয়ে গুছিয়ে রাখা।",
    fr:
      "Explication Simple en Français: La normalisation organise les données dans des tiroirs séparés pour éviter le désordre et retrouver chaque élément rapidement.",
    de:
      "Einfache Deutsche Erklärung: Datenbank-Normalisierung ist wie das Aufräumen eines Schranks: Alles bekommt ein eigenes Fach, damit nichts doppelt oder verloren ist.",
  },
};

export function simplifyParagraphText(originalText: string, lang = "en_eli5", topicHint = ""): string {
  const lower = (originalText + " " + topicHint).toLowerCase();

  let key = "tcp";
  if (lower.includes("subnet") || lower.includes("cidr") || lower.includes("prefix") || lower.includes("mask") || lower.includes("ip address")) {
    key = "subnet";
  } else if (lower.includes("sliding") || lower.includes("window") || lower.includes("go-back") || lower.includes("selective")) {
    key = "sliding";
  } else if (lower.includes("dns") || lower.includes("domain") || lower.includes("quic") || lower.includes("http")) {
    key = "dns";
  } else if (lower.includes("database") || lower.includes("normaliz") || lower.includes("acid") || lower.includes("bcnf") || lower.includes("transaction")) {
    key = "database";
  } else if (lower.includes("handshake") || lower.includes("tcp") || lower.includes("congestion") || lower.includes("cwnd") || lower.includes("ssthresh")) {
    key = "tcp";
  }

  const category = SIMPLIFICATION_KNOWLEDGE[key];
  if (category && category[lang]) {
    return category[lang];
  }

  if (category && category.en_eli5) {
    return category.en_eli5;
  }

  // Fallback simplified intuition
  return `Intuitive Simplification: Think of this mechanism like a real-world sorting system where each rule prevents accidents, reduces duplicate work, and makes sure nothing is lost even if there is heavy traffic.`;
}

/* ================================================================
   Content Depth Mode -- user-selectable depth control
   Maps: low=3.0, medium=5.5, high=8.5, auto=from EWMA score
   ================================================================ */

export function getStoredContentDepthMode(): ContentDepthMode {
  if (typeof window === "undefined") return "auto";
  const raw = localStorage.getItem(CONTENT_DEPTH_MODE_KEY);
  if (raw === "low" || raw === "medium" || raw === "high" || raw === "auto") return raw;
  return "auto";
}

export function setStoredContentDepthMode(mode: ContentDepthMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTENT_DEPTH_MODE_KEY, mode);
}

/**
 * Returns the effective 0-10 depth score based on the user's chosen mode.
 * - auto: returns the EWMA grasping score from telemetry
 * - low: always 3.0
 * - medium: always 5.5
 * - high: always 8.5
 */
export function getEffectiveDepthScore(mode?: ContentDepthMode): number {
  const m = mode ?? getStoredContentDepthMode();
  switch (m) {
    case "low":    return 3.0;
    case "medium": return 5.5;
    case "high":   return 8.5;
    case "auto":
    default:       return getStoredGraspingScore();
  }
}

