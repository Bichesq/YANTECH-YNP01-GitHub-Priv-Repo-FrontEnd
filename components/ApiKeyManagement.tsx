"use client";

import React, { useState, useEffect } from "react";
import {
  getApplications,
  getApplicationApiKeys,
  deleteApiKey,
} from "@/services/api";
import type { APIKeyInfo, ApplicationResponse } from "@/types";
import { TbLoader2 } from "react-icons/tb";
import { FaTrash, FaKey, FaPlus } from "react-icons/fa";

interface ComponentProps {
  handleGenerateNewKey: () => void;
  refreshTrigger?: number;
}

const ApiKeyManagement: React.FC<ComponentProps> = ({
  handleGenerateNewKey,
  refreshTrigger = 0,
}) => {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appId, setAppId] = useState<number>(0);
  const [apiKeys, setApiKeys] = useState<APIKeyInfo[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Fetch applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoadingApps(true);
        setError("");
        const apps = await getApplications();
        setApplications(apps);

        // Auto-select first app if available
        if (apps.length > 0 && apps[0].id) {
          setAppId(apps[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch applications:", err);
        setError("Failed to load applications. Please try again.");
      } finally {
        setLoadingApps(false);
      }
    };

    fetchApplications();
  }, []);

  // Fetch API keys when selected app changes or refresh is triggered
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!appId) {
        setApiKeys([]);
        return;
      }

      try {
        setLoadingKeys(true);
        setError("");
        console.log("Fetching API keys for app:", appId);
        const keys = await getApplicationApiKeys(appId);
        setApiKeys(keys);
        console.log("API keys fetched:", keys);
      } catch (err) {
        console.error("Failed to fetch API keys:", err);
        setError("Failed to load API keys. Please try again.");
        setApiKeys([]);
      } finally {
        setLoadingKeys(false);
      }
    };

    fetchApiKeys();
  }, [selectedAppId, appId, refreshTrigger]);

  const handleDeleteKey = async (keyId: number) => {
    if (!appId) return;

    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingKeyId(keyId);
      setError("");
      setSuccessMessage("");

      await deleteApiKey(appId, keyId);

      // Remove the key from the list
      setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
      setSuccessMessage("API key revoked successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to delete API key:", err);
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setDeletingKeyId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center py-12">
        <TbLoader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600">Loading applications...</span>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FaKey className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Applications Found
        </h3>
        <p className="text-gray-600 mb-4">
          You need to register an application before you can create API keys.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary px-4 py-2 rounded"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Application Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <label
              htmlFor="app-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Application
            </label>
            <select
              id="app-select"
              value={appId || 0}
              onChange={(e) => setAppId(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {applications.map((app) => (
                <option key={app.application_id} value={app.id}>
                  {app.name} ({app.application_id})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:mt-6">
            <button
              onClick={handleGenerateNewKey}
              className="btn-primary px-4 py-2 rounded flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <FaPlus className="w-4 h-4" />
              Generate New API Key
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage API keys for the selected application
          </p>
        </div>

        <div className="p-6">
          {loadingKeys ? (
            <div className="flex items-center justify-center py-8">
              <TbLoader2 className="w-6 h-6 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Loading API keys...</span>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <FaKey className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No API Keys
              </h3>
              <p className="text-gray-600 mb-4">
                This application doesn&apos;t have any API keys yet.
              </p>
              <button
                onClick={handleGenerateNewKey}
                className="btn-primary px-4 py-2 rounded inline-flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Create Your First API Key
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {key.name || "Unnamed Key"}
                        </div>
                        <div className="text-xs text-gray-500">ID: {key.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            key.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {key.is_active ? "Active" : "Revoked"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(key.expires_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(key.last_used_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {key.is_active && (
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={deletingKeyId === key.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                          >
                            {deletingKeyId === key.id ? (
                              <>
                                <TbLoader2 className="w-4 h-4 animate-spin" />
                                Revoking...
                              </>
                            ) : (
                              <>
                                <FaTrash className="w-4 h-4" />
                                Revoke
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManagement;

