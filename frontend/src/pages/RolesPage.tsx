import { useEffect, useState } from "react";
import type { Role } from "../types/user";
import { userService } from "../services/userService";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService
      .getAllRoles()
      .then(setRoles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Roles & Permissions</h2>
        <button className="px-4 py-2 bg-arcadia-600 text-white text-sm font-medium rounded-lg hover:bg-arcadia-700 transition">
          + Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center py-12">Loading roles...</p>
        ) : roles.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center py-12">
            No roles configured. Click "Add Role" to create one.
          </p>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
              {role.description && (
                <p className="text-sm text-gray-500 mt-1">{role.description}</p>
              )}
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-400 uppercase mb-2">Permissions</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((perm) => (
                    <span
                      key={perm.id}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {perm.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="text-arcadia-600 hover:underline text-xs">Edit</button>
                <button className="text-red-500 hover:underline text-xs">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
