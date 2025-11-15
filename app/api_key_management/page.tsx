'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ApplicationForm from '@/components/ApplicationForm'
import ApiCreationForm from '@/components/ApiCreationForm'
import { FaPlus } from "react-icons/fa";
// import { FaBell } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
// import type { Application } from "@/types";
import ApiKeyManagement from '@/components/ApiKeyManagement'

// ⚠️ AUTH BYPASS FLAG - FOR DEVELOPMENT ONLY
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default function ApiKeyManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [showApiCreationForm, setShowApiCreationForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ⚠️ AUTH BYPASS: Skip authentication check if auth is disabled
    if (!AUTH_DISABLED && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  const handleApplicationCreated = () => {
    setShowForm(false);
  };

  const handleApiCreated = () => {
    setShowApiCreationForm(false);
    // Trigger refresh of API keys list
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGenerateNewKey = () => {
    setShowApiCreationForm(true);
  };

  //   if (!isAuthenticated) {
  //     return null;
  //   }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {" "}
                API Key Management
              </h1>
              <p className="text-gray-600 mt-1">
                Create and revoke your API keys.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors justify-center items-center"
              >
                <MdDashboard className="w-4 h-4" />
                Back to Dashboard
              </button>
              {/* <button
                onClick={() => setShowForm(true)}
                className="flex gap-2 btn-primary p-2 rounded mx-auto w-[80%] justify-center sm:w-auto "
              >
                <FaPlus className="w-4 h-4 mt-1" />
                Register Application
              </button> */}
            </div>
          </div>
        </div>

        {/* {showForm && (
          <ApplicationForm
            onClose={() => setShowForm(false)}
            onSuccess={handleApplicationCreated}
          />
        )} */}

        {showApiCreationForm && (
          <ApiCreationForm
            onClose={() => setShowApiCreationForm(false)}
            onSuccess={handleApiCreated}
          />
        )}

        <ApiKeyManagement
          handleGenerateNewKey={handleGenerateNewKey}
          refreshTrigger={refreshTrigger}
        /> 
      </main>
    </div>
  );
}