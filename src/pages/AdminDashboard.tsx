import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Heart, TrendingUp, Plus, Settings } from 'lucide-react';
import Header from '@/components/Header';

interface DashboardStats {
  totalNGOs: number;
  totalUsers: number;
  totalDonations: number;
  totalAmount: number;
  recentDonations: Array<{
    id: string;
    amount: number;
    created_at: string;
    profiles: { full_name: string | null } | null;
    ngos: { name: string } | null;
  }>;
  topNGOs: Array<{
    name: string;
    donation_count: number;
    total_amount: number;
  }>;
}

const AdminDashboard = () => {
  const { profile, loading: authLoading } = useAuth();
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalNGOs: 0,
    totalUsers: 0,
    totalDonations: 0,
    totalAmount: 0,
    recentDonations: [],
    topNGOs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!profile?.id || profile.role !== 'admin') {
        setLoading(false);
        return;
      }
      if (!profile?.id || !isAdmin) return;

      try {
        // Fetch NGO count
        const { count: ngoCount } = await supabase
          .from('ngos')
          .select('*', { count: 'exact', head: true });

        // Fetch user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch donation stats
        const { data: donationData, error: donationError } = await supabase
          .from('donations')
          .select('amount');

        // Fetch recent donations with user and NGO info
        const { data: recentDonations, error: recentError } = await supabase
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

        // Fetch top NGOs by donation amount
        const { data: topNGOsData, error: topError } = await supabase
          .from('donations')
          .select(`
            ngos (name),
            amount
          `);

        if (!donationError && !recentError && !topError) {
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

          setStats({
            totalNGOs: ngoCount || 0,
            totalUsers: userCount || 0,
            totalDonations: donationData?.length || 0,
            totalAmount,
            recentDonations: recentDonations || [],
            topNGOs
          });
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [profile?.id, isAdmin]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">Loading admin dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">Loading admin dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      icon: Building2,
      title: "Total NGOs",
      value: stats.totalNGOs.toLocaleString(),
      description: "Registered organizations",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      description: "Platform members",
      color: "text-secondary"
    },
    {
      icon: Heart,
      title: "Total Donations",
      value: stats.totalDonations.toLocaleString(),
      description: "Acts of generosity",
      color: "text-destructive"
    },
    {
      icon: TrendingUp,
      title: "Total Amount",
      value: formatCurrency(stats.totalAmount),
      description: "Funds raised",
      color: "text-accent-foreground"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Admin Dashboard
              </h1>
              <p className="text-xl text-muted-foreground">
                Welcome back, {profile?.full_name}. Here's your platform overview.
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              Administrator
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {mainStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-12 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Admin Actions
            </CardTitle>
            <CardDescription>
              Manage your platform and support the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-auto p-4 flex-col space-y-2">
                <Plus className="h-6 w-6" />
                <span>Add NGO</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Building2 className="h-6 w-6" />
                <span>Manage NGOs</span>
              </Button>
              <Button variant="secondary" className="h-auto p-4 flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span>User Management</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                <TrendingUp className="h-6 w-6" />
                <span>Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Donations */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Latest platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentDonations.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No donations yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {donation.profiles?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          to {donation.ngos?.name || 'Unknown NGO'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {formatCurrency(parseFloat(donation.amount.toString()))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top NGOs */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Top Performing NGOs</CardTitle>
              <CardDescription>NGOs receiving the most support</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topNGOs.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No data available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.topNGOs.map((ngo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{ngo.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ngo.donation_count} donations
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-secondary">
                          {formatCurrency(ngo.total_amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;