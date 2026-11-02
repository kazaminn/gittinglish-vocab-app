import { PRIVACY_POLICY } from './documents';
import { LegalDocument } from './LegalDocument';

export function PrivacyPage() {
  return (
    <LegalDocument
      content={PRIVACY_POLICY}
      related={{ to: '/terms', label: '利用規約' }}
    />
  );
}
