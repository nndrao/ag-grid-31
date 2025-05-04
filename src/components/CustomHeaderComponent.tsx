import React from 'react';
import { IHeaderParams } from 'ag-grid-community';

export interface CustomHeaderParams {
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  
  // Alignment
  textAlign?: 'left' | 'center' | 'right';
  
  // Background
  backgroundColor?: string;
  
  // Border
  borderStyle?: string;
  borderWidth?: string;
  borderColor?: string;
  borderSides?: string[];
}

export const CustomHeaderComponent: React.FC<IHeaderParams> = (props) => {
  const params = props.column.getColDef().headerComponentParams as CustomHeaderParams | undefined;
  
  // Default styles
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  };
  
  // Apply custom styles if provided
  if (params) {
    // Typography
    if (params.fontFamily) style.fontFamily = params.fontFamily;
    if (params.fontSize) style.fontSize = params.fontSize;
    if (params.fontWeight) style.fontWeight = params.fontWeight;
    if (params.fontStyle) style.fontStyle = params.fontStyle as React.CSSProperties['fontStyle'];
    if (params.textDecoration) style.textDecoration = params.textDecoration;
    if (params.color) style.color = params.color;
    
    // Alignment
    if (params.textAlign) style.textAlign = params.textAlign;
    
    // Background
    if (params.backgroundColor) style.backgroundColor = params.backgroundColor;
    
    // Border
    if (params.borderStyle && params.borderStyle !== 'none') {
      const sides = params.borderSides || ['bottom'];
      const width = params.borderWidth || '1px';
      const color = params.borderColor || '#000';
      
      sides.forEach(side => {
        const borderProp = `border${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof React.CSSProperties;
        if (width && params.borderStyle && color) {
          style[borderProp] = `${width} ${params.borderStyle} ${color}` as any;
        }
      });
    }
  }
  
  return (
    <div style={style}>
      {props.displayName}
    </div>
  );
};

export default CustomHeaderComponent;
