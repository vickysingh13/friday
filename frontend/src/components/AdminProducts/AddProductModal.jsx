// frontend/src/components/AdminProducts/AddProductModal.jsx
import React, { useState } from "react";
import { db } from "../../firebaseClient";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AddProductModal({ onClose }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");

  async function save() {
    if (!name || !sku || !price) {
      alert("All fields required!");
      return;
    }

    try {
      await addDoc(collection(db, "products"), {
        name,
        sku,
        price: Number(price),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Product added!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save product.");
    }
  }

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h2>Add Product</h2>

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
  background: "#27ae60",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};
