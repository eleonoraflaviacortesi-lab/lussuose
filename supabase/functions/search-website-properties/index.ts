import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query must be at least 2 characters' }),
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

    console.log('Searching website for:', query);

    // Use Firecrawl search - skip markdown scraping for speed
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:cortesiluxuryrealestate.com/en/ ${query}`,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 0,
        },
      }),
    });

    const searchData = await searchResponse.json();
    console.log('Firecrawl response structure:', JSON.stringify(Object.keys(searchData)));

    if (!searchResponse.ok) {
      console.error('Search failed:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || 'Search failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse search results - Firecrawl v1 has data in searchData.data
    const resultsArray = searchData.data || [];
    console.log('Results count:', resultsArray.length);
    
    const results = resultsArray.map((result: any) => {
      const url = result.url || '';
      const title = result.title || 'Unknown Property';
      const description = result.description || '';
      const markdown = result.markdown || '';
      const metadata = result.metadata || {};
      
      // Extract ref number from URL, title, description, or markdown content
      // Site uses formats like "Ref: 1023", "Rif: 1023", "Ref. 1023"
      const refMatch = url.match(/ref[_-]?(\d+)/i) || 
                       title.match(/(?:Ref|Rif)[.:\s]*(\d+)/i) || 
                       description.match(/(?:Ref|Rif)[.:\s]*(\d+)/i) ||
                       markdown.match(/(?:Ref|Rif)[.:\s]*(\d+)/i) ||
                       markdown.match(/(?:Reference|Riferimento|Code|Codice)[:\s]*(\d+)/i);
      const refNumber = refMatch ? `Ref. ${refMatch[1]}` : null;
      
      // Debug: log first 300 chars of markdown and metadata for ref extraction debugging
      console.log(`[${title.substring(0, 50)}] URL: ${url}`);
      console.log(`  ref_number: ${refNumber}`);
      console.log(`  metadata keys: ${JSON.stringify(Object.keys(metadata))}`);
      console.log(`  markdown first 500 chars: ${markdown.substring(0, 500)}`);
      console.log(`  description: ${description.substring(0, 200)}`);

      // Try to extract price from description, markdown, or metadata
      let price = null;
      const priceMatch = description.match(/€\s*[\d.,]+|[\d.,]+\s*€/) || 
                         markdown.match(/€\s*[\d.,]+|[\d.,]+\s*€/);
      if (priceMatch) {
        const cleaned = priceMatch[0].replace(/[€\s.]/g, '').replace(',', '.');
        price = parseFloat(cleaned);
        if (isNaN(price)) price = null;
      }

      // Extract image URL from metadata
      let imageUrl = metadata.ogImage || metadata.image || null;
      
      // If no og:image, try to extract from markdown
      if (!imageUrl) {
        const imgMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
      }

      // Extract property details from markdown
      let rooms = null;
      let bathrooms = null;
      let surface = null;
      let location = null;

      // Extract rooms/bedrooms
      const roomsMatch = markdown.match(/(\d+)\s*(?:camere|bedrooms?|rooms?)/i);
      if (roomsMatch) rooms = parseInt(roomsMatch[1]);

      // Extract bathrooms
      const bathMatch = markdown.match(/(\d+)\s*(?:bagn|bathroom)/i);
      if (bathMatch) bathrooms = parseInt(bathMatch[1]);

      // Extract surface area
      const surfaceMatch = markdown.match(/(\d+[\d.,]*)\s*(?:mq|m²|sqm|metri quadri)/i);
      if (surfaceMatch) surface = parseInt(surfaceMatch[1].replace(/[.,]/g, ''));

      // Extract location from metadata or title
      location = metadata.ogLocale ? null : null; // Not useful
      const locationMatch = title.match(/(?:in|a|near)\s+([A-Z][a-zA-Z\s]+?)(?:\s*[-–—]|$)/i) ||
                           description.match(/(?:Situata?\s+(?:a|in|near)\s+)([A-Z][a-zA-Z\s,]+?)(?:\.|,|\s+(?:a|in|this))/i);
      if (locationMatch) location = locationMatch[1].trim();

      return {
        url,
        title: title.replace(' - Cortesi Luxury Real Estate', '').trim(),
        description: description.substring(0, 200),
        ref_number: refNumber,
        price,
        image_url: imageUrl,
        rooms,
        bathrooms,
        surface,
        location,
      };
    }).filter((r: any) => 
      // Filter to only individual property pages
      r.url.includes('cortesiluxuryrealestate.com') && 
      !r.url.includes('/category/') &&
      !r.url.includes('/page/') &&
      !r.url.endsWith('/properties/') &&
      !r.url.endsWith('/vendita/') &&
      r.title.length > 5 &&
      // Exclude generic listing/category pages (non-property results)
      !/^(Villas|Farmhouses|Properties|Luxury|Casali|Ville|Lussuose|Propriedades|Элитная|Luksusejendomme|Immobili)\s+(and|e|di|for|in|de|на|i)\s/i.test(r.title) &&
      // Must have a specific property URL pattern (contains property slug, not just category)
      r.url.split('/').filter((s: string) => s.length > 0).length >= 4
    );

    console.log(`Returning ${results.length} filtered results`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
