import { useEffect, useState } from "react";
import type { User, Role } from "../types/user";
import { userService } from "../services/userService";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userService.getAll(), userService.getAllRoles()])
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management Summary</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-arcadia-700 mt-1">{loading ? "—" : users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{loading ? "—" : activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Inactive Users</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{loading ? "—" : inactiveCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Roles Configured</p>
          <p className="text-3xl font-bold text-arcadia-700 mt-1">{loading ? "—" : roles.length}</p>
        </div>
      </div>

      {/* User table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Roles</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((r) => (
                        <span key={r.id} className="px-2 py-0.5 bg-arcadia-100 text-arcadia-700 rounded text-xs font-medium">{r.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
