import {
  createContext,
  useContext,
  useState,
  useEffect,
  Children,
  isValidElement,
} from "react";


const TableContext = createContext({
  searches: {},
  setSearch: () => {},
});

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
    })
  );
};



export const useTableSearches = () => {
  const [searches, setSearches] = useState({});

  const setSearch = (dataKey, value) =>
    setSearches((prev) => ({ ...prev, [dataKey]: value }));

  const clearSearches = () => setSearches({});

  const activeCount = Object.values(searches).filter((v) => v.trim()).length;

  return { searches, setSearch, clearSearches, activeCount };
};


const Table = ({ children, className = "", searchState, onSearchChange, ...props }) => {
  const [internalSearches, setInternalSearches] = useState({});

  const searches = searchState?.searches ?? internalSearches;
  const setSearch = searchState?.setSearch
    ?? ((key, val) => setInternalSearches((prev) => ({ ...prev, [key]: val })));

  useEffect(() => {
    onSearchChange?.(searches);
  }, [searches]);

  return (
    <TableContext.Provider value={{ searches, setSearch }}>
      <div
        className={`overflow-x-auto rounded-xl border border-slate-700/60 shadow-2xl shadow-black/40 ${className}`}
      >
        <table className="min-w-full divide-y divide-slate-700/60" {...props}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Table.Header
// ─────────────────────────────────────────────────────────────────────────────

Table.Header = ({ children, className = "" }) => {
  const { searches, setSearch } = useContext(TableContext);

  const hasSearchRow = Children.toArray(children).some(
    (child) => isValidElement(child) && child.props.searchable && child.props.dataKey
  );

  return (
    <thead>
      
      <tr className={`bg-slate-900 ${className}`}>{children}</tr>

     
      {hasSearchRow && (
        <tr className="bg-slate-950/80 border-t border-slate-800">
          {Children.map(children, (child) => {
            if (!isValidElement(child)) return null;
            const { dataKey, searchable, className: cellClass = "", width } = child.props;

            if (!searchable || !dataKey) {
              return (
                <th
                  className={`px-3 py-2 ${cellClass}`}
                  style={{ width: width || "auto" }}
                />
              );
            }

            return (
              <th
                className={`px-3 py-2.5 ${cellClass}`}
                style={{ width: width || "auto" }}
              >
                <div className="relative group">
                  <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors duration-150">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </span>

                  <input
                    type="text"
                    value={searches[dataKey] || ""}
                    onChange={(e) => setSearch(dataKey, e.target.value)}
                    placeholder="Filter…"
                    className="
                      w-full pl-7 pr-7 py-1.5 text-xs font-mono rounded-lg
                      bg-slate-800/80 border text-slate-100 placeholder-slate-600
                      outline-none transition-all duration-150 border-slate-700
                      focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20
                      hover:border-slate-600
                    "
                  />

                  {searches[dataKey] && (
                    <button
                      type="button"
                      onClick={() => setSearch(dataKey, "")}
                      className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-emerald-400 transition-colors duration-100"
                      aria-label={`Clear ${dataKey} filter`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      )}
    </thead>
  );
};


Table.HeaderCell = ({
  children,
  className = "",
  width,
  searchable, 
  dataKey,    
  filterFn,  
  ...props
}) => {
  const { searches } = useContext(TableContext);
  const isActive = !!(searchable && dataKey && searches[dataKey]);

  return (
    <th
      className={`
        px-5 py-3.5 text-left text-[11px] font-semibold
        uppercase tracking-widest
        border-r border-slate-700/50 last:border-r-0
        transition-colors duration-150
        ${isActive ? "text-emerald-400 bg-emerald-950/30" : "text-slate-400"}
        ${className}
      `}
      style={{ width: width || "auto" }}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {searchable && (
          <span className={`
            inline-flex items-center gap-1 text-[9px] font-semibold
            normal-case tracking-normal px-1.5 py-0.5 rounded-full border
            transition-all duration-150
            ${isActive
              ? "border-emerald-500/60 text-emerald-400 bg-emerald-500/10"
              : "border-slate-700 text-slate-600 bg-slate-800/50"}
          `}>
            {isActive ? (
              <>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                {searches[dataKey]}
              </>
            ) : "filterable"}
          </span>
        )}
      </div>
    </th>
  );
};



Table.Body = ({ children, className = "", isEmpty = false, activeFilterCount = 0, ...props }) => (
  <tbody className={`divide-y divide-slate-800/70 ${className}`} {...props}>
    {children}
    {isEmpty && activeFilterCount > 0 && (
      <tr>
        <td colSpan={999} className="px-6 py-14 text-center">
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
  </tbody>
);



Table.Row = ({ children, className = "", hover = true, ...props }) => (
  <tr
    className={`
      ${hover ? "hover:bg-slate-800/40" : ""}
      transition-colors duration-100
      ${className}
    `}
    {...props}
  >
    {children}
  </tr>
);



Table.Cell = ({ children, className = "", width, ...props }) => (
  <td
    className={`
      px-5 py-4 whitespace-normal text-slate-300 text-sm
      border-r border-slate-800/60 last:border-r-0
      ${className}
    `}
    style={{ width: width || "auto" }}
    {...props}
  >
    {children}
  </td>
);



export default Table;