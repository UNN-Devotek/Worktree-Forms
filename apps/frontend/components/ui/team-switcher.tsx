"use client";

import React from "react";

// Stub component - TODO: Install or implement properly
export function TeamSwitcher({ teams }: { teams: Array<{ name: string; logo: any; plan: string }> }) {
  return <div className="p-2">
    {teams.length > 0 && (
      <div className="font-semibold">{teams[0].name}</div>
    )}
  </div>;
}
