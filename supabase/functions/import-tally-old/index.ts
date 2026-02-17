import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function clean(val: string): string | null {
  const t = val?.trim();
  if (!t || t === "-" || t === "?") return null;
  return t;
}

function parseBudget(val: string): number | null {
  if (!val) return null;
  const c = val.replace(/[€\s]/g, "").replace(/,/g, "").replace(/\./g, "");
  // Handle ranges like "320.000 - 380.000"
  const rangeMatch = val.match(/(\d[\d\s.,]*)/g);
  if (rangeMatch && rangeMatch.length > 0) {
    // Take the last (max) number
    const nums = rangeMatch.map((s) => {
      const n = s.replace(/[\s.,]/g, "");
      return parseInt(n);
    }).filter((n) => !isNaN(n) && n > 100);
    if (nums.length > 0) return Math.max(...nums);
  }
  const num = parseInt(c);
  if (!isNaN(num) && num > 100) return num;
  return null;
}

function parseRegions(val: string): string[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTallyDate(val: string): string | null {
  if (!val) return null;
  // "April 24, 2025 1:34 PM (GMT+2)" or Italian format
  try {
    const d = new Date(val.replace(/\(.*\)/, "").trim());
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return null;
}

function normalizeNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const sede = body.sede;
    let csvText = body.csvText;
    
    if (body.csvUrl && !csvText) {
      const resp = await fetch(body.csvUrl);
      csvText = await resp.text();
    }
    
    if (!csvText || !sede) {
      return new Response(
        JSON.stringify({ error: "csvText/csvUrl and sede required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove BOM
    csvText = csvText.replace(/^\uFEFF/, "");
    
    // Parse CSV
    const lines = csvText.split("\n");
    let headerIdx = 0;
    while (headerIdx < lines.length) {
      if (lines[headerIdx].includes("Your name and surname")) break;
      headerIdx++;
    }
    if (headerIdx >= lines.length) {
      console.log("First 3 lines:", lines.slice(0, 3).map(l => l.substring(0, 80)));
      console.log("Total lines:", lines.length);
      return new Response(
        JSON.stringify({ error: "Header not found", firstLine: lines[0]?.substring(0, 100), totalLines: lines.length }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = parseCSVLine(lines[headerIdx]);
    // Map header indices
    const hMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const k = h.trim().toLowerCase();
      hMap[k] = i;
    });

    const getField = (fields: string[], key: string): string => {
      const idx = hMap[key];
      if (idx === undefined || idx >= fields.length) return "";
      return fields[idx].trim();
    };

    // Parse full submission rows (rows with a name in column 0 and a date)
    interface ParsedSub {
      fullName: string;
      nome: string;
      cognome: string | null;
      paese: string | null;
      telefono: string | null;
      email: string | null;
      data_submission: string | null;
      budget_max: number | null;
      bagni: string | null;
      camere: string | null;
      stile: string | null;
      terreno: string | null;
      layout: string | null;
      piscina: string | null;
      uso: string | null;
      ha_visitato: boolean;
      vicinanza_citta: boolean;
      regioni: string[];
      tipologia: string[];
      contesto: string[];
      motivo_zona: string[];
      dimensioni_min: string | null;
      interesse_affitto: string | null;
      mutuo: string | null;
      tempo_ricerca: string | null;
      dependance: string | null;
      descrizione: string | null;
      note_extra: string;
    }

    const submissions: ParsedSub[] = [];
    let i = headerIdx + 1;

    while (i < lines.length) {
      let line = lines[i].trim();
      if (!line) { i++; continue; }

      // Handle multiline quoted fields
      while ((line.match(/"/g) || []).length % 2 !== 0 && i + 1 < lines.length) {
        i++;
        line += "\n" + lines[i];
      }

      const fields = parseCSVLine(line);
      const nameField = fields[0]?.trim();
      const dateField = getField(fields, "date");

      // Skip short contact rows (no date = contact list section)
      if (!nameField || !dateField) { i++; continue; }

      // Parse name
      const nameParts = nameField.split(/\s+/);
      const nome = nameParts[0];
      const cognome = nameParts.slice(1).join(" ") || null;

      const country = clean(getField(fields, "country"));
      const phone = clean(getField(fields, "phone number (including country code)"));
      const email = clean(getField(fields, "mail"));
      const budget = parseBudget(getField(fields, "max budget"));
      const bathrooms = clean(getField(fields, "bathrooms"));
      const bedrooms = clean(getField(fields, "bedrooms"));
      const style = clean(getField(fields, "kind of style"));
      const land = clean(getField(fields, "land"));
      const layoutVal = clean(getField(fields, "layout"));
      const pool = clean(getField(fields, "swimming pool"));
      const use = clean(getField(fields, "use"));
      const visited = getField(fields, "visited properties?").toLowerCase();
      const prox = getField(fields, "prox to main cities / airports?").toLowerCase();
      const regions = parseRegions(getField(fields, "regions"));
      const propType = parseRegions(getField(fields, "property type"));
      const setting = parseRegions(getField(fields, "setting"));
      const whyArea = parseRegions(getField(fields, "why area"));
      const size = clean(getField(fields, "size"));
      const rent = clean(getField(fields, "rent"));
      const mutuo = clean(getField(fields, "mutuo"));
      const howLong = clean(getField(fields, "how long have you been looking for a property?"));
      const guesthouse = clean(getField(fields, "guesthouse or annex"));
      const propDesc = clean(getField(fields, "property description"));
      const more = clean(getField(fields, "more.."));
      const landSize = clean(getField(fields, "if yes, how much land would you like to have?"));
      const dateSub = parseTallyDate(dateField);

      // Build note_extra
      const noteLines: string[] = ["📋 IMPORTATO DA TALLY FORM (STORICO)"];
      if (more) noteLines.push(`📌 Note: ${more}`);
      if (landSize) noteLines.push(`🌿 Terreno desiderato: ${landSize}`);
      const examples = clean(getField(fields, "examples "));
      if (examples) noteLines.push(`🔗 Esempi: ${examples}`);
      const quanto = clean(getField(fields, "quanto hanno disponibile?"));
      if (quanto) noteLines.push(`💰 Disponibilità: ${quanto}`);

      submissions.push({
        fullName: nameField.trim(),
        nome,
        cognome,
        paese: country,
        telefono: phone,
        email,
        data_submission: dateSub,
        budget_max: budget,
        bagni: bathrooms,
        camere: bedrooms,
        stile: style,
        terreno: land === "Yes" || land === "Sì" ? "Sì" : land === "No" ? "No" : land,
        layout: layoutVal,
        piscina: pool,
        uso: use,
        ha_visitato: visited.includes("yes") || visited.includes("sì"),
        vicinanza_citta: prox.includes("yes") || prox.includes("sì") || prox.includes("somewhat") || prox.includes("più o meno"),
        regioni: regions,
        tipologia: propType,
        contesto: setting,
        motivo_zona: whyArea,
        dimensioni_min: size,
        interesse_affitto: rent === "Yes" || rent === "Sì" ? "Sì" : rent === "No" ? "No" : rent,
        mutuo: mutuo === "Yes" || mutuo === "Sì" ? "Sì" : mutuo === "No" ? "No" : mutuo,
        tempo_ricerca: howLong,
        dependance: guesthouse === "Yes" || guesthouse === "Sì" ? "Sì" : guesthouse === "No" ? "No" : guesthouse,
        descrizione: propDesc,
        note_extra: noteLines.join("\n"),
      });

      i++;
    }

    // Fetch existing clients in this sede
    const { data: existingClients } = await supabase
      .from("clienti")
      .select("id, nome, cognome, telefono, email, tally_submission_id")
      .eq("sede", sede);

    // Build lookup by normalized name
    const clientsByName = new Map<string, typeof existingClients extends (infer T)[] | null ? T : never>();
    for (const c of existingClients || []) {
      const fullName = `${c.nome} ${c.cognome || ""}`.trim();
      const norm = normalizeNameForMatch(fullName);
      clientsByName.set(norm, c);
      // Also index by just nome
      clientsByName.set(normalizeNameForMatch(c.nome), c);
    }

    let matched = 0;
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const sub of submissions) {
      const normName = normalizeNameForMatch(sub.fullName);
      // Try to find existing client
      let existing = clientsByName.get(normName);
      // Try surname match
      if (!existing && sub.cognome) {
        const normSurname = normalizeNameForMatch(sub.cognome);
        for (const [key, val] of clientsByName) {
          if (key.includes(normSurname) && key.includes(normalizeNameForMatch(sub.nome))) {
            existing = val;
            break;
          }
        }
      }
      // Try phone match
      if (!existing && sub.telefono) {
        const phoneDigits = sub.telefono.replace(/[\s\-\(\)\+]/g, "");
        const byPhone = (existingClients || []).find((c) => {
          if (!c.telefono) return false;
          return c.telefono.replace(/[\s\-\(\)\+]/g, "").includes(phoneDigits.slice(-8));
        });
        if (byPhone) existing = byPhone;
      }

      if (existing) {
        // Update existing client with Tally data, merging note_extra
        const { error } = await supabase
          .from("clienti")
          .update({
            tally_submission_id: `tally-old-${normName.replace(/\s/g, "-")}`,
            data_submission: sub.data_submission || undefined,
            bagni: sub.bagni || undefined,
            camere: sub.camere || undefined,
            stile: sub.stile || undefined,
            terreno: sub.terreno || undefined,
            piscina: sub.piscina || undefined,
            uso: sub.uso || undefined,
            ha_visitato: sub.ha_visitato || undefined,
            regioni: sub.regioni.length > 0 ? sub.regioni : undefined,
            tipologia: sub.tipologia.length > 0 ? sub.tipologia : undefined,
            contesto: sub.contesto.length > 0 ? sub.contesto : undefined,
            motivo_zona: sub.motivo_zona.length > 0 ? sub.motivo_zona : undefined,
            dimensioni_min: sub.dimensioni_min || undefined,
            interesse_affitto: sub.interesse_affitto || undefined,
            tempo_ricerca: sub.tempo_ricerca || undefined,
            dependance: sub.dependance || undefined,
            descrizione: sub.descrizione || undefined,
            budget_max: sub.budget_max || undefined,
            note_extra: sub.note_extra,
          })
          .eq("id", existing.id);

        if (error) {
          errors.push(`Update ${sub.fullName}: ${error.message}`);
        } else {
          matched++;
        }
      } else {
        // Create new client, mark as "classificato"
        const { error } = await supabase.from("clienti").insert({
          nome: sub.nome,
          cognome: sub.cognome,
          paese: sub.paese,
          telefono: sub.telefono,
          email: sub.email,
          sede,
          status: "classified",
          portale: "TALLY",
          tally_submission_id: `tally-old-${normName.replace(/\s/g, "-")}`,
          data_submission: sub.data_submission,
          budget_max: sub.budget_max,
          bagni: sub.bagni,
          camere: sub.camere,
          stile: sub.stile,
          terreno: sub.terreno,
          layout: sub.layout,
          piscina: sub.piscina,
          uso: sub.uso,
          ha_visitato: sub.ha_visitato,
          vicinanza_citta: sub.vicinanza_citta,
          regioni: sub.regioni,
          tipologia: sub.tipologia,
          contesto: sub.contesto,
          motivo_zona: sub.motivo_zona,
          dimensioni_min: sub.dimensioni_min,
          interesse_affitto: sub.interesse_affitto,
          mutuo: sub.mutuo,
          tempo_ricerca: sub.tempo_ricerca,
          dependance: sub.dependance,
          descrizione: sub.descrizione,
          note_extra: sub.note_extra,
        });

        if (error) {
          errors.push(`Insert ${sub.fullName}: ${error.message}`);
        } else {
          created++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        total_parsed: submissions.length,
        matched,
        created,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
