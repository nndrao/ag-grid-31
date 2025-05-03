import React from "react";
import { Button } from "@/components/ui/button";
import { GridApi } from "ag-grid-community";

interface ToolbarProps {
  onRefresh?: () => void;
  gridApi?: GridApi<any> | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ onRefresh, gridApi }) => {
  // Function to export data to CSV
  const handleExport = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv();
    }
  };

  // Function to show/hide columns
  const handleShowColumns = () => {
    if (gridApi) {
      // In AG-Grid v33+, we can use the grid API to show column tool panel
      gridApi.openToolPanel('columns');
    }
  };

  // Function to show/hide filters
  const handleShowFilters = () => {
    if (gridApi) {
      // In AG-Grid v33+, we can use the grid API to show filter tool panel
      gridApi.openToolPanel('filters');
    }
  };

  // Function to handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', e.target.value);
    }
  };

  return (
    <div className="h-[60px] w-full flex items-center justify-between px-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleShowColumns}>
          Columns
        </Button>
        <Button size="sm" variant="outline" onClick={handleShowFilters}>
          Filters
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport}>
          Export
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-8 px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            onChange={handleSearch}
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