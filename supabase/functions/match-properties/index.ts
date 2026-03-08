import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface Cliente {
  id: string;
  budget_max: number | null;
  regioni: string[] | null;
  tipologia: string[] | null;
  piscina: string | null;
  terreno: string | null;
  dimensioni_min: number | null;
  dimensioni_max: number | null;
  camere: string | null;
  bagni: number | null;
}

interface Property {
  id: string;
  price: number | null;
  region: string | null;
  property_type: string | null;
  has_pool: boolean | null;
  has_land: boolean | null;
  surface_mq: number | null;
  rooms: number | null;
  bathrooms: number | null;
  active: boolean | null;
}

const regionMapping: Record<string, string[]> = {
  'Tuscany': ['tuscany', 'toscana'],
  'Umbria': ['umbria'],
  'Marche': ['marche'],
  'Lazio': ['lazio'],
  'Emilia-Romagna': ['emilia', 'romagna', 'emilia-romagna'],
  'Liguria': ['liguria'],
  'Piemonte': ['piemonte', 'piedmont'],
  'Lombardia': ['lombardia', 'lombardy'],
};

const typeMapping: Record<string, string[]> = {
  'Villa': ['villa'],
  'Farmhouse': ['farmhouse', 'casale', 'podere', 'country house'],
  'Apartment': ['apartment', 'appartamento', 'flat'],
  'Castle': ['castle', 'castello'],
  'Estate': ['estate', 'tenuta'],
  'Cottage': ['cottage', 'rustico'],
  'Mansion': ['mansion', 'palazzo'],
  'Property': ['property'],
};

function normalizeRegion(region: string): string {
  const lower = region.toLowerCase();
  for (const [key, values] of Object.entries(regionMapping)) {
    if (values.some(v => lower.includes(v))) return key;
  }
  return region;
}

function normalizeType(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, values] of Object.entries(typeMapping)) {
    if (values.some(v => lower.includes(v))) return key;
  }
  return type;
}

/** Returns true if the client has at least one matchable criterion. */
function hasMatchableCriteria(c: Cliente): boolean {
  return (
    (c.budget_max != null && c.budget_max > 0) ||
    (Array.isArray(c.regioni) && c.regioni.length > 0) ||
    (Array.isArray(c.tipologia) && c.tipologia.length > 0)
  );
}

