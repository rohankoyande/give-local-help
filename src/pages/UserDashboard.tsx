import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  created_at: string;
  ngos: {
    name: string;
    categories: {
      name: string;
    } | null;
  } | null;
}

const UserDashboard = () => {
  const { profile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    favCategory: '',
    lastDonation: null as Date | null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!profile?.id) return;

      try {
        // Fetch user donations
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select(`
            *,
            ngos (
              name,
              categories (
                name
              )
            )
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (donationsError) {
          console.error('Error fetching donations:', donationsError);
        } else {
          setDonations(donationsData || []);

          // Calculate stats
          const totalAmount = donationsData?.reduce((sum, donation) => 
            sum + parseFloat(donation.amount?.toString() || '0'), 0) || 0;

          // Find most frequent category
          const categoryCount: Record<string, number> = {};
          donationsData?.forEach(donation => {
            const category = donation.ngos?.categories?.name;
            if (category) {
              categoryCount[category] = (categoryCount[category] || 0) + 1;
            }
          });

          const favCategory = Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

          const lastDonation = donationsData?.[0] ? new Date(donationsData[0].created_at) : null;

          setStats({
            totalDonations: donationsData?.length || 0,
            totalAmount,
            favCategory,
            lastDonation
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [profile?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome back, {profile?.full_name || 'Donor'}!
          </h1>
          <p className="text-xl text-muted-foreground">
            Here's your impact summary and recent activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Heart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalDonations}</div>
              <p className="text-xs text-muted-foreground">Acts of kindness</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Donated</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(stats.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">Total contribution</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                {stats.favCategory || 'None yet'}
              </div>
              <p className="text-xs text-muted-foreground">Most supported</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Donation</CardTitle>
              <Calendar className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.lastDonation ? stats.lastDonation.toLocaleDateString() : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">Most recent gift</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-12 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Discover new ways to make a difference in your community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild className="h-auto p-4 flex-col space-y-2">
                <Link to="/categories">
                  <Heart className="h-6 w-6" />
                  <span>Browse Categories</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Link to="/ngos">
                  <Users className="h-6 w-6" />
                  <span>Find NGOs</span>
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-auto p-4 flex-col space-y-2">
                <Link to="/impact">
                  <TrendingUp className="h-6 w-6" />
                  <span>View Impact</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Donations */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>
              Your latest contributions to local NGOs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No donations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start making a difference by donating to local NGOs
                </p>
                <Button asChild>
                  <Link to="/ngos">Find NGOs to Support</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.slice(0, 5).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-foreground">
                          {donation.ngos?.name || 'Unknown NGO'}
                        </h4>
                        {donation.ngos?.categories && (
                          <Badge variant="secondary">
                            {donation.ngos.categories.name}
                          </Badge>
                        )}
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          "{donation.message}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(donation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(parseFloat(donation.amount.toString()))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {donations.length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      View All Donations ({donations.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;