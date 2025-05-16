'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Type for Taipei districts
type District = 
  | 'Zhongzheng' | 'Datong' | 'Zhongshan' | 'Songshan' 
  | 'Daan' | 'Wanhua' | 'Xinyi' | 'Shilin' 
  | 'Beitou' | 'Neihu' | 'Nangang' | 'Wenshan';

// All districts in Taipei
const allDistricts: District[] = [
  'Zhongzheng', 'Datong', 'Zhongshan', 'Songshan',
  'Daan', 'Wanhua', 'Xinyi', 'Shilin',
  'Beitou', 'Neihu', 'Nangang', 'Wenshan'
];

interface DistrictFilterProps {
  selectedDistricts: District[];
  onChange: (districts: District[]) => void;
  className?: string;
}

export function DistrictFilter({ 
  selectedDistricts,
  onChange,
  className,
}: DistrictFilterProps) {
  const [open, setOpen] = useState(false);
  
  // Remove a district from selection
  const removeDistrict = (district: District) => {
    onChange(selectedDistricts.filter(d => d !== district));
  };
  
  // Toggle a district selection
  const toggleDistrict = (district: District) => {
    if (selectedDistricts.includes(district)) {
      removeDistrict(district);
    } else {
      onChange([...selectedDistricts, district]);
    }
  };
  
  // Clear all selected districts
  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex justify-between w-full"
          >
            {selectedDistricts.length > 0 
              ? `${selectedDistricts.length} district${selectedDistricts.length > 1 ? 's' : ''} selected`
              : "Select districts"}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search district..." />
            <CommandList>
              <CommandEmpty>No district found.</CommandEmpty>
              <CommandGroup>
                {allDistricts.map((district) => {
                  const isSelected = selectedDistricts.includes(district);
                  
                  return (
                    <CommandItem
                      key={district}
                      value={district}
                      onSelect={() => toggleDistrict(district)}
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{district}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            
            {selectedDistricts.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 text-xs w-full justify-start"
                  onClick={clearAll}
                >
                  Clear all selections
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected districts as badges */}
      {selectedDistricts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedDistricts.map((district) => (
            <Badge
              key={district}
              variant="secondary"
              className="capitalize"
            >
              {district}
              <button
                type="button"
                className="ml-1 rounded-full"
                onClick={() => removeDistrict(district)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {district}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 