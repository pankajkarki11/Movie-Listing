import { useMemo, useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const Column = () => null;
Column.displayName = "AGTable.Column";

// Auto-detect field type
const detectFieldType = (field) => {
  const fieldLower = field?.toLowerCase() || "";
  if (fieldLower.includes("date") || fieldLower.includes("time")) return "date";
  if ( fieldLower.includes("count") || fieldLower.includes("price") || fieldLower.includes("rating")) return "number";
  return "text";
};

// Build column definition from Column component props
const buildColumnDef = (child, enableColumnFilter) => {
  if (!child || child.type !== Column) return null;

  const {
    field,
    header,
    headerName,
    width,
    minWidth = 100,
    maxWidth,
    flex,
    pinned,
    sortable = true,
    filter: customFilter,
    filterParams,
    type: columnType,
    dateFormat = "iso", // 'iso', 'unix', 'custom'
    dateComparator,
    render,
    cellRenderer,
    valueGetter,
    valueFormatter,
    cellClass = "",
    headerClass = "",
    hide,
    resizable = true,
    editable = false,
    autoHeight = false,
    wrapText = false,
    ...restProps
  } = child.props;

  const autoType = detectFieldType(field);
  const finalType = columnType || autoType;

  const colDef = {
    field,
    headerName: header || headerName || field,
    sortable,
    resizable,
    editable,
    autoHeight,
    wrapText,
    hide,
    ...restProps,
  };

  // Width settings
  if (width) colDef.width = width;
  if (minWidth) colDef.minWidth = minWidth;
  if (maxWidth) colDef.maxWidth = maxWidth;
  if (flex) colDef.flex = flex;
  if (pinned) colDef.pinned = pinned;

  // Filter configuration
  if (enableColumnFilter) {
    if (customFilter !== undefined) {
      colDef.filter = customFilter;
    } else {
      switch (finalType) {
        case "date":
          colDef.filter = "agDateColumnFilter";
          colDef.filterParams = {
            comparator: dateComparator || ((filterDate, cellValue) => {
              if (!cellValue) return -1;
              
              let cellDate;
              if (dateFormat === "unix") {
                cellDate = new Date(cellValue * 1000);
              } else {
                cellDate = new Date(cellValue);
              }
              
              cellDate.setHours(0, 0, 0, 0);
              
              if (cellDate < filterDate) return -1;
              if (cellDate > filterDate) return 1;
              return 0;
            }),
            browserDatePicker: true,
            inRangeFloatingFilterDateFormat: "YYYY-MM-DD",
            ...filterParams,
          };
          break;
        case "number":
          colDef.filter = "agNumberColumnFilter";
          if (filterParams) colDef.filterParams = filterParams;
          break;
        default:
          colDef.filter = "agTextColumnFilter";
          if (filterParams) colDef.filterParams = filterParams;
      }
    }
  }

  // Value formatter for dates
  if (finalType === "date" && !valueFormatter && !render && !cellRenderer) {
    colDef.valueFormatter = (params) => {
      if (!params.value) return "N/A";
      try {
        let date;
        if (dateFormat === "unix") {
          date = new Date(params.value * 1000);
        } else {
          date = new Date(params.value);
        }
        return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
      } catch {
        return "Invalid Date";
      }
    };
  }

  // Custom value formatter
  if (valueFormatter) {
    colDef.valueFormatter = valueFormatter;
  }

  // Custom cell renderer
  if (render) {
    colDef.cellRenderer = (params) => render(params.value, params.data, params);
  } else if (cellRenderer) {
    colDef.cellRenderer = cellRenderer;
  }

  // Custom value getter
  if (valueGetter) {
    colDef.valueGetter = valueGetter;
  }

  // Cell styling
  colDef.cellClass = `text-slate-200 text-sm flex items-center ${cellClass}`;
  colDef.headerClass = `font-semibold text-xs uppercase tracking-wider text-slate-400 ${headerClass}`;

  return colDef;
};

const AGTable = ({
  children,
  data = [],
  rowData, // Alias for data
  columnDefs: externalColumnDefs, // External column defs (overrides children)
  defaultColDef: customDefaultColDef,
  enableGlobalSearch = true,
  enableColumnFilter = true,
  enableExport = true,
  exportFileName = "export",
  height = 600,
  gridOptions = {},
  onSelectionChanged,
  onGridReady,
  className = "",
  theme = "dark", // 'dark' or 'light'
  loading = false,
  emptyMessage = "No data available",
  searchPlaceholder = "Search across all columns...",
}) => {
  const gridRef = useRef();
  const [globalSearchText, setGlobalSearchText] = useState("");
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Use rowData if provided, otherwise use data
  const finalRowData = rowData || data;

  // Build column definitions from children
  const childColumnDefs = useMemo(() => {
    if (externalColumnDefs) return externalColumnDefs;
    
    const columns = [];
    const childArray = Array.isArray(children) ? children : [children];
    
    childArray.forEach((child) => {
      const colDef = buildColumnDef(child, enableColumnFilter);
      if (colDef) columns.push(colDef);
    });
    
    return columns;
  }, [children, externalColumnDefs, enableColumnFilter]);

  // Default column definitions
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: enableColumnFilter,
      floatingFilter: enableColumnFilter,
      resizable: true,
      flex: 1,
      minWidth: 100,
      filterParams: {
        debounceMs: 300,
        buttons: ["clear"],
      },
      ...customDefaultColDef,
    }),
    [enableColumnFilter, customDefaultColDef]
  );

  // Global search filter
  const onFilterTextChange = useCallback((text) => {
    setGlobalSearchText(text);
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("quickFilterText", text);
    }
  }, []);

  // Export to CSV
  const onExportCSV = useCallback(() => {
    if (gridRef.current?.api) {
      const params = {
        fileName: `${exportFileName}.csv`,
        columnSeparator: ",",
      };
      gridRef.current.api.exportDataAsCsv(params);
    }
  }, [exportFileName]);

  // Clear all filters
  const onClearFilters = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setFilterModel(null);
      setGlobalSearchText("");
      gridRef.current.api.setGridOption("quickFilterText", "");
    }
  }, []);

  // Track active filters
  const onFilterChanged = useCallback(() => {
    if (gridRef.current?.api) {
      const filterModel = gridRef.current.api.getFilterModel();
      setActiveFilterCount(Object.keys(filterModel).length);
    }
  }, []);

  // Handle grid ready
  const handleGridReady = useCallback(
    (params) => {
      if (onGridReady) {
        onGridReady(params);
      }
    },
    [onGridReady]
  );

  const themeClass = theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine";

  return (
    <div className={`ag-table-wrapper ${className}`}>
      {/* Toolbar */}
      <div className="ag-table-toolbar bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/40 rounded-t-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap shadow-xl shadow-black/20">
        {/* Left side - Global Search */}
        {enableGlobalSearch && (
          <div className="flex-1 max-w-md min-w-[240px]">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              
              <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-200 z-10">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>

              <input
                type="text"
                value={globalSearchText}
                onChange={(e) => onFilterTextChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="
                  relative w-full pl-12 pr-11 py-2.5 text-sm rounded-xl
                  bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-100 placeholder-slate-500
                  outline-none transition-all duration-200
                  focus:border-emerald-500/60 focus:bg-slate-800/80 focus:shadow-lg focus:shadow-emerald-500/10
                  hover:border-slate-600/60
                "
              />

              {globalSearchText && (
                <button
                  type="button"
                  onClick={() => onFilterTextChange("")}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-emerald-400 transition-colors duration-150 z-10"
                  aria-label="Clear search"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Active filter indicator */}
          {(activeFilterCount > 0 || globalSearchText) && (
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-sm">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
                </span>
              )}

              <button
                onClick={onClearFilters}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-200"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Export button */}
          {enableExport && (
            <button
              onClick={onExportCSV}
              disabled={finalRowData.length === 0 || loading}
              className="
                group relative flex items-center gap-2 px-4 py-2 rounded-lg
                bg-gradient-to-r from-emerald-600 to-teal-600
                hover:from-emerald-500 hover:to-teal-500
                text-white text-sm font-medium
                transition-all duration-200
                shadow-lg shadow-emerald-500/25
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-teal-600
                overflow-hidden
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="relative">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* AG Grid */}
      <div
        className={`${themeClass} ag-table-grid rounded-b-2xl border border-t-0 border-slate-700/40 overflow-hidden shadow-2xl shadow-black/40`}
        style={{ height, width: "100%" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-900">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-teal-400 animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
            </div>
            <p className="mt-6 text-sm text-slate-500 font-medium">Loading data...</p>
          </div>
        ) : finalRowData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-900">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-700 mb-4"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={finalRowData}
            columnDefs={childColumnDefs}
            defaultColDef={defaultColDef}
            onGridReady={handleGridReady}
            onSelectionChanged={onSelectionChanged}
            onFilterChanged={onFilterChanged}
            animateRows={true}
            suppressCellFocus={true}
            rowBuffer={20}
            rowModelType="clientSide"
            suppressPagination={true}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            suppressColumnVirtualisation={false}
            suppressRowVirtualisation={false}
            debounceVerticalScrollbar={true}
            theme="legacy"
            {...gridOptions}
          />
        )}
      </div>

      {/* Enhanced styling */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }

        /* AG Grid Dark Theme - Premium Design */
        .ag-theme-alpine-dark {
          --ag-background-color: #0f172a;
          --ag-header-background-color: #1e293b;
          --ag-odd-row-background-color: #0f172a;
          --ag-row-hover-color: rgba(16, 185, 129, 0.05);
          --ag-border-color: rgba(51, 65, 85, 0.4);
          --ag-header-foreground-color: #94a3b8;
          --ag-foreground-color: #cbd5e1;
          --ag-secondary-foreground-color: #64748b;
          --ag-input-border-color: rgba(51, 65, 85, 0.5);
          --ag-input-focus-border-color: #10b981;
          --ag-selected-row-background-color: rgba(16, 185, 129, 0.08);
          --ag-range-selection-border-color: #10b981;
        }

        /* Header styling */
        .ag-theme-alpine-dark .ag-header {
          border-bottom: 2px solid rgba(16, 185, 129, 0.2);
          background: linear-gradient(to bottom, #1e293b, #0f172a);
        }

        .ag-theme-alpine-dark .ag-header-cell {
          border-right: 1px solid rgba(51, 65, 85, 0.3);
          padding: 12px 16px;
        }

        .ag-theme-alpine-dark .ag-header-cell:hover {
          background-color: rgba(16, 185, 129, 0.05);
        }

        /* Row styling */
        .ag-theme-alpine-dark .ag-row {
          border-bottom: 1px solid rgba(51, 65, 85, 0.3);
          transition: background-color 0.15s ease;
        }

        .ag-theme-alpine-dark .ag-row:hover {
          background-color: rgba(16, 185, 129, 0.05) !important;
        }

        .ag-theme-alpine-dark .ag-row-even {
          background-color: rgba(15, 23, 42, 0.5);
        }

        /* Cell styling */
        .ag-theme-alpine-dark .ag-cell {
          border-right: 1px solid rgba(51, 65, 85, 0.25);
          padding: 12px 16px;
          line-height: 1.5;
        }

        /* Floating filter inputs */
        .ag-theme-alpine-dark .ag-floating-filter-input {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(51, 65, 85, 0.5) !important;
          color: #cbd5e1 !important;
          font-size: 0.8125rem !important;
          padding: 0.375rem 0.75rem !important;
          border-radius: 0.5rem !important;
          transition: all 0.2s ease !important;
        }

        .ag-theme-alpine-dark .ag-floating-filter-input:focus {
          border-color: #10b981 !important;
          background-color: rgba(15, 23, 42, 0.95) !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
          outline: none !important;
        }

        /* Icons */
        .ag-theme-alpine-dark .ag-icon {
          color: #64748b !important;
          transition: color 0.15s ease;
        }

        .ag-theme-alpine-dark .ag-icon:hover {
          color: #10b981 !important;
        }

        /* Sort indicator */
        .ag-theme-alpine-dark .ag-sort-ascending-icon,
        .ag-theme-alpine-dark .ag-sort-descending-icon {
          color: #10b981 !important;
        }

        /* Filter panel */
        .ag-theme-alpine-dark .ag-menu {
          background: linear-gradient(to bottom, #1e293b, #0f172a) !important;
          border: 1px solid rgba(51, 65, 85, 0.5) !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2) !important;
          border-radius: 0.75rem !important;
        }

        .ag-theme-alpine-dark .ag-menu-option-active {
          background-color: rgba(16, 185, 129, 0.1) !important;
        }

        .ag-theme-alpine-dark .ag-filter {
          background-color: transparent !important;
        }

        /* Date picker */
        .ag-theme-alpine-dark .ag-date-filter input {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(51, 65, 85, 0.5) !important;
          color: #cbd5e1 !important;
          border-radius: 0.5rem !important;
        }

        .ag-theme-alpine-dark .ag-date-filter input:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
        }

        /* Buttons */
        .ag-theme-alpine-dark .ag-standard-button {
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05)) !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
          color: #10b981 !important;
          border-radius: 0.5rem !important;
          transition: all 0.15s ease !important;
        }

        .ag-theme-alpine-dark .ag-standard-button:hover {
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1)) !important;
          border-color: rgba(16, 185, 129, 0.5) !important;
        }

        /* Scrollbar */
        .ag-theme-alpine-dark ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .ag-theme-alpine-dark ::-webkit-scrollbar-track {
          background: #0f172a;
          border-radius: 5px;
        }

        .ag-theme-alpine-dark ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #475569, #334155);
          border-radius: 5px;
          border: 2px solid #0f172a;
          transition: background 0.2s ease;
        }

        .ag-theme-alpine-dark ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #64748b, #475569);
        }

        /* Selection checkbox */
        .ag-theme-alpine-dark .ag-checkbox-input-wrapper {
          border-color: rgba(51, 65, 85, 0.5) !important;
        }

        .ag-theme-alpine-dark .ag-checkbox-input-wrapper.ag-checked {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }

        /* Loading overlay */
        .ag-theme-alpine-dark .ag-overlay-loading-wrapper {
          background-color: rgba(15, 23, 42, 0.95);
        }
      `}</style>
    </div>
  );
};

// Attach Column as a static property
AGTable.Column = Column;

export default AGTable;