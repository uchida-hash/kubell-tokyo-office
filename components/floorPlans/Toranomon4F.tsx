/**
 * 虎ノ門 4F のフロアプラン SVG。
 * viewBox: 0 0 1200 800
 *
 * 元 PDF の凡例に準拠した配色:
 *   廊下・通路       #FFF4E0 (beige)
 *   ラウンジ・アメニティ #FFE0B2 (orange)
 *   オフィス         #EAF2F8 (light blue)
 *   会議室          #A5D7CE (teal)
 */
export default function Toranomon4F({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1200 800"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-label="虎ノ門 4F フロアプラン"
      role="img"
    >
      {/* ===== オフィス本体（右側の大きな矩形）===== */}
      <rect
        x="220"
        y="50"
        width="930"
        height="700"
        fill="#EAF2F8"
        stroke="#2A4A6B"
        strokeWidth="2"
        rx="4"
      />

      {/* ===== 左側アメニティ棟 ===== */}
      {/* L 字型アウトライン（通路色ベース） */}
      <path
        d="M 50 110 L 220 110 L 220 620 L 170 620 L 170 500 L 50 500 Z"
        fill="#FFF4E0"
        stroke="#2A4A6B"
        strokeWidth="2"
      />

      {/* 階段（左上） */}
      <rect x="55" y="80" width="40" height="30" fill="#F5F5F5" stroke="#85929E" />
      <line x1="55" y1="88" x2="95" y2="88" stroke="#85929E" strokeWidth="0.5" />
      <line x1="55" y1="96" x2="95" y2="96" stroke="#85929E" strokeWidth="0.5" />
      <line x1="55" y1="104" x2="95" y2="104" stroke="#85929E" strokeWidth="0.5" />

      {/* M RESTROOM */}
      <g>
        <rect x="55" y="115" width="95" height="90" fill="#D7DBDD" stroke="#85929E" />
        <text x="102" y="165" textAnchor="middle" fontSize="11" fill="#4A5568" fontWeight="600">
          M RESTROOM
        </text>
      </g>

      {/* ELEV FOYER (上) */}
      <g>
        <rect x="155" y="115" width="65" height="180" fill="#FFF4E0" stroke="#85929E" />
        <text
          x="187"
          y="200"
          textAnchor="middle"
          fontSize="9"
          fill="#4A5568"
          transform="rotate(-90 187 200)"
        >
          ELEV FOYER
        </text>
        {/* エレベーター扉 */}
        <rect x="160" y="130" width="55" height="30" fill="#C8C8C8" stroke="#85929E" />
        <rect x="160" y="165" width="55" height="30" fill="#C8C8C8" stroke="#85929E" />
      </g>

      {/* ELEV FOYER (下) */}
      <g>
        <rect x="155" y="310" width="65" height="190" fill="#FFF4E0" stroke="#85929E" />
        <text
          x="187"
          y="405"
          textAnchor="middle"
          fontSize="9"
          fill="#4A5568"
          transform="rotate(-90 187 405)"
        >
          ELEV FOYER
        </text>
        <rect x="160" y="325" width="55" height="30" fill="#C8C8C8" stroke="#85929E" />
        <rect x="160" y="360" width="55" height="30" fill="#C8C8C8" stroke="#85929E" />
      </g>

      {/* W RESTROOM */}
      <g>
        <rect x="55" y="310" width="95" height="95" fill="#D7DBDD" stroke="#85929E" />
        <text x="102" y="360" textAnchor="middle" fontSize="11" fill="#4A5568" fontWeight="600">
          W RESTROOM
        </text>
      </g>

      {/* 階段（左下） */}
      <rect x="55" y="420" width="95" height="25" fill="#F5F5F5" stroke="#85929E" />
      <line x1="55" y1="428" x2="150" y2="428" stroke="#85929E" strokeWidth="0.5" />
      <line x1="55" y1="436" x2="150" y2="436" stroke="#85929E" strokeWidth="0.5" />

      {/* エントランス */}
      <g>
        <rect x="60" y="510" width="150" height="100" fill="#FFE0B2" stroke="#E65100" strokeWidth="1.5" />
        <text x="135" y="565" textAnchor="middle" fontSize="13" fill="#BF360C" fontWeight="700">
          エントランス
        </text>
      </g>

      {/* ===== 中央：IT, TRASH, 会議室, Lounge, 会議室, 下部会議室 ===== */}
      {/* IT */}
      <g>
        <rect x="240" y="60" width="55" height="40" fill="#D7DBDD" stroke="#85929E" />
        <text x="267" y="85" textAnchor="middle" fontSize="10" fill="#4A5568" fontWeight="600">
          IT
        </text>
      </g>
      {/* TRASH */}
      <g>
        <rect x="240" y="105" width="55" height="35" fill="#D7DBDD" stroke="#85929E" />
        <text x="267" y="127" textAnchor="middle" fontSize="9" fill="#4A5568">
          TRASH
        </text>
      </g>

      {/* 会議室（縦列、中央左）*/}
      <g fill="#A5D7CE" stroke="#008B7C">
        <rect x="305" y="60" width="70" height="55" />
        <rect x="305" y="120" width="70" height="55" />
        <rect x="305" y="180" width="70" height="55" />
        <rect x="305" y="240" width="70" height="55" />
      </g>
      <g fontSize="10" fill="#00695C" textAnchor="middle" fontWeight="600">
        <text x="340" y="93">会議室</text>
        <text x="340" y="153">会議室</text>
        <text x="340" y="213">会議室</text>
        <text x="340" y="273">会議室</text>
      </g>

      {/* Lounge */}
      <g>
        <rect x="240" y="380" width="130" height="180" fill="#FFE0B2" stroke="#E65100" />
        <text x="305" y="475" textAnchor="middle" fontSize="20" fill="#BF360C" fontWeight="700">
          Lounge
        </text>
      </g>

      {/* 中央会議室（大）*/}
      <g>
        <rect x="380" y="320" width="120" height="280" fill="#A5D7CE" stroke="#008B7C" strokeWidth="1.5" />
        <text x="440" y="455" textAnchor="middle" fontSize="18" fill="#00695C" fontWeight="700">
          会議室
        </text>
      </g>

      {/* 中央下部（Lounge と本体の間の柱・通路） */}
      <rect x="220" y="560" width="160" height="20" fill="#FFE0B2" stroke="#E65100" opacity="0.7" />

      {/* 下部 会議室（2個）*/}
      <g fill="#A5D7CE" stroke="#008B7C">
        <rect x="240" y="600" width="100" height="65" />
        <rect x="240" y="670" width="100" height="65" />
      </g>
      <g fontSize="10" fill="#00695C" textAnchor="middle" fontWeight="600">
        <text x="290" y="636">会議室</text>
        <text x="290" y="706">会議室</text>
      </g>

      {/* ===== フレキシブルエリア ===== */}
      <g>
        <rect
          x="510"
          y="320"
          width="430"
          height="280"
          fill="#FFF9C4"
          stroke="#F57F17"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.85"
        />
        <text
          x="725"
          y="455"
          textAnchor="middle"
          fontSize="22"
          fill="#F57F17"
          fontWeight="700"
        >
          フレキシブルエリア
        </text>
      </g>

      {/* ===== オフィスエリアのオーナメント（カラム/柱） ===== */}
      <g fill="#7B8A99" opacity="0.5">
        <rect x="340" y="310" width="10" height="10" />
        <rect x="550" y="310" width="10" height="10" />
        <rect x="750" y="310" width="10" height="10" />
        <rect x="950" y="310" width="10" height="10" />
        <rect x="1130" y="310" width="10" height="10" />
        <rect x="340" y="610" width="10" height="10" />
        <rect x="550" y="610" width="10" height="10" />
        <rect x="750" y="610" width="10" height="10" />
        <rect x="950" y="610" width="10" height="10" />
        <rect x="1130" y="610" width="10" height="10" />
      </g>

      {/* ===== 窓マーカー（外周の線） ===== */}
      <g stroke="#2A4A6B" strokeWidth="0.5" fill="none">
        {/* 上辺の窓サッシ表現 */}
        {Array.from({ length: 22 }).map((_, i) => (
          <line
            key={`top-${i}`}
            x1={230 + i * 42}
            y1="50"
            x2={230 + i * 42}
            y2="58"
            stroke="#2A4A6B"
            strokeWidth="0.5"
          />
        ))}
        {/* 右辺の窓サッシ */}
        {Array.from({ length: 16 }).map((_, i) => (
          <line
            key={`right-${i}`}
            x1="1142"
            y1={60 + i * 42}
            x2="1150"
            y2={60 + i * 42}
            stroke="#2A4A6B"
            strokeWidth="0.5"
          />
        ))}
        {/* 下辺の窓サッシ */}
        {Array.from({ length: 22 }).map((_, i) => (
          <line
            key={`bot-${i}`}
            x1={230 + i * 42}
            y1="742"
            x2={230 + i * 42}
            y2="750"
            stroke="#2A4A6B"
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* 4F ラベル */}
      <text x="85" y="60" fontSize="34" fontWeight="800" fill="#2A4A6B">
        4F
      </text>

      {/* 凡例 */}
      <g transform="translate(280, 765)" fontSize="10" fill="#4A5568">
        <g>
          <rect width="16" height="12" fill="#FFF4E0" stroke="#85929E" />
          <text x="22" y="10">
            廊下・通路
          </text>
        </g>
        <g transform="translate(110, 0)">
          <rect width="16" height="12" fill="#FFE0B2" stroke="#E65100" />
          <text x="22" y="10">
            ラウンジ・アメニティ
          </text>
        </g>
        <g transform="translate(260, 0)">
          <rect width="16" height="12" fill="#EAF2F8" stroke="#2A4A6B" />
          <text x="22" y="10">
            オフィス
          </text>
        </g>
        <g transform="translate(360, 0)">
          <rect width="16" height="12" fill="#A5D7CE" stroke="#008B7C" />
          <text x="22" y="10">
            会議室
          </text>
        </g>
        <g transform="translate(450, 0)">
          <rect
            width="16"
            height="12"
            fill="#FFF9C4"
            stroke="#F57F17"
            strokeDasharray="3 2"
          />
          <text x="22" y="10">
            フレキシブル
          </text>
        </g>
      </g>

      {/* 方位 N */}
      <g transform="translate(1110, 720)">
        <circle cx="0" cy="0" r="20" fill="white" stroke="#2A4A6B" strokeWidth="1" />
        <text x="0" y="-6" textAnchor="middle" fontSize="10" fill="#2A4A6B" fontWeight="700">
          N
        </text>
        <path d="M 0 -14 L -5 4 L 0 0 L 5 4 Z" fill="#2A4A6B" />
      </g>
    </svg>
  );
}
