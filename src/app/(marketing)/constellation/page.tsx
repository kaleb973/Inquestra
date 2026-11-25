"use client";

import ConstellationField from "@/components/ui/constellation-field";

export default function ConstellationFieldDemo() {
  return (
    <div className="pt-16 sm:pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative h-[640px] w-full overflow-hidden rounded-lg border border-border bg-graphite p-8">
        <h1 className="text-graphite-ink text-3xl mb-4 font-semibold relative z-10">Constellation Demo</h1>
        <ConstellationField
          mode="dark"
          speed={1}
          size={1}
          strokeWidth={1}
          length={1}
          density={1}
          opacity={1}
          hue={0}
          saturation={1}
          brightness={1}
          className="absolute inset-0 z-0"
        />
      </div>
    </div>
  );
}
