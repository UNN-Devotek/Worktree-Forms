export type ApplicationStatus = 'pending' | 'approved' | 'denied' | 'under_review' | 'interview_scheduled';
export type ApplicationPriority = 'normal' | 'high' | 'urgent';
export type ApplicationType = 'membership' | 'staff';

export interface MembershipApplication {
  id: number;
  full_name: string;
  email: string;
  birthday?: string | null;
  reference?: string | null;
  age_18_plus: boolean;
  rules_agreement: boolean;
  community_agreement: boolean;
  confidentiality_agreement: boolean;
  games_applied_for: string[];
  status: ApplicationStatus;
  priority: ApplicationPriority;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  admin_notes?: string | null;
  submitted_at: string;
  updated_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_user_id?: string | null;
  comment_count?: number;
}

export interface StaffApplication {
  id: number;
  full_name: string;
  email: string;
  positions_applied_for: string;
  games_supported: string[];
  reason_for_applying: string;
  ability_to_fulfill: string;
  previous_experience: string;
  time_agreement: boolean;
  confidentiality_agreement: boolean;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  admin_notes?: string | null;
  interview_scheduled_at?: string | null;
  submitted_at: string;
  updated_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  user_id?: string | null;
  comment_count?: number;
}

export type Application = MembershipApplication | StaffApplication;

export interface ApplicationComment {
  id: number;
  application_type: ApplicationType;
  application_id: number;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatusHistory {
  id: number;
  application_type: ApplicationType;
  application_id: number;
  old_status?: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_by: string;
  reason?: string | null;
  changed_at: string;
}

export interface ApplicationListResponse {
  applications: Application[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

export interface ApplicationDetailsResponse {
  application: Application;
  comments: ApplicationComment[];
  history: ApplicationStatusHistory[];
}

export interface ApplicationStatistics {
  membership: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
    under_review: number;
  };
  staff: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
    under_review: number;
    interview_scheduled: number;
  };
}

export interface MembershipApplicationFormData {
  full_name: string;
  email: string;
  birthday?: string;
  reference?: string;
  age_18_plus: boolean;
  rules_agreement: boolean;
  community_agreement: boolean;
  confidentiality_agreement: boolean;
  games_applied_for: string[];
}

export interface StaffApplicationFormData {
  full_name: string;
  email: string;
  positions_applied_for: string;
  games_supported: string[];
  reason_for_applying: string;
  ability_to_fulfill: string;
  previous_experience: string;
  time_agreement: boolean;
  confidentiality_agreement: boolean;
}