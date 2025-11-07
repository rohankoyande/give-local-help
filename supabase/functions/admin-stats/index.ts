import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch admin statistics
    const { count: ngoCount } = await supabase
      .from('ngos')
      .select('*', { count: 'exact', head: true });

    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: donationData } = await supabase
      .from('donations')
      .select('amount');

    const { data: recentDonations } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        created_at,
        profiles (full_name),
        ngos (name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: topNGOsData } = await supabase
      .from('donations')
      .select(`
        ngos (name),
        amount
      `);

    // Calculate total amount
    const totalAmount = donationData?.reduce((sum, donation) => 
      sum + parseFloat(donation.amount?.toString() || '0'), 0) || 0;

    // Process top NGOs data
    const ngoAmounts: Record<string, number> = {};
    const ngoCounts: Record<string, number> = {};
    
    topNGOsData?.forEach((donation: any) => {
      if (donation.ngos?.name) {
        const ngoName = donation.ngos.name;
        const amount = parseFloat(donation.amount?.toString() || '0');
        ngoAmounts[ngoName] = (ngoAmounts[ngoName] || 0) + amount;
        ngoCounts[ngoName] = (ngoCounts[ngoName] || 0) + 1;
      }
    });

    const topNGOs = Object.entries(ngoAmounts)
      .map(([name, total_amount]) => ({
        name,
        total_amount,
        donation_count: ngoCounts[name] || 0
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);

    const stats = {
      totalNGOs: ngoCount || 0,
      totalUsers: userCount || 0,
      totalDonations: donationData?.length || 0,
      totalAmount,
      recentDonations: recentDonations || [],
      topNGOs
    };

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-stats function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
