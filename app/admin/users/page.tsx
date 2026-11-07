"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // মডাল স্টেট
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBalance, setEditBalance] = useState("");
  const [editTurnover, setEditTurnover] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const handleToggleBlock = async (user: any) => {
    const newStatus = user.account_status === "active" ? "blocked" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: newStatus })
      .eq("id", user.id);

    if (!error) {
      alert(`User ${newStatus === "blocked" ? "Blocked" : "Unblocked"} Successfully!`);
      fetchUsers(); // Refresh list
    }
  };

  const handleResetPassword = async (user: any) => {
    if (!confirm("Are you sure you want to reset this user's transaction password?")) return;

    const { error } = await supabase
      .from("profiles")
      .update({ transaction_password: null })
      .eq("id", user.id);

    if (!error) {
      alert("Transaction Password Reset Successfully!");
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditBalance(user.balance.toString());
    setEditTurnover(user.total_required_turnover.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        balance: Number(editBalance),
        total_required_turnover: Number(editTurnover),
      })
      .eq("id", selectedUser.id);

    if (!error) {
      alert("User details updated successfully!");
      setIsEditModalOpen(false);
      fetchUsers();
    } else {
      alert("Error updating: " + error.message);
    }
  };

  // সার্চ ফিল্টার
  const filteredUsers = users.filter(
    (u) =>
      u.game_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mobile?.includes(searchTerm)
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading users...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* হেডার এবং সার্চ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all registered users and their balances.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by Game ID or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-blue-500"
          />
          <button onClick={fetchUsers} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
            Refresh
          </button>
        </div>
      </div>

      {/* ইউজার টেবিল */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Game ID / Mobile</th>
                <th className="p-4 font-semibold">Balance (৳)</th>
                <th className="p-4 font-semibold">Bonus (৳)</th>
                <th className="p-4 font-semibold">Turnover (Req/Comp)</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{user.game_id || "N/A"}</div>
                      <div className="text-xs text-gray-500">{user.mobile}</div>
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      ৳{Number(user.balance).toLocaleString()}
                    </td>
                    <td className="p-4 text-blue-600">
                      ৳{Number(user.bonus_balance || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs">
                      <div className="text-gray-500">Req: ৳{Number(user.total_required_turnover).toLocaleString()}</div>
                      <div className="text-green-500">Comp: ৳{Number(user.total_completed_turnover).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        user.account_status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {user.account_status?.toUpperCase() || "ACTIVE"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                        >
                          Edit Data
                        </button>
                        <button 
                          onClick={() => handleToggleBlock(user)}
                          className={`${
                            user.account_status === "active" 
                              ? "bg-red-100 hover:bg-red-200 text-red-700" 
                              : "bg-green-100 hover:bg-green-200 text-green-700"
                          } px-3 py-1.5 rounded text-xs font-bold transition-colors`}
                        >
                          {user.account_status === "active" ? "Block" : "Unblock"}
                        </button>
                        <button 
                          onClick={() => handleResetPassword(user)}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                        >
                          Reset Pass
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User: {selectedUser.game_id}</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Main Balance (৳)</label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Required Turnover (৳)</label>
                <input
                  type="number"
                  value={editTurnover}
                  onChange={(e) => setEditTurnover(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
