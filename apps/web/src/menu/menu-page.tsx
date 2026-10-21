import { PageHeader } from '../ui/page-header.tsx';
import { MenuEditor } from './menu-editor.tsx';

export function MenuPage() {
  return (
    <section className="max-w-3xl">
      <PageHeader
        title="Carte de la caisse"
        subtitle="La carte par défaut, proposée à l'ouverture de chaque soirée, dans l'ordre d'affichage"
      />
      <MenuEditor />
    </section>
  );
}
