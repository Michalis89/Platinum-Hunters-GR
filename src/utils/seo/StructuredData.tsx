'use client';

interface Props {
  readonly data: Record<string, unknown>;
}

export default function StructuredData({ data }: Props) {
  if (!data) return null;

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
