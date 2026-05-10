import { Check } from "lucide-react";

interface Feature {
  title: string;
  desc: string;
}

interface FeatureListProps {
  items: Feature[];
}

export function FeatureList({ items }: FeatureListProps) {
  return (
    <ul className="space-y-5">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-4">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-validation">
            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-body-sm font-semibold text-ink-strong">
              {item.title}
            </p>
            <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
              {item.desc}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
