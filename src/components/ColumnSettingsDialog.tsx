import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GridApi, ColDef } from "ag-grid-community";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DirectColorPicker } from "@/components/ui/direct-color-picker";
import { Slider } from "@/components/ui/slider";
import { Search, Settings, Check, ChevronRight, Info, HelpCircle } from "lucide-react";

// Define interfaces for the component props and state
interface ColumnSettingsDialogProps {
  gridApi: GridApi;
  open: boolean;
  setOpen: (open: boolean) => void;
}

// Define a type for custom column definition that includes the modified flag
interface ExtendedColDef extends ColDef {
  modified?: boolean;
  filterType?: string;
  headerComponentParams?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
    [key: string]: any;
  };
  cellComponentParams?: {
    fontFamily?: string;
    fontSize?: string;
    textAlign?: string;
    color?: string;
    [key: string]: any;
  };
  valueFormatter?: any; // Using any to avoid type conflicts with AG Grid's ValueFormatter
  
  // Additional filter properties
  filterParams?: {
    // Text filter params
    filterOptions?: string[];
    defaultOption?: string;
    caseSensitive?: boolean;
    
    // Number filter params
    allowedCharPattern?: string;
    numberParser?: (text: string) => number;
    
    // Date filter params
    comparator?: (filterDate: Date, cellValue: any) => number;
    browserDatePicker?: boolean;
    minValidYear?: number;
    maxValidYear?: number;
    
    // Set filter params
    values?: any[];
    cellRenderer?: any;
    
    // Multi filter params
    filters?: any[];
    
    // Common params
    buttons?: string[];
    closeOnApply?: boolean;
    debounceMs?: number;
    
    [key: string]: any;
  };
  
  // Editor properties
  cellEditorType?: string;
  cellEditorParams?: {
    // Select editor params
    values?: any[];
    valueSource?: 'csv' | 'json' | 'rest';
    valueSourceData?: string;
    [key: string]: any;
  };
}

