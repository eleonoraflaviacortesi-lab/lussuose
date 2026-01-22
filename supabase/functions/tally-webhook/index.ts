import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: unknown;
  options?: Array<{ id: string; text: string }>;
}

interface TallySubmission {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
  };
}

// Helper to find field value by label (case-insensitive partial match)
function getFieldValue(fields: TallyField[], labelPattern: string): unknown {
  const field = fields.find(f => 
    f.label && f.label.toLowerCase().includes(labelPattern.toLowerCase())
  );
  return field?.value ?? null;
}

// Helper to get array values from checkboxes or multi-select
function getArrayValue(fields: TallyField[], labelPattern: string): string[] {
  const field = fields.find(f => 
    f.label && f.label.toLowerCase().includes(labelPattern.toLowerCase())
  );
  
  if (!field?.value) return [];
  
  // Handle different field types
  if (Array.isArray(field.value)) {
    // For checkbox groups, value might be array of option IDs
    if (field.options && field.options.length > 0) {
      const selectedIds = field.value as string[];
      return field.options
        .filter(opt => selectedIds.includes(opt.id))
        .map(opt => opt.text);
    }
    return field.value.map(String);
  }
  
  if (typeof field.value === 'string') {
    return [field.value];
  }
  
  return [];
}

// Helper to parse budget from string like "€600,000" or "600000"
function parseBudget(value: unknown): number | null {
  if (!value) return null;
  const str = String(value).replace(/[€$,\s]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// Helper to parse boolean from various formats
function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
  }
  return false;
}

// Helper to parse integer
function parseInteger(value: unknown): number | null {
  if (!value) return null;
  // Extract first number from string like "At least 3" or "4+"
  const match = String(value).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Helper to parse size range like "150-300 sqm" into min/max
function parseSizeRange(value: unknown): { min: number | null; max: number | null } {
  if (!value) return { min: null, max: null };
  const str = String(value);
  const numbers = str.match(/\d+/g);
  if (!numbers) return { min: null, max: null };
  if (numbers.length >= 2) {
    return { min: parseInt(numbers[0], 10), max: parseInt(numbers[1], 10) };
  }
  if (numbers.length === 1) {
    return { min: parseInt(numbers[0], 10), max: null };
  }
  return { min: null, max: null };
}

// Determine sede based on regions searched
function getSedeFromRegions(regioni: string[]): string {
  if (!regioni || regioni.length === 0) return "AREZZO"; // default
  
  const normalizedRegions = regioni.map(r => r.toLowerCase().trim());
  
  const hasToscana = normalizedRegions.some(r => 
    r.includes("toscan") || r.includes("tuscan")
  );
  const hasUmbria = normalizedRegions.some(r => 
    r.includes("umbri")
  );
  
  // Only Umbria (no Toscana) → CITTÀ DI CASTELLO (with accent!)
  if (hasUmbria && !hasToscana) {
    return "CITTÀ DI CASTELLO";
  }
  
  // Toscana (with or without Umbria), or other regions → AREZZO
  return "AREZZO";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse Tally webhook payload
    const payload: TallySubmission = await req.json();
    
    console.log("Received Tally submission:", payload.data?.submissionId);
    
    if (!payload.data?.fields) {
      throw new Error("Invalid payload: missing fields");
    }

    const fields = payload.data.fields;
    
    // Extract regions first to determine sede
    const regioni = getArrayValue(fields, "region");
    const sede = getSedeFromRegions(regioni);
    
    console.log("Regions:", regioni, "→ Sede:", sede);
    
    // Map Tally fields to database columns
    const sizeRange = parseSizeRange(getFieldValue(fields, "size"));
    
    const clienteData = {
      // Personal
      nome: String(getFieldValue(fields, "name") || "Unknown"),
      telefono: String(getFieldValue(fields, "phone") || ""),
      email: String(getFieldValue(fields, "email") || "") || null,
      paese: String(getFieldValue(fields, "country") || ""),
      
      // Budget
      budget_max: parseBudget(getFieldValue(fields, "budget")),
      mutuo: String(getFieldValue(fields, "mutuo") || getFieldValue(fields, "mortgage") || ""),
      
      // Timeline
      tempo_ricerca: String(getFieldValue(fields, "old") || getFieldValue(fields, "searching") || ""),
      ha_visitato: parseBoolean(getFieldValue(fields, "visited")),
      
      // Location
      regioni: regioni,
      vicinanza_citta: parseBoolean(getFieldValue(fields, "prox") || getFieldValue(fields, "cities")),
      motivo_zona: getArrayValue(fields, "why"),
      
      // Property Type
      tipologia: getArrayValue(fields, "property type"),
      stile: String(getFieldValue(fields, "style") || ""),
      contesto: getArrayValue(fields, "setting"),
      
      // Features
      dimensioni_min: sizeRange.min,
      dimensioni_max: sizeRange.max,
      camere: String(getFieldValue(fields, "bedroom") || ""),
      bagni: parseInteger(getFieldValue(fields, "bathroom")),
      layout: String(getFieldValue(fields, "layout") || ""),
      dependance: String(getFieldValue(fields, "guesthouse") || getFieldValue(fields, "annex") || ""),
      terreno: String(getFieldValue(fields, "land") || ""),
      piscina: String(getFieldValue(fields, "pool") || getFieldValue(fields, "swimming") || ""),
      
      // Usage
      uso: String(getFieldValue(fields, "use") || ""),
      interesse_affitto: String(getFieldValue(fields, "rent") || ""),
      
      // Notes
      descrizione: String(getFieldValue(fields, "description") || getFieldValue(fields, "property description") || ""),
      note_extra: String(getFieldValue(fields, "more") || getFieldValue(fields, "additional") || ""),
      
      // Management – sede determined by regions, status uses DB default
      sede: sede,
      emoji: "🏠",
      
      // Tally metadata
      tally_submission_id: payload.data.submissionId,
      data_submission: payload.data.createdAt,
    };

    console.log("Mapped cliente data:", clienteData);

    // Upsert to avoid duplicates (based on tally_submission_id)
    const { data, error } = await supabase
      .from("clienti")
      .upsert(clienteData, {
        onConflict: "tally_submission_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("Cliente saved:", data.id);

    return new Response(
      JSON.stringify({ success: true, clienteId: data.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
