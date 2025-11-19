import axios from "axios";
import type {
  ApiCreationFormData,
  Application,
  ApplicationFormData,
  Notification,
  NotificationRequest,
  NotificationResponse,
  APIKeyInfo,
  APIKeyResponse,
  ApplicationResponse,
} from "@/types";
import { getSessionToken, clearSession } from "@/contexts/AuthContext";

// ⚠️ AUTH BYPASS FLAG - FOR DEVELOPMENT ONLY
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

// Call backend services directly (requires CORS configuration on backend)
const APPS_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://13.221.91.36:80";
const REQUESTOR_BASE_URL =
  process.env.NEXT_PUBLIC_REQUESTOR_URL || "http://13.221.91.36:80";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://13.221.91.36:80";

// Test backend connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("✅ Backend connection successful:", data);
    return true;
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    return false;
  }
};

const api = axios.create({
  baseURL: APPS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiRequestor = axios.create({
  baseURL: REQUESTOR_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include authentication token
api.interceptors.request.use(
  (config) => {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiRequestor.interceptors.request.use(
  (config) => {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ⚠️ AUTH BYPASS: Skip 401 redirect if auth is disabled
    if (error.response?.status === 401 && !AUTH_DISABLED) {
      // Session expired or invalid, clear session and redirect to login
      console.log("⚠️ Authentication failed, clearing session");
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

apiRequestor.interceptors.response.use(
  (response) => response,
  (error) => {
    // ⚠️ AUTH BYPASS: Skip 401 redirect if auth is disabled
    if (error.response?.status === 401 && !AUTH_DISABLED) {
      // Session expired or invalid, clear session and redirect to login
      console.log("⚠️ Authentication failed, clearing session");
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getApplications = async (): Promise<ApplicationResponse[]> => {
  console.log("[getApplications] Sending GET request to /apps");

  try {
    const response = await api.get("/apps");

    console.log(
      "[getApplications] Response received:",
      response.status,
      response.data
    );
    return response.data;
  } catch (error: any) {
    console.error("[getApplications] Error occurred:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.detail || "Failed to fetch applications"
    );
  }
};

export const createApplication = async (applicationData: ApplicationFormData): Promise<ApplicationResponse> => {
  console.debug("[createApplication] Input data:", applicationData);

  try {
    // Step 1: Create the application
    const response = await api.post("/app", applicationData);
    console.debug("[createApplication] Response status:", response.status);
    console.debug("[createApplication] Response data:", response.data);

    const createdApp = response.data;

    // Step 2: Generate API key for the created application
    try {
      const apiKeyResponse = await api.post(`/app/${createdApp.id}/api-key`, {
        // Optional: include any metadata for the API key
        name: `API Key for ${createdApp.name || "Application"}`,
        expires_at: null, // null for no expiration, or a date string
      });

      console.debug(
        "[createApplication] API Key generated:",
        apiKeyResponse.data
      );

      // Step 3: Return the application with the API key attached
      return {
        ...createdApp,
        apiKey: apiKeyResponse.data.api_key,
        apiKeyId: apiKeyResponse.data.id,
      };
    } catch (apiKeyError: any) {
      console.error(
        "[createApplication] API Key generation failed:",
        apiKeyError
      );
      // Application was created but API key failed
      // You could either:
      // 1. Return the app without the key (partial success)
      // 2. Delete the app and throw an error (atomic operation)

      // Option 2: Rollback - delete the created app
      try {
        await api.delete(`/app/${createdApp.id}`);
        console.debug("[createApplication] Rolled back application creation");
      } catch (deleteError) {
        console.error("[createApplication] Rollback failed:", deleteError);
      }

      throw new Error(
        apiKeyError.response?.data?.detail || "Failed to generate API key"
      );
    }
  } catch (error: any) {
    console.error("[createApplication] Error:", error);
    console.error(
      "[createApplication] Error details:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.detail || "Failed to create application -api"
    );
  }
};

export const createApiKey = async (
  apiCreationData: ApiCreationFormData
): Promise<APIKeyResponse> => {
  console.log("[createApiKey] Creating API key with data:", apiCreationData);

  try {
    // Validate that app_id is provided
    if (!apiCreationData.app_id || apiCreationData.app_id === 0) {
      throw new Error("Application ID is required");
    }

    // Prepare the request body according to backend APIKeyCreate schema
    const requestBody = {
      name: apiCreationData.name || undefined,
      expires_at: apiCreationData.expires_at || null,
    };

    const apiKeyResponse = await api.post(
      `/app/${apiCreationData.app_id}/api-key`,
      requestBody
    );

    console.log("[createApiKey] API Key generated:", apiKeyResponse.data);

    return apiKeyResponse.data;
  } catch (apiKeyError: any) {
    console.error("[createApiKey] API Key generation failed:", apiKeyError);

    // Throw a proper error with the backend message if available
    throw new Error(
      apiKeyError.response?.data?.detail ||
        apiKeyError.message ||
        "Failed to generate API key"
    );
  }
};

export const requestNotification = async (
  notificationData: NotificationRequest
): Promise<NotificationResponse> => {
  console.log(
    "[requestNotification] Sending notification request:",
    notificationData
  );

  try {
    const response = await apiRequestor.post("/request", notificationData);

    console.log(
      "[requestNotification] Response received:",
      response.status,
      response.data
    );

    return response.data;
  } catch (error: any) {
    console.error("[requestNotification] Error occurred:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.detail || "Failed to send notification request"
    );
  }
};

export const updateApplication = async (
  id: string,
  applicationData: ApplicationFormData
): Promise<Application> => {
  try {
    const response = await api.put(`/app/${id}`, applicationData);
    return response.data;
  } catch (error: any) {
    console.error(
      "[updateApplication] Error details:",
      error.response?.data || error.message
    );
    throw new Error("Failed to update application");
  }
};

export const deleteApplication = async (id: string): Promise<void> => {
  try {
    await api.delete(`/app/${id}`);
  } catch (error: any) {
    throw new Error("Failed to delete application");
  }
};

export const getNotifications = async (
  applicationId: string
): Promise<Notification[]> => {
  try {
    const response = await api.get(`/app/${applicationId}/notifications`);
    return response.data;
  } catch (error: any) {
    throw new Error("Failed to fetch notifications");
  }
};

export const getApplicationApiKeys = async (
  applicationId: number | undefined
): Promise<APIKeyInfo[]> => {
  console.log(
    "[getApplicationApiKeys] Fetching API keys for app:",
    applicationId
  );

  try {
    const response = await api.get(`/app/${applicationId}/api-keys`);
    console.log("[getApplicationApiKeys] API keys fetched:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[getApplicationApiKeys] Error:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to fetch API keys"
    );
  }
};

export const deleteApiKey = async (
  appId: number,
  keyId: number
): Promise<void> => {
  console.log("[deleteApiKey] Deleting API key:", { appId, keyId });

  try {
    await api.delete(`/app/${appId}/api-key/${keyId}`);
    console.log("[deleteApiKey] API key deleted successfully");
  } catch (error: any) {
    console.error("[deleteApiKey] Error:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to delete API key"
    );
  }
};
