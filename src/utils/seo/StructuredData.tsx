interface Props {
  readonly data: Record<string, unknown>;
}

export default function StructuredData({ data }: Props) {
  if (!data) {return null;}

  const jsonLd = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json">{jsonLd}</script>;
}
