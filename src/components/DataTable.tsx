import React, { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { ModuleRegistry, GridApi, GridReadyEvent, ColDef } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import Toolbar from "./Toolbar";
import { inferColumnDefs, defaultColDef } from "../utils/gridUtils";
import { themeQuartz } from "ag-grid-community";
import CustomHeaderComponent from "./CustomHeaderComponent";

ModuleRegistry.registerModules([AllEnterpriseModule]);

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
    googleFont: "Roboto",
  },
  fontSize: 14,
  headerBackgroundColor: "#EFEFEFD6",
  headerFontFamily: {
    googleFont: "Roboto",
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
    googleFont: "Roboto",
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
    googleFont: "Roboto",
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
  const gridRef = useRef<AgGridReact>(null);
  
  const gridTheme = currentTheme === 'dark' ? darkTheme : lightTheme;
  
  const columnDefs = useMemo(() => {
    const inferredCols = inferColumnDefs(rowData);
    
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
      
      return {
        ...col,
        headerComponent: CustomHeaderComponent
      };
    });
  }, [rowData]);

  const handleRefresh = useCallback(() => {
    if (gridApi) {
      gridApi.refreshCells();
    }
  }, [gridApi]);

  const onGridReady = useCallback((params: GridReadyEvent<any>) => {
    setGridApi(params.api);
    
    setTimeout(() => {
      if (params.api && !params.api.isDestroyed()) {
        params.api.expandAll();
      }
    }, 500);
  }, []);

  const updateColumnDefs = useCallback((newColDefs: ColDef[]) => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setGridOption('columnDefs', newColDefs);
    }
  }, []);

  useEffect(() => {
    if (gridApi) {
      (gridApi as any).updateColumnDefs = updateColumnDefs;
    }
  }, [gridApi, updateColumnDefs]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Toolbar 
        onRefresh={handleRefresh} 
        gridApi={gridApi}
      />
      <div className="flex-1 w-full h-[calc(100%-60px)]">
        <AgGridReact
          ref={gridRef}
          theme={gridTheme}
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
          pagination={false}
          rowSelection="multiple"
          enableRangeSelection={true}
          enableFillHandle={true}
          suppressMovableColumns={false}
          suppressDragLeaveHidesColumns={true}
          rowGroupPanelShow="always"
          groupDisplayType="singleColumn"
          groupDefaultExpanded={-1}
          // Keyboard navigation settings
          navigateToNextCell={true}
          tabToNextCell={true}
          enterNavigatesVertically={true}
          enterNavigatesVerticallyAfterEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          // Focus settings
          suppressCellFocus={false}
          suppressRowDeselection={false}
          suppressMultiRangeSelection={false}
          // Performance settings
          rowBuffer={20}
          cacheQuickFilter={true}
          suppressAnimationFrame={true}
          suppressColumnVirtualisation={false}
          suppressRowVirtualisation={false}
          autoGroupColumnDef={{
            headerName: "All Groups",
            minWidth: 300,
            cellRendererParams: {
              suppressCount: false,
              suppressCheckbox: true
            },
            cellRenderer: 'agGroupCellRenderer',
            flex: 1
          }}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalAndFilteredRowCountComponent' },
              { statusPanel: 'agAggregationComponent' }
            ]
          }}
          sideBar={true}
          rowHeight={25}
          className="w-full h-full"
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default DataTable;