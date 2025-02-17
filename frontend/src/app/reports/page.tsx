import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Sparkles, BarChart3, BrainCircuit } from "lucide-react";
import Navigation from "@/components/navigation/navigation";
import { ReactNode } from "react";

export default function ReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navigation />
      <ReportContent />
    </div>
  );
}

function ReportContent() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12 space-y-10 text-center">
      <div className="text-5xl font-extrabold text-gray-800 flex items-center space-x-4 animate-pulse">
        <Sparkles className="text-blue-500 w-12 h-12" />
        <span>Coming Soon</span>
      </div>
      <p className="text-xl text-gray-600 max-w-2xl">
        Our AI-powered air quality reports are on the way! Stay tuned for
        real-time insights and advanced analytics to help you understand air
        pollution trends like never before
      </p>
      <Card className="w-full max-w-4xl shadow-lg border border-blue-500 bg-white">
        <CardHeader className="text-center bg-blue-500 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
            <BrainCircuit className="w-6 h-6" />
            <span>AI-Generated Air Quality Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-gray-700 text-lg">
            Leveraging artificial intelligence, we analyze real-time air
            pollution data to provide accurate insights and actionable
            recommendations. Our reports cover PM2.5 trends, pollution hotspots,
            and seasonal variations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoBox
              title="PM2.5 Trends"
              icon={<BarChart3 className="text-blue-500 w-10 h-10" />}
            >
              Analyze pollution levels over time to detect patterns and
              anomalies.
            </InfoBox>
            <InfoBox
              title="Regional Analysis"
              icon={<BarChart3 className="text-green-500 w-10 h-10" />}
            >
              Compare air quality across different locations with detailed
              breakdowns.
            </InfoBox>
            <InfoBox
              title="Health Impact"
              icon={<BarChart3 className="text-red-500 w-10 h-10" />}
            >
              Understand how pollution affects respiratory health and
              well-being.
            </InfoBox>
            <InfoBox
              title="AI Insights"
              icon={<BrainCircuit className="text-purple-500 w-10 h-10" />}
            >
              Smart predictions based on historical data to help communities
              prepare in advance.
            </InfoBox>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoBoxProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

function InfoBox({ title, icon, children }: InfoBoxProps) {
  return (
    <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg shadow">
      {icon}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm">{children}</p>
      </div>
    </div>
  );
}
