import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function Tabless() {
  const columnDefs = [
    { field: "name" },
    { field: "age" },
    { field: "city" }
  ];

  const rowData = [
    { name: "John", age: 25, city: "New York" },
    { name: "Anna", age: 30, city: "London" },
    { name: "Mike", age: 35, city: "Paris" }
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: 400 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          filter: "agTextColumnFilter",
          floatingFilter: true
        }}
      />
    </div>
  );
}
