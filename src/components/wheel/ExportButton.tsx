'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Image, FileImage } from 'lucide-react';
import { exportToPng, exportToJpeg } from '@/lib/utils/export-image';

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename?: string;
}

export function ExportButton({ targetRef, filename = 'rueda-de-la-vida' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'png' | 'jpg') => {
    if (!targetRef.current) return;

    setExporting(true);
    try {
      if (format === 'png') {
        await exportToPng(targetRef.current, filename);
      } else {
        await exportToJpeg(targetRef.current, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <Image className="h-4 w-4 mr-2" />
          Guardar como PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('jpg')}>
          <FileImage className="h-4 w-4 mr-2" />
          Guardar como JPG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
