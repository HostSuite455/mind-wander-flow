import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HostDashboard from "@/components/HostDashboard";
import PropertyAnalysisDisplay from "@/components/PropertyAnalysisDisplay";

const Index = () => {
  const [generatedAnalysis, setGeneratedAnalysis] = useState(null);

  const handleAnalysisGenerated = (analysis: any) => {
    setGeneratedAnalysis(analysis);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <HostDashboard onAnalysisGenerated={handleAnalysisGenerated} />
        {generatedAnalysis && (
          <PropertyAnalysisDisplay analysis={generatedAnalysis} />
        )}
      </main>
    </div>
  );
};

export default Index;
