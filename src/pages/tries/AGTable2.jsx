
import { useMemo, useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community'; 
import { X, Filter, Download, Table as TableIcon, Loader2 } from 'lucide-react';
import Input from "../Input";

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const Column = () => null;
Column.displayName = "AGTable.Column";

const CellRenderers = {
  tags: (params) => {
    const { value = [], emptyText = 'No tags', limit = 3 } = params;
    const tags = Array.isArray(value) ? value : [];
    const displayTags = tags.slice(0, limit);
    
    return (
      <div className="flex flex-wrap gap-1 py-1">
        {displayTags.map((tag, i) => (
          <span
            key={i}
            className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        {tags.length > limit && (
          <span className="text-slate-500 text-[10px]">+{tags.length - limit}</span>
        )}
        {tags.length === 0 && (
          <span className="text-slate-600 text-xs">{emptyText}</span>
        )}
      </div>
    );
  },

  text: (params) => {
    return (
      <span className="font-medium text-white">
        {params.value || 'N/A'}
      </span>
    );
  },

  // PERFORMANCE: Fixed height text - no clamping calculations
  clampedText: (params) => {
    const text = params.value || 'No content available';
    // Hard truncate to prevent layout measurement
    const truncated = text.length > 180 ? text.substring(0, 180) + '...' : text;
    
    return (
      <div className="text-sm text-slate-300 leading-relaxed" style={{ 
        height: '96px', 
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical'
      }}>
        {truncated}
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

const detectFieldType = (field, data) => {
  const fieldLower = field?.toLowerCase() || "";
  if (fieldLower.includes("image") || fieldLower.includes("poster") || fieldLower.includes("photo")) return "image";
  if (fieldLower.includes("date") || fieldLower.includes("release_date")) return "date";
  if (fieldLower.includes("id") || fieldLower.includes("price") || fieldLower.includes("rating") || 
      fieldLower.includes("age") || fieldLower.includes("amount") || fieldLower.includes("total")) return "number";
  if (data && data.length > 0 && Array.isArray(data[0][field])) return "array";
  return "text";
};

const buildColumnDef = (child, enableColumnFilter, rowData) => {
  if (!child || child.type !== Column) return null;

  const {
    field, header, headerName, width, minWidth = 100, maxWidth, flex, pinned,
    sortable = true, filter: customFilter, filterParams, type: columnType,
    dateFormat = "unix", render, cellRenderer: customCellRenderer,
    cellRendererType, cellRendererParams = {}, valueGetter, valueFormatter,
    cellClass = "", headerClass = "", hide, resizable = true, editable = false,
    emptyText, ...restProps
  } = child.props;

  const autoType = detectFieldType(field, rowData);
  const finalType = columnType || autoType;

  const colDef = {
    field,
    headerName: header || headerName || field,
    sortable,
    resizable,
    editable,
    hide,
    // CRITICAL: Never use autoHeight - it causes layout thrashing
    autoHeight: false,
    wrapText: false,
    ...restProps,
  };

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
          colDef.filter = "agTextColumnFilter";
          colDef.filterParams = {
            textMatcher: ({ value, filterText }) => {
              if (!value || !filterText) return false;
              try {
                const dateStr = dateFormat === "unix" 
                  ? new Date(value * 1000).toLocaleDateString("en-CA")
                  : new Date(value).toLocaleDateString("en-CA");
                return dateStr.includes(filterText.trim());
              } catch { return false; }
            },
            ...filterParams,
          };
          break;
        case "array":
          colDef.filter = "agTextColumnFilter";
          colDef.filterParams = {
            textMatcher: ({ value, filterText }) => {
              if (!value || !filterText) return false;
              const searchLower = filterText.toLowerCase();
              return Array.isArray(value) 
                ? value.some(item => String(item).toLowerCase().includes(searchLower))
                : String(value).toLowerCase().includes(searchLower);
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

  // Date formatting
  if (finalType === "date" && !valueFormatter && !render && !customCellRenderer && !cellRendererType) {
    colDef.valueFormatter = (params) => {
      if (!params.value) return emptyText || "N/A";
      try {
        const date = dateFormat === "unix" ? new Date(params.value * 1000) : new Date(params.value);
        return date.toLocaleDateString("en-CA");
      } catch { return "Invalid Date"; }
    };
  }

  if (valueFormatter) colDef.valueFormatter = valueFormatter;

  // Cell rendering
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
    colDef.valueFormatter = (params) => params.value || "";
    colDef.cellRenderer = (params) => {
      const imageSrc = params.value;
      if (!imageSrc) return <span className="text-slate-500 text-xs">No image</span>;
      return (
        <div className="flex items-center justify-center py-2">
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-20 w-auto max-w-[80px] object-cover rounded-md shadow-lg"
            style={{ contentVisibility: 'auto' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%231e293b' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='10' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      );
    };
  } else if (finalType === "array") {
    colDef.valueFormatter = (params) => {
      if (!params.value) return "";
      return Array.isArray(params.value) ? params.value.join(", ") : String(params.value);
    };
    colDef.cellRenderer = (params) => CellRenderers.tags({ 
      ...params, 
      ...cellRendererParams,
      emptyText: emptyText || "No items",
    });
  }

  if (valueGetter) colDef.valueGetter = valueGetter;

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
  }, [children, externalColumnDefs, enableColumnFilter]);

  const defaultColDef = useMemo(() => ({
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
  }), [enableColumnFilter, customDefaultColDef]);

  const onFilterTextChange = useCallback((text) => {
    setGlobalSearchText(text);
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("quickFilterText", text);
    }
  }, []);

  const onExportCSV = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `${exportFileName}.csv`,
        columnSeparator: ",",
      });
    }
  }, [exportFileName]);

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

  const handleGridReady = useCallback((params) => {
    if (onGridReady) onGridReady(params);
  }, [onGridReady]);

  const themeClass = theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine";

  // CRITICAL PERFORMANCE: Valid AG Grid v32 options only
  const memoizedGridOptions = useMemo(() => ({
    // Animation off for large datasets
    animateRows: false,
    suppressCellFocus: true,
    // Large buffer for smooth scrolling with 140px rows
    rowBuffer: 10, // Reduced from 50 - let virtualization work harder
    rowModelType: "clientSide",
    // Debounce scroll
    debounceVerticalScrollbar: true,
    // Virtualization settings
    suppressColumnVirtualisation: false,
    suppressRowVirtualisation: false,
    // Text selection
    enableCellTextSelection: true,
    // CRITICAL: Get row ID for stable rendering
    getRowId: (params) => String(params.data.id || params.data.ID || params.node.rowIndex),
    // REMOVED: suppressCellFlash (invalid in v32)
    // REMOVED: suppressBrowserResizeObserver (deprecated in v32)
    // REMOVED: blockLoadDebounceMillis (invalid)
    // REMOVED: asyncTransactionWaitMillis (invalid)
    ...gridOptions,
  }), [gridOptions]);

  return (
    <div className={`ag-table-wrapper ${className}`}>
      {/* Toolbar - Identical UI */}
      <div className="ag-table-toolbar bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/40 rounded-t-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap shadow-xl shadow-black/20">
        {enableGlobalSearch && (
          <div className="flex-1 max-w-md min-w-[240px]">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <Input
                type="text"
                value={globalSearchText}
                onChange={(e) => onFilterTextChange(e.target.value)}
                placeholder={searchPlaceholder}
              />
              {globalSearchText && (
                <button
                  type="button"
                  onClick={() => onFilterTextChange("")}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-emerald-400 transition-colors duration-150 z-10"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {(activeFilterCount > 0 || globalSearchText) && (
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-sm">
                  <Filter size={11} />
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
          {enableExport && (
            <button
              onClick={onExportCSV}
              disabled={finalRowData.length === 0 || loading}
              className="group relative flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-teal-600 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Download size={15} className="relative" />
              <span className="relative">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        className={`${themeClass} ag-table-grid rounded-b-2xl border border-t-0 border-slate-700/40 overflow-hidden shadow-2xl shadow-black/40`}
        style={{ height, width: "100%" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-900">
            <p className="mt-6 text-sm text-slate-500 font-medium flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Loading data...
            </p>
          </div>
        ) : finalRowData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-900">
            <TableIcon size={64} className="text-slate-700 mb-4" strokeWidth={1.5} />
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
            theme="legacy"
            {...memoizedGridOptions}
          />
        )}
      </div>

      {/* CSS - Identical styling with performance hints */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animation-delay-150 { animation-delay: 150ms; }
        
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
        .ag-theme-alpine-dark .ag-row {
          border-bottom: 1px solid rgba(51, 65, 85, 0.3);
          transition: background-color 0.15s ease;
          contain: layout style paint;
        }
        .ag-theme-alpine-dark .ag-row:hover {
          background-color: rgba(16, 185, 129, 0.05) !important;
        }
        .ag-theme-alpine-dark .ag-row-even {
          background-color: rgba(15, 23, 42, 0.5);
        }
        .ag-theme-alpine-dark .ag-cell {
          border-right: 1px solid rgba(51, 65, 85, 0.25);
          padding: 12px 16px;
          line-height: 1.5;
          user-select: text;
        }
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
        .ag-theme-alpine-dark .ag-icon {
          color: #64748b !important;
          transition: color 0.15s ease;
        }
        .ag-theme-alpine-dark .ag-icon:hover {
          color: #10b981 !important;
        }
        .ag-theme-alpine-dark .ag-sort-ascending-icon,
        .ag-theme-alpine-dark .ag-sort-descending-icon {
          color: #10b981 !important;
        }
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
        .ag-theme-alpine-dark .ag-checkbox-input-wrapper {
          border-color: rgba(51, 65, 85, 0.5) !important;
        }
        .ag-theme-alpine-dark .ag-checkbox-input-wrapper.ag-checked {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }
        .ag-theme-alpine-dark .ag-overlay-loading-wrapper {
          background-color: rgba(15, 23, 42, 0.95);
        }
      `}</style>
    </div>
  );
};

AGTable.Column = Column;
export default AGTable;