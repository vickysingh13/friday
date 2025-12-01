import React from "react";

export default function ProductTable({ products, onEdit, onDelete }) {
  return (
    <table
      style={{
        width: "100%",
        marginTop: 10,
        borderCollapse: "collapse",
        background: "#fff",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <thead style={{ background: "#f1f1f1" }}>
        <tr>
          <th style={th}>Name</th>
          <th style={th}>SKU</th>
          <th style={th}>Price</th>
          <th style={th}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {products.map((p) => (
          <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={td}>{p.name}</td>
            <td style={td}>{p.sku}</td>
            <td style={td}>₹{p.price}</td>

            <td style={td}>
              <button
                style={btnSecondary}
                onClick={() => onEdit(p)}
              >
                Edit
              </button>

              <button
                style={btnDanger}
                onClick={() => onDelete(p.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = {
  textAlign: "left",
  padding: "10px",
  fontWeight: 700,
  color: "#444",
  fontSize: 14,
};

const td = {
  padding: "10px",
  fontSize: 14,
};

const btnSecondary = {
  padding: "6px 10px",
  marginRight: 10,
  background: "#3498db",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};

const btnDanger = {
  padding: "6px 10px",
  background: "#e74c3c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};
