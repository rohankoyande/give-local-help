import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Search, Heart, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up",
      description: "Create your free account as a donor or register your NGO to get started with our platform.",
      action: "Get Started"
    },
    {
      icon: Search,
      title: "Discover NGOs",
      description: "Browse through verified local NGOs by category, location, or specific needs to find causes you care about.",
      action: "Browse NGOs"
    },
    {
      icon: Heart,
      title: "Make a Difference",
      description: "Donate money, volunteer time, or contribute items directly to NGOs that need your support most.",
      action: "Start Donating"
    },
    {
      icon: BarChart3,
      title: "Track Impact",
      description: "See the real impact of your contributions through detailed reports and updates from NGOs.",
      action: "View Impact"
    }
  ];

  const benefits = [
    {
      title: "Verified NGOs",
      description: "All NGOs on our platform are verified to ensure your donations reach legitimate organizations."
    },
    {
      title: "Transparent Process",
      description: "Track exactly how your donations are being used with regular updates and impact reports."
    },
    {
      title: "Local Focus",
      description: "Connect with NGOs in your community to see the direct impact of your contributions."
    },
    {
      title: "Multiple Ways to Help",
      description: "Donate money, items, or volunteer your time - every contribution makes a difference."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            How LocalGive Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Making a difference in your community has never been easier. Follow these simple steps to start your journey of giving back.
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            4 Simple Steps to Make an Impact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={index} className="text-center shadow-card hover:shadow-warm transition-smooth">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                      {index + 1}
                    </div>
                    <CardTitle className="text-xl text-foreground">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground mb-4">
                      {step.description}
                    </CardDescription>
                    <Button variant="outline" size="sm">
                      {step.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose LocalGive?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card rounded-lg p-8 shadow-card">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Join thousands of donors who are already making an impact in their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/signin">Sign Up as Donor</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/ngos">Browse NGOs</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;