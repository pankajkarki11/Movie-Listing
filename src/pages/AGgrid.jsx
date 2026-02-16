/**
 * Table.jsx — TanStack Table-powered component
 *
 * Features:
 *  - Built on @tanstack/react-table v8 (column defs, filtering, faceted values)
 *  - Per-column searchable toggle: set `enableColumnFilter: true/false` in column defs
 *  - Custom filter functions (pass `filterFn` in column def)
 *  - Global search support via an external globalFilter state
 *  - Slot-style sub-components: Table.Root, Table.GlobalSearch, Table.View, Table.Pagination
 *  - Polished dark-slate design with emerald accents
 *
 * Usage:
 *   const table = useReactTable({ ... })
 *   <Table.Root table={table}>
 *     <Table.GlobalSearch table={table} />
 *     <Table.View table={table} />
 *   </Table.Root>
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

// ─── Re-export TanStack hooks so consumers don't import from two places ────────
export { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender };

// ─── Context ──────────────────────────────────────────────────────────────────
const TableCtx = createContext(null);
const useTableCtx = () => useContext(TableCtx);

// ─── Helper: debounced column filter input ────────────────────────────────────
const ColumnFilterInput = ({ column }) => {
  const currentValue = column.getFilterValue() ?? "";

  return (
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
        value={currentValue}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        placeholder="Search…"
        className="
          w-full pl-7 pr-7 py-1.5 text-xs font-mono rounded-lg
          bg-slate-800/80 border text-slate-100 placeholder-slate-600
          outline-none transition-all duration-150 border-slate-700
          focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20
          hover:border-slate-600
        "
      />

      {currentValue && (
        <button
          type="button"
          onClick={() => column.setFilterValue(undefined)}
          className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-emerald-400 transition-colors duration-100"
          aria-label="Clear filter"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Table.Root — wraps the whole table in context.
 * Pass the TanStack `table` instance.
 */
const Root = ({ table, children, className = "" }) => (
  <TableCtx.Provider value={{ table }}>
    <div className={`flex flex-col gap-3 ${className}`}>{children}</div>
  </TableCtx.Provider>
);

/**
 * Table.GlobalSearch — standalone global search input.
 * Reads/writes globalFilter on the table instance.
 *
 * Usage:  <Table.GlobalSearch placeholder="Search title or overview…" />
 */
const GlobalSearch = ({ placeholder = "Search…", className = "" }) => {
  const { table } = useTableCtx();
  const value = table.getState().globalFilter ?? "";

  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        Global Search
      </span>
      <div className="relative group">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => table.setGlobalFilter(e.target.value || undefined)}
          placeholder={placeholder}
          className="h-8 w-full pl-9 pr-8 rounded-xl border border-slate-700
            bg-slate-950/70 text-sm text-slate-100 placeholder-slate-600
            outline-none ring-emerald-500/50 transition focus:ring-2 focus:border-emerald-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => table.setGlobalFilter(undefined)}
            className="absolute inset-y-0 right-2.5 flex items-center text-slate-500 hover:text-emerald-400 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </label>
  );
};

/**
 * Table.View — renders the <table> element with all rows.
 *
 * showColumnFilters: whether to render the per-column search row.
 *   Columns opt-in individually via `enableColumnFilter: true` in their def.
 */
const View = ({ showColumnFilters = true, className = "" }) => {
  const { table } = useTableCtx();

  const hasAnyFilterableColumn = table
    .getAllLeafColumns()
    .some((col) => col.getCanFilter());

  const showFilterRow = showColumnFilters && hasAnyFilterableColumn;

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-700/60 shadow-2xl shadow-black/40 ${className}`}>
      <table className="min-w-full divide-y divide-slate-700/60">

        {/* ── THEAD ───────────────────────────────────────────────────── */}
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-slate-900">
              {headerGroup.headers.map((header) => {
                const isActive = !!header.column.getFilterValue();
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className={`
                      px-5 py-3.5 text-left text-[11px] font-semibold
                      uppercase tracking-widest
                      border-r border-slate-700/50 last:border-r-0
                      transition-colors duration-150
                      ${isActive ? "text-emerald-400 bg-emerald-950/30" : "text-slate-400"}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}

                      {/* filterable badge */}
                      {header.column.getCanFilter() && (
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
                              {String(header.column.getFilterValue())}
                            </>
                          ) : "filterable"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}

          {/* ── Column filter row ──────────────────────────────────────── */}
          {showFilterRow && (
            <tr className="bg-slate-950/80 border-t border-slate-800">
              {table.getAllLeafColumns().map((column) => (
                <th key={column.id} className="px-3 py-2.5">
                  {column.getCanFilter() ? (
                    <ColumnFilterInput column={column} />
                  ) : null}
                </th>
              ))}
            </tr>
          )}
        </thead>

        {/* ── TBODY ───────────────────────────────────────────────────── */}
        <tbody className="divide-y divide-slate-800/70">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllLeafColumns().length} className="px-6 py-14 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" className="text-slate-700">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span className="text-sm">No results match your filters.</span>
                  <span className="text-xs text-slate-600">Try broadening your search terms.</span>
                </div>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-800/40 transition-colors duration-100"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                    className="px-5 py-4 whitespace-normal text-slate-300 text-sm border-r border-slate-800/60 last:border-r-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Table.ActiveFilterCount — small badge showing how many column filters are on.
 */
const ActiveFilterCount = ({ className = "" }) => {
  const { table } = useTableCtx();
  const count = table.getState().columnFilters.length;
  if (count === 0) return null;
  return (
    <span className={`text-amber-400 text-xs font-mono ${className}`}>
      · {count} column filter{count > 1 ? "s" : ""} active
    </span>
  );
};

/**
 * Table.ClearFilters — button that resets all column filters + global filter.
 */
const ClearFilters = ({ label = "Reset all", className = "" }) => {
  const { table } = useTableCtx();
  const hasFilters =
    table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;

  return (
    <button
      type="button"
      onClick={() => {
        table.resetColumnFilters();
        table.setGlobalFilter(undefined);
      }}
      disabled={!hasFilters}
      className={`h-8 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {label}
    </button>
  );
};

// ─── Named export ─────────────────────────────────────────────────────────────
const Table = { Root, GlobalSearch, View, ActiveFilterCount, ClearFilters };
export default Table;

// ─── Also export useTableSearches for backward compatibility ──────────────────
/**
 * Thin hook wrapping TanStack column filters into the old {searches, setSearch, ...} API.
 * Only needed if you're mixing old + new code.
 */
export const useTanstackColumnFilters = (tableInstance) => {
  const filters = tableInstance.getState().columnFilters;
  const searches = Object.fromEntries(filters.map((f) => [f.id, f.value]));
  const activeCount = filters.length;
  const setSearch = useCallback(
    (id, value) => tableInstance.getColumn(id)?.setFilterValue(value || undefined),
    [tableInstance],
  );
  const clearSearches = useCallback(
    () => tableInstance.resetColumnFilters(),
    [tableInstance],
  );
  return { searches, setSearch, clearSearches, activeCount };
};