import { useState, type CSSProperties } from 'react';
import { formatDate, parseDisplayDate } from '@/utils/dates';
import '../styles/DateInput.css';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  style?: CSSProperties;
  label: string;
}

export const DateInput = ({ value, onChange, min, max, required, className, style, label }: DateInputProps) => {
  const [draft, setDraft] = useState({ source: value, text: formatDate(value) });
  const text = draft.source === value ? draft.text : formatDate(value);
  const parsed = parseDisplayDate(text);
  const error = text && !parsed ? 'Enter a valid date as MM/DD/YYYY.'
    : parsed && min && parsed < min ? `Date must be on or after ${formatDate(min)}.`
    : parsed && max && parsed > max ? `Date must be on or before ${formatDate(max)}.` : '';

  const update = (nextText: string) => {
    const nextDate = parseDisplayDate(nextText);
    const valid = nextDate && (!min || nextDate >= min) && (!max || nextDate <= max);
    const nextValue = valid ? nextDate : '';
    setDraft({ source: nextValue, text: nextText });
    onChange(nextValue);
  };

  return (
    <span className="us-date-field" style={style}>
      <input
        ref={element => element?.setCustomValidity(error)}
        type="text"
        className={className}
        value={text}
        onChange={event => update(event.target.value)}
        placeholder="MM/DD/YYYY"
        aria-label={label}
        aria-invalid={Boolean(error)}
        title={error || 'MM/DD/YYYY'}
        required={required}
        maxLength={10}
        autoComplete="off"
      />
      <input
        type="date"
        className="us-date-picker"
        aria-label={`${label} calendar`}
        title={`${label} calendar`}
        value={value}
        min={min}
        max={max}
        onChange={event => update(formatDate(event.target.value))}
      />
    </span>
  );
};
