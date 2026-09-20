const boolean = (value: string | undefined, fallback: boolean) => value === undefined ? fallback : value === "true";

export const config = {
  appName: process.env.APP_NAME ?? "SkillOS",
  ai: {
    baseUrl: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    apiKey: process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL ?? "gpt-5-mini",
    enabled: boolean(process.env.AI_ENABLED, true),
    webSearchEnabled: boolean(process.env.AI_WEB_SEARCH_ENABLED, true),
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 4000),
  },
  limits: {
    apiRequestsPerMinute: Number(process.env.API_RATE_LIMIT_PER_MINUTE ?? 60),
    uploadsPerMinute: Number(process.env.UPLOAD_RATE_LIMIT_PER_MINUTE ?? 10),
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 20),
  },
  features: {
    cramMode: boolean(process.env.FEATURE_CRAM_MODE, true),
    deepLearn: boolean(process.env.FEATURE_DEEP_LEARN, true),
    pdfIngestion: boolean(process.env.FEATURE_PDF_INGESTION, true),
  },
} as const;
