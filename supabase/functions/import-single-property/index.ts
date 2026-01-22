import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse price from text like "€ 1.200.000" or "Price on request"
function parsePrice(text: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[€\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse surface from text like "450 sqm"
function parseSurface(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Parse rooms/bathrooms from text
function parseRooms(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Parse land hectares from text like "2 ha" or "5000 sqm"
function parseLand(text: string | null): number | null {
  if (!text) return null;
  const haMatch = text.match(/([\d.,]+)\s*ha/i);
  if (haMatch) {
    return parseFloat(haMatch[1].replace(',', '.'));
  }
  const sqmMatch = text.match(/([\d.,]+)\s*(?:sqm|mq)/i);
  if (sqmMatch) {
    return parseFloat(sqmMatch[1].replace(',', '.')) / 10000;
  }
  return null;
}

// Determine region from location text
function determineRegion(location: string | null, url: string): string | null {
  const text = (location || url).toLowerCase();
  if (text.includes('tuscany') || text.includes('toscana')) return 'Tuscany';
  if (text.includes('umbria')) return 'Umbria';
  if (text.includes('marche')) return 'Marche';
  if (text.includes('lazio')) return 'Lazio';
  if (text.includes('emilia') || text.includes('romagna')) return 'Emilia-Romagna';
  return null;
}

// Determine property type from title/description
function determinePropertyType(title: string, description: string | null): string | null {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (text.includes('villa')) return 'Villa';
  if (text.includes('farmhouse') || text.includes('casale') || text.includes('podere')) return 'Farmhouse';
  if (text.includes('apartment') || text.includes('appartamento')) return 'Apartment';
  if (text.includes('castle') || text.includes('castello')) return 'Castle';
  if (text.includes('mansion') || text.includes('palazzo')) return 'Mansion';
  if (text.includes('cottage') || text.includes('rustico')) return 'Cottage';
  if (text.includes('estate') || text.includes('tenuta')) return 'Estate';
  if (text.includes('country house')) return 'Country House';
  return 'Property';
}

// Check if property has pool
function hasPool(text: string): boolean {
  return text.toLowerCase().includes('pool') || text.toLowerCase().includes('piscina');
}

// Check if property has land
function hasLand(text: string): boolean {
  return text.toLowerCase().includes('land') || 
         text.toLowerCase().includes('hectare') || 
         text.toLowerCase().includes('terreno') ||
         text.toLowerCase().includes(' ha ') ||
         /\d+\s*ha\b/i.test(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    if (!url.includes('cortesiluxuryrealestate.com')) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL must be from cortesiluxuryrealestate.com' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Importing property from:', url);

    // Scrape the property page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Scrape failed:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape property' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = scrapeData.data?.markdown || scrapeData.markdown || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // Extract reference number from URL or content
    const refMatch = url.match(/ref[_-]?(\d+)/i) || content.match(/Ref[.\s]*(\d+)/i);
    const refNumber = refMatch ? `Ref. ${refMatch[1]}` : null;

    // Extract title
    const title = metadata.title || 
                 content.split('\n')[0]?.replace(/^#\s*/, '').trim() || 
                 'Unknown Property';

    // Look for price in content
    const priceMatch = content.match(/€\s*[\d.,]+|[\d.,]+\s*€|Price[:\s]*€?\s*[\d.,]+/i);
    const price = parsePrice(priceMatch?.[0] || null);

    // Look for location
    const locationMatch = content.match(/(?:Location|Località|Position)[:\s]*([^\n]+)/i);
    const location = locationMatch?.[1]?.trim() || metadata.description?.split(',')[0] || null;

    // Look for surface
    const surfaceMatch = content.match(/(\d+)\s*(?:sqm|mq|square meters)/i);
    const surface = parseSurface(surfaceMatch?.[0] || null);

    // Look for rooms
    const roomsMatch = content.match(/(\d+)\s*(?:rooms?|bedrooms?|camere)/i);
    const rooms = parseRooms(roomsMatch?.[0] || null);

    // Look for bathrooms
    const bathMatch = content.match(/(\d+)\s*(?:bath(?:room)?s?|bagn[io])/i);
    const bathrooms = parseRooms(bathMatch?.[0] || null);

    // Look for land
    const landMatch = content.match(/(\d+(?:[.,]\d+)?)\s*(?:ha|hectares?|ettari)/i);
    const landHectares = parseLand(landMatch?.[0] || null);

    // Get image from metadata
    const imageUrl = metadata.ogImage || metadata.image || null;

    const propertyData = {
      ref_number: refNumber,
      title: title.substring(0, 255),
      url,
      price,
      location,
      region: determineRegion(location, url),
      property_type: determinePropertyType(title, content),
      surface_mq: surface,
      rooms,
      bathrooms,
      has_pool: hasPool(content),
      has_land: hasLand(content) || landHectares !== null,
      land_hectares: landHectares,
      image_url: imageUrl,
      description: content.substring(0, 2000),
      features: [],
      scraped_at: new Date().toISOString(),
      active: true,
    };

    // Upsert property
    const { data: property, error: upsertError } = await supabase
      .from('properties')
      .upsert(propertyData, { onConflict: 'url' })
      .select('id')
      .single();

    if (upsertError) {
      console.error('Upsert failed:', upsertError);
      return new Response(
        JSON.stringify({ success: false, error: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Property imported successfully:', property.id);

    return new Response(
      JSON.stringify({
        success: true,
        propertyId: property.id,
        property: propertyData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Import failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
