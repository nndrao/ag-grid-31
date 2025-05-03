import React, { useCallback, useEffect, useState } from "react";
import { ModuleRegistry, themeQuartz, ColDef, GridOptions } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { LicenseManager } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import Toolbar from "./Toolbar";

// Set license key (this should be in your entry point file)
// LicenseManager.setLicenseKey("your-license-key");

// Register modules - correct approach for v33+
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Define row data interface
interface RowData {
  make: string;
  model: string;
  price: number;
}

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

// Sample data
const generateRowData = (): RowData[] => {
  const data: RowData[] = [];
  for (let i = 0; i < 10; i++) {
    data.push({ make: "Toyota", model: "Celica", price: 35000 + i * 1000 });
    data.push({ make: "Ford", model: "Mondeo", price: 32000 + i * 1000 });
    data.push({
      make: "Porsche",
      model: "Boxster",
      price: 72000 + i * 1000,
    });
  }
  return data;
};

// Column definitions with proper typing for v33+
const columnDefs: ColDef<RowData>[] = [
  { field: 'make' },
  { field: 'model' },
  { field: 'price' }
];

// Default column definition
const defaultColDef: ColDef<RowData> = {
  flex: 1,
  minWidth: 100,
  filter: true,
  enableValue: true,
  enableRowGroup: true,
  enablePivot: true,
};

const DataTable = () => {
  const { theme: currentTheme } = useTheme();
  const [rowData, setRowData] = useState<RowData[]>(generateRowData());
  
  // Get the appropriate theme based on the current theme
  const gridTheme = currentTheme === 'dark' ? darkTheme : lightTheme;
  
  // Define grid options using the correct type
  const gridOptions: GridOptions<RowData> = {
    columnDefs,
    rowData,
    defaultColDef,
    pagination: true,
    paginationPageSize: 10,
    rowSelection: 'multiple',
    rowGroupPanelShow: 'always',
    enableRangeSelection: true,
    enableFindFeature: true,
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent' },
        { statusPanel: 'agAggregationComponent' }
      ]
    }
  };

  // Handler for refreshing data
  const handleRefresh = useCallback(() => {
    setRowData(generateRowData());
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Toolbar onRefresh={handleRefresh} />
      <div className="flex-1 w-full h-[calc(100%-60px)]">
        <AgGridReact
          theme={gridTheme}
          {...gridOptions}
          rowData={rowData}
          sideBar
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default DataTable; 