// Define the component
export function ColumnSettingsDialog({
  gridApi,
  open,
  setOpen
}: ColumnSettingsDialogProps) {
  // State management
  const [columnDefs, setColumnDefs] = useState<ExtendedColDef[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<ExtendedColDef | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("header");
  const [showFormatExamples, setShowFormatExamples] = useState(false);
  const [customFormatValue, setCustomFormatValue] = useState("");
  const [previewValue, setPreviewValue] = useState("1234.56");
  const [selectValueSource, setSelectValueSource] = useState<'csv' | 'json' | 'rest'>('csv');
  const [selectSourceData, setSelectSourceData] = useState("");
  const [selectValues, setSelectValues] = useState<string[]>([]);

  // Load columns when dialog opens
  useEffect(() => {
    if (open && gridApi) {
      // Clone the column definitions from the grid
      const clonedColDefs = JSON.parse(JSON.stringify(gridApi.getColumnDefs())) as ExtendedColDef[];
      setColumnDefs(clonedColDefs);
      
      // Reset state
      setSelectedColumn(null);
      setSelectedColumns(new Set());
      setSearchTerm("");
      setActiveTab("header");
      setSelectValues([]);
      setSelectSourceData("");
      setSelectValueSource('csv');
    }
  }, [open, gridApi]);

  // Filter columns based on search term
  const filteredColumns = useMemo(() => {
    if (!searchTerm.trim()) return columnDefs;
    
    return columnDefs.filter(col => {
      const headerName = col.headerName || col.field || '';
      const field = col.field || '';
      return headerName.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
             field.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [columnDefs, searchTerm]);

  // Select a column to edit
  const handleSelectColumn = useCallback((column: ExtendedColDef) => {
    if (!bulkUpdateMode) {
      setSelectedColumn(column);
    }
  }, [bulkUpdateMode]);

  // Toggle column selection in bulk mode
  const toggleColumnSelection = useCallback((colId: string) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(colId)) {
        newSet.delete(colId);
      } else {
        newSet.add(colId);
      }
      return newSet;
    });
  }, []);

  // Update a column property
  const updateColumnProperty = useCallback((colId: string, property: string, value: any) => {
    // Update the column definition
    setColumnDefs(prev => 
      prev.map(col => {
        if (col.colId === colId || col.field === colId) {
          return { ...col, [property]: value, modified: true };
        }
        return col;
      })
    );
    
    // Update the selected column if it's the one being modified
    if (selectedColumn && (selectedColumn.colId === colId || selectedColumn.field === colId)) {
      setSelectedColumn(prev => prev ? { ...prev, [property]: value, modified: true } : null);
    }

    // Apply to all selected columns in bulk mode
    if (bulkUpdateMode && selectedColumns.size > 0 && selectedColumns.has(colId)) {
      setColumnDefs(prev => 
        prev.map(col => {
          const id = col.colId || col.field;
          if (id && selectedColumns.has(id as string)) {
            return { ...col, [property]: value, modified: true };
          }
          return col;
        })
      );
    }
  }, [selectedColumn, bulkUpdateMode, selectedColumns]);

  // Apply changes to the grid
  const applyChanges = () => {
    if (gridApi) {
      // Remove the 'modified' property before applying changes
      const cleanedColumnDefs = columnDefs.map(col => {
        const { modified, ...cleanCol } = col;
        return cleanCol;
      });
      
      // Use the setGridOption method directly - AG Grid 33+ compliant approach
      gridApi.setGridOption('columnDefs', cleanedColumnDefs);
      
      // Refresh the grid to apply all changes
      gridApi.refreshCells({ force: true });
      
      // Close the dialog
      setOpen(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredColumns.length === 0) return;

    const currentIndex = selectedColumn 
      ? filteredColumns.findIndex(col => 
          col.colId === selectedColumn.colId || col.field === selectedColumn.field
        ) 
      : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < filteredColumns.length - 1) {
          handleSelectColumn(filteredColumns[currentIndex + 1]);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          handleSelectColumn(filteredColumns[currentIndex - 1]);
        } else if (currentIndex === -1 && filteredColumns.length > 0) {
          handleSelectColumn(filteredColumns[0]);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (bulkUpdateMode && selectedColumn) {
          const colId = selectedColumn.colId || selectedColumn.field;
          if (colId) toggleColumnSelection(colId as string);
        }
        break;
    }
  }, [filteredColumns, selectedColumn, bulkUpdateMode, handleSelectColumn, toggleColumnSelection]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Column Settings</DialogTitle>
              <DialogDescription>
                Configure display and behavior for columns
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Checkbox 
                  id="bulk-update-mode" 
                  checked={!!bulkUpdateMode} 
                  onCheckedChange={(checked) => {
                    setBulkUpdateMode(!!checked);
                    setSelectedColumns(new Set());
                  }}
                />
                <Label htmlFor="bulk-update-mode" className="ml-2">
                  Bulk Update Mode
                </Label>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex h-[650px] overflow-hidden">
          {/* Column List Panel */}
          <div className="w-1/4 border-r">
            {/* Search Input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {/* Column List with Keyboard Navigation */}
            <div 
              className="overflow-auto h-full"
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >
              {filteredColumns.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredColumns.map((column) => (
                    <div
                      key={column.colId || column.field}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer group relative
                        ${(selectedColumn?.colId === column.colId || selectedColumn?.field === column.field) 
                          ? 'bg-primary/15 border-l-4 border-primary shadow-sm' 
                          : 'hover:bg-muted/70 hover:border-l-4 hover:border-primary/50'}`}
                      onClick={() => {
                        if (bulkUpdateMode) {
                          toggleColumnSelection(column.colId || column.field || '');
                        } else {
                          handleSelectColumn(column);
                        }
                      }}
                      title={`Field: ${column.field}`}
                    >
                      <div className="flex items-center space-x-2">
                        {bulkUpdateMode && (
                          <Checkbox 
                            checked={!!selectedColumns.has(column.colId || column.field || '')}
                            onCheckedChange={() => {
                              toggleColumnSelection(column.colId || column.field || '');
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium truncate max-w-[180px] ${(selectedColumn?.colId === column.colId || selectedColumn?.field === column.field) ? 'text-primary' : ''}`}>
                            {column.headerName || column.field}
                          </span>
                          {column.modified && (
                            <span className="text-xs text-primary flex items-center">
                              <div className="w-2 h-2 rounded-full bg-primary mr-1" />
                              Modified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {(selectedColumn?.colId === column.colId || selectedColumn?.field === column.field) && !bulkUpdateMode && (
                          <ChevronRight className="h-4 w-4 text-primary" />
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="absolute z-50 right-2 top-full mt-1 bg-popover text-popover-foreground text-xs rounded-md p-2 shadow-md border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                            <div className="font-medium mb-1">Column Details</div>
                            <div><span className="font-medium">Field:</span> {column.field}</div>
                            {column.colId && column.colId !== column.field && (
                              <div><span className="font-medium">Column ID:</span> {column.colId}</div>
                            )}
                            <div><span className="font-medium">Type:</span> {column.type || 'string'}</div>
                            {column.width && (
                              <div><span className="font-medium">Width:</span> {column.width}px</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="mb-2">
                      <Settings className="h-10 w-10 mx-auto opacity-20" />
                    </div>
                    <p className="text-sm">No columns found</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Settings Panel */}
          <div className="w-3/4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="w-full justify-start px-4 border-b rounded-none">
                <TabsTrigger value="header" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm">Header</TabsTrigger>
                <TabsTrigger value="cell" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm">Cell</TabsTrigger>
                <TabsTrigger value="formatter" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm">Formatter</TabsTrigger>
                <TabsTrigger value="filter" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm">Filter</TabsTrigger>
                <TabsTrigger value="editors" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm">Editors</TabsTrigger>
              </TabsList>
              
              {/* Header Tab */}
              <TabsContent value="header" className="p-0 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="p-4 space-y-6">
                    <div className="flex gap-4 items-center mb-2">
                      <div className="flex-1">
                        <Input
                          id="header-name"
                          value={selectedColumn.headerName || selectedColumn.field || ''}
                          placeholder="Header Caption"
                          onChange={(e) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'headerName', 
                            e.target.value
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="bg-muted/50 rounded-md border h-10 flex items-center justify-center">
                          <div className="font-medium text-sm">
                            Header Preview
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="header-font-family" className="mb-1.5 font-medium text-foreground">Font Family</Label>
                          <Select
                            value={selectedColumn.headerComponentParams?.fontFamily || "default"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, fontFamily: value === "default" ? undefined : value }
                            )}
                          >
                            <SelectTrigger id="header-font-family">
                              <SelectValue placeholder="Select font family" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Courier New">Courier New</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="header-font-size" className="mb-1.5 font-medium text-foreground">Font Size</Label>
                          <Select
                            value={selectedColumn.headerComponentParams?.fontSize || "default"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, fontSize: value === "default" ? undefined : value }
                            )}
                          >
                            <SelectTrigger id="header-font-size">
                              <SelectValue placeholder="Select font size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="10px">10px</SelectItem>
                              <SelectItem value="12px">12px</SelectItem>
                              <SelectItem value="14px">14px</SelectItem>
                              <SelectItem value="16px">16px</SelectItem>
                              <SelectItem value="18px">18px</SelectItem>
                              <SelectItem value="20px">20px</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="header-font-weight" className="mb-1.5 font-medium text-foreground">Font Weight</Label>
                          <Select
                            value={selectedColumn.headerComponentParams?.fontWeight || "default"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, fontWeight: value === "default" ? undefined : value }
                            )}
                          >
                            <SelectTrigger id="header-font-weight">
                              <SelectValue placeholder="Select font weight" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                              <SelectItem value="lighter">Lighter</SelectItem>
                              <SelectItem value="bolder">Bolder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="mb-1.5 font-medium text-foreground">Text Style</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              type="button"
                              variant={selectedColumn.headerComponentParams?.fontWeight === 'bold' ? 'default' : 'outline'}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { 
                                  ...selectedColumn.headerComponentParams, 
                                  fontWeight: selectedColumn.headerComponentParams?.fontWeight === 'bold' ? undefined : 'bold'
                                }
                              )}
                            >
                              B
                            </Button>
                            <Button
                              type="button"
                              variant={selectedColumn.headerComponentParams?.fontStyle === 'italic' ? 'default' : 'outline'}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { 
                                  ...selectedColumn.headerComponentParams, 
                                  fontStyle: selectedColumn.headerComponentParams?.fontStyle === 'italic' ? undefined : 'italic'
                                }
                              )}
                            >
                              I
                            </Button>
                            <Button
                              type="button"
                              variant={selectedColumn.headerComponentParams?.textDecoration === 'underline' ? 'default' : 'outline'}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { 
                                  ...selectedColumn.headerComponentParams, 
                                  textDecoration: selectedColumn.headerComponentParams?.textDecoration === 'underline' ? undefined : 'underline'
                                }
                              )}
                            >
                              U
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="header-text-color" className="mb-1.5 font-medium text-foreground">Text Color</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="header-text-color-apply" 
                                checked={!!selectedColumn.headerComponentParams?.color}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'headerComponentParams', 
                                      { ...selectedColumn.headerComponentParams, color: undefined }
                                    );
                                  } else {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'headerComponentParams', 
                                      { ...selectedColumn.headerComponentParams, color: "#000000" }
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor="header-text-color-apply" className="ml-2">Apply</Label>
                            </div>
                          </div>
                          <div className="w-full mt-2">
                            <DirectColorPicker
                              className="w-full"
                              value={(selectedColumn.headerComponentParams?.color as string) || "#000000"}
                              onChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { ...selectedColumn.headerComponentParams, color: value }
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="header-bg-color" className="mb-1.5 font-medium text-foreground">Background</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="header-bg-color-apply" 
                                checked={!!selectedColumn.headerComponentParams?.backgroundColor}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'headerComponentParams', 
                                      { ...selectedColumn.headerComponentParams, backgroundColor: undefined }
                                    );
                                  } else {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'headerComponentParams', 
                                      { ...selectedColumn.headerComponentParams, backgroundColor: "#ffffff" }
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor="header-bg-color-apply" className="ml-2">Apply</Label>
                            </div>
                          </div>
                          <div className="w-full mt-2">
                            <DirectColorPicker
                              className="w-full"
                              value={(selectedColumn.headerComponentParams?.backgroundColor as string) || "#ffffff"}
                              onChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { ...selectedColumn.headerComponentParams, backgroundColor: value }
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>Borders</div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="apply-borders"
                            checked={!!selectedColumn.headerComponentParams?.borderStyle}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                updateColumnProperty(
                                  selectedColumn.colId || selectedColumn.field || '', 
                                  'headerComponentParams', 
                                  { 
                                    ...selectedColumn.headerComponentParams, 
                                    borderStyle: undefined,
                                    borderWidth: undefined,
                                    borderColor: undefined
                                  }
                                );
                              } else {
                                updateColumnProperty(
                                  selectedColumn.colId || selectedColumn.field || '', 
                                  'headerComponentParams', 
                                  { 
                                    ...selectedColumn.headerComponentParams, 
                                    borderStyle: 'solid',
                                    borderWidth: '1px',
                                    borderColor: '#000000'
                                  }
                                );
                              }
                            }}
                          />
                          <Label htmlFor="apply-borders" className="ml-2">Apply</Label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="header-border-style" className="mb-1.5 font-medium text-foreground">Style</Label>
                          <Select 
                            value={(selectedColumn.headerComponentParams?.borderStyle as string) || "none"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, borderStyle: value }
                            )}
                          >
                            <SelectTrigger id="header-border-style">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="header-border-sides" className="mb-1.5 font-medium text-foreground">Sides</Label>
                          <Select 
                            value={(selectedColumn.headerComponentParams?.borderSides as string) || "all"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, borderSides: value }
                            )}
                          >
                            <SelectTrigger id="header-border-sides">
                              <SelectValue placeholder="Select sides" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="header-border-width" className="mb-1.5 font-medium text-foreground">Width: {selectedColumn.headerComponentParams?.borderWidth || '1px'}</Label>
                          <Slider 
                            id="header-border-width"
                            min={1}
                            max={5}
                            step={1}
                            value={[parseInt((selectedColumn.headerComponentParams?.borderWidth as string)?.replace('px', '') || '1')]}
                            onValueChange={(values) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, borderWidth: `${values[0]}px` }
                            )}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="header-border-color" className="mb-1.5 font-medium text-foreground">Color</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="header-border-color-apply" 
                                checked={!!selectedColumn.headerComponentParams?.borderColor}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'headerComponentParams', 
                                      { ...selectedColumn.headerComponentParams, borderColor: undefined }
                                    );
                                  } else {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'headerComponentParams', 
                                      { ...selectedColumn.headerComponentParams, borderColor: "#000000" }
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor="header-border-color-apply" className="ml-2">Apply</Label>
                            </div>
                          </div>
                          <div className="w-full mt-2">
                            <DirectColorPicker
                              className="w-full"
                              value={(selectedColumn.headerComponentParams?.borderColor as string) || "#000000"}
                              onChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { ...selectedColumn.headerComponentParams, borderColor: value }
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <div className="mb-2">
                        <Settings className="h-10 w-10 mx-auto opacity-20" />
                      </div>
                      <p className="text-sm">Select a column to edit its header properties</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Cell Tab */}
              <TabsContent value="cell" className="p-0 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-muted/50 rounded-md p-2 mb-2 text-center text-sm">
                      <div className="font-medium">
                        Sample Cell Value
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="cell-font-family" className="mb-1.5 font-medium text-foreground">Font Family</Label>
                          <Select
                            value={selectedColumn.cellComponentParams?.fontFamily || "default"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'cellComponentParams', 
                              { ...selectedColumn.cellComponentParams, fontFamily: value === "default" ? undefined : value }
                            )}
                          >
                            <SelectTrigger id="cell-font-family">
                              <SelectValue placeholder="Select font family" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Courier New">Courier New</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="cell-font-size" className="mb-1.5 font-medium text-foreground">Font Size</Label>
                          <Select
                            value={selectedColumn.cellComponentParams?.fontSize || "default"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'cellComponentParams', 
                              { ...selectedColumn.cellComponentParams, fontSize: value === "default" ? undefined : value }
                            )}
                          >
                            <SelectTrigger id="cell-font-size">
                              <SelectValue placeholder="Select font size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="10px">10px</SelectItem>
                              <SelectItem value="12px">12px</SelectItem>
                              <SelectItem value="14px">14px</SelectItem>
                              <SelectItem value="16px">16px</SelectItem>
                              <SelectItem value="18px">18px</SelectItem>
                              <SelectItem value="20px">20px</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="cell-font-weight" className="mb-1.5 font-medium text-foreground">Font Weight</Label>
                          <Select
                            value={selectedColumn.cellComponentParams?.fontWeight || "default"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'cellComponentParams', 
                              { ...selectedColumn.cellComponentParams, fontWeight: value === "default" ? undefined : value }
                            )}
                          >
                            <SelectTrigger id="cell-font-weight">
                              <SelectValue placeholder="Select font weight" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                              <SelectItem value="lighter">Lighter</SelectItem>
                              <SelectItem value="bolder">Bolder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="mb-1.5 font-medium text-foreground">Text Style</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              type="button"
                              variant={selectedColumn.cellComponentParams?.fontWeight === 'bold' ? 'default' : 'outline'}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'cellComponentParams', 
                                { 
                                  ...selectedColumn.cellComponentParams, 
                                  fontWeight: selectedColumn.cellComponentParams?.fontWeight === 'bold' ? undefined : 'bold'
                                }
                              )}
                            >
                              B
                            </Button>
                            <Button
                              type="button"
                              variant={selectedColumn.cellComponentParams?.fontStyle === 'italic' ? 'default' : 'outline'}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'cellComponentParams', 
                                { 
                                  ...selectedColumn.cellComponentParams, 
                                  fontStyle: selectedColumn.cellComponentParams?.fontStyle === 'italic' ? undefined : 'italic'
                                }
                              )}
                            >
                              I
                            </Button>
                            <Button
                              type="button"
                              variant={selectedColumn.cellComponentParams?.textDecoration === 'underline' ? 'default' : 'outline'}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'cellComponentParams', 
                                { 
                                  ...selectedColumn.cellComponentParams, 
                                  textDecoration: selectedColumn.cellComponentParams?.textDecoration === 'underline' ? undefined : 'underline'
                                }
                              )}
                            >
                              U
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="cell-text-color" className="mb-1.5 font-medium text-foreground">Text Color</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="cell-text-color-apply" 
                                checked={!!selectedColumn.cellComponentParams?.color}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'cellComponentParams', 
                                      { ...selectedColumn.cellComponentParams, color: undefined }
                                    );
                                  } else {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'cellComponentParams', 
                                      { ...selectedColumn.cellComponentParams, color: "#000000" }
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor="cell-text-color-apply" className="ml-2">Apply</Label>
                            </div>
                          </div>
                          <div className="w-full mt-2">
                            <DirectColorPicker
                              className="w-full"
                              value={(selectedColumn.cellComponentParams?.color as string) || "#000000"}
                              onChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'cellComponentParams', 
                                { ...selectedColumn.cellComponentParams, color: value }
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="cell-bg-color" className="mb-1.5 font-medium text-foreground">Background</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="cell-bg-color-apply" 
                                checked={!!selectedColumn.cellComponentParams?.backgroundColor}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'cellComponentParams', 
                                      { ...selectedColumn.cellComponentParams, backgroundColor: undefined }
                                    );
                                  } else {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'cellComponentParams', 
                                      { ...selectedColumn.cellComponentParams, backgroundColor: "#ffffff" }
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor="cell-bg-color-apply" className="ml-2">Apply</Label>
                            </div>
                          </div>
                          <div className="w-full mt-2">
                            <DirectColorPicker
                              className="w-full"
                              value={(selectedColumn.cellComponentParams?.backgroundColor as string) || "#ffffff"}
                              onChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'cellComponentParams', 
                                { ...selectedColumn.cellComponentParams, backgroundColor: value }
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>Borders</div>
                        <div className="flex items-center">
                          <Checkbox 
                            id="apply-cell-borders"
                            checked={!!selectedColumn.cellComponentParams?.borderStyle}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                updateColumnProperty(
                                  selectedColumn.colId || selectedColumn.field || '', 
                                  'cellComponentParams', 
                                  { 
                                    ...selectedColumn.cellComponentParams, 
                                    borderStyle: undefined,
                                    borderWidth: undefined,
                                    borderColor: undefined
                                  }
                                );
                              } else {
                                updateColumnProperty(
                                  selectedColumn.colId || selectedColumn.field || '', 
                                  'cellComponentParams', 
                                  { 
                                    ...selectedColumn.cellComponentParams, 
                                    borderStyle: 'solid',
                                    borderWidth: '1px',
                                    borderColor: '#000000'
                                  }
                                );
                              }
                            }}
                          />
                          <Label htmlFor="apply-cell-borders" className="ml-2">Apply</Label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="cell-border-style" className="mb-1.5 font-medium text-foreground">Style</Label>
                          <Select 
                            value={(selectedColumn.cellComponentParams?.borderStyle as string) || "none"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'cellComponentParams', 
                              { ...selectedColumn.cellComponentParams, borderStyle: value }
                            )}
                          >
                            <SelectTrigger id="cell-border-style">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="cell-border-sides" className="mb-1.5 font-medium text-foreground">Sides</Label>
                          <Select 
                            value={(selectedColumn.cellComponentParams?.borderSides as string) || "all"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'cellComponentParams', 
                              { ...selectedColumn.cellComponentParams, borderSides: value }
                            )}
                          >
                            <SelectTrigger id="cell-border-sides">
                              <SelectValue placeholder="Select sides" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="cell-border-width" className="mb-1.5 font-medium text-foreground">Width: {selectedColumn.cellComponentParams?.borderWidth || '1px'}</Label>
                          <Slider 
                            id="cell-border-width"
                            min={1}
                            max={5}
                            step={1}
                            value={[parseInt((selectedColumn.cellComponentParams?.borderWidth as string)?.replace('px', '') || '1')]}
                            onValueChange={(values) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'cellComponentParams', 
                              { ...selectedColumn.cellComponentParams, borderWidth: `${values[0]}px` }
                            )}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="cell-border-color" className="mb-1.5 font-medium text-foreground">Color</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="cell-border-color-apply" 
                                checked={!!selectedColumn.cellComponentParams?.borderColor}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'cellComponentParams', 
                                      { ...selectedColumn.cellComponentParams, borderColor: undefined }
                                    );
                                  } else {
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'cellComponentParams', 
                                      { ...selectedColumn.cellComponentParams, borderColor: "#000000" }
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor="cell-border-color-apply" className="ml-2">Apply</Label>
                            </div>
                          </div>
                          <div className="w-full mt-2">
                            <DirectColorPicker
                              className="w-full"
                              value={(selectedColumn.cellComponentParams?.borderColor as string) || "#000000"}
                              onChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'cellComponentParams', 
                                { ...selectedColumn.cellComponentParams, borderColor: value }
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <div className="mb-2">
                        <Settings className="h-10 w-10 mx-auto opacity-20" />
                      </div>
                      <p className="text-sm">Select a column to edit its cell properties</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Formatter Tab */}
              <TabsContent value="formatter" className="p-0 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-muted/50 rounded-md p-2 mb-2 text-center text-sm">
                      <div className="font-medium">
                        Formatter: {selectedColumn.type || 'None'}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="formatter" className="mb-1.5 font-medium text-foreground">Formatter Type</Label>
                        <Select
                          value={(selectedColumn.type as string) || 'none'}
                          onValueChange={(value) => {
                            updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'type', 
                              value === 'none' ? undefined : value
                            );
                            if (value === 'custom') {
                              setCustomFormatValue(
                                typeof selectedColumn.valueFormatter === 'object' && 
                                selectedColumn.valueFormatter !== null && 
                                selectedColumn.valueFormatter.params && 
                                typeof selectedColumn.valueFormatter.params.formatString === 'string' ? 
                                selectedColumn.valueFormatter.params.formatString : "[>0][Green]\"$\"#,##0.00;[<0][Red]\"$\"#,##0.00;$0.00"
                              );
                            }
                          }}
                        >
                          <SelectTrigger id="formatter">
                            <SelectValue placeholder="Select formatter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedColumn.type === 'number' && (
                        <div>
                          <Label htmlFor="precision" className="mb-1.5 font-medium text-foreground">Decimal Precision</Label>
                          <Input
                            id="precision"
                            type="number"
                            min={0}
                            max={10}
                            value={
                              typeof selectedColumn.valueFormatter === 'object' && 
                              selectedColumn.valueFormatter !== null && 
                              selectedColumn.valueFormatter.params && 
                              typeof selectedColumn.valueFormatter.params.precision === 'number' ? 
                              selectedColumn.valueFormatter.params.precision : 2
                            }
                            onChange={(e) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'valueFormatter', 
                              { 
                                function: 'numberFormatter', 
                                params: { precision: parseInt(e.target.value) } 
                              }
                            )}
                          />
                        </div>
                      )}

                      {selectedColumn.type === 'date' && (
                        <div>
                          <Label htmlFor="dateFormat" className="mb-1.5 font-medium text-foreground">Date Format</Label>
                          <Select
                            value={
                              typeof selectedColumn.valueFormatter === 'object' && 
                              selectedColumn.valueFormatter !== null && 
                              selectedColumn.valueFormatter.params && 
                              typeof selectedColumn.valueFormatter.params.format === 'string' ? 
                              selectedColumn.valueFormatter.params.format : "MM/DD/YYYY"
                            }
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'valueFormatter', 
                              { 
                                function: 'dateFormatter', 
                                params: { format: value } 
                              }
                            )}
                          >
                            <SelectTrigger id="dateFormat">
                              <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                              <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedColumn.type === 'currency' && (
                        <>
                          <div>
                            <Label htmlFor="currencySymbol" className="mb-1.5 font-medium text-foreground">Currency Symbol</Label>
                            <Select
                              value={
                                typeof selectedColumn.valueFormatter === 'object' && 
                                selectedColumn.valueFormatter !== null && 
                                selectedColumn.valueFormatter.params && 
                                typeof selectedColumn.valueFormatter.params.currency === 'string' ? 
                                selectedColumn.valueFormatter.params.currency : "$"
                              }
                              onValueChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'valueFormatter', 
                                { 
                                  function: 'currencyFormatter', 
                                  params: { 
                                    currency: value,
                                    precision: 
                                      typeof selectedColumn.valueFormatter === 'object' && 
                                      selectedColumn.valueFormatter !== null && 
                                      selectedColumn.valueFormatter.params && 
                                      typeof selectedColumn.valueFormatter.params.precision === 'number' ? 
                                      selectedColumn.valueFormatter.params.precision : 2,
                                    position: 
                                      typeof selectedColumn.valueFormatter === 'object' && 
                                      selectedColumn.valueFormatter !== null && 
                                      selectedColumn.valueFormatter.params && 
                                      typeof selectedColumn.valueFormatter.params.position === 'string' ? 
                                      selectedColumn.valueFormatter.params.position : "before"
                                  } 
                                }
                              )}
                            >
                              <SelectTrigger id="currencySymbol">
                                <SelectValue placeholder="Select currency symbol" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="$">$</SelectItem>
                                <SelectItem value="€">€</SelectItem>
                                <SelectItem value="£">£</SelectItem>
                                <SelectItem value="¥">¥</SelectItem>
                                <SelectItem value="₹">₹</SelectItem>
                                <SelectItem value="₽">₽</SelectItem>
                                <SelectItem value="R$">R$</SelectItem>
                                <SelectItem value="kr">kr</SelectItem>
                                <SelectItem value="฿">฿</SelectItem>
                                <SelectItem value="₩">₩</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="decimalPlaces" className="mb-1.5 font-medium text-foreground">Decimal Places</Label>
                            <Input
                              id="decimalPlaces"
                              type="number"
                              min={0}
                              max={10}
                              value={
                                typeof selectedColumn.valueFormatter === 'object' && 
                                selectedColumn.valueFormatter !== null && 
                                selectedColumn.valueFormatter.params && 
                                typeof selectedColumn.valueFormatter.params.precision === 'number' ? 
                                selectedColumn.valueFormatter.params.precision : 2
                              }
                              onChange={(e) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'valueFormatter', 
                                { 
                                  function: 'currencyFormatter', 
                                  params: { 
                                    precision: parseInt(e.target.value),
                                    currency: 
                                      typeof selectedColumn.valueFormatter === 'object' && 
                                      selectedColumn.valueFormatter !== null && 
                                      selectedColumn.valueFormatter.params && 
                                      typeof selectedColumn.valueFormatter.params.currency === 'string' ? 
                                      selectedColumn.valueFormatter.params.currency : "$",
                                    position: 
                                      typeof selectedColumn.valueFormatter === 'object' && 
                                      selectedColumn.valueFormatter !== null && 
                                      selectedColumn.valueFormatter.params && 
                                      typeof selectedColumn.valueFormatter.params.position === 'string' ? 
                                      selectedColumn.valueFormatter.params.position : "before"
                                  } 
                                }
                              )}
                            />
                          </div>

                          <div>
                            <Label htmlFor="symbolPosition" className="mb-1.5 font-medium text-foreground">Symbol Position</Label>
                            <Select
                              value={
                                typeof selectedColumn.valueFormatter === 'object' && 
                                selectedColumn.valueFormatter !== null && 
                                selectedColumn.valueFormatter.params && 
                                typeof selectedColumn.valueFormatter.params.position === 'string' ? 
                                selectedColumn.valueFormatter.params.position : "before"
                              }
                              onValueChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'valueFormatter', 
                                { 
                                  function: 'currencyFormatter', 
                                  params: { 
                                    position: value,
                                    currency: 
                                      typeof selectedColumn.valueFormatter === 'object' && 
                                      selectedColumn.valueFormatter !== null && 
                                      selectedColumn.valueFormatter.params && 
                                      typeof selectedColumn.valueFormatter.params.currency === 'string' ? 
                                      selectedColumn.valueFormatter.params.currency : "$",
                                    precision: 
                                      typeof selectedColumn.valueFormatter === 'object' && 
                                      selectedColumn.valueFormatter !== null && 
                                      selectedColumn.valueFormatter.params && 
                                      typeof selectedColumn.valueFormatter.params.precision === 'number' ? 
                                      selectedColumn.valueFormatter.params.precision : 2
                                  } 
                                }
                              )}
                            >
                              <SelectTrigger id="symbolPosition">
                                <SelectValue placeholder="Select symbol position" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="before">Before ($100)</SelectItem>
                                <SelectItem value="after">After (100$)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {selectedColumn.type === 'percent' && (
                        <div>
                          <Label htmlFor="percentPrecision" className="mb-1.5 font-medium text-foreground">Decimal Places</Label>
                          <Input
                            id="percentPrecision"
                            type="number"
                            min={0}
                            max={10}
                            value={
                              typeof selectedColumn.valueFormatter === 'object' && 
                              selectedColumn.valueFormatter !== null && 
                              selectedColumn.valueFormatter.params && 
                              typeof selectedColumn.valueFormatter.params.precision === 'number' ? 
                              selectedColumn.valueFormatter.params.precision : 2
                            }
                            onChange={(e) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'valueFormatter', 
                              { 
                                function: 'percentFormatter', 
                                params: { precision: parseInt(e.target.value) } 
                              }
                            )}
                          />
                        </div>
                      )}

                      {selectedColumn.type === 'custom' && (
                        <div className="space-y-4">
                          <div className="flex space-x-2">
                            <Button 
                              type="button" 
                              variant={!showFormatExamples ? "default" : "outline"}
                              className="flex-1"
                              onClick={() => setShowFormatExamples(false)}
                            >
                              Format Editor
                            </Button>
                            <Button 
                              type="button" 
                              variant={showFormatExamples ? "default" : "outline"}
                              className="flex-1"
                              onClick={() => setShowFormatExamples(true)}
                            >
                              Examples
                            </Button>
                          </div>

                          {!showFormatExamples ? (
                            <>
                              <div>
                                <Label htmlFor="customFormat" className="mb-1.5 font-medium text-foreground">Custom Format</Label>
                                <div className="relative">
                                  <Input
                                    id="customFormat"
                                    value={customFormatValue}
                                    onChange={(e) => {
                                      setCustomFormatValue(e.target.value);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: e.target.value } 
                                        }
                                      );
                                    }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                    <HelpCircle className="h-4 w-4" />
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Supports Excel-like formats. Click the ? for help.</p>
                              </div>

                              <div>
                                <Label htmlFor="previewValue" className="mb-1.5 font-medium text-foreground">Preview Value:</Label>
                                <Input
                                  id="previewValue"
                                  value={previewValue}
                                  onChange={(e) => setPreviewValue(e.target.value)}
                                />
                              </div>

                              <div>
                                <Label className="mb-1.5 font-medium text-foreground">Preview:</Label>
                                <div className="p-3 border rounded-md bg-muted/30 min-h-[40px]">
                                  {/* Preview would go here - in a real implementation this would format the preview value using the custom format */}
                                  <div className="text-green-500">$1,234.56</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-sm">Click an example to apply it:</p>
                              
                              <div className="space-y-4">
                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">Color & Conditionals</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `[&gt;0][Green]"$"#,##0.00;[&lt;0][Red]"$"#,##0.00;$0.00`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`[&gt;0][Green]"$"#,##0.00;[&lt;0][Red]"$"#,##0.00;$0.00`}</div>
                                    <div className="flex space-x-4">
                                      <div>1234.56: <span className="text-green-500">$1,234.56</span></div>
                                      <div>-1234.56: <span className="text-red-500">$-1,234.56</span></div>
                                      <div>0: <span>$0.00</span></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">Status Indicators</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `[=1][Green]"✓";[=0][Red]"✗";"N/A"`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`[=1][Green]"✓";[=0][Red]"✗";"N/A"`}</div>
                                    <div className="flex space-x-4">
                                      <div>1: <span className="text-green-500">✓</span></div>
                                      <div>0: <span className="text-red-500">✗</span></div>
                                      <div>2: <span>N/A</span></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">Score Ranges</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `[&gt;=90][#00B800]0"%";[&gt;=70][#007C00]0"%";[#FF0000]0"%"`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`[&gt;=90][#00B800]0"%";[&gt;=70][#007C00]0"%";[#FF0000]0"%"`}</div>
                                    <div className="flex space-x-4">
                                      <div>95: <span className="text-[#00B800]">95%</span></div>
                                      <div>75: <span className="text-[#007C00]">75%</span></div>
                                      <div>65: <span className="text-[#FF0000]">65%</span></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">KPI Indicators</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `[&gt;100][Green]"✓ Above Target";[=100][Blue]"= On Target";[Red]"✗ Below Target"`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`[&gt;100][Green]"✓ Above Target";[=100][Blue]"= On Target";[Red]"✗ Below Target"`}</div>
                                    <div className="flex space-x-4">
                                      <div>110: <span className="text-green-500">✓ Above Target</span></div>
                                      <div>100: <span className="text-blue-500">= On Target</span></div>
                                      <div>90: <span className="text-red-500">✗ Below Target</span></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">Simple Heatmap</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `[&gt;0.7][#009900]0"%";[&gt;0.3][#FFCC00]0"%";[#FF0000]0"%"`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`[&gt;0.7][#009900]0"%";[&gt;0.3][#FFCC00]0"%";[#FF0000]0"%"`}</div>
                                    <div className="flex space-x-4">
                                      <div>0.8: <span className="text-[#009900]">80.0%</span></div>
                                      <div>0.5: <span className="text-[#FFCC00]">50.0%</span></div>
                                      <div>0.2: <span className="text-[#FF0000]">20.0%</span></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">Text with Values</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `{value} units`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`{value} units`}</div>
                                    <div>42: <span>42 units</span></div>
                                  </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">Currency with Suffix</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `"$"#,##0.00" USD"`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`"$"#,##0.00" USD"`}</div>
                                    <div>1234.56: <span>$1,234.56 USD</span></div>
                                  </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-muted p-2 border-b">
                                    <span className="font-medium">Conditional Prefix</span>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                      const format = `[&gt;0]"Profit: ";[&lt;0]"Loss: ";"Break-even"`;
                                      setCustomFormatValue(format);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '', 
                                        'valueFormatter', 
                                        { 
                                          function: 'customFormatter', 
                                          params: { formatString: format } 
                                        }
                                      );
                                      setShowFormatExamples(false);
                                    }}>
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="p-3 text-sm">
                                    <div className="font-mono text-xs mb-2">{`[&gt;0]"Profit: ";[&lt;0]"Loss: ";"Break-even"`}</div>
                                    <div className="flex space-x-4">
                                      <div>100: <span>Profit: 100</span></div>
                                      <div>-50: <span>Loss: -50</span></div>
                                      <div>0: <span>Break-even</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <div className="mb-2">
                        <Settings className="h-10 w-10 mx-auto opacity-20" />
                      </div>
                      <p className="text-sm">Select a column to edit its formatter properties</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Filter Tab */}
              <TabsContent value="filter" className="p-0 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-muted/50 rounded-md p-2 mb-2 text-center text-sm">
                      <div className="font-medium">
                        Filter Type: {selectedColumn.filterType || 'Auto'}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Filter Enable/Disable */}
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="filter-enabled" 
                          checked={selectedColumn.filter !== false}
                          onCheckedChange={(checked) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'filter', 
                            checked === true ? true : false
                          )}
                        />
                        <Label htmlFor="filter-enabled" className="font-medium text-foreground">Enable Filter</Label>
                      </div>

                      {/* Floating Filter Enable/Disable */}
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="floating-filter-enabled" 
                          checked={selectedColumn.floatingFilter === true}
                          onCheckedChange={(checked) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'floatingFilter', 
                            checked === true ? true : false
                          )}
                        />
                        <Label htmlFor="floating-filter-enabled" className="font-medium text-foreground">Enable Floating Filter</Label>
                      </div>

                      {/* Filter Type Selection */}
                      <div>
                        <Label htmlFor="filter-type" className="mb-1.5 font-medium text-foreground">Filter Type</Label>
                        <Select
                          value={selectedColumn.filterType || 'agTextColumnFilter'}
                          onValueChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'filterType', 
                            value
                          )}
                        >
                          <SelectTrigger id="filter-type">
                            <SelectValue placeholder="Select filter type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agTextColumnFilter">Text</SelectItem>
                            <SelectItem value="agNumberColumnFilter">Number</SelectItem>
                            <SelectItem value="agDateColumnFilter">Date</SelectItem>
                            <SelectItem value="agSetColumnFilter">Set</SelectItem>
                            <SelectItem value="agMultiColumnFilter">Multi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter Parameters - Text Filter */}
                      {selectedColumn.filterType === 'agTextColumnFilter' && (
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-sm">Text Filter Parameters</h3>
                          
                          <div>
                            <Label htmlFor="text-filter-default-option" className="mb-1.5 text-sm">Default Option</Label>
                            <Select
                              value={(selectedColumn.filterParams?.defaultOption as string) || 'contains'}
                              onValueChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  defaultOption: value 
                                }
                              )}
                            >
                              <SelectTrigger id="text-filter-default-option">
                                <SelectValue placeholder="Default filter option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="startsWith">Starts With</SelectItem>
                                <SelectItem value="endsWith">Ends With</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="text-filter-case-sensitive" 
                              checked={selectedColumn.filterParams?.caseSensitive === true}
                              onCheckedChange={(checked) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  caseSensitive: checked === true ? true : false 
                                }
                              )}
                            />
                            <Label htmlFor="text-filter-case-sensitive" className="text-sm">Case Sensitive</Label>
                          </div>
                        </div>
                      )}

                      {/* Filter Parameters - Number Filter */}
                      {selectedColumn.filterType === 'agNumberColumnFilter' && (
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-sm">Number Filter Parameters</h3>
                          
                          <div>
                            <Label htmlFor="number-filter-default-option" className="mb-1.5 text-sm">Default Option</Label>
                            <Select
                              value={(selectedColumn.filterParams?.defaultOption as string) || 'equals'}
                              onValueChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  defaultOption: value 
                                }
                              )}
                            >
                              <SelectTrigger id="number-filter-default-option">
                                <SelectValue placeholder="Default filter option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="notEqual">Not Equal</SelectItem>
                                <SelectItem value="lessThan">Less Than</SelectItem>
                                <SelectItem value="lessThanOrEqual">Less Than or Equal</SelectItem>
                                <SelectItem value="greaterThan">Greater Than</SelectItem>
                                <SelectItem value="greaterThanOrEqual">Greater Than or Equal</SelectItem>
                                <SelectItem value="inRange">In Range</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="number-filter-allowed-chars" className="mb-1.5 text-sm">Allowed Characters</Label>
                            <Input
                              id="number-filter-allowed-chars"
                              value={(selectedColumn.filterParams?.allowedCharPattern as string) || '\\d\\-\\.'}
                              onChange={(e) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  allowedCharPattern: e.target.value 
                                }
                              )}
                              placeholder="Regular expression pattern"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Default: \d\-\. (digits, minus, decimal)</p>
                          </div>
                        </div>
                      )}

                      {/* Filter Parameters - Date Filter */}
                      {selectedColumn.filterType === 'agDateColumnFilter' && (
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-sm">Date Filter Parameters</h3>
                          
                          <div>
                            <Label htmlFor="date-filter-default-option" className="mb-1.5 text-sm">Default Option</Label>
                            <Select
                              value={(selectedColumn.filterParams?.defaultOption as string) || 'equals'}
                              onValueChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  defaultOption: value 
                                }
                              )}
                            >
                              <SelectTrigger id="date-filter-default-option">
                                <SelectValue placeholder="Default filter option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="notEqual">Not Equal</SelectItem>
                                <SelectItem value="lessThan">Before</SelectItem>
                                <SelectItem value="greaterThan">After</SelectItem>
                                <SelectItem value="inRange">In Range</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="date-filter-browser-picker" 
                              checked={selectedColumn.filterParams?.browserDatePicker === true}
                              onCheckedChange={(checked) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  browserDatePicker: checked === true ? true : false 
                                }
                              )}
                            />
                            <Label htmlFor="date-filter-browser-picker" className="text-sm">Use Browser Date Picker</Label>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="date-filter-min-year" className="mb-1.5 text-sm">Min Year</Label>
                              <Input
                                id="date-filter-min-year"
                                type="number"
                                value={(selectedColumn.filterParams?.minValidYear as number) || 1900}
                                onChange={(e) => updateColumnProperty(
                                  selectedColumn.colId || selectedColumn.field || '', 
                                  'filterParams', 
                                  { 
                                    ...selectedColumn.filterParams,
                                    minValidYear: parseInt(e.target.value) 
                                  }
                                )}
                              />
                            </div>
                            <div>
                              <Label htmlFor="date-filter-max-year" className="mb-1.5 text-sm">Max Year</Label>
                              <Input
                                id="date-filter-max-year"
                                type="number"
                                value={(selectedColumn.filterParams?.maxValidYear as number) || 2100}
                                onChange={(e) => updateColumnProperty(
                                  selectedColumn.colId || selectedColumn.field || '', 
                                  'filterParams', 
                                  { 
                                    ...selectedColumn.filterParams,
                                    maxValidYear: parseInt(e.target.value) 
                                  }
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Filter Parameters - Set Filter */}
                      {selectedColumn.filterType === 'agSetColumnFilter' && (
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-sm">Set Filter Parameters</h3>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="set-filter-select-all" 
                              checked={selectedColumn.filterParams?.selectAllOnMiniFilter === true}
                              onCheckedChange={(checked) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  selectAllOnMiniFilter: checked === true ? true : false 
                                }
                              )}
                            />
                            <Label htmlFor="set-filter-select-all" className="text-sm">Select All on Mini Filter</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="set-filter-search" 
                              checked={selectedColumn.filterParams?.suppressMiniFilter !== true}
                              onCheckedChange={(checked) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'filterParams', 
                                { 
                                  ...selectedColumn.filterParams,
                                  suppressMiniFilter: checked === true ? false : true
                                }
                              )}
                            />
                            <Label htmlFor="set-filter-search" className="text-sm">Enable Search</Label>
                          </div>
                        </div>
                      )}

                      {/* Filter Parameters - Multi Filter */}
                      {selectedColumn.filterType === 'agMultiColumnFilter' && (
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-sm">Multi Filter Parameters</h3>
                          <p className="text-xs text-muted-foreground">Multi-column filter combines multiple filter types.</p>
                          
                          <div>
                            <Label className="mb-1.5 text-sm">Filter Types</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="multi-filter-text" 
                                  checked={selectedColumn.filterParams?.filters?.some(f => f.filter === 'agTextColumnFilter')}
                                  onCheckedChange={(checked) => {
                                    const currentFilters = selectedColumn.filterParams?.filters || [];
                                    let newFilters;
                                    
                                    if (checked) {
                                      // Add text filter if not present
                                      if (!currentFilters.some(f => f.filter === 'agTextColumnFilter')) {
                                        newFilters = [...currentFilters, { filter: 'agTextColumnFilter' }];
                                      } else {
                                        newFilters = currentFilters;
                                      }
                                    } else {
                                      // Remove text filter
                                      newFilters = currentFilters.filter(f => f.filter !== 'agTextColumnFilter');
                                    }
                                    
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'filterParams', 
                                      { 
                                        ...selectedColumn.filterParams,
                                        filters: newFilters
                                      }
                                    );
                                  }}
                                />
                                <Label htmlFor="multi-filter-text" className="text-sm">Text Filter</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="multi-filter-number" 
                                  checked={selectedColumn.filterParams?.filters?.some(f => f.filter === 'agNumberColumnFilter')}
                                  onCheckedChange={(checked) => {
                                    const currentFilters = selectedColumn.filterParams?.filters || [];
                                    let newFilters;
                                    
                                    if (checked) {
                                      // Add number filter if not present
                                      if (!currentFilters.some(f => f.filter === 'agNumberColumnFilter')) {
                                        newFilters = [...currentFilters, { filter: 'agNumberColumnFilter' }];
                                      } else {
                                        newFilters = currentFilters;
                                      }
                                    } else {
                                      // Remove number filter
                                      newFilters = currentFilters.filter(f => f.filter !== 'agNumberColumnFilter');
                                    }
                                    
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'filterParams', 
                                      { 
                                        ...selectedColumn.filterParams,
                                        filters: newFilters
                                      }
                                    );
                                  }}
                                />
                                <Label htmlFor="multi-filter-number" className="text-sm">Number Filter</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="multi-filter-date" 
                                  checked={selectedColumn.filterParams?.filters?.some(f => f.filter === 'agDateColumnFilter')}
                                  onCheckedChange={(checked) => {
                                    const currentFilters = selectedColumn.filterParams?.filters || [];
                                    let newFilters;
                                    
                                    if (checked) {
                                      // Add date filter if not present
                                      if (!currentFilters.some(f => f.filter === 'agDateColumnFilter')) {
                                        newFilters = [...currentFilters, { filter: 'agDateColumnFilter' }];
                                      } else {
                                        newFilters = currentFilters;
                                      }
                                    } else {
                                      // Remove date filter
                                      newFilters = currentFilters.filter(f => f.filter !== 'agDateColumnFilter');
                                    }
                                    
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'filterParams', 
                                      { 
                                        ...selectedColumn.filterParams,
                                        filters: newFilters
                                      }
                                    );
                                  }}
                                />
                                <Label htmlFor="multi-filter-date" className="text-sm">Date Filter</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="multi-filter-set" 
                                  checked={selectedColumn.filterParams?.filters?.some(f => f.filter === 'agSetColumnFilter')}
                                  onCheckedChange={(checked) => {
                                    const currentFilters = selectedColumn.filterParams?.filters || [];
                                    let newFilters;
                                    
                                    if (checked) {
                                      // Add set filter if not present
                                      if (!currentFilters.some(f => f.filter === 'agSetColumnFilter')) {
                                        newFilters = [...currentFilters, { filter: 'agSetColumnFilter' }];
                                      } else {
                                        newFilters = currentFilters;
                                      }
                                    } else {
                                      // Remove set filter
                                      newFilters = currentFilters.filter(f => f.filter !== 'agSetColumnFilter');
                                    }
                                    
                                    updateColumnProperty(
                                      selectedColumn.colId || selectedColumn.field || '', 
                                      'filterParams', 
                                      { 
                                        ...selectedColumn.filterParams,
                                        filters: newFilters
                                      }
                                    );
                                  }}
                                />
                                <Label htmlFor="multi-filter-set" className="text-sm">Set Filter</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Common Filter Parameters */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-medium text-sm">Common Filter Parameters</h3>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-buttons" 
                            checked={selectedColumn.filterParams?.buttons !== undefined}
                            onCheckedChange={(checked) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'filterParams', 
                              { 
                                ...selectedColumn.filterParams,
                                buttons: checked === true ? ['apply', 'clear', 'reset', 'cancel'] : undefined
                              }
                            )}
                          />
                          <Label htmlFor="filter-buttons" className="text-sm">Show Filter Buttons</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-close-on-apply" 
                            checked={selectedColumn.filterParams?.closeOnApply === true}
                            onCheckedChange={(checked) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'filterParams', 
                              { 
                                ...selectedColumn.filterParams,
                                closeOnApply: checked === true ? true : false
                              }
                            )}
                          />
                          <Label htmlFor="filter-close-on-apply" className="text-sm">Close on Apply</Label>
                        </div>

                        <div>
                          <Label htmlFor="filter-debounce" className="mb-1.5 text-sm">Debounce (ms)</Label>
                          <Input
                            id="filter-debounce"
                            type="number"
                            value={(selectedColumn.filterParams?.debounceMs as number) || 500}
                            onChange={(e) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'filterParams', 
                              { 
                                ...selectedColumn.filterParams,
                                debounceMs: parseInt(e.target.value) 
                              }
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <div className="mb-2">
                        <Settings className="h-10 w-10 mx-auto opacity-20" />
                      </div>
                      <p className="text-sm">Select a column to edit its filter properties</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Editors Tab */}
              <TabsContent value="editors" className="p-0 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-muted/50 rounded-md p-2 mb-2 text-center text-sm">
                      <div className="font-medium">
                        Editor: {selectedColumn.editable ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="editor-type" className="mb-1.5 font-medium text-foreground">Editor Type</Label>
                        <Select
                          value={selectedColumn.editable ? (selectedColumn.cellEditorType || 'default') : 'none'}
                          onValueChange={(value) => {
                            // Update editable property
                            updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'editable', 
                              value !== 'none'
                            );
                            
                            // If not 'none', update the editor type
                            if (value !== 'none') {
                              updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'cellEditorType', 
                                value
                              );
                              
                              // Initialize select values if select type is chosen
                              if (value === 'select') {
                                // Initialize with existing values or empty array
                                const initialValues = selectedColumn.cellEditorParams?.values || [];
                                setSelectValues(initialValues);
                                setSelectValueSource('csv');
                                setSelectSourceData('');
                              }
                            }
                          }}
                        >
                          <SelectTrigger id="editor-type">
                            <SelectValue placeholder="Select editor type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedColumn.editable && selectedColumn.cellEditorType === 'select' && (
                        <div className="space-y-4 mt-4">
                          <Label htmlFor="select-value-source" className="mb-1.5 font-medium text-foreground">Select Value Source</Label>
                          <Select
                            value={selectValueSource}
                            onValueChange={(value: 'csv' | 'json' | 'rest') => setSelectValueSource(value)}
                          >
                            <SelectTrigger id="select-value-source">
                              <SelectValue placeholder="Select value source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="rest">REST URL</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {selectValueSource === 'csv' && (
                            <div className="mt-2">
                              <Label htmlFor="select-values-csv" className="mb-1.5 text-sm">CSV Values (comma-separated)</Label>
                              <textarea
                                id="select-values-csv"
                                className="w-full min-h-[100px] p-2 border rounded-md"
                                value={selectValues.join(',')}
                                onChange={(e) => {
                                  const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                  setSelectValues(values);
                                  updateColumnProperty(
                                    selectedColumn.colId || selectedColumn.field || '',
                                    'cellEditorParams',
                                    {
                                      ...selectedColumn.cellEditorParams,
                                      values: values,
                                      valueSource: 'csv',
                                      valueSourceData: e.target.value
                                    }
                                  );
                                }}
                                placeholder="Enter comma-separated values, e.g.: option1,option2,option3"
                              />
                            </div>
                          )}
                          
                          {selectValueSource === 'json' && (
                            <div className="mt-2">
                              <Label htmlFor="select-values-json" className="mb-1.5 text-sm">JSON Values ({`{"value":["val1","val2"]}`})</Label>
                              <textarea
                                id="select-values-json"
                                className="w-full min-h-[100px] p-2 border rounded-md"
                                value={selectSourceData || '{"value":["value1","value2"]}'}
                                onChange={(e) => {
                                  setSelectSourceData(e.target.value);
                                  try {
                                    const jsonData = JSON.parse(e.target.value);
                                    if (jsonData && Array.isArray(jsonData.value)) {
                                      setSelectValues(jsonData.value);
                                      updateColumnProperty(
                                        selectedColumn.colId || selectedColumn.field || '',
                                        'cellEditorParams',
                                        {
                                          ...selectedColumn.cellEditorParams,
                                          values: jsonData.value,
                                          valueSource: 'json',
                                          valueSourceData: e.target.value
                                        }
                                      );
                                    }
                                  } catch (error) {
                                    // Invalid JSON - don't update
                                    console.error("Invalid JSON format", error);
                                  }
                                }}
                                placeholder='{"value":["option1","option2","option3"]}'
                              />
                            </div>
                          )}
                          
                          {selectValueSource === 'rest' && (
                            <div className="mt-2">
                              <Label htmlFor="select-values-rest" className="mb-1.5 text-sm">REST URL (returns {`{"value":["val1","val2"]}`})</Label>
                              <textarea
                                id="select-values-rest"
                                className="w-full min-h-[60px] p-2 border rounded-md"
                                value={selectSourceData}
                                onChange={(e) => {
                                  setSelectSourceData(e.target.value);
                                  updateColumnProperty(
                                    selectedColumn.colId || selectedColumn.field || '',
                                    'cellEditorParams',
                                    {
                                      ...selectedColumn.cellEditorParams,
                                      valueSource: 'rest',
                                      valueSourceData: e.target.value,
                                      // For REST, we'll set a function that fetches the data at runtime
                                      values: [] // Initial empty array, will be populated at runtime
                                    }
                                  );
                                }}
                                placeholder="https://api.example.com/options"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                The REST endpoint should return a JSON object with a "value" property containing an array of options.
                              </p>
                            </div>
                          )}
                          
                          {selectValues.length > 0 && (
                            <div className="mt-2 p-2 bg-muted/30 rounded-md">
                              <Label className="text-xs font-medium">Preview:</Label>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {selectValues.map((value, index) => (
                                  <div key={index} className="px-2 py-1 bg-primary/10 rounded text-xs">
                                    {value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <div className="mb-2">
                        <Settings className="h-10 w-10 mx-auto opacity-20" />
                      </div>
                      <p className="text-sm">Select a column to edit its editor properties</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter className="border-t p-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-2">
            Cancel
          </Button>
          <Button onClick={applyChanges} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Check className="mr-2 h-4 w-4" /> Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
