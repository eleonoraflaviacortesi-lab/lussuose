import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Cliente {
  id: string;
  budget_max: number | null;
  regioni: string[];
  tipologia: string[];
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
  has_pool: boolean;
  has_land: boolean;
  surface_mq: number | null;
  rooms: number | null;
  bathrooms: number | null;
  active: boolean;
}

// Map Italian region names to English
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

// Map property types
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
    if (values.some(v => lower.includes(v))) {
      return key;
    }
  }
  return region;
}

function normalizeType(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, values] of Object.entries(typeMapping)) {
    if (values.some(v => lower.includes(v))) {
      return key;
    }
  }
  return type;
}

function calculateMatchScore(cliente: Cliente, property: Property): number {
  let score = 0;
  let factors = 0;

  // Budget check (30 points) - property price should be within budget
  if (cliente.budget_max && property.price) {
    factors++;
    if (property.price <= cliente.budget_max) {
      // Full points if under budget, partial if slightly over
      const ratio = property.price / cliente.budget_max;
      if (ratio <= 1) {
        score += 30;
      } else if (ratio <= 1.1) {
        score += 20; // Within 10% over budget
      } else if (ratio <= 1.2) {
        score += 10; // Within 20% over budget
      }
    }
  }

  // Region match (25 points)
  if (cliente.regioni.length > 0 && property.region) {
    factors++;
    const normalizedPropertyRegion = normalizeRegion(property.region);
    const clienteRegionsNormalized = cliente.regioni.map(r => normalizeRegion(r));
    
    if (clienteRegionsNormalized.includes(normalizedPropertyRegion)) {
      score += 25;
    }
  }

  // Property type match (20 points)
  if (cliente.tipologia.length > 0 && property.property_type) {
    factors++;
    const normalizedPropertyType = normalizeType(property.property_type);
    const clienteTypesNormalized = cliente.tipologia.map(t => normalizeType(t));
    
    if (clienteTypesNormalized.some(t => 
      t === normalizedPropertyType || 
      normalizedPropertyType.toLowerCase().includes(t.toLowerCase())
    )) {
      score += 20;
    }
  }

  // Pool preference (10 points)
  if (cliente.piscina) {
    factors++;
    const wantsPool = cliente.piscina.toLowerCase().includes('yes') || 
                      cliente.piscina.toLowerCase().includes('sì');
    if (wantsPool && property.has_pool) {
      score += 10;
    } else if (!wantsPool) {
      score += 10; // No preference is fine
    }
  }

  // Land preference (10 points)
  if (cliente.terreno) {
    factors++;
    const wantsLand = cliente.terreno.toLowerCase().includes('yes') || 
                      cliente.terreno.toLowerCase().includes('sì');
    if (wantsLand && property.has_land) {
      score += 10;
    } else if (!wantsLand) {
      score += 10; // No preference is fine
    }
  }

  // Size match (5 points)
  if ((cliente.dimensioni_min || cliente.dimensioni_max) && property.surface_mq) {
    factors++;
    const minOk = !cliente.dimensioni_min || property.surface_mq >= cliente.dimensioni_min;
    const maxOk = !cliente.dimensioni_max || property.surface_mq <= cliente.dimensioni_max;
    if (minOk && maxOk) {
      score += 5;
    }
  }

  // If no factors were compared, return 0
  if (factors === 0) return 0;

  // Normalize score to 0-100 based on factors that were actually compared
  const maxPossibleScore = factors * (100 / 6); // 6 total factors
  return Math.round((score / maxPossibleScore) * 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clienteId } = await req.json();

    console.log('Calculating property matches...');

    // Get clients to match
    let clienteQuery = supabase
      .from('clienti')
      .select('id, budget_max, regioni, tipologia, piscina, terreno, dimensioni_min, dimensioni_max, camere, bagni');
    
    if (clienteId) {
      clienteQuery = clienteQuery.eq('id', clienteId);
    }

    const { data: clienti, error: clientiError } = await clienteQuery;

    if (clientiError) {
      console.error('Failed to fetch clienti:', clientiError);
      return new Response(
        JSON.stringify({ success: false, error: clientiError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, price, region, property_type, has_pool, has_land, surface_mq, rooms, bathrooms, active')
      .eq('active', true);

    if (propertiesError) {
      console.error('Failed to fetch properties:', propertiesError);
      return new Response(
        JSON.stringify({ success: false, error: propertiesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Matching ${clienti?.length || 0} clients against ${properties?.length || 0} properties`);

    let matchesCreated = 0;
    let matchesUpdated = 0;

    for (const cliente of (clienti || [])) {
      for (const property of (properties || [])) {
        const score = calculateMatchScore(cliente as Cliente, property as Property);

        // Only save matches with score >= 30
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
            console.error(`Failed to upsert match:`, upsertError);
          } else {
            matchesCreated++;
          }
        }
      }
    }

    console.log(`Match complete: ${matchesCreated} matches created/updated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Matched ${clienti?.length || 0} clients against ${properties?.length || 0} properties`,
        stats: {
          clients: clienti?.length || 0,
          properties: properties?.length || 0,
          matches: matchesCreated,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Match error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Match failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
