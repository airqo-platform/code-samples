"use client";

import React from "react";
import { FeatureCard } from "@/components/feature-card";
import { Users, HeartHandshake, Ruler, Share2 } from "lucide-react";
import Navigation from "@/components/navigation/navigation";

export default function AboutPage() {
  return (
    <div>
      {/* Navigation Component at the top for consistency */}
      <Navigation />

      {/* About Page Content */}
      <div className="container mx-auto px-4 py-8 h-full overflow-y-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About AirQo</h1>

        <div className="mb-12 text-justify">
          <p className="text-lg mb-4">
            AirQo is a pioneering initiative dedicated to improving air quality
            monitoring and management across Africa.
            <strong>
              Our mission is to efficiently collect, analyze and forecast air
              quality data to international standards and work with partners to
              reduce air pollution and raise awareness of its effects in African
              cities.
            </strong>
          </p>
          <p className="text-lg font-light">
            Founded in 2015 at Makerere University in Uganda, AirQo has grown
            into a multidisciplinary team of engineers, data scientists, and
            environmental experts. We&apos;re committed to developing
            innovative, low-cost air quality monitoring solutions tailored for
            the unique challenges of African urban environments.
          </p>
        </div>

        <h2 className="text-3xl font-semibold mb-6 text-center">
          Our Core Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <FeatureCard
            title="Citizen Focus"
            description="At AirQo, we believe that the main beneficiary of our work should be the citizen."
            Icon={HeartHandshake}
          />
          <FeatureCard
            title="Precision"
            description="We convert low-cost sensor data into a reliable measure of air quality thus making our network and our models as accurate as they can be.."
            Icon={Ruler}
          />
          <FeatureCard
            title="Collaboration and Openness"
            description="IWe work in a fast-moving field with continuous improvements in technology. We recruit the best teams and also commit to their ongoing professional development and training."
            Icon={Share2}
          />
          <FeatureCard
            title="Investment in People"
            description="We invest in the best talent and commit to their ongoing development and training."
            Icon={Users}
          />
        </div>

        <div className="bg-blue-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Our Impact</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Deployed over 300 low-cost air quality sensors across Africa
            </li>
            <li>
              Provided air quality data to millions of citizens through our
              digital platform and API
            </li>
            <li>
              Collaborated with local governments to develop data-driven air
              quality management strategies
            </li>
            <li>
              Engaged in capacity building, training over 5000 individuals in
              air quality monitoring and analysis.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
