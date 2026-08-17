import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { TaxonomyItem, TaxonomyResponse } from '../types';

interface TaxonomySingleSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  fetchSearch: (search?: string, limit?: number) => Promise<TaxonomyResponse>;
  placeholder?: string;
  required?: boolean;
}

export const TaxonomySingleSelect: React.FC<TaxonomySingleSelectProps> = ({
  label,
  value,
  onChange,
  fetchSearch,
  placeholder = 'Select from taxonomy...',
  required = false,
}) => {
  const [options, setOptions] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    const loadOptions = async () => {
      setIsLoading(true);
      try {
        const res = await fetchSearch('', 100);
        if (!isCancelled) {
          setOptions(res.data || []);
        }
      } catch (err) {
        console.warn(`Failed to fetch taxonomy options for ${label}:`, err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOptions();

    return () => {
      isCancelled = true;
    };
  }, [fetchSearch, label]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-mono text-[#8c887e]">
          {label} {required && '*'}
        </label>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-[#8c887e]" />}
      </div>

      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none transition-colors"
      >
        <option value="" disabled>
          {isLoading ? 'Loading options from taxonomy...' : placeholder}
        </option>

        {options.map((opt) => (
          <option key={opt.id} value={opt.name}>
            {opt.name}
          </option>
        ))}

        {/* If current value is not in fetched options yet (e.g. legacy/custom), preserve it as selected option */}
        {value && !options.some((o) => o.name === value) && (
          <option value={value}>{value}</option>
        )}
      </select>
    </div>
  );
};
