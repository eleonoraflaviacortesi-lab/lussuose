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
// Accepts multiple patterns to match against
function getFieldValue(fields: TallyField[], ...patterns: string[]): unknown {
  const field = fields.find(f => 
    f.label && patterns.some(pattern => 
      f.label.toLowerCase().includes(pattern.toLowerCase())
    )
  );
  return field?.value ?? null;
}

// Helper to get the TEXT of a selected option (for dropdowns/radio buttons)
// Tally sends option ID as value, we need to look up the text
function getOptionText(fields: TallyField[], ...patterns: string[]): string {
  const field = fields.find(f => 
    f.label && patterns.some(pattern => 
      f.label.toLowerCase().includes(pattern.toLowerCase())
    )
  );
  
  if (!field?.value) return "";
  
  // If field has options, look up the text by ID
  if (field.options && field.options.length > 0) {
    const valueId = String(field.value);
    const option = field.options.find(opt => opt.id === valueId);
    return option?.text || String(field.value);
  }
  
  // Otherwise return raw value as string
  return String(field.value);
}

// Helper to get array values from checkboxes or multi-select
function getArrayValue(fields: TallyField[], ...patterns: string[]): string[] {
  const field = fields.find(f => 
    f.label && patterns.some(pattern => 
      f.label.toLowerCase().includes(pattern.toLowerCase())
    )
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

// Helper to parse budget from string like "€600,000" or "€ 60000" or "60000"
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
    const lower = value.toLowerCase();
    return lower === 'yes' || lower === 'true' || lower === 'sì' || lower === 'si';
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

// Helper to parse size range like "sqm 100" or "150-300 sqm" into min/max
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
    
    // Log all field labels for debugging
    console.log("Field labels:", fields.map(f => f.label).join(" | "));
    
    // Extract regions first to determine sede
    // Matches: "Which regions of Italy are you considering?"
    const regioni = getArrayValue(fields, "region", "regioni");
    const sede = getSedeFromRegions(regioni);
    
    console.log("Regions:", regioni, "→ Sede:", sede);
    
    // Map Tally fields to database columns using EXACT label patterns from the form
    // "Desired size of the property:"
    const sizeRange = parseSizeRange(getFieldValue(fields, "desired size", "size of the property", "dimensioni"));
    
    const clienteData = {
      // Personal info
      // "Your name and surname"
      nome: String(getFieldValue(fields, "name and surname", "name", "nome") || "Unknown"),
      // "Phone number (including country code)"
      telefono: String(getFieldValue(fields, "phone number", "phone", "telefono") || ""),
      // "Email" (if exists)
      email: String(getFieldValue(fields, "email") || "") || null,
      // "Respondent's country"
      paese: String(getFieldValue(fields, "respondent's country", "country", "paese") || ""),
      
      // Budget & Mortgage
      // "What is your estimated budget for the property purchase?"
      budget_max: parseBudget(getFieldValue(fields, "estimated budget", "budget", "budget massimo")),
      // "Will you require a mortgage to finance the purchase of the property?"
      mutuo: getOptionText(fields, "require a mortgage", "mortgage", "mutuo"),
      
      // Timeline & Experience
      // "How long have you been looking for a property?"
      tempo_ricerca: String(getFieldValue(fields, "how long have you been looking", "been looking for", "da quanto") || ""),
      // "Have you already viewed properties?"
      ha_visitato: parseBoolean(getFieldValue(fields, "already viewed properties", "viewed properties", "visitato")),
      
      // Location preferences
      regioni: regioni,
      // "Is proximity to international airports or major cities a priority?"
      vicinanza_citta: parseBoolean(getFieldValue(fields, "proximity to international", "airports or major cities", "vicinanza")),
      // "Main reason for choosing the area:"
      motivo_zona: getArrayValue(fields, "reason for choosing", "main reason", "motivo"),
      
      // Property Type & Style
      // "What type of property are you looking for?"
      tipologia: getArrayValue(fields, "type of property are you looking", "property type", "tipologia"),
      // "How would you describe the category or style of property you are looking for?"
      stile: getArrayValue(fields, "category or style", "style of property", "stile").join(", "),
      // "Preferred setting:"
      contesto: getArrayValue(fields, "preferred setting", "setting", "contesto"),
      
      // Property Features
      dimensioni_min: sizeRange.min,
      dimensioni_max: sizeRange.max,
      // "Number of bedrooms"
      camere: String(getFieldValue(fields, "number of bedrooms", "bedroom", "camere") || ""),
      // "Minimum number of bathrooms"
      bagni: parseInteger(getFieldValue(fields, "number of bathrooms", "bathroom", "bagni")),
      // "Layout preference:"
      layout: getOptionText(fields, "layout preference", "layout"),
      // "Guesthouse or annex required?"
      dependance: getOptionText(fields, "guesthouse or annex", "annex required", "dependance"),
      // "Do you require land?" / "If yes, how much land..."
      terreno: getOptionText(fields, "do you require land", "require land", "terreno"),
      // "Swimming pool"
      piscina: getOptionText(fields, "swimming pool", "piscina"),
      
      // Usage & Rental
      // "Intended use of the property:"
      uso: getOptionText(fields, "intended use", "use of the property", "uso"),
      // "Do you plan to rent the property?"
      interesse_affitto: getOptionText(fields, "plan to rent", "rent the property", "affitto"),
      
      // Descriptions & Notes
      // "How would you describe your ideal property?"
      descrizione: String(getFieldValue(fields, "describe your ideal", "ideal property", "descrizione") || ""),
      // "Would you like to add any additional notes, preferences, or questions?"
      note_extra: String(getFieldValue(fields, "additional notes", "notes, preferences", "note") || ""),
      
      // Management
      portale: 'TALLY',
      sede: sede,
      emoji: "🏠",
      
      // Tally metadata
      tally_submission_id: payload.data.submissionId,
      data_submission: payload.data.createdAt,
    };

    console.log("Mapped cliente data:", JSON.stringify(clienteData, null, 2));

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

    // Send in-app notifications to coordinators/admins of the same sede
    try {
      const { data: targets } = await supabase
        .from("profiles")
        .select("user_id")
        .in("role", ["coordinatore", "admin"]);

      if (targets && targets.length > 0) {
        const notifications = targets.map((t) => ({
          user_id: t.user_id,
          type: "tally_submission",
          title: `📋 Nuovo lead da Tally: ${clienteData.nome}`,
          message: `Sede: ${clienteData.sede} — Budget: ${clienteData.budget_max ? "€" + clienteData.budget_max.toLocaleString() : "N/D"}`,
          reference_id: data.id,
        }));

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notifError) {
          console.error("Notification insert error:", notifError);
        } else {
          console.log(`Sent ${notifications.length} notifications`);
        }
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
    }

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
