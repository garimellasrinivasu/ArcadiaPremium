import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectService, type ProjectDto } from "../services/projectService";
import {
  pujaExpensesService,
  type PujaExpenseDto,
} from "../services/pujaExpensesService";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ExpensesSummaryPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [expenses, setExpenses] = useState<PujaExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [projData, expData] = await Promise.all([
        projectService.getActiveProjects(),
        pujaExpensesService.getAll(),
      ]);
      setProjects(projData);
      setExpenses(expData);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  const filteredExpenses = selectedProject
    ? expenses.filter((e) => e.projectName === selectedProject)
    : expenses;

  const pujaTotal = filteredExpenses
    .filter((e) => e.pujaName === "Shankustaphana Puja")
    .reduce((sum, e) => sum + e.amount, 0);
  const pujaCount = filteredExpenses.filter(
    (e) => e.pujaName === "Shankustaphana Puja"
  ).length;

  const weeklyTotal = filteredExpenses
    .filter((e) => e.pujaName === "Weekly Expenses")
    .reduce((sum, e) => sum + e.amount, 0);
  const weeklyCount = filteredExpenses.filter(
    (e) => e.pujaName === "Weekly Expenses"
  ).length;

  const petrolTotal = filteredExpenses
    .filter((e) => e.pujaName === "Petrol Expenses")
    .reduce((sum, e) => sum + e.amount, 0);
  const petrolCount = filteredExpenses.filter(
    (e) => e.pujaName === "Petrol Expenses"
  ).length;

  function handleCardClick(path: string) {
    const params = selectedProject
      ? `?project=${encodeURIComponent(selectedProject)}`
      : "";
    navigate(`${path}${params}`);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-700 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Expenses Management</h1>
        <p className="text-amber-100 mt-1 text-sm">
          Track and manage all project expenses
        </p>
      </div>

      {/* Project Selection Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Select Project:
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expense Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Puja Expenses Card */}
        <div
          onClick={() => handleCardClick("/activities/expenses/puja")}
          className="relative bg-amber-50 border-2 border-amber-200 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:border-amber-400 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-amber-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C10 6 6 8 6 12c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-4-6-6-10z" />
                <path d="M12 18v4" />
                <path d="M8 22h8" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-amber-900">Puja Expenses</h3>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            Track expenses for Shankustaphana, Bhoomi Puja, and other religious
            ceremonies
          </p>
          <div className="absolute bottom-4 right-4 text-amber-400 group-hover:text-amber-600 transition-colors text-xl">
            &rarr;
          </div>
        </div>

        {/* Weekly Expenses Card */}
        <div
          onClick={() => handleCardClick("/activities/expenses/weekly")}
          className="relative bg-green-50 border-2 border-green-200 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:border-green-400 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-green-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="9" y1="4" x2="9" y2="10" />
                <line x1="15" y1="4" x2="15" y2="10" />
                <line x1="7" y1="14" x2="7" y2="14.01" strokeWidth="2" />
                <line x1="12" y1="14" x2="12" y2="14.01" strokeWidth="2" />
                <line x1="17" y1="14" x2="17" y2="14.01" strokeWidth="2" />
                <line x1="7" y1="18" x2="7" y2="18.01" strokeWidth="2" />
                <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-green-900">
              Weekly Expenses
            </h3>
          </div>
          <p className="text-sm text-green-800 leading-relaxed">
            Food, snacks, tea/coffee, labour food, site supplies, and other
            recurring weekly expenses
          </p>
          <div className="absolute bottom-4 right-4 text-green-400 group-hover:text-green-600 transition-colors text-xl">
            &rarr;
          </div>
        </div>

        {/* Petrol Expenses Card */}
        <div
          onClick={() => handleCardClick("/activities/expenses/petrol")}
          className="relative bg-blue-50 border-2 border-blue-200 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:border-blue-400 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-blue-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                <path d="M3 22h12" />
                <rect x="5" y="8" width="8" height="5" rx="1" />
                <path d="M15 10h2a2 2 0 0 1 2 2v4a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1V9l-3-3" />
                <circle cx="20" cy="9" r="1" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-blue-900">
              Petrol Expenses
            </h3>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">
            Fuel, diesel, vehicle maintenance, and transportation expenses
          </p>
          <div className="absolute bottom-4 right-4 text-blue-400 group-hover:text-blue-600 transition-colors text-xl">
            &rarr;
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Quick Stats
          {selectedProject && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              &mdash; {selectedProject}
            </span>
          )}
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600" />
            Loading stats...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Puja Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-gray-600">
                  Total Puja Expenses
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-800">
                {formatINR(pujaTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pujaCount} {pujaCount === 1 ? "entry" : "entries"}
              </p>
            </div>

            {/* Weekly Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-600">
                  Total Weekly Expenses
                </span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {formatINR(weeklyTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {weeklyCount} {weeklyCount === 1 ? "entry" : "entries"}
              </p>
            </div>

            {/* Petrol Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-gray-600">
                  Total Petrol Expenses
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {formatINR(petrolTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {petrolCount} {petrolCount === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
