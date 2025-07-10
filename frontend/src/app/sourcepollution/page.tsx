"use client";

import ParishMapClient from '@/components/map/ParishMapClient';
import Navigation from "@/components/navigation/navigation"

export default function SourcePollutionPage() {
  return (
    <div>
      <Navigation />
      <ParishMapClient />
    </div>
  );
}
