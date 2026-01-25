'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LifeDomain } from '@/lib/types';

interface DomainSelectorProps {
  domains: LifeDomain[];
  value: string | null;
  onChange: (domainId: string) => void;
  placeholder?: string;
}

export function DomainSelector({ domains, value, onChange, placeholder = 'Selecciona un dominio' }: DomainSelectorProps) {
  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {domains.map((domain) => (
          <SelectItem key={domain.id} value={domain.id}>
            {domain.icon && <span className="mr-2">{domain.icon}</span>}
            {domain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Badge component for displaying a domain
interface DomainBadgeProps {
  domain: LifeDomain | undefined;
  fallbackCategory?: string | null;
}

const FALLBACK_CATEGORY_COLORS: Record<string, string> = {
  personal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  career: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  health: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  finance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  couple: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const FALLBACK_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  personal: { label: 'Personal', icon: '🌱' },
  career: { label: 'Carrera', icon: '💼' },
  health: { label: 'Salud', icon: '💪' },
  finance: { label: 'Finanzas', icon: '💰' },
  couple: { label: 'Pareja', icon: '❤️' },
  other: { label: 'Otro', icon: '✨' },
};

export function DomainBadge({ domain, fallbackCategory }: DomainBadgeProps) {
  // If we have a domain, use it
  if (domain) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
        {domain.icon && <span>{domain.icon}</span>}
        <span>{domain.name}</span>
      </span>
    );
  }

  // Fallback to legacy category
  if (fallbackCategory && FALLBACK_CATEGORY_LABELS[fallbackCategory]) {
    const cat = FALLBACK_CATEGORY_LABELS[fallbackCategory];
    const colorClass = FALLBACK_CATEGORY_COLORS[fallbackCategory] || FALLBACK_CATEGORY_COLORS.other;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        <span>{cat.icon}</span>
        <span>{cat.label}</span>
      </span>
    );
  }

  return null;
}
