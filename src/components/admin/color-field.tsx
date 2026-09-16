"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";

/**
 * Hex color input backed by the native color picker.
 *
 * Both controls write the same value, and the text field stays editable so an
 * owner can paste an exact brand hex rather than eyeballing it in the picker.
 * Only the text field carries `name`, so what's submitted is always what's
 * shown.
 */
export function ColorField({
  name,
  label,
  hint,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);

  function update(next: string) {
    setValue(next);
    if (/^#[0-9A-Fa-f]{6}$/.test(next)) onChange?.(next);
  }

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={isValid ? value : "#000000"}
          onChange={(e) => update(e.target.value.toUpperCase())}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-charcoal-700 bg-charcoal-900 p-1"
        />
        <Input
          id={name}
          name={name}
          value={value}
          onChange={(e) => update(e.target.value.toUpperCase())}
          spellCheck={false}
          maxLength={7}
          className="font-mono uppercase"
          aria-invalid={!isValid}
        />
      </div>
      {!isValid && (
        <p className="mt-1 text-xs text-red-400">Enter a 6-digit hex color, e.g. #C8A44D.</p>
      )}
      {isValid && hint && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
    </div>
  );
}
