// Bitacora (Session Journal) types

// Session type is now free text (max 60 chars)
// Keep legacy union for backwards-compat display
export type SessionType = string;
export type SessionVisibility = 'DEFAULT' | 'PRIVATE';
export type AttachmentType = 'LINK' | 'FILE';

// ============================================================
// Database row types
// ============================================================

export interface JournalSession {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  date: string;
  provider_name: string | null;
  notes: string | null;
  duration_minutes: number | null;
  domain_id: string | null;
  goal_id: string | null;
  visibility: SessionVisibility;
  shared_space_id: string | null;
  lock_version: number;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionInsight {
  id: string;
  session_id: string;
  user_id: string;
  text: string;
  note: string | null;
  is_primary: boolean;
  is_shared: boolean;
  domain_id: string | null;
  goal_id: string | null;
  order_index: number;
  created_at: string;
  createdByName?: string | null;
}

export interface SessionAction {
  id: string;
  session_id: string;
  user_id: string;
  text: string;
  frequency_type: string | null;
  frequency_value: number | null;
  target_date: string | null;
  is_shared: boolean;
  domain_id: string | null;
  goal_id: string | null;
  lifeplan_activity_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  createdByName?: string | null;
}

export interface SessionAttachment {
  id: string;
  session_id: string;
  user_id: string;
  type: AttachmentType;
  url: string | null;
  file_path: string | null;
  label: string | null;
  is_shared: boolean;
  created_at: string;
  createdByName?: string | null;
}

// ============================================================
// Composite types
// ============================================================

export interface SessionWithRelations extends JournalSession {
  insights: SessionInsight[];
  actions: SessionAction[];
  attachments: SessionAttachment[];
  domain?: { id: string; name: string; icon: string | null } | null;
  goal?: { id: string; title: string } | null;
  // Shared session fields
  sharedSpaceName: string | null;
  createdByName: string | null;
  lastEditedByName: string | null;
  lockVersion: number;
  isOwner: boolean;
  isArchived: boolean;
  canAddItems: boolean;
  currentUserId: string;
}

export interface SessionListItem {
  id: string;
  type: string;
  title: string | null;
  date: string;
  provider_name: string | null;
  visibility: SessionVisibility;
  domain_name: string | null;
  domain_icon: string | null;
  goal_title: string | null;
  insight_count: number;
  action_count: number;
  created_at: string;
  // Shared session fields
  shared_space_id: string | null;
  sharedSpaceName: string | null;
  createdByName: string | null;
  isShared: boolean;
}

// ============================================================
// Shared Spaces types
// ============================================================

export interface SharedSpace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: SharedSpaceMember[];
}

export interface SharedSpaceMember {
  id: string;
  spaceId: string;
  userId: string | null;
  invitedEmail: string;
  role: 'owner' | 'collaborator';
  status: 'pending' | 'accepted' | 'rejected';
  permissions: { canEdit: boolean };
  createdAt: string;
  updatedAt: string;
  userName?: string;
}

export interface PendingInvitation {
  id: string;
  spaceId: string;
  spaceName: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
}

export interface CreateSharedSpaceInput {
  name: string;
  inviteEmail: string;
}

export interface SessionConflictInfo {
  currentVersion: number;
  lastEditedBy: string;
  lastEditedByName: string;
  lastEditedAt: string;
}

export interface JournalSessionUserState {
  id: string;
  sessionId: string;
  userId: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Input types (for server actions)
// ============================================================

export interface CreateInsightInput {
  text: string;
  note?: string;
  is_primary?: boolean;
  is_shared?: boolean;
  domain_id?: string | null;
  goal_id?: string | null;
  order_index: number;
}

export interface CreateActionInput {
  text: string;
  frequency_type?: string | null;
  frequency_value?: number | null;
  target_date?: string | null;
  is_shared?: boolean;
  domain_id?: string | null;
  goal_id?: string | null;
  order_index: number;
}

export interface CreateAttachmentInput {
  type: AttachmentType;
  url?: string;
  label?: string;
  is_shared?: boolean;
}

export interface CreateSessionInput {
  type: string;
  date: string;
  title?: string;
  provider_name?: string;
  notes?: string;
  duration_minutes?: number;
  domain_id?: string | null;
  goal_id?: string | null;
  visibility?: SessionVisibility;
  insights: CreateInsightInput[];
  actions: CreateActionInput[];
  attachments: CreateAttachmentInput[];
  sharedSpaceId?: string | null;
}

export interface UpdateSessionInput extends Partial<Omit<CreateSessionInput, 'insights' | 'actions' | 'attachments'>> {
  insights?: CreateInsightInput[];
  actions?: CreateActionInput[];
  attachments?: CreateAttachmentInput[];
  lockVersion?: number;
}

export interface SessionListFilters {
  type?: string;
  domain_id?: string;
  goal_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  cursor?: string;
  ownership?: 'all' | 'mine' | 'shared';
  spaceId?: string;
  archived?: boolean;
}

// ============================================================
// Constants (backwards compat)
// ============================================================

export const SESSION_TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: 'PSICOLOGIA', label: 'Psicologia' },
  { key: 'INVERSIONES', label: 'Inversiones' },
  { key: 'MEDICA', label: 'Medica' },
  { key: 'OTRA', label: 'Otra' },
];

export const SESSION_TYPE_LABELS: Record<string, string> = {
  PSICOLOGIA: 'Psicologia',
  INVERSIONES: 'Inversiones',
  MEDICA: 'Medica',
  OTRA: 'Otra',
};

export const SESSION_TYPES: string[] = ['PSICOLOGIA', 'INVERSIONES', 'MEDICA', 'OTRA'];

export const VALID_SESSION_TYPES = new Set<string>(SESSION_TYPES);
