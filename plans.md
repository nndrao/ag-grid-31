# AG-Grid Wrapper Component Implementation Plan

## 0. Leveraging Existing Components

### 0.1 Current Architecture Review
- The existing DataTable component will serve as the foundation for our AG-Grid wrapper
- Current implementation already includes:
  - Proper AG-Grid initialization with ModuleRegistry
  - Parameter-based theming for light/dark modes
  - Basic data rendering capabilities
  - Initial toolbar integration with the DataTable

### 0.2 Evolution Strategy
- **DataTable.tsx**: Enhance to consume state from Zustand instead of local state
- **Toolbar.tsx**: Expand with profile management and dialog access points
- **Component Structure**: Maintain current hierarchy while adding new dialog components
- **Theming**: Retain the parameter-based approach already implemented

### 0.3 Migration Path
- Transition from direct prop passing to GridOptions pattern
- Add Zustand integration without breaking existing functionality
- Incrementally implement dialogs and connect to toolbar buttons
- Gradually move state management to the Zustand store

### 0.4 UI Component and Styling Guidelines
- **Component Library**: Use only ShadCN UI components for all interface elements
- **Theming**: Utilize the default ShadCN theme system without custom CSS files
- **Styling**: Apply only Tailwind CSS classes for all styling needs
- **Custom Components**: Any custom UI components should follow ShadCN compositional patterns
- **Consistency**: Maintain visual consistency with the rest of the application
- **Dark/Light Mode**: Ensure all components properly respond to theme changes
- **No Direct CSS**: Avoid direct CSS files or inline styles; use Tailwind exclusively
- **Accessibility**: Leverage ShadCN's built-in accessibility features

## 1. Project Setup and Architecture (Phase 1)

### 1.1 State Management Setup
- Install Zustand: `npm install zustand`
- Create store directory structure:
  ```
  /src/store/
    /slices/
      gridOptionsSlice.ts
      columnSlice.ts
      columnGroupSlice.ts
      filterSlice.ts
      stylingSlice.ts
      profileSlice.ts
      datasourceSlice.ts
    index.ts (combined store)
    types.ts (shared types)
  ```

### 1.2 Core Component Structure
- Enhance existing components:
  ```
  /src/components/
    DataTable.tsx (existing AG-Grid wrapper to enhance)
    Toolbar.tsx (existing toolbar to enhance)
    /DataGrid/ (new structure)
      index.tsx (main export combining existing components)
      /dialogs/ (all dialog components)
      /utils/ (grid-specific utilities)
    /common/ (shared UI components)
  ```

### 1.3 Initial Grid Integration
- Refactor existing AG-Grid implementation to follow best practices
- Ensure typed interfaces are used consistently
- Verify parameter-based theme configuration
- Setup basic data flow structure

## 2. Toolbar Implementation (Phase 2)

### 2.1 Toolbar Component Structure
- Create Toolbar component with:
  - Profile management dropdown
  - Dialog access buttons
  - Font/sizing controls
  - Quick access functions

### 2.2 Profile Management UI
- Profile selector dropdown
- New/Save/Delete profile buttons
- Import/Export profile buttons
- Profile settings modal

### 2.3 Visualization Controls
- Font family selection for monospace option
- Font size slider (12px-18px range)
- Grid density/spacing slider
- Quick filters toggle section

## 3. Dialog System Implementation (Phase 3)

### 3.1 Dialog Framework
- Create base Dialog component with shared functionality:
  - Standard header/footer
  - Save/Cancel buttons
  - Tabs support
  - Responsive design

### 3.2 Dialog Manager
- Modal manager for handling dialog states
- Z-index management
- Dialog open/close animations
- Keyboard navigation and accessibility

### 3.3 Dialog Access Points
- From toolbar buttons
- From column header context menu
- From grid context menu
- From keyboard shortcuts

## 4. State Management Implementation (Phase 4)

### 4.1 Zustand Store Configuration
- Setup core store with slices
- Type all state interfaces
- Implement actions and reducers
- Create middleware for persistence

### 4.2 LocalStorage Integration
- Profile persistence layer
- Auto-save functionality
- Storage quota management
- Migration strategy for updates

### 4.3 State Flow Rules
1. Implement data flow from dialogs → Zustand
2. Implement application of state from Zustand → AG-Grid
3. Create extraction functionality from AG-Grid → Zustand
4. Setup profile population and flushing mechanisms

