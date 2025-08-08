import axios from "axios";
import type {
  Application,
  ApplicationFormData,
  Notification,
  NotificationRequest,
  NotificationResponse,
} from "@/types";

// Use the Next.js API proxy to avoid CORS issues
const APPS_BASE_URL = "/api/proxy";
const REQUESTOR_BASE_URL = "/api/requestor";

// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_URL || "http://107.21.170.151:8001";

const api = axios.create({
  baseURL: APPS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiRequestor = axios.create({
  baseURL: REQUESTOR_BASE_URL, // rewrites to port 8000
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApplications = async (): Promise<Application[]> => {
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

export const createApplication = async (
  applicationData: ApplicationFormData
): Promise<Application> => {
  console.debug("[createApplication] Input data:", applicationData);

  try {
    const response = await api.post("/app", applicationData);
    console.debug("[createApplication] Response status:", response.status);
    console.debug("[createApplication] Response data:", response.data);

    return response.data;
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
