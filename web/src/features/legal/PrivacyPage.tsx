import { LegalDocument } from './LegalDocument';
import { PRIVACY_POLICY } from './documents';

export function PrivacyPage() {
  return (
    <LegalDocument
      content={PRIVACY_POLICY}
      related={{ to: '/terms', label: '利用規約' }}
    />
  );
}
