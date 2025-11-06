'use client'

import { useState, useEffect } from "react";
import { createApiKey, getApplications } from "@/services/api";
import { RxCross2 } from "react-icons/rx";
import { TbLoader2 } from "react-icons/tb";
import type { ApiCreationFormData, Application } from "@/types";

interface ApiCreationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApiCreationForm({
  onClose,
  onSuccess,
}: ApiCreationFormProps) {
  const [formData, setFormData] = useState<ApiCreationFormData>({
    name: "",
    app_id: 0,
    expires_at: null,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState("");
  const [apiKeyResult, setApiKeyResult] = useState<string>("");

  // Fetch applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoadingApps(true);
        const apps = await getApplications();
        setApplications(apps);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
        setError("Failed to load applications. Please try again.");
      } finally {
        setLoadingApps(false);
      }
    };

    fetchApplications();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "app_id" ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setApiKeyResult("");

    // Validate that an app is selected
    if (!formData.app_id || formData.app_id === 0) {
      setError("Please select an application");
      setLoading(false);
      return;
    }

    console.log("[handleSubmit] Form data:", formData);
    try {
      const result = await createApiKey(formData);
      console.log("[handleSubmit] API Key created:", result);

      // Store the API key to display to user
      if (result.api_key) {
        setApiKeyResult(result.api_key);
      }

      // Call onSuccess after a short delay to allow user to see the key
      setTimeout(() => {
        onSuccess();
      }, 100);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to generate API Key");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            API Key Creation
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RxCross2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loadingApps ? (
            <div className="flex items-center justify-center py-8">
              <TbLoader2 className="w-6 h-6 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">
                Loading applications...
              </span>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="app_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Application <span className="text-red-500">*</span>
                </label>
                <select
                  id="app_id"
                  name="app_id"
                  value={formData.app_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value={0}>-- Select an application --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.App_name} ({app.Application})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Choose the application for which you want to generate an API
                  key
                </p>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  API Key Name (Optional)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Production Server Key"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A descriptive name to help you identify this API key
                </p>
              </div>
            </>
          )}

          {apiKeyResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                API Key Generated Successfully!
              </h3>
              <p className="text-xs text-green-700 mb-2">
                Please copy this key now. You won&apos;t be able to see it
                again!
              </p>
              <div className="bg-white border border-green-300 rounded p-3 font-mono text-sm break-all">
                {apiKeyResult}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(apiKeyResult);
                  alert("API key copied to clipboard!");
                }}
                className="mt-2 text-xs text-green-700 hover:text-green-900 underline"
              >
                Copy to clipboard
              </button>
            </div>
          )}

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center p-2 rounded"
              disabled={loading}
            >
              {apiKeyResult ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || loadingApps || formData.app_id === 0}
              className="btn-primary flex-1 justify-center p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <TbLoader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate New API Key"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}