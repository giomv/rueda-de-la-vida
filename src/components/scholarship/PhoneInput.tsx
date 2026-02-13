'use client';

import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (number: string) => void;
  required?: boolean;
}

export function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  required,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const selected = countryCode ? getCountryByCode(countryCode) : undefined;

  return (
    <div className="flex gap-2">
      {/* Country code selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-[130px] shrink-0 justify-between font-normal')}
            type="button"
          >
            {selected ? (
              <span className="flex items-center gap-1 text-sm">
                <span>{selected.flag}</span>
                <span>{selected.dialCode}</span>
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">Código</span>
            )}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Buscar país..." />
            <CommandList>
              <CommandEmpty>No se encontró.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dialCode}`}
                    onSelect={() => {
                      onCountryCodeChange(country.code);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {country.dialCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Phone number input */}
      <Input
        type="tel"
        placeholder="Número de teléfono"
        value={phoneNumber}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d\s\-()]/g, '');
          onPhoneNumberChange(cleaned);
        }}
        required={required}
        className="flex-1"
      />
    </div>
  );
}
