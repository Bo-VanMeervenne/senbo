import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1alpI26husBws0nVHpf0_CcR4RS3FrrxhBxPLeuhK_3s';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_SHEETS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from Daily Revenue sheet - columns A (date), B (revenue), C (views)
    const sheetName = 'Daily Revenue';
    const range = `${sheetName}!A:C`;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    
    console.log('Fetching daily revenue from Google Sheets...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Google Sheets response:', JSON.stringify(data).slice(0, 500));
    
    // Parse the values - skip header row
    const rows = data.values?.slice(1) || [];
    
    const parseAmount = (value: string): number => {
      if (!value) return 0;
      // Remove currency symbols and whitespace
      let cleaned = value.toString().replace(/[€$£\s]/g, '');
      
      // Check if it's European format (comma as decimal, period as thousands)
      if (cleaned.includes(',') && cleaned.includes('.')) {
        const lastComma = cleaned.lastIndexOf(',');
        const lastPeriod = cleaned.lastIndexOf('.');
        if (lastComma > lastPeriod) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        const parts = cleaned.split(',');
        if (parts[1] && parts[1].length === 2) {
          cleaned = cleaned.replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      
      return parseFloat(cleaned) || 0;
    };

    const parseDate = (value: string): string | null => {
      if (!value) return null;
      // Try to parse various date formats
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      // Try DD/MM/YYYY format
      const parts = value.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
      }
      return null;
    };

    const dailyData = rows
      .map((row: string[]) => {
        const date = parseDate(row[0]);
        if (!date) return null;
        return {
          date,
          revenue: parseAmount(row[1]),
          views: parseInt(row[2]?.replace(/[,.\s]/g, '') || '0') || 0,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`Parsed ${dailyData.length} daily revenue entries`);

    return new Response(
      JSON.stringify({ data: dailyData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-daily-revenue function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
