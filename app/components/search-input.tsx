import { useEffect, useState } from "react";
import { Icon } from "~/components/icon";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

/** Search field that reports after typing pauses (300 ms). */
export function SearchInput({
  defaultValue,
  onSearch,
  placeholder,
  className,
}: {
  defaultValue: string;
  onSearch: (q: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (value.trim() === defaultValue) return;
    const t = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(t);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 pl-10 text-sm"
      />
    </label>
  );
}
