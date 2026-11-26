import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '../../settings/settings-page.tsx';

export const Route = createFileRoute('/_app/parametrage')({
  component: SettingsPage,
});
