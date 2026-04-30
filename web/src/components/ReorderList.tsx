import { useMemo, useState } from 'react';
import { type ID, type ReorderChunk } from '@shared/domain';

interface ReorderListProps {
  chunks: ReorderChunk[];
  onSubmit: (orderedIds: ID[]) => void;
  disabled: boolean;
  /** When set, shows correct/incorrect highlighting */
  correctOrder?: ID[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function ReorderList({
  chunks,
  onSubmit,
  disabled,
  correctOrder,
}: ReorderListProps) {
  const [slotIds, setSlotIds] = useState<(ID | undefined)[]>(() =>
    Array.from({ length: chunks.length }, () => undefined)
  );
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  const [candidateOrder] = useState<ID[]>(() =>
    shuffleArray(chunks.map((chunk) => chunk.id))
  );

  const chunkMap = useMemo(
    () => new Map(chunks.map((chunk) => [chunk.id, chunk])),
    [chunks]
  );
  const availableIds = candidateOrder.filter((id) => !slotIds.includes(id));
  const isComplete = slotIds.every((id) => id !== undefined);

  function placeChunk(chunkId: ID) {
    if (disabled) return;

    setSlotIds((prev) => {
      const next = [...prev];
      const targetIdx = next[activeSlotIdx] === undefined
        ? activeSlotIdx
        : next.findIndex((id) => id === undefined);
      const resolvedIdx = targetIdx >= 0 ? targetIdx : activeSlotIdx;
      next[resolvedIdx] = chunkId;
      return next;
    });

    setActiveSlotIdx((prev) => {
      const nextEmptyIdx = slotIds.findIndex((id, idx) => idx > prev && id === undefined);
      return nextEmptyIdx >= 0 ? nextEmptyIdx : prev;
    });
  }

  function clearSlot(slotIdx: number) {
    if (disabled) return;

    setSlotIds((prev) => {
      const next = [...prev];
      next[slotIdx] = undefined;
      return next;
    });
    setActiveSlotIdx(slotIdx);
  }

  function getSlotStyle(slotIdx: number) {
    const slotId = slotIds[slotIdx];
    let background = 'transparent';
    let borderColor =
      activeSlotIdx === slotIdx ? 'var(--border-accent)' : 'var(--border-subtle)';
    let textColor = 'var(--text-primary)';

    if (slotId && !correctOrder) {
      background = 'var(--bg-selected)';
    }

    if (correctOrder && slotId) {
      const isCorrectPosition = correctOrder[slotIdx] === slotId;
      background = isCorrectPosition ? 'var(--bg-success)' : 'var(--bg-error)';
      borderColor = isCorrectPosition
        ? 'var(--border-success)'
        : 'var(--border-error)';
      textColor = isCorrectPosition
        ? 'var(--text-success)'
        : 'var(--text-error)';
    }

    return { background, borderColor, color: textColor };
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          select a slot, then choose a chunk below
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {slotIds.map((slotId, slotIdx) => {
            const slotChunk = slotId ? chunkMap.get(slotId) : undefined;
            const isEmpty = slotChunk === undefined;

            return (
              <button
                key={`slot-${chunks[slotIdx]?.id ?? 'unknown'}`}
                type="button"
                onClick={() => {
                  if (isEmpty) {
                    setActiveSlotIdx(slotIdx);
                  } else {
                    clearSlot(slotIdx);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveSlotIdx((current) => Math.max(0, current - 1));
                  }

                  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveSlotIdx((current) =>
                      Math.min(slotIds.length - 1, current + 1)
                    );
                  }

                  if (
                    (event.key === 'Backspace' || event.key === 'Delete') &&
                    slotId
                  ) {
                    event.preventDefault();
                    clearSlot(slotIdx);
                  }
                }}
                disabled={disabled}
                aria-label={
                  slotChunk
                    ? `Answer slot ${slotIdx + 1}: ${slotChunk.text}`
                    : `Answer slot ${slotIdx + 1}: empty`
                }
                className="min-h-16 rounded-sm border px-4 py-3 text-left"
                style={getSlotStyle(slotIdx)}
              >
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                  [{slotIdx + 1}]
                </span>
                {slotChunk ? (
                  <span className="mt-2 block">{slotChunk.text}</span>
                ) : (
                  <span
                    className="mt-2 block border-b-2"
                    style={{ borderColor: 'var(--border-accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!disabled && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            chunk bank
          </p>
          <div className="flex flex-wrap gap-2" aria-label="Chunk bank">
            {availableIds.map((id) => {
              const chunk = chunkMap.get(id);
              if (!chunk) return null;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => placeChunk(id)}
                  disabled={disabled}
                  aria-label={`Chunk choice: ${chunk.text}`}
                  className="rounded-sm border px-4 py-3 text-left"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-accent)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {chunk.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={() => onSubmit(slotIds.filter((id): id is ID => id !== undefined))}
          disabled={!isComplete}
          className="w-full rounded-sm border px-4 py-3 text-left"
          style={{
            background: 'transparent',
            borderColor: isComplete
              ? 'var(--border-accent)'
              : 'var(--border-subtle)',
            color: isComplete ? 'var(--text-accent)' : 'var(--text-muted)',
          }}
        >
          &gt; submit order
        </button>
      )}
    </div>
  );
}
