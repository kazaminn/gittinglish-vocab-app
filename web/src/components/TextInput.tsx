import { useEffect, useRef, useState } from 'react';

interface TextInputProps {
  onSubmit: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function TextInput({ onSubmit, disabled, placeholder }: TextInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim() !== '') {
      e.preventDefault();
      onSubmit(value);
    }
  }

  function handleSubmit() {
    if (value.trim() !== '') {
      onSubmit(value);
    }
  }

  return (
    <div
      className="flex items-center gap-2 rounded-sm border px-4 py-3"
      style={{
        background: disabled ? 'transparent' : 'var(--bg-interactive)',
        borderColor: disabled ? 'var(--border-subtle)' : 'var(--border-accent)',
      }}
    >
      <span
        className="text-sm select-none"
        style={{ color: 'var(--text-muted)' }}
        aria-hidden="true"
      >
        &gt;
      </span>
      <input
        ref={inputRef}
        type="text"
        value={disabled ? '' : value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Type your answer"
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-transparent font-mono text-base outline-none placeholder:opacity-50"
        style={{ color: 'var(--text-primary)' }}
      />
      {!disabled && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={value.trim() === ''}
          className="shrink-0 rounded-sm border px-3 py-1 text-sm"
          style={{
            borderColor:
              value.trim() !== ''
                ? 'var(--border-accent)'
                : 'var(--border-subtle)',
            color:
              value.trim() !== '' ? 'var(--text-accent)' : 'var(--text-muted)',
            background: 'transparent',
          }}
        >
          enter
        </button>
      )}
    </div>
  );
}
