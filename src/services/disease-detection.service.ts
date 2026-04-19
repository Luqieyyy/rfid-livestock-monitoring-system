import { getFirebaseAuth } from '@/lib/firebase';
import type {
  DiseaseDetectionSubmission,
  DiseaseSubmissionDetailsResponse,
  DiseaseSubmissionStatus,
} from '@/types/disease-detection.types';

type ListResponse = {
  ok: boolean;
  count: number;
  items: DiseaseDetectionSubmission[];
};

function getDiseaseApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_DISEASE_API_BASE_URL;
  if (explicit && explicit.trim()) {
    return explicit.replace(/\/+$/, '');
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const region = process.env.NEXT_PUBLIC_DISEASE_FUNCTION_REGION || 'us-central1';
  if (!projectId) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID for disease API base URL');
  }

  return `https://${region}-${projectId}.cloudfunctions.net`;
}

async function getAuthToken(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return user.getIdToken();
}

async function requestJson<T>(
  functionName: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH';
    body?: Record<string, any>;
    query?: Record<string, string | number | undefined | null>;
  }
): Promise<T> {
  const method = options?.method ?? 'GET';
  const token = await getAuthToken();

  const baseUrl = getDiseaseApiBaseUrl();
  const url = new URL(`${baseUrl}/${functionName}`);

  if (options?.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: method === 'GET' ? undefined : JSON.stringify(options?.body ?? {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const diseaseDetectionService = {
  async listSubmissions(filters?: {
    status?: DiseaseSubmissionStatus | 'all';
    farmerId?: string;
    animalType?: string;
    limit?: number;
  }): Promise<DiseaseDetectionSubmission[]> {
    const res = await requestJson<ListResponse>('listDiseaseSubmissions', {
      method: 'GET',
      query: {
        status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
        farmerId: filters?.farmerId,
        animalType: filters?.animalType,
        limit: filters?.limit ?? 50,
      },
    });
    return res.items || [];
  },

  async getSubmissionDetails(submissionId: string): Promise<DiseaseSubmissionDetailsResponse> {
    return requestJson<DiseaseSubmissionDetailsResponse>('getDiseaseSubmissionDetails', {
      method: 'GET',
      query: { submissionId },
    });
  },

  async triggerAnalysis(submissionId: string) {
    return requestJson<any>('triggerDiseaseAnalysis', {
      method: 'POST',
      body: { submissionId },
    });
  },

  async updateSubmissionStatus(
    submissionId: string,
    status: DiseaseSubmissionStatus,
    reviewNote?: string
  ) {
    return requestJson<any>('updateDiseaseSubmissionStatus', {
      method: 'PATCH',
      body: { submissionId, status, reviewNote },
    });
  },
};
