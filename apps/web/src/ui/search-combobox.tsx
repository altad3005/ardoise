import { useState, type KeyboardEvent } from 'react';
import { Field, fieldControlClassName, fieldControlProps } from './field.tsx';

export interface SearchOption {
  id: string;
  label: string;
  detail?: string;
}

interface SearchComboboxProps {
  id: string;
  label: string;
  placeholder?: string;
  hint?: string;
  options: SearchOption[];
  disabled?: boolean;
  onSelect: (optionId: string) => void;
}

const maxSuggestions = 8;

export function SearchCombobox({
  id,
  label,
  placeholder,
  hint,
  options,
  disabled,
  onSelect,
}: SearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const search = normalize(query.trim());
  const suggestions =
    search === ''
      ? []
      : options
          .filter((option) => normalize(option.label).includes(search))
          .slice(0, maxSuggestions);
  const isShowingSuggestions = isOpen && search !== '';
  const isExpanded = isShowingSuggestions && suggestions.length > 0;
  const activeOption = isExpanded ? suggestions[activeIndex] : undefined;
  const listboxId = `${id}-suggestions`;
  const optionElementId = (option: SearchOption) => `${id}-option-${option.id}`;

  const select = (option: SearchOption) => {
    onSelect(option.id);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const highlight = (offset: -1 | 1) => {
    const count = suggestions.length;
    if (count === 0) {
      return;
    }
    setIsOpen(true);
    setActiveIndex((index) =>
      index === -1 ? (offset === 1 ? 0 : count - 1) : (index + offset + count) % count,
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      highlight(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && activeOption) {
      event.preventDefault();
      select(activeOption);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <input
          className={fieldControlClassName}
          {...fieldControlProps(id, null, hint)}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          aria-activedescendant={activeOption ? optionElementId(activeOption) : undefined}
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setIsOpen(false)}
        />
        {isShowingSuggestions && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-lg">
            {suggestions.length === 0 ? (
              <p className="px-3 py-2 text-ink-muted">Aucun résultat</p>
            ) : (
              <ul
                id={listboxId}
                role="listbox"
                aria-label={label}
                className="max-h-72 overflow-y-auto py-1"
              >
                {suggestions.map((option, index) => (
                  <li
                    key={option.id}
                    id={optionElementId(option)}
                    role="option"
                    aria-selected={index === activeIndex}
                    className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 hover:bg-surface-raised aria-selected:bg-surface-raised"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(option)}
                  >
                    <span className="min-w-0 break-words">{option.label}</span>
                    {option.detail && (
                      <span className="shrink-0 text-sm text-ink-muted">{option.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}
