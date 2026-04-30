"use client";

import { Label } from "@/components/ui/label";
import { useId } from "react";

type Props = {
  produceNames: string[];
  selectedProduce: string;
  onChange: (value: string) => void;
};

export function ProduceSelector({
  produceNames,
  selectedProduce,
  onChange,
}: Props) {
  const id = useId();

  return (
    <div className="produce-selector">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        Produce
      </Label>
      <select
        id={id}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={selectedProduce}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">No heatmap</option>
        {produceNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

