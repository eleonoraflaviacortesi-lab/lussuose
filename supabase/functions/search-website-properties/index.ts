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

    // Use Firecrawl search to find properties on the website
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:cortesiluxuryrealestate.com ${query}`,
        limit: 20,
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Search failed:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || 'Search failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse search results
    const results = (searchData.data || []).map((result: any) => {
      const url = result.url || '';
      const title = result.title || 'Unknown Property';
      const description = result.description || '';
      
      // Extract ref number from URL or title
      const refMatch = url.match(/ref[_-]?(\d+)/i) || title.match(/Ref[.\s]*(\d+)/i);
      const refNumber = refMatch ? `Ref. ${refMatch[1]}` : null;

      // Try to extract price from description
      const priceMatch = description.match(/€\s*[\d.,]+|[\d.,]+\s*€/);
      let price = null;
      if (priceMatch) {
        const cleaned = priceMatch[0].replace(/[€\s.]/g, '').replace(',', '.');
        price = parseFloat(cleaned);
        if (isNaN(price)) price = null;
      }

      return {
        url,
        title: title.replace(' - Cortesi Luxury Real Estate', '').trim(),
        description: description.substring(0, 200),
        ref_number: refNumber,
        price,
      };
    }).filter((r: any) => 
      // Filter to only property pages
      r.url.includes('cortesiluxuryrealestate.com') && 
      !r.url.includes('/category/') &&
      !r.url.includes('/page/') &&
      r.title.length > 5
    );

    console.log(`Found ${results.length} results`);

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
