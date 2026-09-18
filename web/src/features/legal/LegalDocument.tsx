import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { type LegalBlock, type LegalDocumentContent } from './documents';

function renderBlock(block: LegalBlock, key: string): ReactNode {
  switch (block.kind) {
    case 'h2':
      return (
        <h2 key={key} className="mt-6 text-base font-semibold">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={key} className="mt-4 text-sm font-semibold">
          {block.text}
        </h3>
      );
    case 'p':
      return <p key={key}>{block.text}</p>;
    case 'ul':
      return (
        <ul key={key} className="list-disc space-y-1 pl-5">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={key} className="list-decimal space-y-1 pl-5">
          {block.items.map((item) =>
            typeof item === 'string' ? (
              <li key={item}>{item}</li>
            ) : (
              <li key={item.text}>
                {item.text}
                <ol className="mt-1 list-[lower-alpha] space-y-1 pl-5">
                  {item.items.map((nested) => (
                    <li key={nested}>{nested}</li>
                  ))}
                </ol>
              </li>
            )
          )}
        </ol>
      );
  }
}

/**
 * Lays out a legal document. It only arranges what `documents.ts` holds — the
 * wording lives there, verbatim, so that nothing between the agreed text and
 * the page can reword or reflow it.
 */
export function LegalDocument({
  content,
  related,
}: {
  content: LegalDocumentContent;
  related: { to: string; label: string };
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        {content.title}
      </h1>
      <p className="text-text-muted mb-8 text-xs">{content.enacted}</p>

      <article className="text-text space-y-3 text-sm leading-relaxed">
        {content.blocks.map((block, index) =>
          renderBlock(block, `${block.kind}-${String(index)}`)
        )}
      </article>

      <p className="mt-8 text-xs">
        <Link to={related.to} className="underline">
          {related.label}
        </Link>
      </p>
      <p className="mt-2 text-xs">
        <Link to="/" className="text-text-muted hover:underline">
          ← トップへ戻る
        </Link>
      </p>
    </main>
  );
}
