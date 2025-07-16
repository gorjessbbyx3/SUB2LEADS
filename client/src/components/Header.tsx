import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">{title}</h2>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {action && (
            <Button 
              onClick={action.onClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          )}
          
        </div>
      </div>
    </header>
  );
}
