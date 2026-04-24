/**
 * 虎ノ門 4F — kubell ブランドデザイン準拠フロアプラン
 *
 * viewBox: 0 0 1400 1456
 * L 字型のアウトライン（西側アメニティ棟 + 東側オフィス棟）
 *
 * 静的な部分（壁・階段・WC・EV・エントランス・ラウンジ/パントリー・オフィスゾーン）を SVG で描画。
 * 会議室とデスクは管理画面で CRUD できるため、このコンポーネントには含めない（SeatingMap 側で重ねる）。
 *
 * 配色（kubell ブランド / WeWork 凡例準拠）:
 *   オフィス青:   #D9E6F2 / #A8BDD4 (ハッチ付き)
 *   ラウンジ橙:   #F9D9B5 / #E6B683
 *   廊下ベージュ: #F3EEE2 / #DDD3BD
 *   壁:          #1A1A1A
 *   ベース:      #FAF7F2
 */
export const TORANOMON_4F_VIEWBOX = { width: 1400, height: 1456 };

export default function Toranomon4F({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${TORANOMON_4F_VIEWBOX.width} ${TORANOMON_4F_VIEWBOX.height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-label="虎ノ門 4F フロアプラン"
      role="img"
    >
      <defs>
        {/* オフィスゾーン用フローリング風ハッチ */}
        <pattern
          id="k-office-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="6"
            y2="0"
            stroke="rgba(80,110,150,.10)"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>

      {/* ベース外形（L字型） */}
      <path
        d="M 40 340 L 520 340 L 520 20 L 1380 20 L 1380 1440 L 520 1440 L 520 1150 L 40 1150 Z"
        fill="#FAF7F2"
        stroke="#1A1A1A"
        strokeWidth="2"
      />

      {/* ── ゾーン背景 ── */}
      {/* 北オフィスゾーン */}
      <g>
        <rect x="520" y="20" width="860" height="700" fill="#D9E6F2" rx="2" />
        <rect
          x="520"
          y="20"
          width="860"
          height="700"
          fill="url(#k-office-hatch)"
          rx="2"
        />
      </g>
      {/* 南オフィスゾーン */}
      <g>
        <rect x="520" y="820" width="860" height="620" fill="#D9E6F2" rx="2" />
        <rect
          x="520"
          y="820"
          width="860"
          height="620"
          fill="url(#k-office-hatch)"
          rx="2"
        />
      </g>
      {/* 中央廊下 */}
      <rect x="520" y="720" width="860" height="100" fill="#F3EEE2" rx="2" />
      {/* 西コア（アメニティ廊下） */}
      <rect x="40" y="340" width="370" height="810" fill="#F3EEE2" rx="2" />

      {/* ── ラウンジ / パントリー ── */}
      <rect x="410" y="490" width="110" height="350" fill="#F9D9B5" rx="2" />
      <rect x="530" y="720" width="180" height="90" fill="#F9D9B5" rx="2" />
      {/* パントリーバー（ラベル付き） */}
      <g>
        <rect
          x="530"
          y="720"
          width="180"
          height="30"
          fill="#E8C29F"
          stroke="#A97B50"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="620"
          y="740"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#7A4F22"
          style={{ letterSpacing: "0.1em" }}
        >
          PANTRY
        </text>
      </g>
      {/* Lounge 大ラベル */}
      <text
        x="465"
        y="670"
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fill="rgba(122,90,63,.9)"
        style={{ letterSpacing: "0.12em" }}
      >
        LOUNGE
      </text>

      {/* ── フィーチャー（階段 / WC / EV / エントランス） ── */}
      {/* 階段 NW */}
      <g>
        <rect
          x="50"
          y="340"
          width="220"
          height="100"
          fill="#E3DBCB"
          stroke="#B8AE97"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="160"
          y="395"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="rgba(0,0,0,.55)"
          style={{ letterSpacing: "0.08em" }}
        >
          階段
        </text>
      </g>
      {/* 階段 SW */}
      <g>
        <rect
          x="50"
          y="1050"
          width="220"
          height="100"
          fill="#E3DBCB"
          stroke="#B8AE97"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="160"
          y="1105"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="rgba(0,0,0,.55)"
          style={{ letterSpacing: "0.08em" }}
        >
          階段
        </text>
      </g>
      {/* M RESTROOM */}
      <g>
        <rect
          x="50"
          y="450"
          width="80"
          height="200"
          fill="#E3DBCB"
          stroke="#B8AE97"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="90"
          y="555"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="rgba(0,0,0,.55)"
          style={{ letterSpacing: "0.06em" }}
        >
          M RESTROOM
        </text>
      </g>
      {/* W RESTROOM */}
      <g>
        <rect
          x="50"
          y="780"
          width="80"
          height="250"
          fill="#E3DBCB"
          stroke="#B8AE97"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="90"
          y="910"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="rgba(0,0,0,.55)"
          style={{ letterSpacing: "0.06em" }}
        >
          W RESTROOM
        </text>
      </g>
      {/* ELEV FOYER 上 */}
      <g>
        <rect
          x="140"
          y="460"
          width="270"
          height="180"
          fill="#F3EEE2"
          stroke="#B8AE97"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="275"
          y="555"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="rgba(0,0,0,.55)"
          style={{ letterSpacing: "0.08em" }}
        >
          ELEV FOYER
        </text>
        {/* EV ケージ */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`ev1-${i}`}
            x={150}
            y={475 + i * 38}
            width="70"
            height="32"
            fill="#C8C0AE"
            stroke="#8A8270"
            strokeWidth="0.8"
            rx="1"
          />
        ))}
      </g>
      {/* ELEV FOYER 下 */}
      <g>
        <rect
          x="140"
          y="780"
          width="270"
          height="260"
          fill="#F3EEE2"
          stroke="#B8AE97"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="275"
          y="920"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="rgba(0,0,0,.55)"
          style={{ letterSpacing: "0.08em" }}
        >
          ELEV FOYER
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={`ev2-${i}`}
            x={150}
            y={795 + i * 45}
            width="70"
            height="38"
            fill="#C8C0AE"
            stroke="#8A8270"
            strokeWidth="0.8"
            rx="1"
          />
        ))}
      </g>
      {/* エントランス */}
      <g>
        <rect
          x="150"
          y="660"
          width="200"
          height="110"
          fill="#EADFC8"
          stroke="#C9B98E"
          strokeWidth="1.5"
          rx="3"
        />
        <text
          x="250"
          y="720"
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill="#7A5A3F"
          style={{ letterSpacing: "0.06em" }}
        >
          エントランス
        </text>
      </g>

      {/* ── 観葉植物 ── */}
      <g>
        <circle cx="527" cy="727" r="7" fill="#9CB98F" stroke="#6F8F5F" strokeWidth="0.8" />
        <circle cx="527" cy="817" r="7" fill="#9CB98F" stroke="#6F8F5F" strokeWidth="0.8" />
        <circle cx="417" cy="477" r="7" fill="#9CB98F" stroke="#6F8F5F" strokeWidth="0.8" />
        <circle cx="417" cy="857" r="7" fill="#9CB98F" stroke="#6F8F5F" strokeWidth="0.8" />
      </g>

      {/* ── 4F ラベル ── */}
      <text
        x="60"
        y="85"
        fontSize="36"
        fontWeight="800"
        fill="#1A1A1A"
        style={{ letterSpacing: "-0.02em" }}
      >
        4F
      </text>
      <text
        x="60"
        y="115"
        fontSize="11"
        fontWeight="600"
        fill="rgba(0,0,0,.45)"
        style={{ letterSpacing: "0.08em" }}
      >
        kubell TORANOMON
      </text>

      {/* ── 凡例 ── */}
      <g transform="translate(60, 1200)" fontSize="10" fill="rgba(0,0,0,.55)">
        <text fontSize="10" fontWeight="700" y="-6" style={{ letterSpacing: "0.1em" }}>
          LEGEND
        </text>
        <g transform="translate(0, 8)">
          <rect width="14" height="10" fill="#D9E6F2" stroke="#A8BDD4" />
          <text x="20" y="9">オフィス</text>
        </g>
        <g transform="translate(0, 26)">
          <rect width="14" height="10" fill="#F9D9B5" stroke="#E6B683" />
          <text x="20" y="9">ラウンジ・アメニティ</text>
        </g>
        <g transform="translate(0, 44)">
          <rect width="14" height="10" fill="#F3EEE2" stroke="#DDD3BD" />
          <text x="20" y="9">廊下・通路</text>
        </g>
        <g transform="translate(0, 62)">
          <rect width="14" height="10" fill="#CDE8D8" stroke="#6FA886" />
          <text x="20" y="9">会議室</text>
        </g>
      </g>

      {/* ── 方位コンパス ── */}
      <g transform="translate(1330, 1390)">
        <circle r="22" fill="#FFFFFF" stroke="#D6CFC1" strokeWidth="1" />
        <text y="-4" textAnchor="middle" fontSize="10" fontWeight="600" fill="#8A857E">
          N
        </text>
        <path d="M 0 -14 L 5 4 L 0 0 L -5 4 Z" fill="#F04600" />
      </g>
    </svg>
  );
}
