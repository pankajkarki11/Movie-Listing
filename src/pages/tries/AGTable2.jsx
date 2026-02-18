import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
    
    ModuleRegistry.registerModules([ AllCommunityModule ]);


const AGTable = ({
  rowData = [],
  columnDefs = [],
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
}) => {
  const gridRef = useRef();
  const [globalSearchText, setGlobalSearchText] = useState("");
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Default column definitions with filtering enabled
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
      cellClass: "text-slate-300 text-sm flex items-center",
      headerClass: "font-semibold text-xs uppercase tracking-wider text-slate-400",
      ...customDefaultColDef,
    }),
    [enableColumnFilter, customDefaultColDef]
  );

  // Enhanced column definitions with smart defaults and date search fix
  const enhancedColumnDefs = useMemo(() => {
    return columnDefs.map((col) => {
      const enhanced = { ...col };

      // Auto-detect and set filter types if not specified
      if (col.filter === undefined && enableColumnFilter && col.field) {
        if (col.field.includes('date') || col.field.includes('time')) {
          enhanced.filter = 'agDateColumnFilter';
          // Add custom date filter parameters for better UX
          enhanced.filterParams = {
            ...enhanced.filterParams,
            comparator: (filterDate, cellValue) => {
              if (!cellValue) return -1;
              
              // Convert Unix timestamp to Date object
              const cellDate = new Date(cellValue * 1000);
              cellDate.setHours(0, 0, 0, 0);
              
              // Compare dates
              if (cellDate < filterDate) return -1;
              if (cellDate > filterDate) return 1;
              return 0;
            },
            // Allow typing in YYYY-MM-DD format
            browserDatePicker: true,
            inRangeFloatingFilterDateFormat: 'YYYY-MM-DD',
          };
        } else if (col.field === 'id' || col.field.includes('count') || col.field.includes('price')) {
          enhanced.filter = 'agNumberColumnFilter';
        } else {
          enhanced.filter = 'agTextColumnFilter';
        }
      }

      return enhanced;
    });
  }, [columnDefs, enableColumnFilter]);

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
        processCellCallback: (params) => {
          if (Array.isArray(params.value)) {
            return params.value.join("; ");
          }
          if (params.column.getColId() === "release_date" && params.value) {
            return new Date(params.value * 1000).toLocaleDateString("en-CA");
          }
          return params.value;
        },
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
      // Add custom CSS classes to AG Grid elements
      const gridApi = params.api;
      
      // Style the header cells
      const headerCells = document.querySelectorAll('.ag-header-cell');
      headerCells.forEach(cell => {
        cell.classList.add('border-r', 'border-slate-700/50');
      });

      // Style the rows
      const rows = document.querySelectorAll('.ag-row');
      rows.forEach(row => {
        row.classList.add('border-b', 'border-slate-700/70', 'hover:bg-slate-800/50', 'transition-colors', 'duration-150');
      });

      // Style the cells
      const cells = document.querySelectorAll('.ag-cell');
      cells.forEach(cell => {
        cell.classList.add('border-r', 'border-slate-700/60');
      });

      if (onGridReady) {
        onGridReady(params);
      }
    },
    [onGridReady]
  );

  return (
    <div className={`ag-table-container ${className}`}>
      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-700/60 rounded-t-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Left side - Global Search */}
        {enableGlobalSearch && (
          <div className="flex-1 max-w-md min-w-[200px]">
            <div className="relative group">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors duration-150">
                <svg
                  width="14"
                  height="14"
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
                placeholder="Search across all columns..."
                className="
                  w-full pl-10 pr-10 py-2 text-sm rounded-lg
                  bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-600
                  outline-none transition-all duration-150
                  focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20
                  hover:border-slate-600
                "
              />

              {globalSearchText && (
                <button
                  type="button"
                  onClick={() => onFilterTextChange("")}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-emerald-400 transition-colors duration-100"
                  aria-label="Clear global search"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active filter count */}
          {(activeFilterCount > 0 || globalSearchText) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    {activeFilterCount} column filter{activeFilterCount !== 1 ? "s" : ""}
                  </span>
                )}
              </span>

              <button
                onClick={onClearFilters}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-150"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Export button */}
          {enableExport && (
            <button
              onClick={onExportCSV}
              disabled={rowData.length === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-150 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* AG Grid - with virtualization enabled */}
      <div
        className="ag-theme-alpine-dark rounded-b-xl border border-t-0 border-slate-700/60 overflow-hidden"
        style={{ height, width: "100%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={enhancedColumnDefs}
          defaultColDef={defaultColDef}
          onGridReady={handleGridReady}
          onSelectionChanged={onSelectionChanged}
          onFilterChanged={onFilterChanged}
          animateRows={true}
          suppressCellFocus={true}
          // Virtualization settings
          rowBuffer={20} // Number of rows to render outside of viewport
          rowModelType="clientSide"
          suppressPagination={true} // Disable pagination
          enableCellTextSelection={true}
          ensureDomOrder={true}
          suppressColumnVirtualisation={false} // Enable column virtualization
          suppressRowVirtualisation={false} // Enable row virtualization
          // Performance settings
          debounceVerticalScrollbar={true}
          throttleScroll={true}
          theme="legacy"
          {...gridOptions}
        />
      </div>

      {/* Add Tailwind classes to AG Grid elements via style injection */}
      <style>{`
        /* Override AG Grid default styles with Tailwind-compatible colors */
        .ag-theme-alpine-dark {
          --ag-background-color: #0f172a;
          --ag-header-background-color: #1e293b;
          --ag-odd-row-background-color: #0f172a;
          --ag-row-hover-color: #1e293b;
          --ag-border-color: #334155;
          --ag-header-foreground-color: #94a3b8;
          --ag-foreground-color: #cbd5e1;
          --ag-secondary-foreground-color: #64748b;
          --ag-input-border-color: #334155;
          --ag-input-focus-border-color: #10b981;
          --ag-selected-row-background-color: rgba(16, 185, 129, 0.1);
        }

        /* Floating filter input styling */
        .ag-theme-alpine-dark .ag-floating-filter-input {
          background-color: #0f172a !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
          font-size: 0.75rem !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.375rem !important;
        }

        .ag-theme-alpine-dark .ag-floating-filter-input:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
          outline: none !important;
        }

        /* Date picker styling */
        .ag-theme-alpine-dark .ag-date-filter input {
          background-color: #0f172a !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
        }

        .ag-theme-alpine-dark .ag-date-filter input:focus {
          border-color: #10b981 !important;
        }

        /* Icon colors */
        .ag-theme-alpine-dark .ag-icon {
          color: #64748b !important;
        }

        .ag-theme-alpine-dark .ag-icon:hover {
          color: #10b981 !important;
        }

        /* Menu styling */
        .ag-theme-alpine-dark .ag-menu {
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }

        .ag-theme-alpine-dark .ag-menu-option-active {
          background-color: rgba(16, 185, 129, 0.1) !important;
        }

        /* Filter panel */
        .ag-theme-alpine-dark .ag-filter {
          background-color: #1e293b !important;
        }

        .ag-theme-alpine-dark .ag-filter-apply-panel {
          border-top-color: #334155 !important;
        }

        /* Ensure text colors */
        .ag-theme-alpine-dark .ag-header-cell-text {
          color: #94a3b8 !important;
        }

        .ag-theme-alpine-dark .ag-cell {
          color: #cbd5e1 !important;
        }

        /* Scrollbar styling */
        .ag-theme-alpine-dark ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .ag-theme-alpine-dark ::-webkit-scrollbar-track {
          background: #1e293b;
        }

        .ag-theme-alpine-dark ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .ag-theme-alpine-dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default AGTable;