import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import type { NormalizedJiraField } from "@ewjdev/anyclick-jira";
import type { AutocompleteOption } from "../types";

interface AutocompleteInputProps {
  field: NormalizedJiraField;
  value: string;
  displayValue: string;
  onChange: (value: string, display: string) => void;
  onSelect: (id: string, display: string) => void;
  hasError: boolean;
  requestHeaders?: HeadersInit;
}

export function AutocompleteInput({
  field,
  value,
  displayValue,
  onChange,
  onSelect,
  hasError,
  requestHeaders,
}: AutocompleteInputProps) {
  const [query, setQuery] = useState(displayValue || "");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchOptions = useCallback(
    async (searchQuery: string) => {
      const lowerName = field.name.toLowerCase();
      const lowerKey = field.key?.toLowerCase() || "";
      const isSpecialField = lowerName.includes("epic") ||
        lowerName === "team" || lowerKey.includes("epic");

      if (!searchQuery.trim() && !isSpecialField) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/ac/jira?action=search&field=${
            encodeURIComponent(field.name)
          }&fieldKey=${encodeURIComponent(field.key || "")}&query=${
            encodeURIComponent(searchQuery)
          }`,
          { headers: requestHeaders },
        );
        const data = await response.json();
        if (data.results) {
          setOptions(data.results);
        }
      } catch (error) {
        console.error("Failed to search field values:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [field.key, field.name, requestHeaders],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    onChange("", newQuery);
    setIsOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchOptions(newQuery);
    }, 300);
  };

  const handleSelect = (option: AutocompleteOption) => {
    setQuery(option.name);
    onSelect(option.id, option.name);
    setIsOpen(false);
  };

  const baseInputClasses =
    `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] text-gray-900 ${
      hasError ? "border-red-500" : "border-gray-200"
    }`;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            const lowerName = field.name.toLowerCase();
            const lowerKey = field.key?.toLowerCase() || "";
            const isSpecialField = lowerName.includes("epic") ||
              lowerName === "team" || lowerKey.includes("epic");
            if (query.trim() || isSpecialField) {
              searchOptions(query);
            }
          }}
          placeholder={field.placeholder || `Search for ${field.name}...`}
          className={`${baseInputClasses} pr-10`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Search className="w-5 h-5" />}
        </div>
      </div>

      {isOpen && (options.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
        >
          {isLoading && options.length === 0
            ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            )
            : options.length === 0
            ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No results found
              </div>
            )
            : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[#eef3f3] transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="font-medium text-gray-900">
                    {option.name}
                  </span>
                  {option.id !== option.name && (
                    <span className="text-gray-500 ml-2">({option.id})</span>
                  )}
                </button>
              ))
            )}
        </div>
      )}

      {value && (
        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Selected: {displayValue || value}
        </div>
      )}
    </div>
  );
}
