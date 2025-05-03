import React, { useCallback, useEffect, useState, useMemo } from "react";
import { ModuleRegistry, ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { LicenseManager } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import Toolbar from "./Toolbar";
import { inferColumnDefs, defaultColDef } from "../utils/gridUtils";
import { themeQuartz } from "ag-grid-community";

// Register modules - correct approach for v33+
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Define theme configuration for v33+
const lightTheme = themeQuartz.withParams({
  accentColor: "#8AAAA7",
  backgroundColor: "#F7F7F7",
  borderColor: "#23202029",
  browserColorScheme: "light",
  buttonBorderRadius: 2,
  cellTextColor: "#000000",
  checkboxBorderRadius: 2,
  columnBorder: true,
  fontFamily: {
    googleFont: "Inter",
  },
  fontSize: 14,
  headerBackgroundColor: "#EFEFEFD6",
  headerFontFamily: {
    googleFont: "Inter",
  },
  headerFontSize: 14,
  headerFontWeight: 500,
  iconButtonBorderRadius: 1,
  iconSize: 12,
  inputBorderRadius: 2,
  oddRowBackgroundColor: "#EEF1F1E8",
  spacing: 6,
  wrapperBorderRadius: 2,
});

const darkTheme = themeQuartz.withParams({
  accentColor: "#8AAAA7",
  backgroundColor: "#1f2836",
  borderRadius: 2,
  checkboxBorderRadius: 2,
  columnBorder: true,
  fontFamily: {
    googleFont: "Inter",
  },
  browserColorScheme: "dark",
  chromeBackgroundColor: {
    ref: "foregroundColor",
    mix: 0.07,
    onto: "backgroundColor",
  },
  fontSize: 14,
  foregroundColor: "#FFF",
  headerFontFamily: {
    googleFont: "Inter",
  },
  headerFontSize: 14,
  iconSize: 12,
  inputBorderRadius: 2,
  oddRowBackgroundColor: "#2A2E35",
  spacing: 6,
  wrapperBorderRadius: 2,
});

interface DataTableProps {
  rowData?: any[];
}

const DataTable: React.FC<DataTableProps> = ({ rowData = [] }) => {
  const { theme: currentTheme } = useTheme();
  const [gridApi, setGridApi] = useState<GridApi<any> | null>(null);
  
  // Get the appropriate theme based on the current theme
  const gridTheme = currentTheme === 'dark' ? darkTheme : lightTheme;
  
  // Infer column definitions from row data and set groupable fields
  const columnDefs = useMemo(() => {
    const inferredCols = inferColumnDefs(rowData);
    
    // Find the country, issuer name, and instrument type columns and mark them for grouping
    return inferredCols.map(col => {
      const field = col.field?.toLowerCase();
      
      if (field === 'country' || field === 'issuername' || field === 'issuer' || 
          field === 'instrumenttype' || field === 'instrument type' || field === 'type') {
        return {
          ...col,
          rowGroup: true,
          hide: true
        };
      }
      
      return col;
    });
  }, [rowData]);

  // Handler for refreshing data
  const handleRefresh = useCallback(() => {
    // TO DO: implement refresh logic
  }, []);

  // Handle grid ready event
  const onGridReady = useCallback((params: GridReadyEvent<any>) => {
    setGridApi(params.api);
    
    // Auto-expand all row groups
    setTimeout(() => {
      if (params.api) {
        params.api.expandAll();
      }
    }, 500);
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Toolbar 
        onRefresh={handleRefresh} 
        gridApi={gridApi}
      />
      <div className="flex-1 w-full h-[calc(100%-60px)]">
        <AgGridReact
          theme={gridTheme}
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
          pagination={false}
          rowSelection={{
            mode: "multiRow"
          }}
          rowGroupPanelShow="always"
          cellSelection={true}
          groupDisplayType="groupRows"
          groupDefaultExpanded={-1}
          autoGroupColumnDef={{
            headerName: "Group",
            minWidth: 250,
            cellRendererParams: {
              suppressCount: false,
              checkbox: true
            }
          }}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalAndFilteredRowCountComponent' },
              { statusPanel: 'agAggregationComponent' }
            ]
          }}
          sideBar={true}
          className="w-full h-full"
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default DataTable;