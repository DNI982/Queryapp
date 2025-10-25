import { DatabaseZap } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-primary">
      <DatabaseZap className="h-8 w-8" />
      <span className="text-2xl font-bold text-foreground">DataWise AI</span>
    </div>
  );
}
