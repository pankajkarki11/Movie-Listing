import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from "ag-grid-community";

// No CSS imports needed - Theming API handles it!

const Table = ({
  data = [],
  columns = [],
  className = "",
  onFilterChange,
  quickFilter = "",
  disabledColumns = [],
  height = "100%",
  ...props
}) => {
  const gridRef = useRef();
  const [gridApi, setGridApi] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});

  // Custom dark theme
  const myTheme = themeQuartz.withParams({
    backgroundColor: "#0f172a",
    headerBackgroundColor: "#0b1120",
    rowHoverColor: "#1e293b",
    borderColor: "#334155",
    headerTextColor: "#94a3b8",
    textColor: "#e2e8f0",
    inputBackgroundColor: "#1e293b",
    inputBorderColor: "#334155",
    inputFocusBorderColor: "#10b981",
    accentColor: "#10b981",
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    borderRadius: 12,
    spacing: 8,
  });

  // Build AG Grid column definitions
  const columnDefs = useMemo(() => {
    return columns.map((col, index) => {
      const isSearchable = !disabledColumns.includes(index) && col.field;
      
      return {
        headerName: col.header,
        field: col.field,
        width: col.width,
        flex: col.flex,
        minWidth: col.minWidth,
        hide: col.hidden,
        cellClass: col.cellClass,
        headerClass: col.headerClass,
        filter: isSearchable ? 'agTextColumnFilter' : false,
        floatingFilter: isSearchable,
        sortable: !!col.field,
        cellRenderer: col.cellRenderer,
        valueFormatter: col.valueFormatter,
        autoHeight: col.autoHeight,
        wrapText: col.wrapText,
        ...col
      };
    });
  }, [columns, disabledColumns]);

  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
  }, []);

  // Apply quick filter (global search)
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', quickFilter);
    }
  }, [gridApi, quickFilter]);

  // Handle filter changes
  const handleFilterChanged = useCallback(() => {
    if (gridApi && onFilterChange) {
      const filterModel = gridApi.getFilterModel();
      setActiveFilters(filterModel);
      onFilterChange(filterModel);
    }
  }, [gridApi, onFilterChange]);

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <>
      {/* Filter count indicator */}
      {activeFilterCount > 0 && (
        <div className="mb-2 text-xs text-amber-400 font-mono px-1">
          {activeFilterCount} column filter{activeFilterCount > 1 ? 's' : ''} active
        </div>
      )}
      
      <div 
        className={`rounded-xl overflow-hidden border border-slate-700/60 ${className}`}
        style={{ height, width: '100%' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          theme={myTheme}
          onGridReady={onGridReady}
          onFilterChanged={handleFilterChanged}
          defaultColDef={{
            resizable: true,
            sortable: false,
            filter: false,
            floatingFilter: false,
          }}
          rowHeight={90}
          headerHeight={48}
          floatingFiltersHeight={48}
          animateRows={true}
          suppressCellFocus={false}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          {...props}
        />
      </div>
    </>
  );
};

export default Table;