'use client';

import { useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { countries, getCountryByCode } from '@/lib/data/countries';

interface CountrySelectProps {
  value: string;
  onValueChange: (code: string) => void;
  required?: boolean;
}

export function CountrySelect({
  value,
  onValueChange,
  required,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? getCountryByCode(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          type="button"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span>{selected.flag}</span>
              <span>{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Selecciona un país</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandList>
            <CommandEmpty>No se encontró el país.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onValueChange(country.code);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2">{country.flag}</span>
                  {country.name}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === country.code ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      {/* Hidden input for native form validation */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          className="sr-only"
          required
          value={value}
          onChange={() => {}}
          aria-hidden="true"
        />
      )}
    </Popover>
  );
}
