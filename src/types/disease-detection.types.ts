export type DiseaseSubmissionStatus =
  | 'pending'
  | 'under_analysis'
  | 'analyzed'
  | 'review_needed';

export interface DiseaseDetectionSubmission {
  id: string;
  farmerId?: string | null;
  farmerName?: string | null;
  farmerEmail?: string | null;
  animalId?: string | null;
  animalTag?: string | null;
  animalType?: string | null;
  symptomDescription?: string | null;
  observedAt?: string | null;
  farmReference?: string | null;
  locationReference?: string | null;
  status: DiseaseSubmissionStatus;
  submittedAt?: any;
  analyzedAt?: any;
  analyzedBy?: string | null;
  predictionLabel?: string | null;
  confidence?: number | null;
  resultSummary?: string | null;
  reviewNote?: string | null;
  mediaCounts?: {
    image?: number;
    video?: number;
    thumbnail?: number;
  };
  disclaimer?: string | null;
}

export interface DiseaseMediaFile {
  id: string;
  submissionId: string;
  mediaType: 'image' | 'video' | 'thumbnail' | string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  storagePath?: string;
  status?: string;
  previewUrl?: string | null;
  uploadedAt?: any;
}

export interface DiseaseDetectionResult {
  id: string;
  submissionId: string;
  primaryLabel?: string;
  confidence?: number;
  alternatives?: Array<{ label?: string; score?: number }>;
  lowConfidenceFlag?: boolean;
  note?: string;
  recommendation?: string;
  modelVersion?: string;
  modelSource?: string;
  analyzedAt?: any;
  disclaimer?: string;
  mediaContext?: {
    imageCount?: number;
    videoCount?: number;
  };
}

export interface DiseaseModelRun {
  id: string;
  submissionId: string;
  status?: string;
  triggeredBy?: string;
  triggerSource?: string;
  modelVersion?: string;
  modelSource?: string;
  startedAt?: any;
  endedAt?: any;
  outputSummary?: {
    prediction?: string;
    confidence?: number;
    lowConfidence?: boolean;
  };
  error?: string | null;
}

export interface DiseaseSubmissionDetailsResponse {
  submission: DiseaseDetectionSubmission;
  media: DiseaseMediaFile[];
  result: DiseaseDetectionResult | null;
  modelRuns: DiseaseModelRun[];
}
