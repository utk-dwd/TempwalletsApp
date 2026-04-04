export type WalletNetworkItem = {
  id: string;
  symbol: string;
  name: string;
  badge: '7702' | 'EOA';
  color: string;
  logo: string;
  dot?: boolean;
};

type WalletNetworkGroup = {
  title: string;
  items: WalletNetworkItem[];
};

export const NETWORK_LIST: WalletNetworkGroup[] = [
  {
    title: 'GASLESS CHAINS / EIP-7702',
    items: [
      {
        id: 'ethereumErc4337',
        symbol: 'ETH',
        name: 'Ethereum',
        badge: '7702',
        color: '#627EEA',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        dot: true,
      },
      {
        id: 'baseErc4337',
        symbol: 'BASE',
        name: 'Base',
        badge: '7702',
        color: '#0052FF',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
      },
      {
        id: 'polygonErc4337',
        symbol: 'MATIC',
        name: 'Polygon',
        badge: '7702',
        color: '#8247E5',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
      },
      {
        id: 'avalancheErc4337',
        symbol: 'AVAX',
        name: 'Avalanche',
        badge: '7702',
        color: '#E84142',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
      },
      {
        id: 'arbitrumErc4337',
        symbol: 'ARB',
        name: 'Arbitrum',
        badge: '7702',
        color: '#28A0F0',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
      },
    ],
  },
  {
    title: 'EVM EOA WALLETS',
    items: [
      {
        id: 'ethereumEoa',
        symbol: 'ETH',
        name: 'Ethereum',
        badge: 'EOA',
        color: '#627EEA',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      },
      {
        id: 'baseEoa',
        symbol: 'BASE',
        name: 'Base',
        badge: 'EOA',
        color: '#0052FF',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
      },
      {
        id: 'arbitrumEoa',
        symbol: 'ARB',
        name: 'Arbitrum',
        badge: 'EOA',
        color: '#28A0F0',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
      },
      {
        id: 'polygonEoa',
        symbol: 'MATIC',
        name: 'Polygon',
        badge: 'EOA',
        color: '#8247E5',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
      },
      {
        id: 'avalancheEoa',
        symbol: 'AVAX',
        name: 'Avalanche',
        badge: 'EOA',
        color: '#E84142',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
      },
    ],
  },
  {
    title: 'COMPATIBLE LIGHTNING NODE WALLETS',
    items: [
      {
        id: 'lnEthereum',
        symbol: 'ETH',
        name: 'Ethereum',
        badge: '7702',
        color: '#627EEA',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        dot: true,
      },
      {
        id: 'lnBase',
        symbol: 'BASE',
        name: 'Base',
        badge: '7702',
        color: '#0052FF',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
      },
      {
        id: 'lnArbitrum',
        symbol: 'ARB',
        name: 'Arbitrum',
        badge: '7702',
        color: '#28A0F0',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
      },
    ],
  },
];

export const DEFAULT_VISIBLE_NETWORK_IDS = [
  'ethereumErc4337',
  'baseErc4337',
  'arbitrumErc4337',
  'polygonErc4337',
];

const FLAT_NETWORK_ITEMS: WalletNetworkItem[] = NETWORK_LIST.flatMap(
  (group) => group.items,
);

export const NETWORK_ITEM_BY_ID = Object.fromEntries(
  FLAT_NETWORK_ITEMS.map((item) => [item.id, item]),
) as Record<string, WalletNetworkItem>;

export const NETWORK_BASE_ASSET_BY_ID: Record<
  string,
  { amount: string; usdValue: string; changePct: string }
> = {
  ethereumErc4337: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  baseErc4337: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  arbitrumErc4337: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  polygonErc4337: { amount: '0.00 MATIC', usdValue: '$0.00', changePct: '+0.00%' },
  avalancheErc4337: { amount: '0.00 AVAX', usdValue: '$0.00', changePct: '+0.00%' },
  ethereumEoa: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  baseEoa: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  arbitrumEoa: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  polygonEoa: { amount: '0.00 MATIC', usdValue: '$0.00', changePct: '+0.00%' },
  avalancheEoa: { amount: '0.00 AVAX', usdValue: '$0.00', changePct: '+0.00%' },
  lnEthereum: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  lnBase: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
  lnArbitrum: { amount: '0.00 ETH', usdValue: '$0.00', changePct: '+0.00%' },
};

