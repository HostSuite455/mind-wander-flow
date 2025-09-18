import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends BadgeProps {
  status: "active" | "pending" | "resolved" | "maintenance" | "inactive";
}

export const StatusBadge = ({ status, className, ...props }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "resolved":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "maintenance":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "active":
        return "Attivo";
      case "pending":
        return "In Attesa";
      case "resolved":
        return "Risolto";
      case "maintenance":
        return "Manutenzione";
      case "inactive":
        return "Inattivo";
      default:
        return status;
    }
  };

  return (
    <Badge 
      className={cn(getStatusStyles(), className)} 
      {...props}
    >
      {getStatusLabel()}
    </Badge>
  );
};

interface SourceBadgeProps extends BadgeProps {
  source: string;
}

export const SourceBadge = ({ source, className, ...props }: SourceBadgeProps) => {
  const getSourceStyles = () => {
    switch (source.toLowerCase()) {
      case "airbnb":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "booking":
      case "booking.com":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "email":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "whatsapp":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "phone":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <Badge 
      variant="outline"
      className={cn(getSourceStyles(), className)} 
      {...props}
    >
      {source}
    </Badge>
  );
};