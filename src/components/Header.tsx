import { Button } from "@/components/ui/button";
import { Heart, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { toast } = useToast();

  const handleSignIn = () => {
    toast({
      title: "Authentication Required",
      description: "Connect to Supabase to enable user and NGO authentication.",
      variant: "default",
    });
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">LocalGive</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
              Categories
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
              NGOs
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
              How it Works
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
              Impact
            </a>
          </nav>

          <Button 
            onClick={handleSignIn}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;