export const ACTIONS = [
  { id: 'connect', label: 'Connect', icon: 'link-variant' as const },
  { id: 'send', label: 'Send', icon: 'send' as const },
  { id: 'copy', label: 'Copy', icon: 'content-copy' as const },
  { id: 'history', label: 'History', icon: 'history' as const },
  { id: 'create', label: 'Create New', icon: 'plus-circle-outline' as const },
];

export const ABOUT_SERVICES = [
  {
    id: 'lightning',
    icon: require('../../assets/Risk.png'),
    title: 'Lightning Network Channels',
    description:
      'Open instant low-fee Lightning channels in TempWallet for fast, scalable, cross-chain crypto payments.',
  },
  {
    id: 'gasless',
    icon: require('../../assets/Wallet.png'),
    title: 'Gas-less Burner Wallets',
    description:
      'Receive tokens instantly without gas fees in burner wallets for secure, private transactions.',
  },
  {
    id: 'telegram',
    icon: require('../../assets/Write-Cheque.png'),
    title: 'Secure Telegram Notifications',
    description:
      'Get private, real-time Telegram alerts for all wallet activities to stay informed and protected.',
  },
];

export const ABOUT_TEAM = [
  {
    id: 'rohit',
    name: 'Rohit',
    role: 'Founder',
    image: require('../../assets/Rohit Profile Picture.png'),
    twitter: 'https://x.com/cryptorohittt',
    telegram: 'https://t.me/cryptorohittt',
  },
  {
    id: 'karsh',
    name: 'Karsh',
    role: 'Founding Developer',
    image: require('../../assets/Utkarsh Profile Picture.png'),
    twitter: 'https://x.com/karshingdev',
    telegram: 'https://t.me/karshingdev',
  },
  {
    id: 'rahul',
    name: 'Rahul',
    role: 'Business Development',
    image: require('../../assets/Rahul Profile Picture.png'),
    twitter: 'https://x.com/rahulpandey187',
    telegram: 'https://t.me/rahulpandey187',
  },
  {
    id: 'lavina',
    name: 'Lavina',
    role: 'PR & Communications',
    image: require('../../assets/Lavina Profile Picture.png'),
    twitter: 'https://x.com/lavinafand_21',
    telegram: 'https://t.me/lavinafand_21',
  },
];

export const ABOUT_BLOGS = [
  {
    id: 'blog1',
    image: require('../../assets/3D Black Chrome Shape (16).png'),
    date: 'March 3, 2025',
    title: 'How Tempwallets is Shaping a Trustless Economy',
    description:
      "Blockchain is no longer just a buzzword. It's the backbone of a new era of digital innovation. . .",
    tags: ['Smart', 'Contract', 'Creation'],
  },
  {
    id: 'blog2',
    image: require('../../assets/3D Black Chrome Shape (17).png'),
    date: 'March 10, 2025',
    title: 'Decentralized Finance: The Future of Banking',
    description:
      'Traditional banking systems are being revolutionized by DeFi protocols that offer transparency and accessibility. . .',
    tags: ['Finance', 'Banking', 'Revolution'],
  },
  {
    id: 'blog3',
    image: require('../../assets/3D Black Chrome Shape (21).png'),
    date: 'March 17, 2025',
    title: "Web3 Integration: Building Tomorrow's Internet",
    description:
      'The next generation of the internet is here, powered by decentralized technologies and user ownership. . .',
    tags: ['Web3', 'Internet', 'Future'],
  },
];

export const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Alex C.',
    handle: '@alexcrypto',
    text: 'TempWallets is a game changer for quick degen plays. Love the gasless features!',
  },
  {
    id: 't2',
    name: 'Sarah J.',
    handle: '@sarahweb3',
    text: 'Finally a wallet that respects my privacy without the hassle. The UI is slick too.',
  },
];
