"use client";
import React from "react";
import dynamic from "next/dynamic";
import Loading from "./Loading";

const LeafletMap = dynamic(() => import("../components/map/LeafletMap"), {
  ssr: false,
  loading: () => <Loading />,
});

const Home: React.FC = () => {
  return (
    <div>
      <LeafletMap />
    </div>
  );
};

export default Home;
