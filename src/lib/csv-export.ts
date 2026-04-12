export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = row.map((val) =>
      val.includes(",") || val.includes('"') || val.includes("\n")
        ? `"${val.replace(/"/g, '""')}"`
        : val
    );
    lines.push(values.join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
