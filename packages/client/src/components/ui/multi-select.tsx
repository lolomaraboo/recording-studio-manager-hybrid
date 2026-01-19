import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  value?: string[];
  onChange?: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
  creatable?: boolean;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = "Select options...",
  creatable = false,
  className,
  disabled = false,
}: MultiSelectProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value);
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync with external value prop
  React.useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    if (disabled) return;

    let newValues: string[];
    if (selectedValues.includes(selectedValue)) {
      newValues = selectedValues.filter((v) => v !== selectedValue);
    } else {
      newValues = [...selectedValues, selectedValue];
    }

    setSelectedValues(newValues);
    onChange?.(newValues);
    setInputValue("");
  };

  const handleRemove = (valueToRemove: string) => {
    if (disabled) return;

    const newValues = selectedValues.filter((v) => v !== valueToRemove);
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Enter" && inputValue && creatable) {
      e.preventDefault();

      // Check if value already exists in options or selected values
      const exists = options.some(opt => opt.value.toLowerCase() === inputValue.toLowerCase()) ||
                     selectedValues.some(v => v.toLowerCase() === inputValue.toLowerCase());

      if (!exists) {
        const newValues = [...selectedValues, inputValue];
        setSelectedValues(newValues);
        onChange?.(newValues);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && selectedValues.length > 0) {
      // Remove last selected value on backspace
      const newValues = selectedValues.slice(0, -1);
      setSelectedValues(newValues);
      onChange?.(newValues);
    }
  };

  // Filter options that haven't been selected yet
  const availableOptions = options.filter(
    (option) => !selectedValues.includes(option.value)
  );

  return (
    <div className={cn("relative", className)}>
      <Command className="overflow-visible bg-transparent">
        <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex gap-1 flex-wrap">
            {selectedValues.map((value) => {
              const option = options.find((opt) => opt.value === value);
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="gap-1"
                >
                  {option?.label || value}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleRemove(value)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              );
            })}
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              placeholder={selectedValues.length === 0 ? placeholder : ""}
              className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
              disabled={disabled}
            />
          </div>
        </div>
        {!disabled && isOpen && availableOptions.length > 0 && (
          <div className="relative mt-2">
            <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto max-h-60">
                {availableOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </div>
        )}
      </Command>
    </div>
  );
}
