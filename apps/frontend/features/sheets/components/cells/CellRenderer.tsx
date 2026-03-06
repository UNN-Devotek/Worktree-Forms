"use client";

import { cn } from "@/lib/utils";

/**
 * Column descriptor for the CellRenderer.
 * Mirrors the shape stored in SheetColumnEntity.
 */
interface ColumnDescriptor {
  type: string;
  config?: Record<string, unknown>;
}

interface CellRendererProps {
  /** Current cell value */
  value: unknown;
  /** Column type and config */
  column: ColumnDescriptor;
  /** Callback when the value changes (omit for read-only) */
  onChange?: (value: unknown) => void;
  /** When true, the cell renders in display mode only */
  readOnly?: boolean;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Renders the appropriate input/display for a cell based on column type.
 *
 * Supported types: TEXT, NUMBER, CHECKBOX, DATE, SELECT, STATUS, CONTACT,
 * PERCENT, URL, LONGTEXT. Unknown types fall back to a text display.
 */
export function CellRenderer({
  value,
  column,
  onChange,
  readOnly = false,
  className,
}: CellRendererProps) {
  const baseInput =
    "w-full px-2 py-1 text-sm border-0 focus:outline-none bg-transparent";

  switch (column.type) {
    case "TEXT":
      return readOnly ? (
        <span className={cn("px-2 py-1 text-sm", className)}>
          {String(value ?? "")}
        </span>
      ) : (
        <input
          className={cn(baseInput, className)}
          value={String(value ?? "")}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );

    case "NUMBER":
      return readOnly ? (
        <span className={cn("px-2 py-1 text-sm text-right block", className)}>
          {value != null ? Number(value) : ""}
        </span>
      ) : (
        <input
          type="number"
          className={cn(baseInput, "text-right", className)}
          value={value != null ? Number(value) : ""}
          onChange={(e) => onChange?.(Number(e.target.value))}
        />
      );

    case "PERCENT":
      return readOnly ? (
        <span className={cn("px-2 py-1 text-sm text-right block", className)}>
          {value != null ? `${Number(value)}%` : ""}
        </span>
      ) : (
        <input
          type="number"
          min={0}
          max={100}
          className={cn(baseInput, "text-right", className)}
          value={value != null ? Number(value) : ""}
          onChange={(e) => onChange?.(Number(e.target.value))}
        />
      );

    case "CHECKBOX":
      return (
        <input
          type="checkbox"
          className={cn("mx-2", className)}
          checked={Boolean(value)}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={readOnly}
        />
      );

    case "DATE":
      return (
        <input
          type="date"
          className={cn(baseInput, className)}
          value={value ? String(value).split("T")[0] : ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={readOnly}
        />
      );

    case "SELECT":
    case "DROPDOWN":
    case "STATUS": {
      const options =
        (column.config?.options as string[] | undefined) ?? [];
      return readOnly ? (
        <span className={cn("px-2 py-1 text-sm", className)}>
          {String(value ?? "")}
        </span>
      ) : (
        <select
          className={cn(baseInput, className)}
          value={String(value ?? "")}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="">--</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    case "URL": {
      const urlStr = String(value ?? "");
      return readOnly ? (
        <a
          href={urlStr}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "px-2 py-1 text-sm text-blue-600 underline truncate block",
            className
          )}
        >
          {urlStr || "--"}
        </a>
      ) : (
        <input
          type="url"
          className={cn(baseInput, className)}
          value={urlStr}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="https://..."
        />
      );
    }

    case "LONGTEXT":
      return readOnly ? (
        <span className={cn("px-2 py-1 text-sm whitespace-pre-wrap", className)}>
          {String(value ?? "")}
        </span>
      ) : (
        <textarea
          className={cn(baseInput, "resize-none min-h-[60px]", className)}
          value={String(value ?? "")}
          onChange={(e) => onChange?.(e.target.value)}
          rows={2}
        />
      );

    case "CONTACT": {
      const displayValue = String(value ?? "");
      return readOnly ? (
        <div className={cn("flex items-center gap-2 px-2 py-1", className)}>
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
            {displayValue ? displayValue.charAt(0).toUpperCase() : "?"}
          </div>
          <span className="text-sm truncate">
            {displayValue || "Unassigned"}
          </span>
        </div>
      ) : (
        <input
          className={cn(baseInput, className)}
          value={displayValue}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Name or email"
        />
      );
    }

    default:
      return (
        <span
          className={cn("px-2 py-1 text-sm text-muted-foreground", className)}
        >
          {String(value ?? "")}
        </span>
      );
  }
}