function calculateMatchScore(cliente: Cliente, property: Property): number {
  let score = 0;
  let maxScore = 0;

  const regioni = Array.isArray(cliente.regioni) ? cliente.regioni : [];
  const tipologia = Array.isArray(cliente.tipologia) ? cliente.tipologia : [];

  // Budget check (30 points)
  if (cliente.budget_max != null && cliente.budget_max > 0 && property.price != null) {
    maxScore += 30;
    const budgetWithMargin = cliente.budget_max + 100000;
    if (property.price <= cliente.budget_max) {
      score += 30;
    } else if (property.price <= budgetWithMargin) {
      const overBudget = property.price - cliente.budget_max;
      const penalty = (overBudget / 100000) * 15;
      score += Math.max(15, 30 - penalty);
    }
  }

  // Region match (25 points)
  if (regioni.length > 0 && property.region) {
    maxScore += 25;
    const normalizedPropertyRegion = normalizeRegion(property.region);
    const clienteRegionsNormalized = regioni.map(r => normalizeRegion(r));
    if (clienteRegionsNormalized.includes(normalizedPropertyRegion)) {
      score += 25;
    }
  }

  // Property type match (20 points)
  if (tipologia.length > 0 && property.property_type) {
    maxScore += 20;
    const normalizedPropertyType = normalizeType(property.property_type);
    const clienteTypesNormalized = tipologia.map(t => normalizeType(t));

    if (clienteTypesNormalized.some(t =>
      t === normalizedPropertyType ||
      normalizedPropertyType.toLowerCase().includes(t.toLowerCase())
    )) {
      score += 20;
    } else {
      const similarTypes: Record<string, string[]> = {
        'Villa': ['Country House', 'Estate', 'Mansion'],
        'Farmhouse': ['Country House', 'Cottage', 'Estate'],
        'Apartment': ['Flat'],
        'Estate': ['Villa', 'Mansion', 'Farmhouse'],
      };
      for (const clienteType of clienteTypesNormalized) {
        const similar = similarTypes[clienteType] || [];
        if (similar.includes(normalizedPropertyType)) {
          score += 12;
          break;
        }
      }
    }
  }

  // Pool preference (10 points)
  if (cliente.piscina) {
    maxScore += 10;
    const wantsPool = cliente.piscina.toLowerCase().includes('yes') ||
                      cliente.piscina.toLowerCase().includes('sì');
    if (wantsPool && property.has_pool) {
      score += 10;
    } else if (wantsPool && !property.has_pool) {
      score += 3;
    } else {
      score += 10;
    }
  }

  // Land preference (10 points)
  if (cliente.terreno) {
    maxScore += 10;
    const wantsLand = cliente.terreno.toLowerCase().includes('yes') ||
                      cliente.terreno.toLowerCase().includes('sì');
    if (wantsLand && property.has_land) {
      score += 10;
    } else if (!wantsLand) {
      score += 10;
    }
  }

  // Rooms match (5 points)
  if (cliente.camere && property.rooms != null) {
    maxScore += 5;
    const wantedRooms = parseInt(cliente.camere) || 0;
    if (wantedRooms > 0) {
      const diff = Math.abs(property.rooms - wantedRooms);
      if (diff === 0) score += 5;
      else if (diff <= 1) score += 4;
      else if (diff <= 2) score += 3;
      else if (diff <= 3) score += 1;
    }
  }

  // Size match (5 points)
  if ((cliente.dimensioni_min != null || cliente.dimensioni_max != null) && property.surface_mq != null) {
    maxScore += 5;
    const tolerance = 0.2;
    const minWithTolerance = cliente.dimensioni_min != null ? cliente.dimensioni_min * (1 - tolerance) : 0;
    const maxWithTolerance = cliente.dimensioni_max != null ? cliente.dimensioni_max * (1 + tolerance) : Infinity;

    if (property.surface_mq >= minWithTolerance && property.surface_mq <= maxWithTolerance) {
      score += 5;
    } else {
      const minOk = cliente.dimensioni_min == null || property.surface_mq >= cliente.dimensioni_min * 0.7;
      const maxOk = cliente.dimensioni_max == null || property.surface_mq <= cliente.dimensioni_max * 1.4;
      if (minOk && maxOk) score += 2;
    }
  }

  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ error: 'Server misconfigured: missing environment variables' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse & validate request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const clienteId = typeof body.clienteId === 'string' ? body.clienteId : null;

    // Fetch clients
    let clienteQuery = supabase
      .from('clienti')
      .select('id, budget_max, regioni, tipologia, piscina, terreno, dimensioni_min, dimensioni_max, camere, bagni');

    if (clienteId) {
      clienteQuery = clienteQuery.eq('id', clienteId);
    }

    const { data: clienti, error: clientiError } = await clienteQuery;

    if (clientiError) {
      console.error('Failed to fetch clienti:', clientiError);
      return jsonResponse({ error: `Failed to fetch clients: ${clientiError.message}` }, 500);
    }

    if (!clienti || clienti.length === 0) {
      return jsonResponse(
        { error: clienteId ? `Client not found: ${clienteId}` : 'No clients found' },
        404,
      );
    }

    // Filter clients that have at least one matchable criterion
    const matchableClienti = clienti.filter((c) => hasMatchableCriteria(c as Cliente));
    const skippedCount = clienti.length - matchableClienti.length;

    if (matchableClienti.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No clients have sufficient criteria (budget_max, regioni, or tipologia) for matching',
        stats: { clients: 0, skipped: skippedCount, properties: 0, matches: 0 },
      });
    }

    // Fetch active properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, price, region, property_type, has_pool, has_land, surface_mq, rooms, bathrooms, active')
      .eq('active', true);

    if (propertiesError) {
      console.error('Failed to fetch properties:', propertiesError);
      return jsonResponse({ error: `Failed to fetch properties: ${propertiesError.message}` }, 500);
    }

    if (!properties || properties.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No active properties available for matching',
        stats: { clients: matchableClienti.length, properties: 0, matches: 0 },
      });
    }

    console.log(`Matching ${matchableClienti.length} clients against ${properties.length} properties (${skippedCount} skipped)`);

    let matchesCreated = 0;

    for (const cliente of matchableClienti) {
      for (const property of properties) {
        const score = calculateMatchScore(cliente as Cliente, property as Property);

        if (score >= 30) {
          const { error: upsertError } = await supabase
            .from('client_property_matches')
            .upsert({
              cliente_id: cliente.id,
              property_id: property.id,
              match_type: 'auto',
              match_score: score,
            }, {
              onConflict: 'cliente_id,property_id',
            });

          if (upsertError) {
            console.error(`Failed to upsert match (${cliente.id} ↔ ${property.id}):`, upsertError);
          } else {
            matchesCreated++;
          }
        }
      }
    }

    console.log(`Match complete: ${matchesCreated} matches created/updated`);

    return jsonResponse({
      success: true,
      message: `Matched ${matchableClienti.length} clients against ${properties.length} properties`,
      stats: {
        clients: matchableClienti.length,
        skipped: skippedCount,
        properties: properties.length,
        matches: matchesCreated,
      },
    });
  } catch (error) {
    console.error('Match error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      500,
    );
  }
});
