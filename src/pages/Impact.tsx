import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Heart, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';

interface ImpactMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  created_at: string;
  ngos: {
    name: string;
  } | null;
}

interface Stats {
  totalNGOs: number;
  totalDonations: number;
  totalDonationAmount: number;
  totalUsers: number;
}

const Impact = () => {
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetric[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalNGOs: 0,
    totalDonations: 0,
    totalDonationAmount: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch impact metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('impact_metrics')
          .select(`
            *,
            ngos (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (metricsError) {
          console.error('Error fetching impact metrics:', metricsError);
        } else {
          setImpactMetrics(metricsData || []);
        }

        // Fetch NGO count
        const { count: ngoCount, error: ngoError } = await supabase
          .from('ngos')
          .select('*', { count: 'exact', head: true });

        // Fetch donation stats
        const { data: donationData, error: donationError } = await supabase
          .from('donations')
          .select('amount');

        // Fetch user count
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (!ngoError && !donationError && !userError) {
          const totalAmount = donationData?.reduce((sum, donation) => 
            sum + (parseFloat(donation.amount?.toString() || '0')), 0) || 0;

          setStats({
            totalNGOs: ngoCount || 0,
            totalDonations: donationData?.length || 0,
            totalDonationAmount: totalAmount,
            totalUsers: userCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const mainStats = [
    {
      icon: Building2,
      title: "Partner NGOs",
      value: stats.totalNGOs.toLocaleString(),
      description: "Verified organizations making a difference",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Active Donors",
      value: stats.totalUsers.toLocaleString(),
      description: "Community members contributing to causes",
      color: "text-secondary"
    },
    {
      icon: Heart,
      title: "Total Donations",
      value: stats.totalDonations.toLocaleString(),
      description: "Individual acts of kindness",
      color: "text-destructive"
    },
    {
      icon: TrendingUp,
      title: "Amount Donated",
      value: formatCurrency(stats.totalDonationAmount),
      description: "Financial support provided to NGOs",
      color: "text-accent-foreground"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">Loading impact data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Our Community Impact
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Together, we're creating meaningful change in our communities. See the incredible impact that your donations and support have made possible.
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {mainStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="text-center shadow-card hover:shadow-warm transition-smooth">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </CardTitle>
                  <CardDescription className="text-lg font-medium text-foreground">
                    {stat.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Impact Metrics from NGOs */}
        {impactMetrics.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Real Impact Stories
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {impactMetrics.map((metric) => (
                <Card key={metric.id} className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">
                      {metric.metric_value.toLocaleString()}
                    </CardTitle>
                    <CardDescription className="text-lg font-medium text-foreground">
                      {metric.metric_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {metric.ngos && (
                      <p className="text-muted-foreground">
                        by {metric.ngos.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Reported on {new Date(metric.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center bg-card rounded-lg p-8 shadow-card">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Be Part of the Impact
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Every donation, no matter the size, creates ripple effects of positive change in our community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-primary mb-2">₹100</div>
              <p className="text-muted-foreground">Can provide school supplies for a child</p>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-secondary mb-2">₹500</div>
              <p className="text-muted-foreground">Can support a family's hygiene needs for a month</p>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-accent-foreground mb-2">₹1000</div>
              <p className="text-muted-foreground">Can provide warm clothing for someone in need</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Impact;