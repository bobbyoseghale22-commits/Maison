import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  className?: string;
}

/**
 * Generic admin data table. Each column declares its own `render`
 * function so the caller handles formatting, links, and badges without
 * the table needing to know the data shape — mirrors how the shop's
 * `ProductGrid` delegates card rendering to `ProductCard`.
 */
export function AdminTable<T>({
  columns,
  rows,
  emptyMessage = "No records found.",
  className,
}: AdminTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-3 pr-4 text-left text-label text-foreground/50 font-normal",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-16 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("py-3 pr-4", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
