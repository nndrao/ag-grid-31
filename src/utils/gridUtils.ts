// Generate column definitions from data sample
export const inferColumnDefs = (rowData: any[]) => {
  if (!rowData || rowData.length === 0) return [];

  // Take a sample of up to 10% of the data for inference, with a minimum of 5 items and max of 50
  const sampleSize = Math.min(50, Math.max(5, Math.ceil(rowData.length * 0.1)));
  const sample = rowData.slice(0, sampleSize);

  // Collect all unique keys from the sample data
  const allKeys = new Set<string>();
  sample.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  // Create column definitions
  return Array.from(allKeys).map(field => {
    // Analyze values across the sample to determine type
    const values = sample
      .map(item => item[field])
      .filter(val => val !== null && val !== undefined);
    
    // Skip if no valid values found
    if (values.length === 0) {
      return {
        field,
        headerName: formatHeaderName(field),
        filter: 'agTextColumnFilter',
      };
    }

    // Determine the most likely type
    const typeInfo = inferFieldType(field, values);
    
    return {
      field,
      headerName: formatHeaderName(field),
      filter: typeInfo.filter,
      sortable: true,
      resizable: true,
      ...typeInfo.colDef,
    };
  });
};

// Format header name from camelCase or snake_case to Title Case with spaces
const formatHeaderName = (field: string): string => {
  return field
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1')  // Add space before capital letters
    .replace(/^\w/, c => c.toUpperCase())  // Capitalize first letter
    .replace(/\s+/g, ' ')  // Remove extra spaces
    .trim();
};

// Infer field type and return appropriate column definition properties
const inferFieldType = (field: string, values: any[]) => {
  // Check for boolean type
  if (values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
    return {
      filter: 'agSetColumnFilter',
      colDef: {
        cellRenderer: 'agCheckboxCellRenderer',
        cellEditor: 'agCheckboxCellEditor',
        cellEditorParams: {
          useFormatter: true,
        },
      }
    };
  }

  // Check for number type
  if (values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))) {
    return {
      filter: 'agNumberColumnFilter',
      colDef: {
        type: 'numericColumn',
        ...inferNumberFormatting(field, values),
      }
    };
  }

  // Check for date type
  if (isDateField(field, values)) {
    return {
      filter: 'agDateColumnFilter',
      colDef: {
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) return '';
          try {
            const date = new Date(params.value);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch (e) {
            return params.value;
          }
        },
        cellEditor: 'agDateStringCellEditor',
        cellEditorParams: {
          useFormatter: true,
        },
        filterParams: {
          browserDatePicker: true,
        }
      }
    };
  }

  // Check for array type
  if (values.some(v => Array.isArray(v))) {
    return {
      filter: 'agTextColumnFilter',
      colDef: {
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) return '';
          if (Array.isArray(params.value)) {
            return params.value.join(', ');
          }
          return String(params.value);
        },
        cellEditor: 'agLargeTextCellEditor',
        cellEditorParams: {
          maxLength: 500,
          rows: 5,
          cols: 50
        }
      }
    };
  }

  // Check for object type
  if (values.some(v => typeof v === 'object' && v !== null && !Array.isArray(v))) {
    return {
      filter: 'agTextColumnFilter',
      colDef: {
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) return '';
          if (typeof params.value === 'object') {
            return JSON.stringify(params.value);
          }
          return String(params.value);
        },
        cellEditor: 'agLargeTextCellEditor',
        cellEditorParams: {
          maxLength: 1000,
          rows: 5,
          cols: 50
        }
      }
    };
  }

  // Check for email type
  if (isEmailField(field, values)) {
    return {
      filter: 'agTextColumnFilter',
      colDef: {
        cellRenderer: (params: any) => {
          if (!params.value) return '';
          return `<a href="mailto:${params.value}" style="color: inherit; text-decoration: underline;">${params.value}</a>`;
        }
      }
    };
  }

  // Check for URL type
  if (isUrlField(field, values)) {
    return {
      filter: 'agTextColumnFilter',
      colDef: {
        cellRenderer: (params: any) => {
          if (!params.value) return '';
          return `<a href="${params.value}" target="_blank" style="color: inherit; text-decoration: underline;">${params.value}</a>`;
        }
      }
    };
  }

  // Check for enum/set type (limited set of string values)
  if (isEnumField(values)) {
    const uniqueValues = [...new Set(values.map(v => String(v)))];
    return {
      filter: 'agSetColumnFilter',
      colDef: {
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: uniqueValues
        },
        filterParams: {
          values: uniqueValues
        }
      }
    };
  }

  // Default to text
  return {
    filter: 'agTextColumnFilter',
    colDef: {
      cellEditor: 'agTextCellEditor',
    }
  };
};

