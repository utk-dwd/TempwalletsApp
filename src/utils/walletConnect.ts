import type { WalletConnectProposalEvent } from '../types';

export const getRequestedEip155ChainIds = (
  proposal: WalletConnectProposalEvent,
) => {
  const required = proposal.params.requiredNamespaces?.eip155?.chains || [];
  const optional = proposal.params.optionalNamespaces?.eip155?.chains || [];
  const unique = [...new Set([...required, ...optional])];
  return unique
    .filter((item) => item.startsWith('eip155:'))
    .map((item) => Number(item.split(':')[1]))
    .filter((id) => Number.isFinite(id));
};
