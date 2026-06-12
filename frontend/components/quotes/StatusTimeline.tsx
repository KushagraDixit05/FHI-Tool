'use client';

import { CheckCircle, Circle, Clock } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants';
import { formatDate } from '@/lib/utils';
import type { QuoteStatusHistory } from '@/types';

interface StatusTimelineProps {
  history: QuoteStatusHistory[];
  currentStatus: string;
}

const STATUS_ORDER = [
  'DRAFT',
  'UNDER_REVIEW',
  'SENT_TO_BUYER',
  'NEGOTIATION',
  'APPROVED',
  'PO_RECEIVED',
  'SHIPMENT_PLANNED',
  'CLOSED',
];

export function StatusTimeline({ history, currentStatus }: StatusTimelineProps) {
  const latestByStatus: Record<string, QuoteStatusHistory> = {};
  for (const entry of history) {
    if (!latestByStatus[entry.toStatus]) {
      latestByStatus[entry.toStatus] = entry;
    }
  }

  const isLost = currentStatus === 'LOST';
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-2">
      {isLost && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-3">
          <Circle className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-red-700">Quote Lost</div>
            {latestByStatus['LOST']?.changedAt && (
              <div className="text-xs text-red-500">{formatDate(latestByStatus['LOST'].changedAt)}</div>
            )}
            {latestByStatus['LOST']?.note && (
              <div className="text-xs text-red-600 mt-0.5">{latestByStatus['LOST'].note}</div>
            )}
          </div>
        </div>
      )}

      <div className="relative pl-5">
        {/* Vertical line */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />

        {STATUS_ORDER.map((status, index) => {
          const entry = latestByStatus[status];
          const reached = currentIndex >= index || !!entry;
          const isCurrent = status === currentStatus;

          return (
            <div key={status} className="relative flex items-start gap-3 mb-4 last:mb-0">
              {/* Dot */}
              <div
                className={`absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  isCurrent
                    ? 'bg-slate-800 shadow-sm'
                    : reached
                    ? 'bg-emerald-500'
                    : 'bg-white border-2 border-slate-200'
                }`}
              >
                {isCurrent ? (
                  <Clock className="w-3 h-3 text-white" />
                ) : reached ? (
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                ) : null}
              </div>

              {/* Content */}
              <div className="ml-6 pb-1">
                <div className={`text-sm font-medium ${isCurrent ? 'text-slate-900' : reached ? 'text-slate-700' : 'text-slate-400'}`}>
                  {STATUS_LABELS[status]}
                </div>
                {entry && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(entry.changedAt)}
                    {entry.changedBy?.name && ` · ${entry.changedBy.name}`}
                    {entry.note && <span className="block italic text-slate-400">"{entry.note}"</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
