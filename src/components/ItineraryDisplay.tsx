import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, DollarSign, Lightbulb, Download, Share2 } from "lucide-react";

interface Activity {
  time: string;
  title: string;
  description: string;
}

interface Day {
  day: number;
  title: string;
  activities: Activity[];
}

interface Itinerary {
  destination: string;
  duration: string;
  days: Day[];
  estimatedCost: string;
  tips: string[];
}

interface ItineraryDisplayProps {
  itinerary: Itinerary;
}

const ItineraryDisplay = ({ itinerary }: ItineraryDisplayProps) => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-seafoam mb-4">
              Your Personalized Itinerary
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge variant="secondary" className="px-4 py-2">
                <MapPin className="w-4 h-4 mr-2" />
                {itinerary.destination}
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                {itinerary.duration} days
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <DollarSign className="w-4 h-4 mr-2" />
                {itinerary.estimatedCost}
              </Badge>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Itinerary
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Itinerary Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-bold text-seafoam mb-6">Daily Schedule</h3>
              
              {itinerary.days.map((day, index) => (
                <Card key={index} className="shadow-soft border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-ocean text-white">
                    <CardTitle className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {day.day}
                      </div>
                      <span>Day {day.day}: {day.title}</span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex gap-4 p-6 border-b last:border-b-0 hover:bg-seafoam-light/20 transition-colors">
                          <div className="flex-shrink-0">
                            <div className="bg-coral text-white rounded-lg px-3 py-1 text-sm font-medium min-w-[60px] text-center">
                              {activity.time}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-semibold text-seafoam mb-1">
                              {activity.title}
                            </h4>
                            <p className="text-muted-foreground">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Trip Tips */}
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-seafoam">
                    <Lightbulb className="w-5 h-5" />
                    Travel Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {itinerary.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="text-seafoam">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Days</span>
                    <span className="font-semibold">{itinerary.duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <span className="font-semibold text-coral">{itinerary.estimatedCost}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Activities</span>
                    <span className="font-semibold">
                      {itinerary.days.reduce((total, day) => total + day.activities.length, 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Weather Widget Placeholder */}
              <Card className="shadow-soft border-0 bg-gradient-sunset text-white">
                <CardContent className="p-6 text-center">
                  <h4 className="font-semibold mb-2">Weather Forecast</h4>
                  <div className="text-3xl font-bold mb-1">24°C</div>
                  <p className="text-sm opacity-90">Sunny with light clouds</p>
                  <p className="text-xs opacity-75 mt-2">Perfect weather for exploring!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ItineraryDisplay;