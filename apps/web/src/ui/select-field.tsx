import type { ReactNode, SelectHTMLAttributes } from 'react';
import { Field, fieldControlClassName, fieldControlProps, type FieldProps } from './field.tsx';

type SelectFieldProps = FieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
    children: ReactNode;
  };

export function SelectField({
  id,
  label,
  hint,
  error,
  children,
  ...selectProps
}: SelectFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <select
        className={fieldControlClassName}
        {...fieldControlProps(id, error, hint)}
        {...selectProps}
      >
        {children}
      </select>
    </Field>
  );
}
