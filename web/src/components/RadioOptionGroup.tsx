import { type ReactNode, useEffect, useRef } from 'react';
import { type OptionState, SelectableOption } from './SelectableOption';

interface RadioOptionGroupProps<T> {
  ariaLabel: string;
  items: T[];
  getKey: (item: T) => string;
  renderLabel: (item: T) => ReactNode;
  selectedKey: string | undefined;
  onSelect: (item: T) => void;
  heading?: ReactNode;
  indicator?: (item: T, isSelected: boolean, index: number) => ReactNode;
  getState?: (item: T, isSelected: boolean) => OptionState;
  density?: 'compact' | 'comfortable';
  disabled?: boolean;
  /** Allow 1..n keys to select the matching option directly. */
  numberKeys?: boolean;
  /** Move focus to the first option on mount (used while answering a drill). */
  autoFocusFirst?: boolean;
  /** Which option holds the roving tabindex when focus enters the group. */
  rovingAnchor?: 'selected' | 'first';
}

export function RadioOptionGroup<T>({
  ariaLabel,
  items,
  getKey,
  renderLabel,
  selectedKey,
  onSelect,
  heading,
  indicator,
  getState,
  density,
  disabled = false,
  numberKeys = false,
  autoFocusFirst = false,
  rovingAnchor = 'selected',
}: RadioOptionGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (autoFocusFirst && !disabled) refs.current[0]?.focus();
  }, [autoFocusFirst, disabled]);

  function moveFocus(currentIndex: number, direction: 1 | -1) {
    const count = refs.current.length;
    if (count === 0) return;
    const nextIndex = (currentIndex + direction + count) % count;
    refs.current[nextIndex]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number, item: T) {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(index, 1);
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(index, -1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item);
    }
    if (numberKeys) {
      const num = Number(event.key);
      const target =
        num >= 1 && num <= items.length ? items[num - 1] : undefined;
      if (target) onSelect(target);
    }
  }

  return (
    <div className="space-y-2">
      {heading !== undefined && <p className="text-secondary">{heading}</p>}
      <div role="radiogroup" aria-label={ariaLabel} className="space-y-1">
        {items.map((item, index) => {
          const key = getKey(item);
          const isSelected = key === selectedKey;
          const state = getState
            ? getState(item, isSelected)
            : isSelected
              ? 'selected'
              : 'default';
          const tabIndex = disabled
            ? -1
            : rovingAnchor === 'first'
              ? index === 0
                ? 0
                : -1
              : isSelected
                ? 0
                : -1;

          return (
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- CLI-style options need a styleable <button>; a native radio cannot match the design
            <SelectableOption
              key={key}
              ref={(element) => {
                refs.current[index] = element;
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={tabIndex}
              disabled={disabled}
              state={state}
              density={density}
              indicator={indicator?.(item, isSelected, index)}
              onClick={() => onSelect(item)}
              onKeyDown={(event) => handleKeyDown(event, index, item)}
            >
              {renderLabel(item)}
            </SelectableOption>
          );
        })}
      </div>
    </div>
  );
}
