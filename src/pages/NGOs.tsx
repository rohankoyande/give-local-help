import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Mail, Phone, Globe, Search } from 'lucide-react';
import Header from '@/components/Header';

interface NGO {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  created_at: string;
  categories: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

const NGOs = () => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        } else {
          setCategories(categoriesData || []);
        }

        // Fetch NGOs with category information
        const { data: ngosData, error: ngosError } = await supabase
          .from('ngos')
          .select(`
            *,
            categories (
              name
            )
          `)
          .order('name');

        if (ngosError) {
          console.error('Error fetching NGOs:', ngosError);
        } else {
          setNgos(ngosData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set initial category filter from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const filteredNGOs = ngos.filter((ngo) => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ngo.description && ngo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (ngo.location && ngo.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           (ngo.categories && ngo.categories.name === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">Loading NGOs...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Local NGOs Directory
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and connect with NGOs in your area that are making a difference in the community.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search NGOs by name, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-muted-foreground">
          Showing {filteredNGOs.length} of {ngos.length} NGOs
        </div>

        {/* NGOs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNGOs.map((ngo) => (
            <Card key={ngo.id} className="h-full shadow-card hover:shadow-warm transition-smooth">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">
                  {ngo.name}
                </CardTitle>
                {ngo.categories && (
                  <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-sm rounded-md w-fit">
                    {ngo.categories.name}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {ngo.description && (
                  <CardDescription className="text-muted-foreground">
                    {ngo.description}
                  </CardDescription>
                )}
                
                <div className="space-y-2">
                  {ngo.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {ngo.location}
                    </div>
                  )}
                  
                  {ngo.contact_email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${ngo.contact_email}`} className="hover:text-primary transition-smooth">
                        {ngo.contact_email}
                      </a>
                    </div>
                  )}
                  
                  {ngo.contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${ngo.contact_phone}`} className="hover:text-primary transition-smooth">
                        {ngo.contact_phone}
                      </a>
                    </div>
                  )}
                  
                  {ngo.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={ngo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-smooth"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <Button className="w-full mt-4">
                  Contact NGO
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNGOs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-4">
              No NGOs found matching your search criteria.
            </div>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default NGOs;