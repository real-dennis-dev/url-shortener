// config/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validation
if (!supabaseUrl) {
  console.error("❌ Supabase Error: SUPABASE_URL is not defined in .env");
  process.exit(1);
}

if (!supabaseKey) {
  console.error(
    "❌ Supabase Error: SUPABASE_PUBLISHABLE_KEY is not defined in .env"
  );
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.warn(
    "⚠️  Warning: SUPABASE_SERVICE_KEY is not defined in .env. Admin operations will not work."
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test connection on startup
async function testSupabaseConnection() {
  try {
    console.log("🔄 Testing Supabase connection...");

    const { data, error } = await supabaseAdmin
      .from("users") // or any table that always exists
      .select("count", { count: "exact", head: true })
      .limit(1);

    if (error) {
      console.warn("⚠️  Supabase connected but query failed:", error.message);
      console.log("✅ Supabase Client Initialized (but check RLS/policies)");
    } else {
      console.log("✅ Supabase Connected Successfully");
      console.log(`📍 Project URL: ${supabaseUrl}`);
    }
  } catch (err) {
    console.error("❌ Supabase Connection Failed:", err.message);
  }
}

// Run connection test immediately
testSupabaseConnection();

export default supabase;
