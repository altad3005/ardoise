import type { LucideIcon } from 'lucide-react';
import { classNames } from '../ui/class-names.ts';

interface PanelSectionHeadingProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: 'neutral' | 'accent';
}

export function PanelSectionHeading({
  id,
  icon: Icon,
  title,
  description,
  tone = 'neutral',
}: PanelSectionHeadingProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        aria-hidden="true"
        className={classNames('mt-0.5 size-5 shrink-0', tone === 'accent' && 'text-accent')}
      />
      <div>
        <h3 id={id} className="text-base font-bold">
          {title}
        </h3>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
    </div>
  );
}
