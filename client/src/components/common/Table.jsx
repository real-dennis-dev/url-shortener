// Table.jsx
export const Table = ({
  headers,
  data,
  className = "",
  variant = "default",
}) => {
  const variants = {
    default: "bg-neutral-100",
    striped: "bg-neutral-100 [&>tbody>tr:nth-child(even)]:bg-neutral-200",
    bordered:
      "bg-neutral-100 border border-neutral-300 [&>thead>tr>th]:border [&>tbody>tr>td]:border",
  };

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full ${variants[variant]} ${className}`}>
        <thead className="bg-neutral-300">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-weight-bold text-neutral-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-300">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-neutral-600"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
