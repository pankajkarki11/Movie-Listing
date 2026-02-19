import { useMemo, useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const Column = () => null;
Column.displayName = "AGTable.Column";

// Built-in cell renderers
const CellRenderers = {
  image: (params) => {
    const { value, data, imageField = 'poster', titleField = 'title', idField = 'id' } = params;
    const imageSrc = imageField ? data[imageField] : value;
    const title = titleField ? data[titleField] : '';
    const id = idField ? data[idField] : '';
    
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <div className="h-20 w-14 overflow-hidden rounded-md bg-slate-800 shadow-lg">
          <img
            src={imageSrc}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='80' viewBox='0 0 56 80'%3E%3Crect fill='%231e293b' width='56' height='80'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='10' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
        {id && (
          <span className="text-[9px] text-slate-500 font-mono">
            #{id}
          </span>
        )}
      </div>
    );
  },

  tags: (params) => {
    const { value = [], emptyText = 'No tags', tagClassName = '' } = params;
    const tags = Array.isArray(value) ? value : [];
    
    return (
      <div className="flex flex-wrap gap-1 py-1">
        {tags.map((tag, i) => (
          <span
            key={i}
            className={tagClassName || "bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap"}
          >
            {tag}
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-slate-600 text-xs">{emptyText}</span>
        )}
      </div>
    );
  },

  text: (params) => {
    const { value, emptyText = 'N/A', className = '' } = params;
    return (
      <span className={className || "font-medium text-white"}>
        {value || emptyText}
      </span>
    );
  },

  clampedText: (params) => {
    const { value, emptyText = 'No content available', lines = 3 } = params;
    return (
      <div className={`line-clamp-${lines}`}>
        {value || emptyText}
      </div>
    );
  },

  rowNumber: (params) => {
    return (
      <span className="font-mono text-slate-400">
        {params.node.rowIndex + 1}
      </span>
    );
  },
};

// Auto-detect field type with enhanced logic
const detectFieldType = (field, data) => {
  const fieldLower = field?.toLowerCase() || "";
  
  // Image detection
  if (fieldLower.includes("image") || fieldLower.includes("poster") || 
      fieldLower.includes("photo") || fieldLower.includes("picture") || 
      fieldLower.includes("avatar") || fieldLower.includes("thumbnail")) {
    return "image";
  }
  
  // Date detection
  if (fieldLower.includes("date") || fieldLower.includes("time") || fieldLower.includes("created") || fieldLower.includes("updated")) {
    return "date";
  }
  
  // Number detection
  if (fieldLower.includes("count") || fieldLower.includes("price") || fieldLower.includes("rating") || 
      fieldLower.includes("age") || fieldLower.includes("amount") || fieldLower.includes("total")) {
    return "number";
  }
  
  // Array detection (for tags/badges)
  if (data && data.length > 0) {
    const sampleValue = data[0][field];
    if (Array.isArray(sampleValue)) {
      return "array";
    }
  }
  
  return "text";
};

// Build column definition from Column component props
const buildColumnDef = (child, enableColumnFilter, rowData) => {
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
    dateFormat = "unix", // 'iso', 'unix', 'custom'
    dateComparator,
    render,
    cellRenderer: customCellRenderer,
    cellRendererType, // 'image', 'tags', 'text', 'clampedText', 'rowNumber'
    cellRendererParams = {},
    valueGetter,
    valueFormatter,
    cellClass = "",
    headerClass = "",
    hide,
    resizable = true,
    editable = false,
    autoHeight = false,
    wrapText = false,
    emptyText,
    ...restProps
  } = child.props;


  const autoType = detectFieldType(field, rowData);
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

 
  if (width) colDef.width = width;
  if (minWidth) colDef.minWidth = minWidth;
  if (maxWidth) colDef.maxWidth = maxWidth;
  if (flex) colDef.flex = flex;
  if (pinned) colDef.pinned = pinned;

 
  if (enableColumnFilter) {
    if (customFilter !== undefined) {
      colDef.filter = customFilter;
    } else {
      switch (finalType) {
        case "date":
          
          colDef.filter = "agTextColumnFilter";
          colDef.filterParams = {
            textMatcher: ({ filterOption, value, filterText }) => {
              if (!value || !filterText) return false;
              
             
              let dateStr;
              try {
                if (dateFormat === "unix") {
                  dateStr = new Date(value * 1000).toLocaleDateString("en-CA");
                } else {
                  dateStr = new Date(value).toLocaleDateString("en-CA");
                }
              } catch {
                return false;
              }
              
         
              const normalizedFilter = filterText.trim().toLowerCase();
              const normalizedDate = dateStr.toLowerCase();
              
           
              return normalizedDate.startsWith(normalizedFilter) || 
                     normalizedDate.includes(normalizedFilter);
            },
            ...filterParams,
          };
          break;
        case "number":
          colDef.filter = "agNumberColumnFilter";
          if (filterParams) colDef.filterParams = filterParams;
          break;
        case "array":
        
          colDef.filter = "agTextColumnFilter";
          colDef.filterParams = {
            textMatcher: ({ filterOption, value, filterText }) => {
              if (!value || !filterText) return false;
              
              // Handle array values
              if (Array.isArray(value)) {
                return value.some(item => 
                  String(item).toLowerCase().includes(filterText.toLowerCase())
                );
              }
              
      
              return String(value).toLowerCase().includes(filterText.toLowerCase());
            },
            ...filterParams,
          };
          break;
        default:
          colDef.filter = "agTextColumnFilter";
          if (filterParams) colDef.filterParams = filterParams;
      }
    }
  }


  if (finalType === "date" && !valueFormatter && !render && !customCellRenderer && !cellRendererType) {
    colDef.valueFormatter = (params) => {
      if (!params.value) return emptyText || "N/A";
      try {
        let date;
        if (dateFormat === "unix") {
          date = new Date(params.value * 1000);
        } else {
          date = new Date(params.value);
        }
        return date.toLocaleDateString("en-CA"); 
      } catch {
        return "Invalid Date";
      }
    };
  }


  if (valueFormatter) {
    colDef.valueFormatter = valueFormatter;
  }


  if (render) {
    colDef.cellRenderer = (params) => render(params.value, params.data, params);
  } else if (cellRendererType && CellRenderers[cellRendererType]) {
    colDef.cellRenderer = (params) => CellRenderers[cellRendererType]({ 
      ...params, 
      ...cellRendererParams,
      emptyText: emptyText || cellRendererParams.emptyText,
    });
  } else if (customCellRenderer) {
    colDef.cellRenderer = customCellRenderer;
  } else if (finalType === "image") {
    
    colDef.cellRenderer = (params) => {
      const imageSrc = params.value;
      if (!imageSrc) return <span className="text-slate-500 text-xs">No image</span>;
      
      return (
        <div className="flex items-center justify-center py-2">
          <img
            src={imageSrc}
            alt={params.data[field] || "Image"}
            loading="lazy"
            className="h-20 w-auto max-w-[80px] object-cover rounded-md shadow-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%231e293b' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='10' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      );
    };
  } else if (finalType === "array") {

    colDef.cellRenderer = (params) => CellRenderers.tags({ 
      ...params, 
      emptyText: emptyText || "No items",
    });
  }


  if (valueGetter) {
    colDef.valueGetter = valueGetter;
  }

 

  const defaultCellClass = finalType === "date" 
    ? "text-slate-400 font-mono text-sm flex items-center"
    : "text-slate-200 text-sm flex items-center";
  
  colDef.cellClass = `${defaultCellClass} ${cellClass}`;
  colDef.headerClass = `font-semibold text-xs uppercase tracking-wider text-slate-400 ${headerClass}`;

  return colDef;
};

const AGTable = ({
  children,
  data = [],
  rowData, 
  columnDefs: externalColumnDefs, 
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
  theme = "dark", 
  loading = false,
  emptyMessage = "No data available",
  searchPlaceholder = "Search across all columns...",
}) => {
  const gridRef = useRef();
  const [globalSearchText, setGlobalSearchText] = useState("");
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  
  const finalRowData = rowData || data;


  const childColumnDefs = useMemo(() => {
    if (externalColumnDefs) return externalColumnDefs;
    
    const columns = [];
    const childArray = Array.isArray(children) ? children : [children];
    
    childArray.forEach((child) => {
      const colDef = buildColumnDef(child, enableColumnFilter, finalRowData);
      if (colDef) columns.push(colDef);
    });
    
    return columns;
  }, [children, externalColumnDefs, enableColumnFilter, finalRowData]);


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


  const onFilterTextChange = useCallback((text) => {
    setGlobalSearchText(text);
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("quickFilterText", text);
    }
  }, []);


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


  const onFilterChanged = useCallback(() => {
    if (gridRef.current?.api) {
      const filterModel = gridRef.current.api.getFilterModel();
      setActiveFilterCount(Object.keys(filterModel).length);
    }
  }, []);


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

AGTable.Column = Column;

export default AGTable;