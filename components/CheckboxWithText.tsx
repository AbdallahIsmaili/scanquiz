"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface CheckboxWithTextProps {
  title: string;
  desc: string;
}

export function CheckboxWithText({ title, desc }: CheckboxWithTextProps) {
  return (
    <div className="flex items-top space-x-2">
      <Checkbox id="checkbox" />
      <div className="flex justify-start items-center gap-2">
        <label
          htmlFor="checkbox"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {title}
        </label>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
