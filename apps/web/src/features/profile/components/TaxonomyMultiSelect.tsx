import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, AlertCircle, Plus, Check } from 'lucide-react';
import type { TaxonomyItem, TaxonomyResponse } from '../types';

interface TaxonomyMultiSelectProps {
  categoryLabel: string;
  placeholder?: string;
  selectedItems: TaxonomyItem[];
  onChange: (items: TaxonomyItem[]) => void;
  fetchSearch: (search: string) => Promise<TaxonomyResponse>;
  maxLimit?: number;
}

export const TaxonomyMultiSelect: React.FC<TaxonomyMultiSelectProps> = ({
  categoryLabel,
  placeholder = 'Search recognized items...',
  selectedItems,
  onChange,
  fetchSearch,
  maxLimit = 30,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch search results whenever debounced term or dropdown open status changes
  useEffect(() => {
    let isCancelled = false;

    if (!isDropdownOpen) {
      return;
    }

    const loadTaxonomy = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchSearch(debouncedSearch);
        if (!isCancelled) {
          setResults(response.data || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Unable to load taxonomy options.');
          setResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTaxonomy();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, isDropdownOpen, fetchSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item: TaxonomyItem) => {
    const exists = selectedItems.some((s) => s.id === item.id);

    if (exists) {
      // Remove if clicked again
      onChange(selectedItems.filter((s) => s.id !== item.id));
    } else {
      if (selectedItems.length >= maxLimit) {
        return;
      }
      onChange([...selectedItems, item]);
    }
  };

  const handleRemoveItem = (idToRemove: string) => {
    onChange(selectedItems.filter((item) => item.id !== idToRemove));
  };

  const isSelected = (id: string) => selectedItems.some((s) => s.id === id);

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#cac6bc]">
          {categoryLabel}
        </label>
        <span className="font-mono text-[11px] text-[#8c887e]">
          {selectedItems.length} / {maxLimit} selected
        </span>
      </div>

      {/* Selected Chips List */}
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2.5 rounded-2xl border border-[#363433] bg-[#141312]">
        {selectedItems.length === 0 ? (
          <span className="text-xs text-[#8c887e] font-sans self-center px-1">
            No items selected. Search recognized values below to select.
          </span>
        ) : (
          selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#48473f] bg-[#201f1e] px-3 py-1 font-mono text-xs text-[#e6e2df] transition-all hover:border-[#e6e2df]"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="text-[#8c887e] hover:text-[#ffffff] transition-colors p-0.5 rounded-md"
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c887e]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-[#363433] bg-[#1c1b1a] pl-10 pr-10 py-2.5 font-sans text-xs text-[#e6e2df] placeholder-[#8c887e] focus:border-[#e6e2df] focus:outline-none transition-colors"
          />
          {isLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#cac6bc]" />
          )}
        </div>

        {/* Dropdown Options List */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-60 overflow-y-auto rounded-2xl border border-[#363433] bg-[#1c1b1a] shadow-2xl p-2 space-y-1 animate-fadeIn">
            {isLoading && results.length === 0 && (
              <div className="flex items-center gap-2 p-3 text-xs font-mono text-[#8c887e]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching recognized backend taxonomy...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs font-mono text-amber-400 bg-amber-950/20 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isLoading && !error && results.length === 0 && (
              <div className="p-3 text-xs text-[#8c887e] font-sans">
                No recognized taxonomy items found matching{' '}
                <span className="font-mono text-[#cac6bc]">"{searchTerm}"</span>. Custom custom entries are not permitted.
              </div>
            )}

            {results.map((item) => {
              const selected = isSelected(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left flex items-start justify-between p-2.5 rounded-xl text-xs transition-colors ${
                    selected
                      ? 'bg-[#2b2a29] text-[#ffffff] font-semibold'
                      : 'hover:bg-[#201f1e] text-[#cac6bc]'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <p className="font-mono">{item.name}</p>
                    {item.description && (
                      <p className="text-[11px] text-[#8c887e] line-clamp-1 font-sans">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {selected ? (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Plus className="h-4 w-4 text-[#8c887e] shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
