'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  ExternalLink,
  Zap,
  Calendar,
  Clock,
  User,
  Loader2,
  Users,
  Pencil,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  sendActionToLifePlan,
  getSession,
} from '@/lib/actions/journal-actions';
import type { SessionWithRelations, SessionAction, SessionInsight, SessionAttachment } from '@/lib/types/journal';
import { SESSION_TYPE_LABELS } from '@/lib/types/journal';
import { FREQUENCY_OPTIONS } from '@/lib/types/lifeplan';
import { cn } from '@/lib/utils';

interface SessionDetailProps {
  session: SessionWithRelations;
  onSessionUpdate: (session: SessionWithRelations) => void;
}

function getFrequencyLabel(type: string | null): string | null {
  if (!type) return null;
  return FREQUENCY_OPTIONS.find((f) => f.key === type)?.label || type;
}

export function SessionDetail({ session, onSessionUpdate }: SessionDetailProps) {
  const [sendingActionId, setSendingActionId] = useState<string | null>(null);

  const isShared = !!session.shared_space_id;
  // Owner of a shared session can see private-item indicators
  const showPrivateIndicator = isShared && session.isOwner;
  // Show per-item creator name for shared sessions
  const showItemCreator = isShared;

  const formattedDate = new Date(session.date + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const typeLabel = SESSION_TYPE_LABELS[session.type] || session.type;

  const refreshSession = async () => {
    const updated = await getSession(session.id);
    onSessionUpdate(updated);
  };

  const handleSendToLifePlan = async (actionId: string) => {
    setSendingActionId(actionId);
    try {
      await sendActionToLifePlan(actionId);
      await refreshSession();
    } catch {
      // Silently handle - likely already exists
    } finally {
      setSendingActionId(null);
    }
  };

  return (
    <Tabs defaultValue="resumen">
      <TabsList className="w-full">
        <TabsTrigger value="resumen" className="flex-1">Resumen</TabsTrigger>
        <TabsTrigger value="insights" className="flex-1">
          Insights ({session.insights.length})
        </TabsTrigger>
        <TabsTrigger value="acciones" className="flex-1">
          Acciones ({session.actions.length})
        </TabsTrigger>
        <TabsTrigger value="adjuntos" className="flex-1">
          Adjuntos ({session.attachments.length})
        </TabsTrigger>
      </TabsList>

      {/* Tab: Resumen */}
      <TabsContent value="resumen">
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {typeLabel}
              </Badge>
              {session.shared_space_id && session.sharedSpaceName && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {session.sharedSpaceName}
                </Badge>
              )}
              {session.visibility === 'PRIVATE' && (
                <Badge variant="outline">Privada</Badge>
              )}
              {session.domain && (
                <Badge variant="secondary">
                  {session.domain.icon && <span className="mr-1">{session.domain.icon}</span>}
                  {session.domain.name}
                </Badge>
              )}
              {session.goal && (
                <Badge variant="outline">{session.goal.title}</Badge>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="capitalize">{formattedDate}</span>
              </div>
              {session.provider_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{session.provider_name}</span>
                </div>
              )}
              {session.duration_minutes && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{session.duration_minutes} min</span>
                </div>
              )}
            </div>

            {/* Shared session metadata */}
            {session.shared_space_id && (
              <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
                {session.createdByName && (
                  <p>Creada por: {session.createdByName}</p>
                )}
                {session.lastEditedByName && (
                  <p className="flex items-center gap-1">
                    <Pencil className="h-3 w-3" />
                    Última edición por: {session.lastEditedByName}
                    {session.updated_at && (
                      <span>
                        {' · '}
                        {new Date(session.updated_at).toLocaleDateString('es-PE', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {session.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab: Insights */}
      <TabsContent value="insights">
        {session.insights.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No se registraron insights en esta sesión.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {session.insights.map((insight) => (
              <InsightRow
                key={insight.id}
                insight={insight}
                showPrivateIndicator={showPrivateIndicator}
                showItemCreator={showItemCreator}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab: Acciones */}
      <TabsContent value="acciones">
        {session.actions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No se registraron acciones para esta sesión.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {session.actions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                isSending={sendingActionId === action.id}
                onSendToLifePlan={handleSendToLifePlan}
                showPrivateIndicator={showPrivateIndicator}
                showItemCreator={showItemCreator}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab: Adjuntos */}
      <TabsContent value="adjuntos">
        {session.attachments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Sin adjuntos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {session.attachments.map((att) => (
              <AttachmentRow
                key={att.id}
                attachment={att}
                showPrivateIndicator={showPrivateIndicator}
                showItemCreator={showItemCreator}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

// ============================================================
// Action Row sub-component (read-only + "Enviar a Mi Plan")
// ============================================================

function ActionRow({
  action,
  isSending,
  onSendToLifePlan,
  showPrivateIndicator,
  showItemCreator,
}: {
  action: SessionAction;
  isSending: boolean;
  onSendToLifePlan: (id: string) => void;
  showPrivateIndicator: boolean;
  showItemCreator: boolean;
}) {
  const freqLabel = getFrequencyLabel(action.frequency_type);
  const hasFrequency = !!action.frequency_type;
  const isInLifePlan = !!action.lifeplan_activity_id;

  return (
    <Card className={cn(showPrivateIndicator && !action.is_shared && 'border-dashed opacity-75')}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {showPrivateIndicator && !action.is_shared && (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <p className="text-sm flex-1">{action.text}</p>
          <div className="flex items-center gap-1 shrink-0">
            {isInLifePlan ? (
              <Link href={`/mi-plan/actividad/${action.lifeplan_activity_id}`}>
                <Badge variant="outline" className="shrink-0 text-green-600 border-green-300 gap-1">
                  <Star className="h-3 w-3 fill-green-600" />
                  En Mi Plan
                </Badge>
              </Link>
            ) : hasFrequency ? (
              <Button
                variant="outline"
                size="xs"
                onClick={() => onSendToLifePlan(action.id)}
                disabled={isSending}
                className="shrink-0"
              >
                {isSending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3" />
                )}
                Enviar a Mi Plan
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {freqLabel && (
            <Badge variant="secondary" className="text-xs">
              {freqLabel}
            </Badge>
          )}
          {action.target_date && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(action.target_date + 'T12:00:00').toLocaleDateString('es-PE', {
                day: 'numeric',
                month: 'short',
              })}
            </Badge>
          )}
          {showItemCreator && action.createdByName && (
            <span className="text-xs text-muted-foreground ml-auto">
              {action.createdByName}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Insight Row sub-component (read-only)
// ============================================================

function InsightRow({
  insight,
  showPrivateIndicator,
  showItemCreator,
}: {
  insight: SessionInsight;
  showPrivateIndicator: boolean;
  showItemCreator: boolean;
}) {
  return (
    <Card
      className={cn(
        insight.is_primary && 'border-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-950/10',
        showPrivateIndicator && !insight.is_shared && 'border-dashed opacity-75'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          {insight.is_primary && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 space-y-1">
            <p className="text-sm">{insight.text}</p>
            {insight.note && (
              <p className="text-xs text-muted-foreground">{insight.note}</p>
            )}
          </div>
          {showPrivateIndicator && !insight.is_shared && (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
        </div>
        {showItemCreator && insight.createdByName && (
          <p className="text-xs text-muted-foreground text-right mt-2">
            {insight.createdByName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Attachment Row sub-component (read-only)
// ============================================================

function AttachmentRow({
  attachment,
  showPrivateIndicator,
  showItemCreator,
}: {
  attachment: SessionAttachment;
  showPrivateIndicator: boolean;
  showItemCreator: boolean;
}) {
  return (
    <Card className={cn(showPrivateIndicator && !attachment.is_shared && 'border-dashed opacity-75')}>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          <a
            href={attachment.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate flex-1"
          >
            {attachment.label || attachment.url}
          </a>
          {showPrivateIndicator && !attachment.is_shared && (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
        {showItemCreator && attachment.createdByName && (
          <p className="text-xs text-muted-foreground text-right">
            {attachment.createdByName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
