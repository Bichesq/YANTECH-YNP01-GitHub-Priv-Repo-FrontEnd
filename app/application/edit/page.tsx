'use client'

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import { getApplications, updateApplication } from '@/services/api'
import { FaArrowLeft } from "react-icons/fa"
import type { ApplicationFormData, ApplicationResponse } from '@/types'

// ⚠️ AUTH BYPASS FLAG - FOR DEVELOPMENT ONLY
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

function EditApplicationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [application, setApplication] = useState<ApplicationResponse | null>(null)
  const [formData, setFormData] = useState<ApplicationFormData>({
    App_name: '',
    Application: '',
    Email: '',
    Domain: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const id = searchParams.get('id')

  const loadApplication = useCallback(async () => {
    if (!id) {
      router.push("/dashboard");
      return;
    }

    try {
      const apps = await getApplications();
      const app = apps.find((a: ApplicationResponse) => a.application_id === id);
      if (app) {
        setApplication(app);
        setFormData({
          App_name: app.name,
          Application: app.application_id,
          Email: app.email,
          Domain: app.domain,
        });
      }
    } catch (error) {
      console.error("Failed to load application:", error);
    }
  }, [id, router]);

  useEffect(() => {
    // ⚠️ AUTH BYPASS: Skip authentication check if auth is disabled
    if (!AUTH_DISABLED && !isAuthenticated) {
      router.push("/login");
      return;
    }
    loadApplication();
  }, [isAuthenticated, router, loadApplication]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!id) {
      setError("Application ID is missing");
      setLoading(false);
      return;
    }

    try {
      await updateApplication(id, formData)
      router.push('/dashboard')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Failed to update application")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !application) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary mb-6"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Application
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Name
              </label>
              <input
                type="text"
                name="App_name"
                value={formData.App_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application ID
              </label>
              <input
                type="text"
                name="Application"
                value={formData.Application}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain
              </label>
              <input
                type="text"
                name="Domain"
                value={formData.Domain}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn-secondary flex-1 justify-center p-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 justify-center p-2 rounded"
              >
                {loading ? "Updating..." : "Update Application"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function EditApplicationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    }>
      <EditApplicationContent />
    </Suspense>
  );
}
