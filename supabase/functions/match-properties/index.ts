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
  let maxScore = 0;

  // Budget check (30 points) - allow up to €100k over budget for negotiation
  if (cliente.budget_max && property.price) {
    maxScore += 30;
    const budgetWithMargin = cliente.budget_max + 100000; // €100k negotiation margin
    
    if (property.price <= cliente.budget_max) {
      score += 30; // Perfect - under budget
    } else if (property.price <= budgetWithMargin) {
      // Gradual decrease: full points at budget, 15 points at budget+100k
      const overBudget = property.price - cliente.budget_max;
      const penalty = (overBudget / 100000) * 15;
      score += Math.max(15, 30 - penalty);
    }
    // Over budget+100k = 0 points
  }

  // Region match (25 points)
  if (cliente.regioni.length > 0 && property.region) {
    maxScore += 25;
    const normalizedPropertyRegion = normalizeRegion(property.region);
    const clienteRegionsNormalized = cliente.regioni.map(r => normalizeRegion(r));
    
    if (clienteRegionsNormalized.includes(normalizedPropertyRegion)) {
      score += 25;
    }
  }

  // Property type match (20 points) - flexible matching
  if (cliente.tipologia.length > 0 && property.property_type) {
    maxScore += 20;
    const normalizedPropertyType = normalizeType(property.property_type);
    const clienteTypesNormalized = cliente.tipologia.map(t => normalizeType(t));
    
    // Full match
    if (clienteTypesNormalized.some(t => 
      t === normalizedPropertyType || 
      normalizedPropertyType.toLowerCase().includes(t.toLowerCase())
    )) {
      score += 20;
    } else {
      // Partial match for similar types (e.g., Villa ~ Country House)
      const similarTypes: Record<string, string[]> = {
        'Villa': ['Country House', 'Estate', 'Mansion'],
        'Farmhouse': ['Country House', 'Cottage', 'Estate'],
        'Apartment': ['Flat'],
        'Estate': ['Villa', 'Mansion', 'Farmhouse'],
      };
      
      for (const clienteType of clienteTypesNormalized) {
        const similar = similarTypes[clienteType] || [];
        if (similar.includes(normalizedPropertyType)) {
          score += 12; // Partial credit for similar types
          break;
        }
      }
    }
  }

  // Pool preference (10 points) - flexible
  if (cliente.piscina) {
    maxScore += 10;
    const wantsPool = cliente.piscina.toLowerCase().includes('yes') || 
                      cliente.piscina.toLowerCase().includes('sì');
    if (wantsPool && property.has_pool) {
      score += 10;
    } else if (wantsPool && !property.has_pool) {
      score += 3; // Pool can often be added
    } else {
      score += 10; // No preference or doesn't want pool
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

  // Rooms match (5 points) - flexible: allow ±2 rooms
  if (cliente.camere && property.rooms) {
    maxScore += 5;
    const wantedRooms = parseInt(cliente.camere) || 0;
    if (wantedRooms > 0) {
      const diff = Math.abs(property.rooms - wantedRooms);
      if (diff === 0) {
        score += 5;
      } else if (diff <= 1) {
        score += 4; // 1 room difference
      } else if (diff <= 2) {
        score += 3; // 2 rooms difference
      } else if (diff <= 3) {
        score += 1; // 3 rooms difference
      }
    }
  }

  // Size match (5 points) - flexible with 20% tolerance
  if ((cliente.dimensioni_min || cliente.dimensioni_max) && property.surface_mq) {
    maxScore += 5;
    const tolerance = 0.2; // 20% tolerance
    const minWithTolerance = cliente.dimensioni_min ? cliente.dimensioni_min * (1 - tolerance) : 0;
    const maxWithTolerance = cliente.dimensioni_max ? cliente.dimensioni_max * (1 + tolerance) : Infinity;
    
    if (property.surface_mq >= minWithTolerance && property.surface_mq <= maxWithTolerance) {
      score += 5;
    } else {
      // Partial credit if close
      const minOk = !cliente.dimensioni_min || property.surface_mq >= cliente.dimensioni_min * 0.7;
      const maxOk = !cliente.dimensioni_max || property.surface_mq <= cliente.dimensioni_max * 1.4;
      if (minOk && maxOk) {
        score += 2;
      }
    }
  }

  // If no factors were compared, return 0
  if (maxScore === 0) return 0;

  // Calculate percentage
  return Math.round((score / maxScore) * 100);
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
