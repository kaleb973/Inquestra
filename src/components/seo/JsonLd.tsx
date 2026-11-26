import type { SchemaNode } from '@/lib/seo';

interface JsonLdProps {
  data: SchemaNode;
}

/**
 * Renders a Schema.org JSON-LD script block with `<` escaped to prevent script breakout.
 */
export function JsonLd({ data }: JsonLdProps) {
  const serialized = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
