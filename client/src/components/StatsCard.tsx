import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral" | "urgent";
}

export function StatsCard({ title, value, change, icon: Icon, trend = "neutral" }: StatsCardProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600", 
    neutral: "text-gray-600",
    urgent: "text-red-600"
  };

  const iconBgColors = {
    up: "bg-blue-50",
    down: "bg-red-50",
    neutral: "bg-gray-50", 
    urgent: "bg-red-50"
  };

  const iconColors = {
    up: "text-blue-600",
    down: "text-red-600",
    neutral: "text-gray-600",
    urgent: "text-red-600"
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              trend === "urgent" ? "text-red-600" : "text-gray-900"
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <span className={cn("text-sm font-medium", trendColors[trend])}>
                {change}
              </span>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", iconBgColors[trend])}>
            <Icon className={cn("h-6 w-6", iconColors[trend])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
