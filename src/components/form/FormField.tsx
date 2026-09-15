import { ReactNode, useId } from "react";

export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: (props: { id: string; describedBy?: string }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-critical-600">*</span>}
      </label>
      {children({ id, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-critical-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
