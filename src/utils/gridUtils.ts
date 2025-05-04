// Generate column definitions from data sample
export const inferColumnDefs = (rowData: any[]) => {
  if (!rowData || rowData.length === 0) return [];

  // Take a sample of up to 5% of the data for inference, with a minimum of 1 item
  const sampleSize = Math.max(1, Math.ceil(rowData.length * 0.05));
  const sample = rowData.slice(0, sampleSize);

  // Collect all unique keys from the sample data
  const allKeys = new Set<string>();
  sample.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  // Create column definitions
  return Array.from(allKeys).map(field => {
    // Find a non-null value for this field to determine type
    const sampleValue = sample.find(item => item[field] !== null && item[field] !== undefined)?.[field];
    const isNumber = typeof sampleValue === 'number';
    const isDate = typeof sampleValue === 'string' && 
      (sampleValue.match(/^\d{4}-\d{2}-\d{2}$/) || // YYYY-MM-DD
       sampleValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)); // ISO date

    return {
      field,
      headerName: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').trim(),
      filter: true,
      sortable: true,
      resizable: true,
      // Add number formatting for numeric fields
      ...(isNumber && {
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) return '';
          
          if (field.toLowerCase().includes('price') || 
              field.toLowerCase().includes('amount') || 
              field.toLowerCase().includes('value') ||
              field.toLowerCase().includes('cost')) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(params.value);
          }
          
          if (field.toLowerCase().includes('rate') || 
              field.toLowerCase().includes('percent') || 
              field.toLowerCase().includes('yield')) {
            return new Intl.NumberFormat('en-US', {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(params.value / 100);
          }
          
          return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2
          }).format(params.value);
        }
      }),
      // Add date formatting for date fields
      ...(isDate && {
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) return '';
          try {
            return new Date(params.value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch (e) {
            return params.value;
          }
        }
      })
    };
  });
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
