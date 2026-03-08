// Specialist module types

export type SpecialistRelationStatus = 'invited' | 'active' | 'revoked';

export interface SpecialistUserRelation {
  id: string;
  specialist_id: string;
  user_id: string | null;
  invited_email: string;
  status: SpecialistRelationStatus;
  revoked_by: string | null;
  revoked_at: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecommendationItem {
  id: string;
  text: string;
  category?: string;
  domain_id?: string;
}

export interface SpecialistSessionNote {
  id: string;
  specialist_id: string;
  user_id: string;
  relation_id: string;
  session_type: string | null;
  session_date: string;
  duration_minutes: number | null;
  private_notes: { id: string; text: string }[];
  private_followup: string | null;
  shared_recommendations: RecommendationItem[];
  shared_published_at: string | null;
  visibility_to_user: 'none' | 'recommendations_only';
  lock_version: number;
  created_at: string;
  updated_at: string;
}

export interface SpecialistBitacoraEntry {
  id: string;
  user_id: string;
  specialist_id: string;
  specialist_session_note_id: string;
  title: string | null;
  date: string;
  shared_recommendations_snapshot: RecommendationItem[];
  created_at: string;
  updated_at: string;
}

// Enriched types for UI

export interface SpecialistUserListItem {
  relation: SpecialistUserRelation;
  user_name: string | null;
  user_email: string;
  last_session_date: string | null;
  session_count: number;
}

export interface SpecialistSessionNoteWithUser extends SpecialistSessionNote {
  user_name: string | null;
  user_email: string;
}

export interface SpecialistBitacoraEntryListItem extends SpecialistBitacoraEntry {
  specialist_name: string | null;
  source: 'specialist';
}

export interface SpecialistInvitationWithName extends SpecialistUserRelation {
  specialist_name: string;
}

// Input types

export interface CreateSpecialistSessionNoteInput {
  user_id: string;
  relation_id: string;
  session_type?: string;
  session_date: string;
  duration_minutes?: number | null;
  private_notes: { id: string; text: string }[];
  private_followup?: string;
  shared_recommendations: RecommendationItem[];
}

export interface UpdateSpecialistSessionNoteInput {
  session_type?: string;
  session_date?: string;
  duration_minutes?: number | null;
  private_notes?: { id: string; text: string }[];
  private_followup?: string;
  shared_recommendations?: RecommendationItem[];
  lock_version: number;
}

export interface SpecialistSessionListFilters {
  user_id?: string;
  cursor?: string;
  limit?: number;
  search?: string;
}
