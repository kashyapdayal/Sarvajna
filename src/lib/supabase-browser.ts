"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isConfigured = Boolean(url && anonKey && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) && !url.includes("your-project"));

export const supabaseBrowser = isConfigured ? createClient(url!, anonKey!) : null;
export const supabaseBrowserConfigurationError = isConfigured
  ? null
  : "Authentication needs a real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";
