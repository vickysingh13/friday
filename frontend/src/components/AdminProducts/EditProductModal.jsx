// frontend/src/components/AdminProducts/EditProductModal.jsx
import React, { useState } from "react";
import { db } from "../../firebaseClient";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function EditProductModal({ product, onClose }) {
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [price, setPrice] = useState(product.price);

  async function save() {
    try {
      await updateDoc(doc(db, "products", product.id), {
        name,
        sku,
        price: Number(price),
        updatedAt: serverTimestamp(),
      });

      alert("Product updated!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    }
  }

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h2>Edit Product</h2>

        <div style={field}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div style={field}>
          <label>SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>

        <div style={field}>
          <label>Price (₹)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button style={btnCancel} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modal = {
  width: 400,
  background: "#fff",
  padding: 20,
  borderRadius: 10,
};

const field = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 12,
};

const btnCancel = {
  padding: "8px 14px",
  background: "#777",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};

const btnPrimary = {
  padding: "8px 14px",
  background: "#3498db",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};
