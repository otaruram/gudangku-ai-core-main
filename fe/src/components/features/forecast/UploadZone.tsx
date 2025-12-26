import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect?: (file: File) => void;
}

export function UploadZone({ isDragging, onDragOver, onDragLeave, onDrop, onFileSelect }: UploadZoneProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect?.(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-8",
        isDragging
          ? "border-accent bg-accent/5"
          : "border-border hover:border-muted-foreground"
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className={cn(
          "rounded-full p-3 transition-colors sm:p-4",
          isDragging ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
        )}>
          <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
        </div>
        <div>
          <p className="text-sm font-medium sm:text-base">
            {isDragging ? "Lepaskan file di sini" : "Drag & Drop file CSV Anda"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            atau klik untuk memilih file dari komputer
          </p>
        </div>
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload CSV"
          />
          <Button variant="outline" size="sm" className="mt-1 sm:mt-2 pointer-events-none">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Pilih File CSV
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground sm:text-xs">
          Format: date, product_id, quantity (max 10MB)
        </p>
      </div>
    </div>
  );
}
