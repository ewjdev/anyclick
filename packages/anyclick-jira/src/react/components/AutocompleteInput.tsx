"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import type { NormalizedJiraField } from "../../types";
import type { AutocompleteOption } from "../types";
import { getApiEndpoint, useJiraFeedbackConfig } from "../JiraFeedbackContext";
import { colors, spinnerKeyframes } from "../utils/styles";

interface AutocompleteInputProps {
  field: NormalizedJiraField;
  value: string;
  displayValue: string;
  onChange: (value: string, display: string) => void;
  onSelect: (id: string, display: string) => void;
  hasError: boolean;
  requestHeaders?: HeadersInit;
  apiEndpoint?: string;
}

export function AutocompleteInput({
  field,
  value,
  displayValue,
  onChange,
  onSelect,
  hasError,
  requestHeaders,
  apiEndpoint: propApiEndpoint,
}: AutocompleteInputProps) {
  const contextConfig = useJiraFeedbackConfig();
  const apiEndpoint = getApiEndpoint(propApiEndpoint, contextConfig);

  const [query, setQuery] = useState(displayValue || "");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Inject spinner keyframes
    const styleId = "jira-feedback-spinner-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = spinnerKeyframes;
      document.head.appendChild(style);
    }
  }, []);

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
        lowerName === "team" ||
        lowerKey.includes("epic");

      if (!searchQuery.trim() && !isSpecialField) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `${apiEndpoint}?action=search&field=${
            encodeURIComponent(
              field.name,
            )
          }&fieldKey=${
            encodeURIComponent(
              field.key || "",
            )
          }&query=${encodeURIComponent(searchQuery)}`,
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
    [apiEndpoint, field.key, field.name, requestHeaders],
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

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    paddingRight: "40px",
    border: `1px solid ${hasError ? colors.red500 : colors.gray200}`,
    borderRadius: "12px",
    outline: "none",
    fontSize: "16px",
    color: colors.gray900,
    backgroundColor: colors.white,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
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
              lowerName === "team" ||
              lowerKey.includes("epic");
            if (query.trim() || isSpecialField) {
              searchOptions(query);
            }
          }}
          placeholder={field.placeholder || `Search for ${field.name}...`}
          style={inputStyle}
        />
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: colors.gray400,
          }}
        >
          {isLoading
            ? (
              <Loader2
                style={{
                  width: "20px",
                  height: "20px",
                  animation: "jira-feedback-spin 1s linear infinite",
                }}
              />
            )
            : <Search style={{ width: "20px", height: "20px" }} />}
        </div>
      </div>

      {isOpen && (options.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            zIndex: 50,
            width: "100%",
            marginTop: "4px",
            backgroundColor: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: "12px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            maxHeight: "192px",
            overflowY: "auto",
          }}
        >
          {isLoading && options.length === 0
            ? (
              <div
                style={{
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: colors.gray500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Loader2
                  style={{
                    width: "16px",
                    height: "16px",
                    animation: "jira-feedback-spin 1s linear infinite",
                  }}
                />
                Searching...
              </div>
            )
            : options.length === 0
            ? (
              <div
                style={{
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: colors.gray500,
                }}
              >
                No results found
              </div>
            )
            : (
              options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHoveredOption(option.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "14px",
                    backgroundColor: hoveredOption === option.id
                      ? colors.background
                      : colors.white,
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    borderRadius: index === 0
                      ? "12px 12px 0 0"
                      : index === options.length - 1
                      ? "0 0 12px 12px"
                      : "0",
                  }}
                >
                  <span style={{ fontWeight: 500, color: colors.gray900 }}>
                    {option.name}
                  </span>
                  {option.id !== option.name && (
                    <span style={{ color: colors.gray500, marginLeft: "8px" }}>
                      ({option.id})
                    </span>
                  )}
                </button>
              ))
            )}
        </div>
      )}

      {value && (
        <div
          style={{
            marginTop: "4px",
            fontSize: "12px",
            color: colors.success,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <CheckCircle2 style={{ width: "12px", height: "12px" }} />
          Selected: {displayValue || value}
        </div>
      )}
    </div>
  );
}
