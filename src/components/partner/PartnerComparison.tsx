'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WheelComparison } from '@/components/wheel/WheelComparison';
import { MessageCircle } from 'lucide-react';
import type { Domain, Score } from '@/lib/types';

interface PartnerComparisonProps {
  domains: Domain[];
  myScores: Score[];
  partnerScores: Score[];
  myName: string;
  partnerName: string;
}

export function PartnerComparison({
  domains,
  myScores,
  partnerScores,
  myName,
  partnerName,
}: PartnerComparisonProps) {
  // Generate conversation points
  const conversationPoints = domains
    .map((domain) => {
      const myScore = myScores.find((s) => s.domain_id === domain.id)?.score ?? 0;
      const partnerScore = partnerScores.find((s) => s.domain_id === domain.id)?.score ?? 0;
      const diff = Math.abs(myScore - partnerScore);
      return { domain, myScore, partnerScore, diff };
    })
    .filter((item) => item.diff >= 3)
    .sort((a, b) => b.diff - a.diff);

  return (
    <div className="space-y-6">
      <WheelComparison
        domains={domains}
        scoresA={myScores}
        scoresB={partnerScores}
        labelA={myName}
        labelB={partnerName}
      />

      {conversationPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5" />
              Puntos de conversación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {conversationPoints.map(({ domain, myScore, partnerScore }) => (
                <li key={domain.id} className="text-sm">
                  <span className="font-medium">{domain.icon} {domain.name}:</span>{' '}
                  <span className="text-muted-foreground">
                    {myName} ({myScore}) vs {partnerName} ({partnerScore}).
                    ¿Cómo se siente cada uno en esta área?
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
