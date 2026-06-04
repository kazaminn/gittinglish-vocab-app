import { type Choice } from '@shared/domain';
import { RadioOptionGroup } from './RadioOptionGroup';
import { type OptionState } from './SelectableOption';

interface ChoiceListProps {
  choices: Choice[];
  selectedId: string | undefined;
  correctId: string;
  showResult: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export function ChoiceList({
  choices,
  selectedId,
  correctId,
  showResult,
  onSelect,
  disabled,
}: ChoiceListProps) {
  function getState(choice: Choice, isSelected: boolean): OptionState {
    if (showResult && choice.id === correctId) return 'correct';
    if (showResult && isSelected && choice.id !== correctId) return 'incorrect';
    if (isSelected && !showResult) return 'selected';
    return 'default';
  }

  return (
    <RadioOptionGroup
      ariaLabel="Answer choices"
      items={choices}
      getKey={(choice) => choice.id}
      renderLabel={(choice) => choice.text}
      selectedKey={selectedId}
      onSelect={(choice) => onSelect(choice.id)}
      getState={getState}
      indicator={(_choice, _isSelected, index) => `[${index + 1}]`}
      density="comfortable"
      disabled={disabled}
      numberKeys
      autoFocusFirst
      rovingAnchor="first"
    />
  );
}
