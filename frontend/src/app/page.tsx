"use client";
import React from "react";
import dynamic from "next/dynamic";
import Loading from "./Loading";
import Navigation from "@/components/navigation/navigation";

const LeafletMap = dynamic(() => import("../components/map/LeafletMap"), {
  ssr: false,
  loading: () => <Loading />,
});

const Home: React.FC = () => {
  return (
    <div>
      {/* Add Navigation Component */}
      <Navigation />

      {/* Dynamically Loaded Map */}
      <LeafletMap />
    </div>
  );
};

export default Home;
