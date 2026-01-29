const Table = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}
    >
      <table
        className="min-w-full divide-y divide-gray-200 table-fixed"
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

Table.Header = ({ children, className = "" }) => (
  <thead className="bg-gray-50 sticky top-0 z-10">
    <tr className={className}>{children}</tr>
  </thead>
);

Table.HeaderCell = ({ children, className = "", ...props }) => (
  <th
    className={`
      px-6 py-3 text-left text-xs font-medium 
      text-gray-500 border-r border-gray-200
      uppercase tracking-wider
      ${className}
    `}
    {...props}
  >
    {children}
  </th>
);

Table.Body = ({ children, className = "", virtualized = false, ...props }) => (
  <tbody 
    className={`bg-white ${!virtualized ? 'divide-y divide-gray-200' : ''}`}
    style={virtualized ? { display: 'block', position: 'relative' } : {}}
    {...props}
  >
    {children}
  </tbody>
);

Table.Row = ({ children, className = "", hover = true, virtualized = false, style = {}, ...props }) => (
  <tr
    className={`
      ${hover ? "hover:bg-gray-50" : ""}
      transition-colors duration-150
      ${className}
    `}
    style={virtualized ? { 
      ...style,
      display: 'table',
      width: '100%',
      tableLayout: 'fixed'
    } : style}
    {...props}
  >
    {children}
  </tr>
);

Table.Cell = ({ children, className = "", ...props }) => (
  <td
    className={`
      px-6 py-4 whitespace-normal 
      text-gray-900 border-r border-gray-100
      ${className}
    `}
    {...props}
  >
    {children}
  </td>
);

export default Table;