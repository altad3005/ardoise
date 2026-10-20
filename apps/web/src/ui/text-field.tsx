import type { InputHTMLAttributes, ReactNode } from 'react';
import { Field, fieldControlClassName, fieldControlProps, type FieldProps } from './field.tsx';

type TextFieldProps = FieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
    action?: ReactNode;
  };

export function TextField({ id, label, hint, error, action, ...inputProps }: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className="flex gap-2">
        <input
          className={fieldControlClassName}
          {...fieldControlProps(id, error, hint)}
          {...inputProps}
        />
        {action}
      </div>
    </Field>
  );
}
