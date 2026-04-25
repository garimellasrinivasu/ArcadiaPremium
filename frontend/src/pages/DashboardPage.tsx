export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-arcadia-700 mt-1">—</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Active Roles</p>
          <p className="text-3xl font-bold text-arcadia-700 mt-1">—</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Permissions</p>
          <p className="text-3xl font-bold text-arcadia-700 mt-1">—</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to ArcadiaPremium</h3>
        <p className="text-gray-500">
          Use the sidebar to manage users, roles, and permissions. More features like property
          listings, search, and analytics will be added as the application grows.
        </p>
      </div>
    </div>
  );
}
