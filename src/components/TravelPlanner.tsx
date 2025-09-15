import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Wallet, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TravelPlannerProps {
  onPlanGenerated: (plan: any) => void;
}

const TravelPlanner = ({ onPlanGenerated }: TravelPlannerProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    duration: "",
    budget: "",
    travelers: "",
    interests: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockItinerary = {
        destination: formData.destination,
        duration: formData.duration,
        days: [
          {
            day: 1,
            title: "Arrival & City Center",
            activities: [
              { time: "09:00", title: "Airport Transfer", description: "Arrive and check into hotel" },
              { time: "14:00", title: "Historic District", description: "Explore the old town and local markets" },
              { time: "19:00", title: "Welcome Dinner", description: "Traditional cuisine at a local restaurant" }
            ]
          },
          {
            day: 2,
            title: "Cultural Immersion",
            activities: [
              { time: "09:00", title: "Museum Visit", description: "Discover local history and art" },
              { time: "13:00", title: "Local Lunch", description: "Authentic street food experience" },
              { time: "16:00", title: "Cultural Workshop", description: "Hands-on traditional craft experience" }
            ]
          }
        ],
        estimatedCost: "$" + (parseInt(formData.budget) || 1500),
        tips: [
          "Pack comfortable walking shoes",
          "Learn basic local phrases",
          "Try the local specialties"
        ]
      };
      
      onPlanGenerated(mockItinerary);
      setIsGenerating(false);
      
      toast({
        title: "Itinerary Generated!",
        description: `Your personalized ${formData.duration}-day trip to ${formData.destination} is ready!`,
      });
    }, 2000);
  };

  return (
    <section id="travel-planner" className="py-20 bg-gradient-to-br from-seafoam-light to-sand">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-seafoam mb-4">
            Plan Your Perfect Trip
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us about your dream destination and preferences, and we'll create a personalized itinerary just for you.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-soft border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-seafoam">
              <Wand2 className="w-6 h-6" />
              AI Travel Planner
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center gap-2 text-seafoam font-medium">
                    <MapPin className="w-4 h-4" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="Where would you like to go?"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2 text-seafoam font-medium">
                    <Calendar className="w-4 h-4" />
                    Duration
                  </Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Trip length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="10">10 days</SelectItem>
                      <SelectItem value="14">2 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travelers" className="flex items-center gap-2 text-seafoam font-medium">
                    <Users className="w-4 h-4" />
                    Travelers
                  </Label>
                  <Select value={formData.travelers} onValueChange={(value) => setFormData({ ...formData, travelers: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Number of travelers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo traveler</SelectItem>
                      <SelectItem value="couple">Couple</SelectItem>
                      <SelectItem value="family">Family (3-4)</SelectItem>
                      <SelectItem value="group">Group (5+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2 text-seafoam font-medium">
                    <Wallet className="w-4 h-4" />
                    Budget (USD)
                  </Label>
                  <Select value={formData.budget} onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">Under $1,000</SelectItem>
                      <SelectItem value="2500">$1,000 - $2,500</SelectItem>
                      <SelectItem value="5000">$2,500 - $5,000</SelectItem>
                      <SelectItem value="10000">$5,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests" className="text-seafoam font-medium">
                  Interests & Preferences
                </Label>
                <Input
                  id="interests"
                  placeholder="e.g., culture, adventure, food, beaches, history..."
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isGenerating || !formData.destination || !formData.duration}
                className="w-full h-14 text-lg font-semibold bg-gradient-ocean hover:scale-105 transition-all duration-300 shadow-glow"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Your Itinerary...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Create My Itinerary
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TravelPlanner;