## 5. Dialog Implementation (Phase 5-8)

### 5.1 General Options Dialog
- **Access Point**: "Options" button in toolbar
- **Tabs**:
  - General: Theme, sizing, pagination settings
  - Selection: Selection mode, cell/row selection
  - Features: Toggle grid features (grouping, pivoting, etc)
  - Advanced: Performance settings, debugging options
- **Implementation Tasks**:
  - Create all form controls with validation
  - Link to gridOptionsSlice in store
  - Implement preview functionality

### 5.2 Column Customization Dialog
- **Access Point**: "Columns" button in toolbar, column header menu
- **Tabs**:
  - Visibility: Column visibility toggles with search
  - Headers: Header text, alignment, styling
  - Cells: Cell format, alignment, styling
  - Components: Cell renderer selection
- **Implementation Tasks**:
  - Build column visibility manager with search
  - Create styling controls with live preview
  - Implement column property editors
  - Build cell renderer selector

### 5.3 Calculated Columns Dialog
- **Access Point**: "Add Column" button in toolbar or column panel
- **Tabs**:
  - Definition: Name, description, data type
  - Expression: Expression editor with column references
  - Format: Value formatting options
  - Preview: Live data preview with sample rows
- **Implementation Tasks**:
  - Implement Expression Editor component
  - Create column preview mechanism
  - Build expression validation logic
  - Implement error handling and feedback

### 5.4 Column Groups Dialog
- **Access Point**: "Column Groups" button in toolbar
- **Panels**:
  - Available Columns: List of ungrouped columns
  - Groups: List of existing groups
  - Group Editor: Name and columns for selected group
- **Implementation Tasks**:
  - Create two-panel interface with drag-drop
  - Implement group CRUD operations
  - Build validation and error handling
  - Create group application to grid

### 5.5 Named Filters Dialog
- **Access Point**: "Filters" button in toolbar
- **Tabs**:
  - Filter List: CRUD for named filters
  - Expression: Filter expression editor
  - Preview: Filtered data preview
- **Implementation Tasks**:
  - Reuse Expression Editor component
  - Implement filter testing functionality
  - Create filter application mechanism
  - Build filter persistence

### 5.6 Conditional Styling Dialog
- **Access Point**: "Styling" button in toolbar
- **Tabs**:
  - Rules: Rule CRUD with conditions
  - Styling: Style selection for rules
  - Preview: Live preview of styled data
- **Implementation Tasks**:
  - Build rule editor with conditions
  - Create style selector component
  - Implement rule application to grid
  - Build preview functionality

### 5.7 Cell Flashing Dialog
- **Access Point**: "Cell Flashing" button in toolbar
- **Tabs**:
  - Rules: When cells should flash
  - Appearance: Flash colors and animation
  - Preview: Live preview with sample changes
- **Implementation Tasks**:
  - Create rule editor for change detection
  - Build animation style controls
  - Implement flash mechanisms
  - Create test/preview functionality

### 5.8 Grid Editing Dialog
- **Access Point**: "Editing" button in toolbar
- **Tabs**:
  - Permissions: Column-level edit permissions
  - Validation: Validation rules by column
  - Interaction: Edit triggers and behavior
- **Implementation Tasks**:
  - Build permission matrix UI
  - Create validation rule editor
  - Implement application to grid
  - Test editing functionality

### 5.9 Data Preprocessing Dialog
- **Access Point**: "Preprocessing" button in toolbar
- **Tabs**:
  - Transformations: Data transformation rules
  - Filters: Pre-display filtering rules
  - Preview: Before/after data preview
- **Implementation Tasks**:
  - Build transformation rule editor
  - Create filter rule editor
  - Implement preview functionality
  - Build application to data pipeline

### 5.10 Datasource Dialog
- **Access Point**: "Data Source" button in toolbar
- **Tabs**:
  - Source Type: HTTP/WebSocket selection
  - Configuration: Endpoint, auth, parameters
  - Schema: Auto-detected or manual schema
  - Preview: Connection test and data preview
- **Implementation Tasks**:
  - Create source type selector
  - Build configuration forms by type
  - Implement schema detection
  - Create connection testing functionality

## 6. Expression Editor Component (Phase 9)

