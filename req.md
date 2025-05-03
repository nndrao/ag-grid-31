
# AG-Grid Wrapper Component Requirements

## Overview
Create an independent data table component that wraps AG-Grid 33+ to provide runtime configuration, customization, and state management capabilities. The component will save settings under various profiles in local storage or as exportable JSON files.

---

## Core Requirements

### Component Structure
- Main wrapper component containing toolbar and AG-Grid
- Modular, lightweight component architecture
- ShadCN UI components and Tailwind for styling
- AG-Grid v33+ integration with parameter-based theming only (no CSS-based theming)

### Customization Dialogs
1. **General Options Dialog**: Configure various grid options for AG-Grid
2. **Column Customization Dialog**: Customize column properties, visibility, and behavior
3. **Calculated Columns Dialog**: Create calculated columns using a sophisticated expression editor
4. **Column Groups Dialog**: Create and manage column hierarchies
5. **Named Filters Dialog**: Build complex filter expressions with a sophisticated expression editor
6. **Conditional Styling Dialog**: Define rules for rows and columns styling
7. **Cell Flashing Dialog**: Configure cell flashing animation rules and triggers
8. **Grid Editing Dialog**: Define editing permissions and validation rules
9. **Data Preprocessing Dialog**: Configure data filtering and transformation rules
10. **Datasource Dialog**: Configure WebSocket (Socket.io, STOMP) or HTTP data sources with schema inference

### Toolbar Functionality
- Profile management (create, update, delete, and switch between profiles)
- Dropdown for selecting profiles
- Default profile that cannot be removed
- Buttons to access customization dialogs
- Monospace font family selection
- Font size slider
- Grid spacing/density slider

### State Management & Data Flow
- Zustand for state management
- All dialog components hydrate from the Zustand datastore
- Dialog settings save to Zustand store first, then applied to AG-Grid
- AG-Grid never directly saves state to Zustand store
- AG-Grid state is explicitly extracted when saving to profiles
- Profile switching flushes and repopulates the Zustand store

### Profile Management
- Save all settings to named profiles
- Store profiles in localStorage
- Import/export profiles as JSON files
- Always maintain a "Default" profile
- Profile switching updates all grid settings and dialog settings

### Data Flow Rules
1. All customization dialog boxes always hydrate from the Zustand datastore, never from AG-Grid
2. All settings from dialogs save first to Zustand datastore
3. Settings from Zustand datastore apply to AG-Grid
4. When saving profiles, AG-Grid state is explicitly extracted and saved to Zustand store
5. Combined settings from dialogs and extracted AG-Grid state save to profile settings
6. On app refresh, settings load from selected profile to datastore, then apply to AG-Grid
7. When switching profiles, datastore is flushed and repopulated from the selected profile

### Real-time Data Integration
- Support for WebSocket data sources (Socket.IO, STOMP protocol)
- HTTP endpoint support
- Automatic column definition inference from data samples
- Real-time data visualization with cell flashing

### Import/Export Capabilities
- Import grid settings from JSON files
- Export grid settings to JSON files
- Preservation of all customizations in exported files

### Technical Requirements

#### AG-Grid Integration Requirements
- Use AG-Grid version 33 or above
- Use parameter-based theming exclusively
- Never use CSS-based theming
- Support all core AG-Grid features (sorting, filtering, etc.)

#### UI Component Requirements
- Use ShadCN UI components for dialogs and controls
- Use Tailwind CSS for styling
- Ensure responsive design
- Clean, intuitive user interface

#### State Management Requirements
- Zustand store as single source of truth
- Separate slices for different configuration aspects
- Clear actions for state updates
- Efficient state application to grid

#### Storage Requirements
- LocalStorage for profile persistence
- JSON schema for profile data
- Efficient serialization/deserialization
- Proper error handling for storage operations

#### Performance Requirements
- Efficient state updates
- Minimal rerenders
- Optimized grid configuration
- Efficient handling of large datasets

---

## Expression Editor — Integration and Specification

To provide rich expression editing for calculated columns, conditional styling, flashing cells, formatting rules, and named queries, a modular expression editor should be included:

### Expression Editor Component
- **Component Name**: `<ExpressionEditor />`
- **Features**:
  - Syntax highlighting
  - Autocomplete suggestions (column names, functions)
  - Function library with search and examples
  - Expression validation and error messaging
  - Test console with sample input/output preview
  - Expression history or versioning (optional)

### Integration Points
- **Calculated Columns Dialog**: Use to define logic for computed fields
- **Conditional Styling Dialog**: Apply dynamic cell/row styles
- **Cell Flashing Dialog**: Define logic for when a cell should flash
- **Named Filters Dialog**: Create reusable logical filters
- **Value Formatting Tab**: Support expression-based custom formatting

### State Management
- Stored centrally in Zustand slices
- Exported as part of profile JSON structure
- Editable, testable, and persistent between sessions

### UX & Accessibility
- Clear visual feedback for expression success/error
- Accessibility via keyboard shortcuts and ARIA labels
- Helper modals, tooltips, and syntax references

---

## Column Groups Dialog — Enhanced Specification

### Available Columns Panel
- List all ungrouped columns with checkboxes
- Automatically updates when columns are grouped/ungrouped
- Columns sorted alphabetically

### Group Creation
- Input field for group name with validation
- Multi-select columns for grouping
- Create Group button enabled only with valid input and selection
- Upon creation: columns removed from available list, input cleared, AG-Grid updated

### Existing Groups Management
- Sidebar list with group name, column count, and delete button
- Selecting a group enters edit mode
- Inputs prefilled, column checkboxes updated
- Update/Cancel replace Create Group in edit mode

### Group Editing
- Add/remove columns via checkboxes
- Update AG-Grid immediately on save
- Restore original state on cancel

### Group Deletion
- Confirmation dialog
- Removes group from AG-Grid
- Columns return to available list

### State Management
- Maintain consistency between available list, groups, and AG-Grid
- Handle empty groups, duplicate columns, concurrent edits

### User Experience
- Visual feedback for actions and errors
- Tooltips and accessibility features
- Keyboard navigation supported

---

## Column Customization Interface — Enhanced Specification

### Available Columns Sidebar
- List and search available columns
- Click to edit properties

### Header Settings
- Edit header text with live preview
- Alignment controls
- Color pickers for text and background
- Font family, size, weight, style
- Border controls (all sides)

### Cell Formatting
- Alignment and color settings
- Font styling
- Border customization (all sides)
- Conditional formatting builder with rules and styles

### Value Formatting
- Built-in options: numeric, percent, currency, date/time, ticker
- Custom formatter with Excel-like syntax and live preview

### Component Configuration
- Select cell renderer (text, checkbox, date, dropdown)
- Set input type and datasource for dropdowns
- Enable/disable editing
- Define filters visually (multi-filter support)

---

## Integration and Data Flow
- All state managed via Zustand
- Dialogs hydrate from Zustand and push updates to AG-Grid
- Profiles store complete grid and column settings
- Profile switching reloads entire state
- Import/export settings as JSON

## State Slice Design
- `columnSettings`: header, formatting, components
- `groupSettings`: groups, availableColumns

---

This modular architecture ensures that the AG-Grid wrapper remains lightweight, composable, and scalable for enterprise-grade data table solutions.
