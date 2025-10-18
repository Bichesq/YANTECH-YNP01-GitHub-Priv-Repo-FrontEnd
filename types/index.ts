export interface Application {
  Application: string
  App_name: string
  Email: string
  Domain: string
  'SES-Domain-ARN'?: string
  'SNS-Topic-ARN'?: string
}

export interface ApplicationFormData {
  App_name: string
  Application: string
  Email: string
  Domain: string
}

export interface ApiKey {
  id: string;
  name: string;
  created: string;
  expiry: string;
  isRevoked: boolean;
  createdDate: string;
}

export interface ApiCreationFormData {
  Api_name?: string,
  Api_id: string
}

export interface Notification {
  Application: string;
  Recipient: string;
  Subject: string;
  Message: string;
  OutputType: string;
  Interval: object;
}

export interface NotificationInterval {
  Once?: boolean;
  Daily?: boolean;
  Weekly?: boolean;
  Monthly?: boolean;
  Days?: number[];
}

export interface NotificationRequest {
  Application: string;
  Recipient: string;
  Subject: string;
  Message: string;
  OutputType: "EMAIL" | "SMS" | "PUSH";
  PhoneNumber?: string;
  Interval: NotificationInterval;
  EmailAddresses?: string[];
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  notificationId?: string;
}

export interface User {
  username: string
}

export interface ApplicationListProps {
  applications: Application[];
  onUpdate: () => void;
}