### 6.1 Core Editor Implementation
- Monaco Editor integration
- Syntax highlighting for expressions
- Custom language definition
- Error highlighting

### 6.2 Autocomplete Implementation
- Column name suggestions
- Function library suggestions
- Context-aware completion
- Documentation tooltips

### 6.3 Function Library
- Mathematical functions
- String manipulation
- Date/time functions
- Conditional logic
- Array operations
- Custom function registration

### 6.4 Validation and Testing
- Syntax validation
- Runtime validation
- Test console with sample data
- Error messaging system

## 7. Profile Management System (Phase 10)

### 7.1 Profile CRUD Operations
- Create new profiles
- Update existing profiles
- Delete profiles (with protection for default)
- Duplicate profiles

### 7.2 Import/Export System
- JSON schema definition
- Export functionality with versioning
- Import with validation
- Migration for older formats

### 7.3 Profile Switching
- State flush mechanism
- Loading from LocalStorage
- Application to grid
- UI updates on profile change

### 7.4 Default Profile Management
- Create default profile on first run
- Protect default profile from deletion
- Reset to default functionality
- Factory reset option

## 8. Real-time Data Integration (Phase 11)

### 8.1 HTTP Data Source
- REST API integration
- Polling mechanism
- Authentication support
- Error handling and retry logic

### 8.2 WebSocket Integration
- Socket.IO client setup
- STOMP protocol support
- Connection management
- Automatic reconnection

### 8.3 Schema Inference
- Automatic type detection
- Schema evolution handling
- Custom type mapping
- Schema persistence

### 8.4 Real-time Updates
- Cell flashing on changes
- Delta updates processing
- Performance optimization
- Update queuing for large batches

## 9. Integration and Testing (Phase 12)

### 9.1 Component Integration
- Connect all dialogs to toolbar
- Wire up all state flows
- Ensure consistent styling
- Validate accessibility

### 9.2 Performance Testing
- Large dataset testing
- Memory usage optimization
- Render performance tuning
- State update optimization

### 9.3 Usability Testing
- Dialog flow testing
- Keyboard navigation
- Screen reader compatibility
- Mobile responsiveness

### 9.4 Documentation
- API documentation
- Usage examples
- Configuration guide
- Customization documentation

## 10. Development Workflow and Branching Strategy

### 10.1 Branching Structure
- **main**: Production-ready code, always in a deployable state
- **develop**: Integration branch for feature development
- **feature/[feature-name]**: Individual feature branches
- **release/[version]**: Release candidate branches
- **hotfix/[issue]**: Emergency fixes for production

### 10.2 Feature Branch Workflow
1. Create a feature branch for each component/feature from the develop branch
   - Example: `feature/toolbar-profiles`, `feature/column-dialog`, etc.
2. Follow the phase order from the implementation plan
3. Implement one feature at a time with its associated tests
4. Create pull requests to merge completed features into develop
5. Perform code reviews before merging

### 10.3 Merging Guidelines
- Features must have unit tests with adequate coverage
- All tests must pass before merging
- Code must be reviewed by at least one team member
- Documentation must be updated for the feature
- Manual testing of the feature must be completed

### 10.4 Release Process
1. Create a release branch from develop when a set of features is complete
2. Perform final integration testing on the release branch
3. Fix any issues directly in the release branch
4. Merge release branch to main and tag with version number
5. Merge release branch back to develop

### 10.5 Alignment with Implementation Phases
- Create feature branches that align with the phases in the implementation plan
- Group related features within the same phase when appropriate
- Prioritize core functionality before advanced features
- Consider dependencies between features when planning branch creation

This branching strategy ensures organized, incremental development while maintaining a stable codebase. It allows team members to work on different features in parallel without interference and provides clear points for integration and testing.

## Development Timeline Estimates

| Phase | Description | Estimated Effort |
|-------|-------------|------------------|
| 1 | Project Setup and Architecture | 1 week |
| 2 | Toolbar Implementation | 1 week |
| 3 | Dialog System | 1 week |
| 4 | State Management | 2 weeks |
| 5-8 | Dialog Implementation (10 dialogs) | 5 weeks |
| 9 | Expression Editor | 2 weeks |
| 10 | Profile Management | 1 week |
| 11 | Real-time Data Integration | 2 weeks |
| 12 | Integration and Testing | 2 weeks |

**Total Estimated Timeline: 17 weeks** 