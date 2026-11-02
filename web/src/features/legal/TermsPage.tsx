import { TERMS } from './documents';
import { LegalDocument } from './LegalDocument';

export function TermsPage() {
  return (
    <LegalDocument
      content={TERMS}
      related={{ to: '/privacy', label: 'プライバシーポリシー' }}
    />
  );
}
