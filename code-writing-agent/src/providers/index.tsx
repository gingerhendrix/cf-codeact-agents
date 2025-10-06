import { TooltipProvider } from "@/providers/TooltipProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <TooltipProvider>{children}</TooltipProvider>;
};
