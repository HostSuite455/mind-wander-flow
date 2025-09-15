import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import TravelPlanner from "@/components/TravelPlanner";
import ItineraryDisplay from "@/components/ItineraryDisplay";

const Index = () => {
  const [generatedItinerary, setGeneratedItinerary] = useState(null);

  const handlePlanGenerated = (plan: any) => {
    setGeneratedItinerary(plan);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <TravelPlanner onPlanGenerated={handlePlanGenerated} />
        {generatedItinerary && (
          <ItineraryDisplay itinerary={generatedItinerary} />
        )}
      </main>
    </div>
  );
};

export default Index;
