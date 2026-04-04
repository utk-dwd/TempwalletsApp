export const hexToRgba = (hex: string, alpha: number) => {
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const normalizeEvmAddress = (value: string) => value.trim().toLowerCase();

export const isValidEvmAddress = (value: string) =>
  /^0x[a-f0-9]{40}$/.test(normalizeEvmAddress(value));

export const formatUnits = (
  value: string,
  decimals: number,
  maxFractionDigits = 6,
) => {
  try {
    const v = BigInt((value || '0').trim());
    const d = Math.max(0, Math.min(36, decimals || 0));
    const base = 10n ** BigInt(d);
    const whole = v / base;
    const frac = v % base;

    if (frac === 0n || maxFractionDigits === 0) return whole.toString();

    let fracStr = frac.toString().padStart(d, '0');
    fracStr = fracStr.replace(/0+$/, '');
    if (fracStr.length > maxFractionDigits) {
      fracStr = fracStr.slice(0, maxFractionDigits).replace(/0+$/, '');
    }
    return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  } catch {
    return '0';
  }
};

export const extractPrimaryEvmAddressFromUiPayload = (
  payload: any,
): string | null => {
  const smartAddress = payload?.smartAccount?.address;
  if (typeof smartAddress === 'string' && smartAddress.trim()) {
    return smartAddress.trim();
  }

  const aux = payload?.auxiliary;
  if (Array.isArray(aux)) {
    const eth = aux.find(
      (e: any) =>
        e?.chain === 'ethereum' &&
        typeof e?.address === 'string' &&
        e.address.trim(),
    );
    if (eth?.address) return String(eth.address).trim();

    const anyEvm = aux.find(
      (e: any) =>
        ['base', 'arbitrum', 'polygon', 'avalanche'].includes(e?.chain) &&
        typeof e?.address === 'string' &&
        e.address.trim(),
    );
    if (anyEvm?.address) return String(anyEvm.address).trim();
  }

  return null;
};
