// src/components/ui/number-input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label?: string
  description?: string
  error?: string
  min?: number
  max?: number
  step?: number
  value?: number | undefined
  onChange: (value: number | undefined) => void
  allowDecimal?: boolean
  allowEmpty?: boolean
  showValidation?: boolean
  unit?: string
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({
    className,
    label,
    description,
    error: externalError,
    min,
    max,
    step = 1,
    value,
    onChange,
    allowDecimal = true,
    allowEmpty = true,
    showValidation = true,
    unit,
    disabled,
    ...props
  }, ref) => {
    // Internal state for input value (string to allow empty)
    const [inputValue, setInputValue] = React.useState<string>(
      value !== undefined ? value.toString() : ''
    );
    const [internalError, setInternalError] = React.useState<string | null>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync external value changes
    React.useEffect(() => {
      setInputValue(value !== undefined ? value.toString() : '');
    }, [value]);

    const validateNumber = (numValue: number): string | null => {
      if (!showValidation) return null;

      if (min !== undefined && numValue < min) {
        return `Value must be at least ${min}`;
      }
      if (max !== undefined && numValue > max) {
        return `Value must be at most ${max}`;
      }
      return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Allow empty string (user clearing field)
      if (newValue === '' || newValue === '-') {
        setInputValue(newValue);
        if (allowEmpty) {
          onChange(undefined);
          setInternalError(null);
        } else {
          setInternalError('Value is required');
        }
        return;
      }

      // Validate input based on decimal setting
      const regex = allowDecimal
        ? /^-?\d*\.?\d*$/
        : /^-?\d*$/;

      if (!regex.test(newValue)) {
        return; // Don't update if invalid format
      }

      setInputValue(newValue);

      // Try to parse the number
      const parsed = allowDecimal ? parseFloat(newValue) : parseInt(newValue, 10);

      // If we have a complete valid number
      if (!isNaN(parsed)) {
        const validationError = validateNumber(parsed);
        setInternalError(validationError);

        // Call onChange even if there's a validation error
        // This allows the parent to track invalid states
        onChange(parsed);
      } else {
        // Incomplete number (like "1.", "0.", "-")
        setInternalError(null);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // On blur, clean up incomplete numbers
      if (inputValue === '' || inputValue === '-' || inputValue === '.') {
        if (allowEmpty) {
          setInputValue('');
          onChange(undefined);
          setInternalError(null);
        } else {
          // Set to min value or 0 if required
          const defaultValue = min !== undefined ? min : 0;
          setInputValue(defaultValue.toString());
          onChange(defaultValue);
          setInternalError(null);
        }
      } else if (inputValue.endsWith('.')) {
        // Remove trailing decimal point
        const cleaned = inputValue.slice(0, -1);
        setInputValue(cleaned);
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          onChange(parsed);
        }
      }

      // Call original onBlur if provided
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
        return;
      }

      props.onKeyDown?.(e);
    };

    const displayError = externalError || internalError;
    const hasError = Boolean(displayError);

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {!allowEmpty && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            type="text"
            inputMode={allowDecimal ? "decimal" : "numeric"}
            className={cn(
              "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              hasError
                ? "border-destructive focus-visible:ring-destructive"
                : "border-input focus-visible:ring-ring",
              unit && "pr-12"
            )}
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            ref={ref}
            {...props}
          />

          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

        {description && !hasError && (
          <p className="text-xs text-muted-foreground">
            {description}
            {min !== undefined && max !== undefined && (
              <span className="ml-1">({min}-{max})</span>
            )}
            {min !== undefined && max === undefined && (
              <span className="ml-1">(min: {min})</span>
            )}
            {min === undefined && max !== undefined && (
              <span className="ml-1">(max: {max})</span>
            )}
          </p>
        )}

        {hasError && showValidation && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Visual indicators during focus */}
        {isFocused && (min !== undefined || max !== undefined) && !hasError && (
          <div className="text-xs text-muted-foreground">
            {min !== undefined && (
              <span>Min: {min}</span>
            )}
            {min !== undefined && max !== undefined && <span className="mx-1">•</span>}
            {max !== undefined && (
              <span>Max: {max}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)

NumberInput.displayName = "NumberInput"

export { NumberInput }