// Check if field is likely a date field
const isDateField = (field: string, values: any[]): boolean => {
  // Check field name hints
  const dateFieldHints = ['date', 'time', 'created', 'updated', 'timestamp', 'birthday', 'dob'];
  const fieldNameSuggestsDate = dateFieldHints.some(hint => 
    field.toLowerCase().includes(hint)
  );
  
  // Check if values look like dates
  const valuesLookLikeDates = values.some(v => {
    if (v instanceof Date) return true;
    
    if (typeof v === 'string') {
      // ISO date format
      if (v.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/)) return true;
      
      // MM/DD/YYYY or DD/MM/YYYY
      if (v.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) return true;
      
      // Try parsing as date and check if valid
      const parsed = new Date(v);
      return !isNaN(parsed.getTime());
    }
    
    return false;
  });
  
  return fieldNameSuggestsDate || valuesLookLikeDates;
};

// Check if field is likely an email field
const isEmailField = (field: string, values: any[]): boolean => {
  // Check field name hints
  const emailFieldHints = ['email', 'e-mail', 'mail'];
  const fieldNameSuggestsEmail = emailFieldHints.some(hint => 
    field.toLowerCase().includes(hint)
  );
  
  // Check if values look like emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valuesLookLikeEmails = values.some(v => 
    typeof v === 'string' && emailRegex.test(v)
  );
  
  return fieldNameSuggestsEmail || valuesLookLikeEmails;
};

// Check if field is likely a URL field
const isUrlField = (field: string, values: any[]): boolean => {
  // Check field name hints
  const urlFieldHints = ['url', 'link', 'website', 'site', 'web'];
  const fieldNameSuggestsUrl = urlFieldHints.some(hint => 
    field.toLowerCase().includes(hint)
  );
  
  // Check if values look like URLs
  const urlRegex = /^(https?:\/\/|www\.)[^\s$.?#].[^\s]*$/i;
  const valuesLookLikeUrls = values.some(v => 
    typeof v === 'string' && urlRegex.test(v)
  );
  
  return fieldNameSuggestsUrl || valuesLookLikeUrls;
};

// Check if field has a limited set of values (enum-like)
const isEnumField = (values: any[]): boolean => {
  const uniqueValues = new Set(values.map(v => String(v)));
  // If there are few unique values compared to total values, it's likely an enum
  return uniqueValues.size <= 10 && uniqueValues.size < values.length / 2;
};

// Infer number formatting based on field name and values
const inferNumberFormatting = (field: string, values: any[]) => {
  const fieldLower = field.toLowerCase();
  
  // Currency fields
  if (fieldLower.includes('price') || 
      fieldLower.includes('amount') || 
      fieldLower.includes('value') ||
      fieldLower.includes('cost') ||
      fieldLower.includes('salary') ||
      fieldLower.includes('budget')) {
    return {
      valueFormatter: (params: any) => {
        if (params.value === null || params.value === undefined) return '';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(params.value));
      }
    };
  }
  
  // Percentage fields
  if (fieldLower.includes('rate') || 
      fieldLower.includes('percent') || 
      fieldLower.includes('yield') ||
      fieldLower.includes('ratio')) {
    return {
      valueFormatter: (params: any) => {
        if (params.value === null || params.value === undefined) return '';
        const value = Number(params.value);
        // Check if value is already in percentage format (0-100) or decimal format (0-1)
        const divisor = Math.max(...values) > 1 ? 1 : 100;
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value / divisor);
      }
    };
  }
  
  // Default number formatting
  return {
    valueFormatter: (params: any) => {
      if (params.value === null || params.value === undefined) return '';
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
      }).format(Number(params.value));
    }
  };
};

// Default column definition settings
export const defaultColDef = {
  flex: 1,
  minWidth: 100,
  filter: true,
  enableValue: true,
  enableRowGroup: true,
  enablePivot: true,
  // Add default valueFormatter and valueParser for object data types
  valueFormatter: (params: any) => {
    if (params.value === null || params.value === undefined) {
      return '';
    }
    if (typeof params.value === 'object') {
      return JSON.stringify(params.value);
    }
    return params.value.toString();
  },
  valueParser: (params: any) => {
    if (params.newValue === null || params.newValue === undefined) {
      return null;
    }
    if (typeof params.oldValue === 'object') {
      try {
        return JSON.parse(params.newValue);
      } catch (e) {
        return params.newValue;
      }
    }
    return params.newValue;
  }
};
