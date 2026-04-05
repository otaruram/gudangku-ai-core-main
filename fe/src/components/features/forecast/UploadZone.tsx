import { useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect?.(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleClick}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 cursor-pointer sm:p-8",
        isDragging
          ? "border-accent bg-accent/5"
          : "border-border hover:border-muted-foreground"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain,application/vnd.ms-excel"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload CSV"
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className={cn(
          "rounded-full p-3 transition-colors sm:p-4",
          isDragging ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
        )}>
          <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
        </div>
        <div>
          <p className="text-sm font-medium sm:text-base">
            {isDragging ? "Drop file here" : "Tap to select CSV file"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            or drag & drop on desktop
          </p>
        </div>
        <Button variant="outline" size="sm" className="mt-1 sm:mt-2 pointer-events-none">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Select CSV File
        </Button>
        <p className="text-[10px] text-muted-foreground sm:text-xs">
          Format: date, product, sales, stock (max 10MB)
        </p>
      </div>
    </div>
  );
}
