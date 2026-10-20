export function toFieldErrors<Field extends string>(
  issues: readonly { path: readonly PropertyKey[] }[],
  messages: Record<Field, string>,
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (isKnownField(field, messages)) {
      errors[field] = messages[field];
    }
  }
  return errors;
}

function isKnownField<Field extends string>(
  field: PropertyKey | undefined,
  messages: Record<Field, string>,
): field is Field {
  return typeof field === 'string' && Object.hasOwn(messages, field);
}
