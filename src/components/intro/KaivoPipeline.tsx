type Pipe = {
  path: string
  className: string
}

const pipes: Pipe[] = [
  { path: 'M-80 120 H210 Q270 120 270 180 V285 Q270 330 315 330 H520', className: 'pipe pipe--far pipe--one' },
  { path: 'M1510 95 H1235 Q1175 95 1175 155 V285 Q1175 330 1125 330 H920', className: 'pipe pipe--far pipe--two' },
  { path: 'M-70 700 H170 Q235 700 235 635 V570 Q235 520 290 520 H525', className: 'pipe pipe--near pipe--three' },
  { path: 'M1510 735 H1275 Q1210 735 1210 670 V590 Q1210 535 1155 535 H915', className: 'pipe pipe--near pipe--four' },
  { path: 'M450 -65 V120 Q450 170 500 170 H610 Q655 170 655 215 V300', className: 'pipe pipe--main pipe--five' },
  { path: 'M1015 -65 V125 Q1015 175 965 175 H850 Q805 175 805 220 V300', className: 'pipe pipe--main pipe--six' },
  { path: 'M425 965 V790 Q425 735 480 735 H610 Q660 735 660 685 V585', className: 'pipe pipe--far pipe--seven' },
  { path: 'M1035 965 V790 Q1035 735 980 735 H855 Q805 735 805 685 V585', className: 'pipe pipe--far pipe--eight' },
  { path: 'M-80 375 H155 Q210 375 245 410 L315 480 Q350 515 400 515 H545', className: 'pipe pipe--main pipe--nine' },
  { path: 'M1510 395 H1285 Q1230 395 1195 430 L1130 495 Q1095 530 1045 530 H900', className: 'pipe pipe--main pipe--ten' },
]

export function KaivoPipeline() {
  return (
    <svg
      className="kaivo-pipeline"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kaivo-pipe-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b5ce2" stopOpacity="0.12" />
          <stop offset="0.48" stopColor="#8d66ff" />
          <stop offset="0.72" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#5b5ce2" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="kaivo-energy-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#f0e9ff" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <filter id="kaivo-soft-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g className="kaivo-pipeline__field">
        {pipes.map((pipe, index) => (
          <path key={index} pathLength="1" d={pipe.path} className={pipe.className} />
        ))}
      </g>

      <g className="kaivo-network" filter="url(#kaivo-soft-glow)">
        <circle className="kaivo-network__orbit" pathLength="1" cx="730" cy="445" r="105" />
        <path className="kaivo-network__glyph kaivo-network__glyph--stem" pathLength="1" d="M690 375 V515" />
        <path className="kaivo-network__glyph kaivo-network__glyph--upper" pathLength="1" d="M690 445 L780 380" />
        <path className="kaivo-network__glyph kaivo-network__glyph--lower" pathLength="1" d="M690 445 L780 510" />
      </g>

      <path
        className="kaivo-energy kaivo-energy--left"
        pathLength="1"
        d="M-80 375 H155 Q210 375 245 410 L315 480 Q350 515 400 515 H690"
      />
      <path
        className="kaivo-energy kaivo-energy--right"
        pathLength="1"
        d="M1510 395 H1285 Q1230 395 1195 430 L1130 495 Q1095 530 1045 530 H780"
      />

      <g className="kaivo-connection" transform="translate(730 445)">
        <circle className="kaivo-connection__wave" r="16" />
        <circle className="kaivo-connection__core" r="4" />
      </g>
    </svg>
  )
}
