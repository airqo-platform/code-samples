"use client"; // Make sure to mark the file as a client component

import React from "react";
import { FeatureCard } from "@/components/feature-card";
import { MapPin, Users, BarChart3 } from "lucide-react";
import Navigation from "@/components/navigation/navigation";

export default function AboutPage() {
  return (
    <div>
      {/* Navigation Component at the top for consistency */}
      <Navigation />

      {/* About Page Content */}
      <div className="container mx-auto px-4 py-8 h-full overflow-y-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About AirQo</h1>

        <div className="mb-12">
          <p className="text-lg mb-4">
            AirQo is a pioneering initiative dedicated to improving air quality monitoring and management across Africa.
            Our mission is to provide accurate, actionable air quality information to empower communities, researchers,
            and policymakers in the fight against air pollution.
          </p>
          <p className="text-lg">
            Founded in 2015 at Makerere University in Uganda, AirQo has grown into a multidisciplinary team of engineers,
            data scientists, and environmental experts. We're committed to developing innovative, low-cost air quality
            monitoring solutions tailored for the unique challenges of African urban environments.
          </p>
        </div>

        <h2 className="text-3xl font-semibold mb-6 text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <FeatureCard
            title="Local Expertise"
            description="We leverage local knowledge and talent to create solutions that work for African cities."
            Icon={MapPin}
          />
          <FeatureCard
            title="Collaboration"
            description="We partner with communities, governments, and organizations to maximize our impact."
            Icon={Users}
          />
          <FeatureCard
            title="Data-Driven Decisions"
            description="We believe in the power of accurate data to drive meaningful policy changes."
            Icon={BarChart3}
          />
        </div>

        <div className="bg-blue-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Our Impact</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Deployed over 100 low-cost air quality sensors across East Africa</li>
            <li>Provided air quality data to millions of citizens through our mobile app and API</li>
            <li>Collaborated with local governments to develop data-driven air quality management strategies</li>
            <li>Engaged in capacity building, training over 500 individuals in air quality monitoring and analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
