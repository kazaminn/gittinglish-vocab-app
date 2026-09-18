import { LegalDocument } from './LegalDocument';
import { TERMS } from './documents';

export function TermsPage() {
  return (
    <LegalDocument
      content={TERMS}
      related={{ to: '/privacy', label: 'プライバシーポリシー' }}
    />
  );
}
