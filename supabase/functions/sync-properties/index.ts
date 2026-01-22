import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  ref_number: string | null;
  title: string;
  url: string;
  price: number | null;
  location: string | null;
  region: string | null;
  property_type: string | null;
  surface_mq: number | null;
  rooms: number | null;
  bathrooms: number | null;
  has_pool: boolean;
  has_land: boolean;
  land_hectares: number | null;
  image_url: string | null;
  description: string | null;
  features: string[];
}

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
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting property sync from cortesiluxuryrealestate.com...');

    // Step 1: Map the website to get all property URLs
    console.log('Mapping website...');
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://cortesiluxuryrealestate.com',
        limit: 500,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();
    
    if (!mapResponse.ok) {
      console.error('Map failed:', mapData);
      return new Response(
        JSON.stringify({ success: false, error: mapData.error || 'Failed to map website' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter for property listing URLs
    const propertyUrls = (mapData.links || []).filter((url: string) => 
      url.includes('/property/') || url.includes('/properties/') || 
      url.match(/\/[a-z-]+-ref-\d+/) || url.match(/ref[_-]?\d+/i)
    );

    console.log(`Found ${propertyUrls.length} potential property URLs`);

    if (propertyUrls.length === 0) {
      // Try to get properties from main listings pages
      const listingUrls = (mapData.links || []).filter((url: string) =>
        url.includes('/for-sale') || url.includes('/vendita') || 
        url.includes('/properties') || url.includes('/immobili')
      );
      console.log('No direct property URLs found. Listing pages:', listingUrls);
    }

    // Step 2: Scrape each property page
    const properties: PropertyData[] = [];
    const urlsToScrape = propertyUrls.slice(0, 100); // Limit to 100 properties per sync

    for (const url of urlsToScrape) {
      try {
        console.log(`Scraping: ${url}`);
        
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
          console.error(`Failed to scrape ${url}:`, scrapeData.error);
          continue;
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

        const property: PropertyData = {
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
        };

        properties.push(property);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`Error scraping ${url}:`, err);
      }
    }

    console.log(`Successfully scraped ${properties.length} properties`);

    // Step 3: Upsert properties to database
    let inserted = 0;
    let updated = 0;

    for (const property of properties) {
      const { error } = await supabase
        .from('properties')
        .upsert({
          ...property,
          scraped_at: new Date().toISOString(),
          active: true,
        }, {
          onConflict: 'url',
        });

      if (error) {
        console.error(`Failed to upsert property ${property.url}:`, error);
      } else {
        // Check if it was insert or update
        const { data: existing } = await supabase
          .from('properties')
          .select('created_at, scraped_at')
          .eq('url', property.url)
          .single();
        
        if (existing && existing.created_at === existing.scraped_at) {
          inserted++;
        } else {
          updated++;
        }
      }
    }

    // Step 4: Mark properties not found in this sync as potentially inactive
    const syncedUrls = properties.map(p => p.url);
    if (syncedUrls.length > 0) {
      // Only mark as inactive if we got a decent number of properties
      // to avoid false positives from partial syncs
      if (properties.length >= 10) {
        const { error: deactivateError } = await supabase
          .from('properties')
          .update({ active: false })
          .not('url', 'in', `(${syncedUrls.map(u => `"${u}"`).join(',')})`)
          .lt('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        if (deactivateError) {
          console.error('Failed to deactivate old properties:', deactivateError);
        }
      }
    }

    console.log(`Sync complete: ${inserted} inserted, ${updated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${properties.length} properties`,
        stats: {
          found: propertyUrls.length,
          scraped: properties.length,
          inserted,
          updated,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Sync failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
