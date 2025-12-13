'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type {
  Application,
  ApplicationListResponse,
  ApplicationDetailsResponse,
  ApplicationComment,
  ApplicationStatistics,
  ApplicationStatus,
  ApplicationType,
  MembershipApplicationFormData,
  StaffApplicationFormData,
} from '@/types/applications';

interface StatusUpdatePayload {
  status: ApplicationStatus;
  review_notes?: string;
  priority?: string;
}

export function useApplications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMembershipApplications = useCallback(
    async (
      status?: ApplicationStatus,
      page = 1,
      perPage = 20,
      search = ''
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        if (search) params.append('search', search);

        const response = await apiClient<ApiResponse<ApplicationListResponse>>(
          `/api/applications/membership?${params}`
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch applications');
        }

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch applications';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getStaffApplications = useCallback(
    async (
      status?: ApplicationStatus,
      page = 1,
      perPage = 20,
      search = ''
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        if (search) params.append('search', search);

        const response = await apiClient<ApiResponse<ApplicationListResponse>>(
          `/api/applications/staff?${params}`
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch applications');
        }

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch applications';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getMembershipApplicationDetails = useCallback(
    async (applicationId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient<ApiResponse<ApplicationDetailsResponse>>(
          `/api/applications/membership/${applicationId}`
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch application');
        }

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch application';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getStaffApplicationDetails = useCallback(
    async (applicationId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient<ApiResponse<ApplicationDetailsResponse>>(
          `/api/applications/staff/${applicationId}`
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch application');
        }

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch application';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateApplicationStatus = useCallback(
    async (
      applicationType: ApplicationType,
      applicationId: number,
      status: ApplicationStatus,
      reviewNotes?: string,
      priority?: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const endpoint =
          applicationType === 'membership'
            ? `/api/applications/membership/${applicationId}/status`
            : `/api/applications/staff/${applicationId}/status`;

        const payload: StatusUpdatePayload = { status };
        if (reviewNotes) payload.review_notes = reviewNotes;
        if (priority) payload.priority = priority;

        const response = await apiClient<ApiResponse<Application>>(endpoint, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to update application');
        }

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update application';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addComment = useCallback(
    async (
      applicationType: ApplicationType,
      applicationId: number,
      comment: string,
      isInternal = true
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient<ApiResponse<{ comment: ApplicationComment }>>(
          `/api/applications/${applicationType}/${applicationId}/comments`,
          {
            method: 'POST',
            body: JSON.stringify({
              comment,
              is_internal: isInternal,
            }),
          }
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to add comment');
        }

        return response.data.comment;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add comment';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const submitMembershipApplication = useCallback(
    async (data: MembershipApplicationFormData) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient<
          ApiResponse<{ application_id: number; message: string }>
        >('/api/applications/membership/submit', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to submit application');
        }

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to submit application';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const submitStaffApplication = useCallback(
    async (data: StaffApplicationFormData) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient<
          ApiResponse<{ application_id: number; message: string }>
        >('/api/applications/staff/submit', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to submit application');
        }

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to submit application';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient<ApiResponse<ApplicationStatistics>>(
        '/api/applications/statistics'
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch statistics');
      }

      return response.data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getMembershipApplications,
    getStaffApplications,
    getMembershipApplicationDetails,
    getStaffApplicationDetails,
    updateApplicationStatus,
    addComment,
    submitMembershipApplication,
    submitStaffApplication,
    getStatistics,
  };
}
