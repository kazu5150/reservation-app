// マインクラフト風の装飾コンポーネント

export const MinecraftBlock = ({ color = "#8B4513", className = "" }: { color?: string, className?: string }) => (
  <div className={`relative ${className}`} style={{ width: '40px', height: '40px' }}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {/* メインのブロック */}
      <rect x="0" y="0" width="40" height="40" fill={color} />
      {/* 上部のハイライト */}
      <rect x="0" y="0" width="40" height="8" fill="rgba(255,255,255,0.2)" />
      {/* 左側のハイライト */}
      <rect x="0" y="0" width="8" height="40" fill="rgba(255,255,255,0.1)" />
      {/* 右側のシャドウ */}
      <rect x="32" y="0" width="8" height="40" fill="rgba(0,0,0,0.2)" />
      {/* 下部のシャドウ */}
      <rect x="0" y="32" width="40" height="8" fill="rgba(0,0,0,0.3)" />
      {/* グリッド線 */}
      <line x1="0" y1="10" x2="40" y2="10" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="0" y1="20" x2="40" y2="20" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="0" y1="30" x2="40" y2="30" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="10" y1="0" x2="10" y2="40" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="30" y1="0" x2="30" y2="40" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
    </svg>
  </div>
);

export const MinecraftCharacter = ({ className = "" }: { className?: string }) => (
  <div className={`relative ${className}`} style={{ width: '80px', height: '120px' }}>
    <svg viewBox="0 0 80 120" className="w-full h-full">
      {/* 頭 */}
      <rect x="20" y="0" width="40" height="40" fill="#F0D0A0" />
      <rect x="20" y="0" width="40" height="8" fill="rgba(255,255,255,0.3)" />
      {/* 目 */}
      <rect x="28" y="16" width="8" height="12" fill="#4A90E2" />
      <rect x="44" y="16" width="8" height="12" fill="#4A90E2" />
      {/* 胴体 */}
      <rect x="16" y="44" width="48" height="40" fill="#00B8D4" />
      <rect x="16" y="44" width="48" height="8" fill="rgba(255,255,255,0.2)" />
      {/* 腕 */}
      <rect x="4" y="44" width="12" height="36" fill="#F0D0A0" />
      <rect x="64" y="44" width="12" height="36" fill="#F0D0A0" />
      {/* 足 */}
      <rect x="24" y="88" width="14" height="32" fill="#2E3A47" />
      <rect x="42" y="88" width="14" height="32" fill="#2E3A47" />
    </svg>
  </div>
);

export const MinecraftGrassBlock = ({ className = "" }: { className?: string }) => (
  <div className={`relative ${className}`} style={{ width: '60px', height: '60px' }}>
    <svg viewBox="0 0 60 60" className="w-full h-full">
      {/* 草の上面 */}
      <rect x="0" y="0" width="60" height="20" fill="#7CBE4B" />
      <rect x="0" y="0" width="60" height="4" fill="rgba(255,255,255,0.3)" />
      {/* 土の部分 */}
      <rect x="0" y="20" width="60" height="40" fill="#8B4513" />
      {/* ハイライトとシャドウ */}
      <rect x="0" y="20" width="12" height="40" fill="rgba(255,255,255,0.1)" />
      <rect x="48" y="20" width="12" height="40" fill="rgba(0,0,0,0.2)" />
      <rect x="0" y="52" width="60" height="8" fill="rgba(0,0,0,0.3)" />
      {/* グリッド */}
      <line x1="0" y1="15" x2="60" y2="15" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="0" y1="30" x2="60" y2="30" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="0" y1="45" x2="60" y2="45" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
    </svg>
  </div>
);

export const MinecraftDiamond = ({ className = "" }: { className?: string }) => (
  <div className={`relative ${className} animate-bounce`} style={{ width: '40px', height: '40px' }}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <polygon
        points="20,4 32,16 20,36 8,16"
        fill="#4DD0E1"
        stroke="#00ACC1"
        strokeWidth="2"
      />
      <polygon
        points="20,4 26,10 20,16 14,10"
        fill="rgba(255,255,255,0.4)"
      />
    </svg>
  </div>
);

export const MinecraftPickaxe = ({ className = "" }: { className?: string }) => (
  <div className={`relative ${className}`} style={{ width: '60px', height: '60px' }}>
    <svg viewBox="0 0 60 60" className="w-full h-full transform rotate-45">
      {/* つるはし部分 */}
      <rect x="4" y="20" width="32" height="8" fill="#4DD0E1" />
      <polygon points="36,20 44,24 36,28" fill="#4DD0E1" />
      {/* 柄 */}
      <rect x="16" y="28" width="6" height="28" fill="#8B4513" />
      {/* ハイライト */}
      <rect x="4" y="20" width="32" height="2" fill="rgba(255,255,255,0.4)" />
    </svg>
  </div>
);

export const FloatingBlocks = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-10 left-10 animate-float">
      <MinecraftBlock color="#7CBE4B" />
    </div>
    <div className="absolute top-20 right-20 animate-float-delayed">
      <MinecraftBlock color="#8B4513" />
    </div>
    <div className="absolute bottom-32 left-1/4 animate-float">
      <MinecraftDiamond />
    </div>
    <div className="absolute top-1/3 right-10 animate-float-delayed">
      <MinecraftBlock color="#A0A0A0" />
    </div>
  </div>
);
