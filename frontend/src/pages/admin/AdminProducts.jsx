// frontend/src/pages/admin/AdminProducts.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../../firebaseClient";

import ProductFilterBar from "../../components/AdminProducts/ProductFilterBar";
import ProductPagination from "../../components/AdminProducts/ProductPagination";
import ProductTable from "../../components/AdminProducts/ProductTable";

import AddProductModal from "../../components/AdminProducts/AddProductModal";
import EditProductModal from "../../components/AdminProducts/EditProductModal";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => setCurrentPage(1), [search, pageSize]);

  const filtered = useMemo(() => {
    const txt = search.toLowerCase();
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(txt) ||
        (p.sku || "").toLowerCase().includes(txt)
    );
  }, [products, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", id));

      const user = JSON.parse(localStorage.getItem("sm_user") || "{}");
      await addDoc(collection(db, "admin_actions"), {
        actorEmail: user.email,
        actionType: "delete_product",
        productId: id,
        createdAt: serverTimestamp()
      });

      alert("Product deleted.");
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Manage Products</h1>

        <button
          style={{
            padding: "8px 14px",
            background: "#27ae60",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer"
          }}
          onClick={() => setShowAdd(true)}
        >
          + Add Product
        </button>
      </div>

      <ProductFilterBar search={search} setSearch={setSearch} />

      <ProductTable products={paged} onEdit={setEditProduct} onDelete={deleteProduct} />

      <ProductPagination
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} />}
      {editProduct && (
        <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} />
      )}
    </div>
  );
}
