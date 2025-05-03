import React from "react";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  onRefresh?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onRefresh }) => {
  return (
    <div className="h-[60px] w-full flex items-center justify-between px-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          Columns
        </Button>
        <Button size="sm" variant="outline">
          Filters
        </Button>
        <Button size="sm" variant="outline">
          Export
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-8 px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default Toolbar; 