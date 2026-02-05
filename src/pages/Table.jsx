

const Table = ({
   children,
    className = "",
     ...props }) => {
  return (
    <div
      className={`overflow-x-auto rounded-lg border border-gray-200  ${className}`}//overflwo-x-auto adds the horizontal scroll bar if the table is wider than container
    >
      <table
        className="min-w-full divide-y divide-gray-200 "//min-w-full makes the table take 100% of the parents width//divide y adds a line between each row between thead and tbody which seperates the title of table and body which is data
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

Table.Header = ({ children, className = "" }) => (
  <thead className="bg-gray-50 ">
    <tr className={className}>{children}</tr>
  </thead>
);

Table.HeaderCell = ({ children, className = "", width, ...props }) => (
  <th
    className={`
      px-6 py-3 text-left text-xs font-medium 
      text-gray-500 border-r border-gray-200
      uppercase tracking-wider
      ${className}
    `}
    style={{ width: width || 'auto' }}
    {...props}
  >
    {children}
   
  </th>
);

Table.Body = ({ children, className = "", ...props }) => (
  <tbody className="bg-white  divide-y divide-gray-200 ">
    {children}
  </tbody>
);

Table.Row = ({ children, className = "", hover = true, ...props }) => (
  <tr
    className={`
      ${hover ? "hover:bg-gray-50 " : ""}
      transition-colors duration-150
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
      px-6 py-4 whitespace-normal 
      text-gray-900 border-r border-gray-100
      ${className}
    `}
    style={{ width: width || 'auto' }}
    {...props}
  >
    {children}
  </td>
);

export default Table;
