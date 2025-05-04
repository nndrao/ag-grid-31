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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DirectColorPicker } from "@/components/ui/direct-color-picker";
import { Slider } from "@/components/ui/slider";
import { Search, Settings, Check, ChevronRight } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("general");

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
      setActiveTab("general");
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
        
        <div className="flex h-[600px] overflow-hidden">
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
                      className={`flex items-center justify-between p-2 rounded cursor-pointer
                        ${(selectedColumn?.colId === column.colId || selectedColumn?.field === column.field) ? 'bg-muted' : 'hover:bg-muted/50'}`}
                      onClick={() => {
                        if (bulkUpdateMode) {
                          toggleColumnSelection(column.colId || column.field || '');
                        } else {
                          handleSelectColumn(column);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {bulkUpdateMode && (
                          <Checkbox 
                            checked={!!selectedColumns.has(column.colId || column.field || '')}
                            onCheckedChange={() => {
                              toggleColumnSelection(column.colId || column.field || '');
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {column.headerName || column.field}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {column.field}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {column.modified && (
                          <div className="w-2 h-2 rounded-full bg-primary mr-2" title="Modified" />
                        )}
                        {(selectedColumn?.colId === column.colId || selectedColumn?.field === column.field) && !bulkUpdateMode && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">No columns found</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Settings Panel */}
          <div className="w-3/4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="w-full justify-start px-4 border-b rounded-none">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="cell">Cell</TabsTrigger>
                <TabsTrigger value="formatter">Formatter</TabsTrigger>
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="editors">Editors</TabsTrigger>
              </TabsList>
              {/* General Tab */}
              <TabsContent value="general" className="p-0 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-muted/50 rounded-md p-2 mb-2 text-center text-sm">
                      <div className="font-medium">
                        Field: <span className="font-mono">{selectedColumn.field}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="header-name" className="mb-1.5">Header Name</Label>
                        <Input
                          id="header-name"
                          value={selectedColumn.headerName || ''}
                          onChange={(e) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'headerName', 
                            e.target.value
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="width" className="mb-1.5">Width</Label>
                          <Input
                            id="width"
                            type="number"
                            value={selectedColumn.width || ''}
                            onChange={(e) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'width', 
                              parseInt(e.target.value)
                            )}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="type" className="mb-1.5">Type</Label>
                          <Select
                            value={(selectedColumn.type as string) || 'default'}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'type', 
                              value === 'default' ? undefined : value
                            )}
                          >
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                          <Label htmlFor="editable" className="mb-1.5">Editable</Label>
                          <Switch
                            id="editable"
                            checked={!!selectedColumn.editable}
                            onCheckedChange={(checked) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'editable', 
                              checked
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                          <Label htmlFor="resizable" className="mb-1.5">Resizable</Label>
                          <Switch
                            id="resizable"
                            checked={!!selectedColumn.resizable}
                            onCheckedChange={(checked) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'resizable', 
                              checked
                            )}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="pinned" className="mb-1.5">Pinned</Label>
                        <Select
                          value={(selectedColumn.pinned as string) || 'none'}
                          onValueChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'pinned', 
                            value === 'none' ? null : value
                          )}
                        >
                          <SelectTrigger id="pinned">
                            <SelectValue placeholder="Not pinned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not pinned</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center py-8">
                    <div>
                      <div className="mb-2">
                        <Settings className="h-10 w-10 mx-auto opacity-20" />
                      </div>
                      <p className="text-sm">Select a column to edit its properties</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Header Tab */}
              <TabsContent value="header" className="p-0 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-muted/50 rounded-md p-2 mb-2 text-center text-sm">
                      <div className="font-medium">
                        Header Preview
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <Label htmlFor="header-font-family" className="mb-1.5">Font Family</Label>
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
                          <Label htmlFor="header-font-size" className="mb-1.5">Font Size</Label>
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
                          <Label htmlFor="header-font-weight" className="mb-1.5">Font Weight</Label>
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
                          <Label htmlFor="header-text-style" className="mb-1.5">Text Style</Label>
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
                            <Label htmlFor="header-text-color" className="mb-1.5">Text Color</Label>
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
                            <Label htmlFor="header-bg-color" className="mb-1.5">Background</Label>
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
                          <Label htmlFor="header-border-style" className="mb-1.5">Style</Label>
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
                          <Label htmlFor="header-border-sides" className="mb-1.5">Sides</Label>
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
                          <Label htmlFor="header-border-width" className="mb-1.5">Width: {selectedColumn.headerComponentParams?.borderWidth || '1px'}</Label>
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
                            <Label htmlFor="header-border-color" className="mb-1.5">Color</Label>
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
                          <Label htmlFor="cell-font-family" className="mb-1.5">Font Family</Label>
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
                          <Label htmlFor="cell-font-size" className="mb-1.5">Font Size</Label>
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
                          <Label htmlFor="cell-font-weight" className="mb-1.5">Font Weight</Label>
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
                          <Label htmlFor="cell-text-style" className="mb-1.5">Text Style</Label>
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
                            <Label htmlFor="cell-text-color" className="mb-1.5">Text Color</Label>
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
                            <Label htmlFor="cell-bg-color" className="mb-1.5">Background</Label>
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
                          <Label htmlFor="cell-border-style" className="mb-1.5">Style</Label>
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
                          <Label htmlFor="cell-border-sides" className="mb-1.5">Sides</Label>
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
                          <Label htmlFor="cell-border-width" className="mb-1.5">Width: {selectedColumn.cellComponentParams?.borderWidth || '1px'}</Label>
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
                            <Label htmlFor="cell-border-color" className="mb-1.5">Color</Label>
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
                        <Label htmlFor="formatter" className="mb-1.5">Formatter Type</Label>
                        <Select
                          value={(selectedColumn.type as string) || 'none'}
                          onValueChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'type', 
                            value === 'none' ? undefined : value
                          )}
                        >
                          <SelectTrigger id="formatter">
                            <SelectValue placeholder="Select formatter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedColumn.type === 'number' && (
                        <div>
                          <Label htmlFor="precision" className="mb-1.5">Decimal Precision</Label>
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
                      <div>
                        <Label htmlFor="filter-type" className="mb-1.5">Filter Type</Label>
                        <Select
                          value={selectedColumn.filterType || 'auto'}
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
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="editor-type" className="mb-1.5">Editor Type</Label>
                        <Select
                          value={selectedColumn.editable ? 'default' : 'none'}
                          onValueChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'editable', 
                            value !== 'none'
                          )}
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
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={applyChanges}>
            <Check className="mr-2 h-4 w-4" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
