import { useState, useEffect } from "react";
import { approvalChainService } from "../services/approvalChainService";
import { userService } from "../services/userService";
import type {
  ApprovalChainDto,
  CreateApprovalChainRequest,
} from "../services/approvalChainService";
import type { Role, User } from "../types/user";

const ROLE_DISPLAY: Record<string, string> = {
  OFFICE_ASSISTANT: "Office Assistant",
  SUPERVISOR: "Supervisor",
  ENGINEERING: "Engineering",
  PARTNER: "Partner",
  ACCOUNTING: "Accounting",
  ADMIN: "Admin",
  SALES: "Sales",
  OPERATIONS: "Operations",
  ACCOUNTS: "Accounts",
};

function roleName(code: string): string {
  return ROLE_DISPLAY[code] || code;
}

export default function ApprovalChainAdminPage() {
  const [chains, setChains] = useState<ApprovalChainDto[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSubmitterRole, setFormSubmitterRole] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formSteps, setFormSteps] = useState<
    { approverRoleName: string; approverUserId: number; blocking: boolean }[]
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [chainsData, rolesData, usersData] = await Promise.all([
        approvalChainService.getAll(),
        userService.getAllRoles(),
        userService.getAll(),
      ]);
      setChains(chainsData);
      setRoles(rolesData);
      setUsers(usersData);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormSubmitterRole("");
    setFormActive(true);
    setFormSteps([]);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(chain: ApprovalChainDto) {
    setFormName(chain.name);
    setFormSubmitterRole(chain.submitterRoleName);
    setFormActive(chain.active);
    setFormSteps(
      chain.steps.map((s) => ({
        approverRoleName: s.approverRoleName,
        approverUserId: s.approverUserId || 0,
        blocking: s.blocking,
      }))
    );
    setEditingId(chain.id);
    setShowForm(true);
  }

  function addStep() {
    setFormSteps([...formSteps, { approverRoleName: "", approverUserId: 0, blocking: true }]);
  }

  function removeStep(idx: number) {
    setFormSteps(formSteps.filter((_, i) => i !== idx));
  }

  function updateStep(idx: number, field: string, value: string | number | boolean) {
    const updated = [...formSteps];
    if (field === "approverRoleName") {
      updated[idx].approverRoleName = value as string;
      updated[idx].approverUserId = 0; // reset user when role changes
    } else if (field === "approverUserId") {
      updated[idx].approverUserId = value as number;
    } else if (field === "blocking") {
      updated[idx].blocking = value as boolean;
    }
    setFormSteps(updated);
  }

  // Get users who have a specific role
  function getUsersForRole(roleName: string): User[] {
    return users.filter(
      (u) => u.active && u.roles.some((r) => r.name === roleName)
    );
  }

  async function handleSubmit() {
    if (!formName || !formSubmitterRole || formSteps.length === 0) {
      setError("Please fill in all fields and add at least one step");
      return;
    }
    if (formSteps.some((s) => !s.approverRoleName)) {
      setError("Each step must have an approver role selected");
      return;
    }
    if (formSteps.some((s) => !s.approverUserId || s.approverUserId === 0)) {
      setError("Each step must have a specific approver user selected");
      return;
    }

    const req: CreateApprovalChainRequest = {
      name: formName,
      submitterRoleName: formSubmitterRole,
      active: formActive,
      steps: formSteps,
    };

    try {
      setError("");
      if (editingId) {
        await approvalChainService.update(editingId, req);
      } else {
        await approvalChainService.create(req);
      }
      resetForm();
      await loadData();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to save chain");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this approval chain?")) return;
    try {
      await approvalChainService.delete(id);
      await loadData();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcadia-600" />
        <span className="ml-3 text-gray-600">Loading approval chains...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approval Chain Configuration</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-arcadia-600 text-white px-4 py-2 rounded-lg hover:bg-arcadia-700 transition text-sm font-medium"
          >
            + New Chain
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Approval Chain" : "New Approval Chain"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chain Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
                placeholder="e.g. Supervisor → Subbu → Partner"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When submitted by (Role)
              </label>
              <select
                value={formSubmitterRole}
                onChange={(e) => setFormSubmitterRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
              >
                <option value="">Select submitter role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{roleName(r.name)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="h-4 w-4 text-arcadia-600 rounded"
              id="chainActive"
            />
            <label htmlFor="chainActive" className="ml-2 text-sm text-gray-700">Active</label>
          </div>

          {/* Steps */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Approval Steps</label>
              <button onClick={addStep} className="text-sm text-arcadia-600 hover:text-arcadia-800 font-medium">
                + Add Step
              </button>
            </div>

            {formSteps.length === 0 && (
              <p className="text-sm text-gray-400 italic">No steps added yet. Click "+ Add Step" to begin.</p>
            )}

            <div className="space-y-3">
              {formSteps.map((step, idx) => {
                const roleUsers = step.approverRoleName ? getUsersForRole(step.approverRoleName) : [];
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-500 w-16">Step {idx + 1}</span>
                      <button onClick={() => removeStep(idx)} className="ml-auto text-red-400 hover:text-red-600 text-sm">
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Approver Role</label>
                        <select
                          value={step.approverRoleName}
                          onChange={(e) => updateStep(idx, "approverRoleName", e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        >
                          <option value="">Select role...</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.name}>{roleName(r.name)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Assigned User</label>
                        <select
                          value={step.approverUserId}
                          onChange={(e) => updateStep(idx, "approverUserId", Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                          disabled={!step.approverRoleName}
                        >
                          <option value={0}>Select user...</option>
                          {roleUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName}
                            </option>
                          ))}
                          {step.approverRoleName && roleUsers.length === 0 && (
                            <option disabled>No users with this role</option>
                          )}
                        </select>
                        {step.approverRoleName && roleUsers.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            No users have the {roleName(step.approverRoleName)} role. Create a user with this role first.
                          </p>
                        )}
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-1.5 text-sm text-gray-600 pb-1.5">
                          <input
                            type="checkbox"
                            checked={step.blocking}
                            onChange={(e) => updateStep(idx, "blocking", e.target.checked)}
                            className="h-3.5 w-3.5 text-arcadia-600 rounded"
                          />
                          Blocking (requires approval)
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="bg-arcadia-600 text-white px-5 py-2 rounded-lg hover:bg-arcadia-700 transition text-sm font-medium"
            >
              {editingId ? "Update Chain" : "Create Chain"}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Chains */}
      {chains.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl text-gray-300 mb-3">&#9881;</div>
          <p className="text-gray-500 mb-2">No approval chains configured yet.</p>
          <p className="text-sm text-gray-400">
            Click "+ New Chain" to create one. Each chain defines who approves submissions from a specific role.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chains.map((chain) => (
            <div
              key={chain.id}
              className={`bg-white border rounded-xl p-5 shadow-sm ${
                chain.active ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{chain.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Triggered when <span className="font-medium text-arcadia-700">{roleName(chain.submitterRoleName)}</span> submits
                    {!chain.active && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">Inactive</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(chain)} className="text-sm text-arcadia-600 hover:text-arcadia-800 font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(chain.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                    Delete
                  </button>
                </div>
              </div>

              {/* Steps visualization with user names */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {roleName(chain.submitterRoleName)}
                </span>
                {chain.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-gray-300 text-lg">&rarr;</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        step.blocking
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {step.approverUserName || roleName(step.approverRoleName)}
                      <span className="font-normal text-gray-500 ml-1">
                        ({roleName(step.approverRoleName)})
                      </span>
                      {!step.blocking && " - record only"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
