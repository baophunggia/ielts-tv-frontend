import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    return "";
  }
  return "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");

// Singleton pattern: Đảm bảo chỉ có 1 instance được tạo ra
let supabase;
if (!supabase) {
  supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder",
  );
}

export default supabase;
