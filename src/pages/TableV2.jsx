import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
export const resolvePath = (obj, path) =>
  path.split(".").reduce((acc, key) => acc?.[key], obj);

export const defaultMatch = (value, term) => {
  if (value === null || value === undefined) return false;
  const t = term.toLowerCase();
  if (Array.isArray(value))
    return value.some((v) => String(v).toLowerCase().includes(t));
  return String(value).toLowerCase().includes(t);
};

export const filterByColumnSearches = (rows, searches, filterFns = {}) => {
  const active = Object.entries(searches).filter(([, v]) => v.trim() !== "");
  if (active.length === 0) return rows;
  return rows.filter((row) =>
    active.every(([dataKey, term]) => {
      const value = resolvePath(row, dataKey);
      const fn = filterFns[dataKey] ?? defaultMatch;
      return fn(value, term);
    }),
  );
};
export const useTableSearches = () => {
  const [searches, setSearches] = useState({});
  const setSearch = useCallback(
    (dataKey, value) => setSearches((prev) => ({ ...prev, [dataKey]: value })),
    [],
  );
  const clearSearches = useCallback(() => setSearches({}), []);
  const activeCount = Object.values(searches).filter((v) => v.trim()).length;
  return { searches, setSearch, clearSearches, activeCount };
};

export const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};


const SearchCell = ({ col, value: parentValue, onSet, debounceDelay = 300 }) => {
  const base = `px-3 py-2 ${col.className ?? ""} ${col.headerClassName ?? ""}`;
  const style = { width: col.width ?? "auto" };


  const [localValue, setLocalValue] = useState(parentValue);

  useEffect(() => {
    setLocalValue(parentValue);
  }, [parentValue]);

  const debouncedValue = useDebounce(localValue, debounceDelay);

  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    onSet(col.dataKey, debouncedValue);
  }, [debouncedValue]);
  const handleClear = useCallback(() => {
    setLocalValue("");
    onSet(col.dataKey, "");
  }, [col.dataKey, onSet]);


  if (!col.dataKey || col.searchable === false) {
    return <th className={base} style={style} />;
  }


  if (col.searchType === "date") {
    return (
      <th
        className={`px-3 py-2.5 ${col.className ?? ""} ${col.headerClassName ?? ""}`}
        style={style}
      >
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={parentValue}                      
            onChange={(e) => onSet(col.dataKey, e.target.value)}
            aria-label={`Filter by ${col.header}`}
            className="
              w-full px-2 py-1.5 text-xs font-mono rounded-lg
              bg-slate-800/80 border border-slate-700 text-slate-100
              outline-none transition-all duration-150
              focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20
              hover:border-slate-600 [color-scheme:dark]
            "
          />
          {parentValue && (
            <button
              type="button"
              onClick={() => onSet(col.dataKey, "")}
              className="flex-shrink-0 text-slate-500 hover:text-emerald-400 transition-colors"
              aria-label={`Clear ${col.header} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </th>
    );
  }

 
  return (
    <th
      className={`px-3 py-2.5 ${col.className ?? ""} ${col.headerClassName ?? ""}`}
      style={style}
    >
      <div className="relative group">
        <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none
          text-slate-600 group-focus-within:text-emerald-500 transition-colors duration-150">
          <Search className="w-3 h-3" />
        </span>
        <input
          type="text"
          value={localValue}                      
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={col.searchPlaceholder ?? "Search…"}
          aria-label={`Filter by ${col.header}`}
          className="
            w-full pl-7 pr-7 py-1.5 text-xs font-mono rounded-lg
            bg-slate-800/80 border text-slate-100 placeholder-slate-600
            outline-none transition-all duration-150 border-slate-700
            focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20
            hover:border-slate-600
          "
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-2 flex items-center
              text-slate-500 hover:text-emerald-400 transition-colors duration-100"
            aria-label={`Clear ${col.header} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </th>
  );
};



const Table = ({
  columns = [],
  rows = [],
  startIndex = 0,
  searches = {},
  onSearch = () => {},
  showSearch = true,
  isEmpty = false,
  activeFilterCount = 0,
  searchDebounceMs = 300,
  className = "",
}) => {
  const hasSearchRow =
    showSearch && columns.some((col) => col.dataKey && col.searchable !== false);

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-700/60 shadow-2xl shadow-black/40 ${className}`}
    >
      <table className="min-w-full divide-y divide-slate-700/60">

    
        <thead>
          <tr className="bg-slate-900">
            {columns.map((col, ci) => (
              <th
                key={ci}
                className={`
                  px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest
                  border-r border-slate-700/50 last:border-r-0 text-slate-400
                  ${col.className ?? ""} ${col.headerClassName ?? ""}
                `}
                style={{ width: col.width ?? "auto" }}
              >
                {col.header}
              </th>
            ))}
          </tr>

          {hasSearchRow && (
            <tr className="bg-slate-950/80 border-t border-slate-800">
              {columns.map((col, ci) => (
                <SearchCell
                  key={ci}
                  col={col}
                  value={col.dataKey ? (searches[col.dataKey] ?? "") : ""}
                  onSet={onSearch}
                  debounceDelay={searchDebounceMs}
                />
              ))}
            </tr>
          )}
        </thead>


        <tbody className="divide-y divide-slate-800/70">
          {rows.map((row, ri) => (
            <tr
              key={row.id ?? ri}
              className="hover:bg-slate-800/40 transition-colors duration-100"
            >
              {columns.map((col, ci) => {
                const content = col.render
                  ? col.render(row, startIndex + ri)
                  : col.dataKey
                    ? String(resolvePath(row, col.dataKey) ?? "")
                    : null;

                return (
                  <td
                    key={ci}
                    className={`
                      px-5 py-4 whitespace-normal text-slate-300 text-sm
                      border-r border-slate-800/60 last:border-r-0
                      ${col.className ?? ""} ${col.cellClassName ?? ""}
                    `}
                    style={{ width: col.width ?? "auto" }}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}

          {isEmpty && activeFilterCount > 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-14 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" className="text-slate-700">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span className="text-sm">No results match your column filters.</span>
                  <span className="text-xs text-slate-600">Try broadening your search terms.</span>
                </div>
              </td>
            </tr>
          )}

          {isEmpty && activeFilterCount === 0 && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-14 text-center">
                <span className="text-sm text-slate-500">No data to display.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;