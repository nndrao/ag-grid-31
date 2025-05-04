import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GridApi, ColDef } from "ag-grid-community";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { Search, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

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
      <DialogTrigger asChild>{/* children */}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
          <DialogDescription>
            Configure display and behavior for columns
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Column List Panel */}
          <div className="w-1/3 pr-4 flex flex-col h-full">
            {/* Bulk Update Mode Toggle */}
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="bulk-update-mode" 
                checked={bulkUpdateMode} 
                onCheckedChange={(checked) => {
                  setBulkUpdateMode(!!checked);
                  setSelectedColumns(new Set());
                }}
                className="border-2 border-primary bg-background"
              />
              <Label htmlFor="bulk-update-mode" className="font-medium">
                Bulk Update Mode
              </Label>
            </div>
            
            {/* Column List */}
            <div className="flex-1 flex flex-col border rounded-lg shadow-md overflow-hidden">
              {/* Search Input */}
              <div className="border-b flex items-center px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Search columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Column List with Keyboard Navigation */}
              <div 
                className="flex-1 overflow-auto"
                tabIndex={0}
                onKeyDown={handleKeyDown}
              >
                {filteredColumns.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No columns found
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredColumns.map((col) => {
                      const colId = col.colId || col.field;
                      const isSelected = !bulkUpdateMode && selectedColumn && 
                        (selectedColumn.colId === colId || selectedColumn.field === colId);
                      const isChecked = bulkUpdateMode && selectedColumns.has(colId as string);
                      
                      return (
                        <div
                          key={colId}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                            "hover:bg-accent hover:text-accent-foreground",
                            "border-l-4",
                            isSelected ? "bg-accent text-accent-foreground border-primary" : "border-transparent",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          )}
                          onClick={() => {
                            if (bulkUpdateMode) {
                              toggleColumnSelection(colId as string);
                            } else {
                              handleSelectColumn(col);
                            }
                          }}
                          tabIndex={-1}
                        >
                          {bulkUpdateMode && (
                            <Checkbox
                              className="mr-2 border-2 border-primary bg-background"
                              checked={isChecked}
                              onCheckedChange={() => toggleColumnSelection(colId as string)}
                            />
                          )}
                          <div className="flex items-center flex-1">
                            <span>{col.headerName || col.field}</span>
                            {col.modified && (
                              <div className="h-3 w-3 rounded-full bg-blue-500 ml-2" title="Modified" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Settings Panel */}
          <div className="w-2/3 pl-4 border-l flex flex-col">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid grid-cols-6 mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="cell">Cell</TabsTrigger>
                <TabsTrigger value="formatter">Formatter</TabsTrigger>
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="editors">Editors</TabsTrigger>
              </TabsList>
              
              {/* General Tab */}
              <TabsContent value="general" className="border rounded-md p-4 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="header-name">Header Name</Label>
                      <Input
                        id="header-name"
                        value={selectedColumn.headerName || ''}
                        onChange={(e) => updateColumnProperty(
                          selectedColumn.colId || selectedColumn.field || '', 
                          'headerName', 
                          e.target.value
                        )}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="width">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={selectedColumn.width || ''}
                        onChange={(e) => updateColumnProperty(
                          selectedColumn.colId || selectedColumn.field || '', 
                          'width', 
                          parseInt(e.target.value)
                        )}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={(selectedColumn.type as string) || ''}
                        onValueChange={(value) => updateColumnProperty(
                          selectedColumn.colId || selectedColumn.field || '', 
                          'type', 
                          value
                        )}
                      >
                        <SelectTrigger id="type" className="mt-1">
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
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="editable">Editable</Label>
                      <Switch
                        id="editable"
                        checked={selectedColumn.editable === true}
                        onCheckedChange={(checked) => updateColumnProperty(
                          selectedColumn.colId || selectedColumn.field || '', 
                          'editable', 
                          checked
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Select a column to edit its properties
                  </div>
                )}
              </TabsContent>
              
              {/* Header Tab */}
              <TabsContent value="header" className="border rounded-md p-4 flex-1 overflow-auto">
                {selectedColumn ? (
                  <>
                    <div className="bg-muted text-muted-foreground p-2 mb-4 text-center w-1/2 mx-auto border">
                      Header Preview
                    </div>
                    
                    {/* Typography Section */}
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="header-font-family">Font Family</Label>
                          <Select 
                            value={(selectedColumn.headerComponentParams?.fontFamily as string) || "arial"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, fontFamily: value }
                            )}
                          >
                            <SelectTrigger id="header-font-family" className="mt-1">
                              <SelectValue placeholder="Select font" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="arial">Arial</SelectItem>
                              <SelectItem value="roboto">Roboto</SelectItem>
                              <SelectItem value="inter">Inter</SelectItem>
                              <SelectItem value="monospace">Monospace</SelectItem>
                              <SelectItem value="consolas">Consolas</SelectItem>
                              <SelectItem value="courier">Courier</SelectItem>
                              <SelectItem value="monaco">Monaco</SelectItem>
                              <SelectItem value="source-code-pro">Source Code Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="header-font-size">Font Size</Label>
                          <Select 
                            value={(selectedColumn.headerComponentParams?.fontSize as string) || "14px"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, fontSize: value }
                            )}
                          >
                            <SelectTrigger id="header-font-size" className="mt-1">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10px">10px</SelectItem>
                              <SelectItem value="11px">11px</SelectItem>
                              <SelectItem value="12px">12px</SelectItem>
                              <SelectItem value="13px">13px</SelectItem>
                              <SelectItem value="14px">14px</SelectItem>
                              <SelectItem value="15px">15px</SelectItem>
                              <SelectItem value="16px">16px</SelectItem>
                              <SelectItem value="18px">18px</SelectItem>
                              <SelectItem value="20px">20px</SelectItem>
                              <SelectItem value="22px">22px</SelectItem>
                              <SelectItem value="24px">24px</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="header-font-weight">Font Weight</Label>
                          <Select 
                            value={(selectedColumn.headerComponentParams?.fontWeight as string) || "normal"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, fontWeight: value }
                            )}
                          >
                            <SelectTrigger id="header-font-weight" className="mt-1">
                              <SelectValue placeholder="Select weight" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                              <SelectItem value="lighter">Lighter</SelectItem>
                              <SelectItem value="bolder">Bolder</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="300">300</SelectItem>
                              <SelectItem value="400">400</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                              <SelectItem value="600">600</SelectItem>
                              <SelectItem value="700">700</SelectItem>
                              <SelectItem value="800">800</SelectItem>
                              <SelectItem value="900">900</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Style</Label>
                          <div className="flex space-x-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "flex-1 font-bold",
                                (selectedColumn.headerComponentParams?.fontWeight === 'bold') && "bg-accent"
                              )}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { 
                                  ...selectedColumn.headerComponentParams, 
                                  fontWeight: selectedColumn.headerComponentParams?.fontWeight === 'bold' ? 'normal' : 'bold' 
                                }
                              )}
                            >
                              B
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "flex-1 italic",
                                (selectedColumn.headerComponentParams?.fontStyle === 'italic') && "bg-accent"
                              )}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { 
                                  ...selectedColumn.headerComponentParams, 
                                  fontStyle: selectedColumn.headerComponentParams?.fontStyle === 'italic' ? 'normal' : 'italic' 
                                }
                              )}
                            >
                              I
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "flex-1 underline",
                                (selectedColumn.headerComponentParams?.textDecoration === 'underline') && "bg-accent"
                              )}
                              onClick={() => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { 
                                  ...selectedColumn.headerComponentParams, 
                                  textDecoration: selectedColumn.headerComponentParams?.textDecoration === 'underline' ? 'none' : 'underline' 
                                }
                              )}
                            >
                              U
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Colors Section */}
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label htmlFor="apply-text-color">Text Color</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="apply-text-color"
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
                                className="mr-2"
                              />
                              <Label htmlFor="apply-text-color" className="text-xs">Apply</Label>
                            </div>
                          </div>
                          <ColorPicker
                            value={(selectedColumn.headerComponentParams?.color as string) || "#000000"}
                            onChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, color: value }
                            )}
                            disabled={!selectedColumn.headerComponentParams?.color}
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label htmlFor="apply-bg-color">Background</Label>
                            <div className="flex items-center">
                              <Checkbox 
                                id="apply-bg-color"
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
                                className="mr-2"
                              />
                              <Label htmlFor="apply-bg-color" className="text-xs">Apply</Label>
                            </div>
                          </div>
                          <ColorPicker
                            value={(selectedColumn.headerComponentParams?.backgroundColor as string) || "#ffffff"}
                            onChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, backgroundColor: value }
                            )}
                            disabled={!selectedColumn.headerComponentParams?.backgroundColor}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Alignment Section */}
                    <div className="mb-6">
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "flex-1 mr-1",
                            (selectedColumn.headerComponentParams?.textAlign === 'left' || !selectedColumn.headerComponentParams?.textAlign) && "bg-accent"
                          )}
                          onClick={() => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'headerComponentParams', 
                            { ...selectedColumn.headerComponentParams, textAlign: 'left' }
                          )}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "flex-1 mx-1",
                            selectedColumn.headerComponentParams?.textAlign === 'center' && "bg-accent"
                          )}
                          onClick={() => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'headerComponentParams', 
                            { ...selectedColumn.headerComponentParams, textAlign: 'center' }
                          )}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "flex-1 ml-1",
                            selectedColumn.headerComponentParams?.textAlign === 'right' && "bg-accent"
                          )}
                          onClick={() => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'headerComponentParams', 
                            { ...selectedColumn.headerComponentParams, textAlign: 'right' }
                          )}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Borders Section */}
                    <div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="header-border-props">Border Properties</Label>
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
                              className="mr-2"
                            />
                            <Label htmlFor="apply-borders" className="text-xs">Apply Borders</Label>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="header-border-style">Style</Label>
                            <Select 
                              value={(selectedColumn.headerComponentParams?.borderStyle as string) || "none"}
                              onValueChange={(value) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { ...selectedColumn.headerComponentParams, borderStyle: value }
                              )}
                              disabled={!selectedColumn.headerComponentParams?.borderStyle}
                            >
                              <SelectTrigger id="header-border-style" className="mt-1">
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
                          
                          <div>
                            <div className="flex justify-between items-center">
                              <Label htmlFor="header-border-width">Width: {selectedColumn.headerComponentParams?.borderWidth || '1px'}</Label>
                            </div>
                            <Slider 
                              id="header-border-width"
                              min={1}
                              max={5}
                              step={1}
                              value={[parseInt((selectedColumn.headerComponentParams?.borderWidth as string)?.replace('px', '') || '1')]}
                              onValueChange={(values: number[]) => updateColumnProperty(
                                selectedColumn.colId || selectedColumn.field || '', 
                                'headerComponentParams', 
                                { ...selectedColumn.headerComponentParams, borderWidth: `${values[0]}px` }
                              )}
                              className="mt-2"
                              disabled={!selectedColumn.headerComponentParams?.borderStyle}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="header-border-color">Color</Label>
                          <ColorPicker
                            value={(selectedColumn.headerComponentParams?.borderColor as string) || "#000000"}
                            onChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, borderColor: value }
                            )}
                            disabled={!selectedColumn.headerComponentParams?.borderStyle}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="header-border-sides">Sides</Label>
                          <Select 
                            value={(selectedColumn.headerComponentParams?.borderSides as string) || "all"}
                            onValueChange={(value) => updateColumnProperty(
                              selectedColumn.colId || selectedColumn.field || '', 
                              'headerComponentParams', 
                              { ...selectedColumn.headerComponentParams, borderSides: value }
                            )}
                            disabled={!selectedColumn.headerComponentParams?.borderStyle}
                          >
                            <SelectTrigger id="header-border-sides" className="mt-1">
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
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Select a column to edit its header properties
                  </div>
                )}
              </TabsContent>
              
              {/* Cell Tab */}
              <TabsContent value="cell" className="border rounded-md p-4 flex-1 overflow-auto">
                {selectedColumn ? (
                  <>
                    <div className="bg-primary text-primary-foreground p-2 mb-4 text-center">
                      Cell Preview
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cell-font-family">Font Family</Label>
                        <Select 
                          value={(selectedColumn.cellComponentParams?.fontFamily as string) || "arial"}
                          onValueChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'cellComponentParams', 
                            { ...selectedColumn.cellComponentParams, fontFamily: value }
                          )}
                        >
                          <SelectTrigger id="cell-font-family" className="mt-1">
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="arial">Arial</SelectItem>
                            <SelectItem value="inter">Inter</SelectItem>
                            <SelectItem value="roboto">Roboto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="cell-font-size">Font Size</Label>
                        <Select 
                          value={(selectedColumn.cellComponentParams?.fontSize as string) || "14px"}
                          onValueChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'cellComponentParams', 
                            { ...selectedColumn.cellComponentParams, fontSize: value }
                          )}
                        >
                          <SelectTrigger id="cell-font-size" className="mt-1">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10px">10px</SelectItem>
                            <SelectItem value="12px">12px</SelectItem>
                            <SelectItem value="14px">14px</SelectItem>
                            <SelectItem value="16px">16px</SelectItem>
                            <SelectItem value="18px">18px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="cell-text-align">Text Align</Label>
                        <Select 
                          value={(selectedColumn.cellComponentParams?.textAlign as string) || "left"}
                          onValueChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'cellComponentParams', 
                            { ...selectedColumn.cellComponentParams, textAlign: value }
                          )}
                        >
                          <SelectTrigger id="cell-text-align" className="mt-1">
                            <SelectValue placeholder="Select alignment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="cell-text-color">Text Color</Label>
                        <ColorPicker
                          value={(selectedColumn.cellComponentParams?.color as string) || "#000000"}
                          onChange={(value) => updateColumnProperty(
                            selectedColumn.colId || selectedColumn.field || '', 
                            'cellComponentParams', 
                            { ...selectedColumn.cellComponentParams, color: value }
                          )}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Select a column to edit its cell properties
                  </div>
                )}
              </TabsContent>
              
              {/* Formatter Tab */}
              <TabsContent value="formatter" className="border rounded-md p-4 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="formatter">Formatter</Label>
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
                        <Label htmlFor="precision">Decimal Precision</Label>
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
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Select a column to edit its formatter properties
                  </div>
                )}
              </TabsContent>
              
              {/* Filter Tab */}
              <TabsContent value="filter" className="border rounded-md p-4 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="filter-type">Filter Type</Label>
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
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Select a column to edit its filter properties
                  </div>
                )}
              </TabsContent>
              
              {/* Editors Tab */}
              <TabsContent value="editors" className="border rounded-md p-4 flex-1 overflow-auto">
                {selectedColumn ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editor-type">Editor Type</Label>
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
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Select a column to edit its editor properties
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={applyChanges}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
