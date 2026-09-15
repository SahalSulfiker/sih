"use client";

import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { demoScenarios } from "@/data/mockAnalysis";
import { cargoLabels, contractLabels, originLabels, portLabels } from "@/lib/format";
import type { AnalyzeRequest } from "@/types/analysis";

const inputClass =
  "h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-marine-500 disabled:bg-ink-900/5";

const contractOptions: { value: AnalyzeRequest["contract_preference"]; description: string }[] = [
  { value: "spot", description: "Single voyage, booked at current market rate" },
  { value: "3_month_mvc", description: "Minimum volume commitment over 3 months" },
  { value: "6_month_mvc", description: "Minimum volume commitment over 6 months" },
  { value: "open_to_mvc", description: "Let the analysis recommend the best structure" },
];

interface FormState {
  cargo_type: AnalyzeRequest["cargo_type"] | "";
  quantity_mt: string;
  origin: AnalyzeRequest["origin"] | "";
  destination_port: AnalyzeRequest["destination_port"] | "";
  required_date: string;
  contract_preference: AnalyzeRequest["contract_preference"] | "";
}

const emptyState: FormState = {
  cargo_type: "",
  quantity_mt: "",
  origin: "",
  destination_port: "",
  required_date: "",
  contract_preference: "",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function VoyageForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (request: AnalyzeRequest) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<FormState>(emptyState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function applyScenario(index: number) {
    const { request } = demoScenarios[index];
    setForm({
      cargo_type: request.cargo_type,
      quantity_mt: String(request.quantity_mt),
      origin: request.origin,
      destination_port: request.destination_port,
      required_date: request.required_date,
      contract_preference: request.contract_preference,
    });
    setErrors({});
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.cargo_type) next.cargo_type = "Select a cargo type.";
    const quantity = Number(form.quantity_mt);
    if (!form.quantity_mt || Number.isNaN(quantity) || quantity <= 0) {
      next.quantity_mt = "Enter a cargo quantity greater than zero.";
    }
    if (!form.origin) next.origin = "Select an origin.";
    if (!form.destination_port) next.destination_port = "Select a destination port.";
    if (!form.required_date) {
      next.required_date = "Select a required delivery date.";
    } else if (form.required_date < todayIso()) {
      next.required_date = "Delivery date must be in the future.";
    }
    if (!form.contract_preference) next.contract_preference = "Select a contract preference.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      cargo_type: form.cargo_type as AnalyzeRequest["cargo_type"],
      quantity_mt: Number(form.quantity_mt),
      origin: form.origin as AnalyzeRequest["origin"],
      destination_port: form.destination_port as AnalyzeRequest["destination_port"],
      required_date: form.required_date,
      contract_preference: form.contract_preference as AnalyzeRequest["contract_preference"],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border-strong bg-marine-100/40 px-4 py-3">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-marine-700" aria-hidden />
        <span className="text-[13px] text-ink-500">Try a sample cargo movement:</span>
        {demoScenarios.map((scenario, i) => (
          <button
            key={scenario.label}
            type="button"
            onClick={() => applyScenario(i)}
            className="rounded-full border border-border-strong bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-marine-500 hover:text-marine-700"
          >
            {scenario.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Cargo type" required error={errors.cargo_type}>
            {({ id, describedBy }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!errors.cargo_type}
                className={inputClass}
                value={form.cargo_type}
                onChange={(e) => set("cargo_type", e.target.value as FormState["cargo_type"])}
                disabled={submitting}
              >
                <option value="" disabled>
                  Select cargo type
                </option>
                {Object.entries(cargoLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Cargo quantity"
            required
            error={errors.quantity_mt}
            hint="In metric tonnes (MT)"
          >
            {({ id, describedBy }) => (
              <div className="relative">
                <input
                  id={id}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder="e.g. 75000"
                  aria-describedby={describedBy}
                  aria-invalid={!!errors.quantity_mt}
                  className={cn(inputClass, "pr-12")}
                  value={form.quantity_mt}
                  onChange={(e) => set("quantity_mt", e.target.value)}
                  disabled={submitting}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-400">
                  MT
                </span>
              </div>
            )}
          </FormField>

          <FormField label="Origin" required error={errors.origin}>
            {({ id, describedBy }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!errors.origin}
                className={inputClass}
                value={form.origin}
                onChange={(e) => set("origin", e.target.value as FormState["origin"])}
                disabled={submitting}
              >
                <option value="" disabled>
                  Select origin
                </option>
                {Object.entries(originLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Destination port" required error={errors.destination_port}>
            {({ id, describedBy }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!errors.destination_port}
                className={inputClass}
                value={form.destination_port}
                onChange={(e) =>
                  set("destination_port", e.target.value as FormState["destination_port"])
                }
                disabled={submitting}
              >
                <option value="" disabled>
                  Select destination port
                </option>
                {Object.entries(portLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Required delivery date" required error={errors.required_date}>
            {({ id, describedBy }) => (
              <input
                id={id}
                type="date"
                min={todayIso()}
                aria-describedby={describedBy}
                aria-invalid={!!errors.required_date}
                className={inputClass}
                value={form.required_date}
                onChange={(e) => set("required_date", e.target.value)}
                disabled={submitting}
              />
            )}
          </FormField>
        </div>

        <fieldset>
          <legend className="text-[13px] font-medium text-ink-700">
            Contract preference
            <span className="ml-0.5 text-critical-600">*</span>
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contractOptions.map((option) => {
              const selected = form.contract_preference === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 rounded-md border px-3.5 py-3 transition-colors",
                    selected
                      ? "border-marine-500 bg-marine-100/50"
                      : "border-border-strong hover:border-marine-300"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contract_preference"
                      value={option.value}
                      checked={selected}
                      onChange={() => set("contract_preference", option.value)}
                      disabled={submitting}
                      className="h-3.5 w-3.5 accent-marine-700"
                    />
                    <span className="text-sm font-medium text-ink-900">
                      {contractLabels[option.value as keyof typeof contractLabels] ??
                        "Open to MVC"}
                    </span>
                  </span>
                  <span className="pl-[22px] text-xs text-ink-400">{option.description}</span>
                </label>
              );
            })}
          </div>
          {errors.contract_preference && (
            <p className="mt-1.5 text-xs font-medium text-critical-700" role="alert">
              {errors.contract_preference}
            </p>
          )}
        </fieldset>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
          <Button type="submit" loading={submitting} disabled={submitting}>
            {submitting ? "Analyzing…" : "Analyze Voyage"}
          </Button>
        </div>
      </form>
    </div>
  );
}
