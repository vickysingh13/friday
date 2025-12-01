// frontend/src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../../firebaseClient";
const auth = getAuth();

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("refiller");

  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  // LOAD USERS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ADD NEW USER
  async function createUser() {
  const emailClean = newEmail.trim();
  const passClean = newPassword; // no trim, allow spaces if needed

  // EMAIL validation: MUST contain "@"
  if (!emailClean || !emailClean.includes("@")) {
    return alert("Email must contain '@' . Example: user@xyz");
  }

  // PASSWORD validation: must not be empty
  if (!passClean || passClean.length < 1) {
    return alert("Password cannot be empty.");
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      emailClean,
      passClean
    );

    await addDoc(collection(db, "users"), {
      uid: cred.user.uid,
      email: emailClean,
      displayName: "",
      role: newRole,
    });

    alert("User created successfully.");
    setShowAdd(false);

    setNewEmail("");
    setNewPassword("");
    setNewRole("refiller");

  } catch (err) {
    console.error(err);
    alert("Firebase Error: " + err.code);
  }
}


  // UPDATE USER
  async function updateUser() {
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        displayName: editName,
        role: editRole,
      });

      alert("User updated!");
      setEditingUser(null);

    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  }

  // DELETE USER
  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      alert("User deleted.");
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  }

  return (
    <div>
      <h1>Manage Users</h1>

      <button
        onClick={() => setShowAdd(true)}
        style={addBtn}
      >
        + Add User
      </button>

      {/* USERS TABLE */}
      <table style={table}>
        <thead style={{ background: "#eee" }}>
          <tr>
            <th style={th}>Email</th>
            <th style={th}>Name</th>
            <th style={th}>Role</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={td}>{u.email}</td>
              <td style={td}>{u.displayName || "-"}</td>
              <td style={td}>{u.role}</td>

              <td style={td}>
                <button
                  style={btnSecondary}
                  onClick={() => {
                    setEditingUser(u);
                    setEditName(u.displayName || "");
                    setEditRole(u.role);
                  }}
                >
                  Edit
                </button>

                <button
                  style={btnDanger}
                  onClick={() => deleteUser(u.id)}
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD USER MODAL */}
      {showAdd && (
        <div className="modal">
          <div className="modal-box">

            <h2>Add User</h2>

            <input
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={input}
            />

            <input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={input}
            />

            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={input}
            >
              <option value="admin">Admin</option>
              <option value="refiller">Refiller</option>
            </select>

            <button style={btnPrimary} onClick={createUser}>Create</button>
            <button style={btnSecondary} onClick={() => setShowAdd(false)}>Cancel</button>

          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal">
          <div className="modal-box">

            <h2>Edit User</h2>

            <input
              placeholder="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={input}
            />

            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              style={input}
            >
              <option value="admin">Admin</option>
              <option value="refiller">Refiller</option>
            </select>

            <button style={btnPrimary} onClick={updateUser}>Save</button>
            <button style={btnSecondary} onClick={() => setEditingUser(null)}>Cancel</button>

          </div>
        </div>
      )}
    </div>
  );
}

/* UI */
const table = {
  width: "100%",
  marginTop: 20,
  borderCollapse: "collapse",
};

const th = {
  padding: 10,
  textAlign: "left",
  fontWeight: "bold",
};

const td = {
  padding: 10,
};

const btnPrimary = {
  padding: "8px 14px",
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginRight: 10,
};

const btnSecondary = {
  padding: "8px 14px",
  background: "#aaa",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginRight: 10,
};

const btnDanger = {
  padding: "8px 14px",
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const addBtn = {
  padding: "10px 16px",
  background: "#2ecc71",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginBottom: 15,
};

const input = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  marginBottom: 10,
  width: "100%",
};
