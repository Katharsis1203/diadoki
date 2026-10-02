import type { SceneryObject } from '../game/babyloniaScenery'

// All symbols share a bottom-centre origin (0,0). Ink, pale upper-left faces
// and shaded right faces give depth without raster assets or object filters.
export function ScenerySymbols() {
  const mountainPeaks = [
    ['M-23 0L-7 -36L13 0Z','M-7 -36L-5 -16L13 0Z','M-11 -28L-7 -36L-2 -27L-6 -29Z'],
    ['M-22 0L-11 -21L-2 -34L20 0Z','M-2 -34L2 -15L20 0Z','M-6 -26L-2 -34L4 -25L-1 -27Z'],
    ['M-22 0L-12 -26L-2 -15L8 -31L23 0Z','M8 -31L9 -13L23 0L1 0Z','M4 -24L8 -31L12 -23L8 -25Z'],
  ]
  const hills=['M-23 0Q-17 -19 -6 -20Q6 -22 23 0Z','M-24 0Q-12 -27 1 -18Q11 -13 23 0Z','M-23 0Q-14 -15 -4 -12Q7 -24 23 0Z']
  return <>
    {mountainPeaks.map(([outline,shade,summit],i)=><symbol key={`mountain-${i}`} id={`scenery-mountain-${i}`} viewBox="-24 -40 48 40">
      <path d={outline} fill="#d9c7a1" stroke="#897350" strokeWidth=".9" strokeLinejoin="round"/>
      <path d={shade} fill="#a28a65" opacity=".64"/><path d={summit} fill="#f1e4c5"/>
      <path d="M-17 -2l5 -7m6 5l3 -7m11 8l-3 -5" stroke="#887352" strokeWidth=".65" fill="none" opacity=".6"/>
    </symbol>)}
    {hills.map((outline,i)=><symbol key={`hill-${i}`} id={`scenery-hill-${i}`} viewBox="-24 -40 48 40">
      <path d={outline} fill="#d3c197" stroke="#99805a" strokeWidth=".8"/>
      <path d="M-18 -1Q-13 -16 -5 -17Q-1 -11 2 0Z" fill="#f0e1bc" opacity=".75"/>
      <path d="M3 -11Q11 -9 19 -1" stroke="#a48b61" fill="none" strokeWidth="1"/>
    </symbol>)}
    {[0,1].map(i=><symbol key={`trees-${i}`} id={`scenery-trees-${i}`} viewBox="-24 -40 48 40">
      {(i===0?[[-12,-4,.7],[1,0,1],[14,-2,.64]]:[[11,-5,.77],[-9,0,.9],[1,-3,.63]]).map(([x,y,s],j)=><g key={j} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M0 0Q2 -10 0 -23" stroke="#8c7751" strokeWidth="2.2" fill="none"/>
        <path d="M0 -23Q-12 -32 -16 -19Q-7 -25 0 -23M0 -23Q12 -33 17 -20Q8 -26 0 -23M0 -23Q-2 -34 -8 -31M0 -23Q6 -35 10 -30M0 -23Q-10 -21 -11 -13M0 -23Q10 -23 12 -14" stroke="#829061" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M-13 -21Q-6 -27 0 -23Q7 -28 13 -23" stroke="#b7bd88" strokeWidth="1.5" fill="none"/>
      </g>)}
    </symbol>)}
    {[0,1].map(i=><symbol key={`reeds-${i}`} id={`scenery-reeds-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-19 0l2 -17m-2 11l-5 -5m6 4l6 -7M-5 0l-1 -24m0 13l-6 -5m6 2l6 -8M9 0l2 -19m-1 11l6 -6M19 0l-2 -11':'M-20 0l-2 -10M-10 0l2 -22m-2 12l-7 -6m8 2l5 -8M5 0l-2 -16m0 7l-5 -5m5 3l6 -9M17 0l2 -23m-1 12l-6 -5m7 2l5 -6'} fill="none" stroke="#849273" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M-22 -1q9 -3 16 0m9 0q9 -3 19 -1" stroke="#8aa59a" strokeWidth="1" fill="none"/>
    </symbol>)}
    {[0,1,2].map(i=><symbol key={`city-${i}`} id={`scenery-city-${i}`} viewBox="-24 -40 48 40">
      {i===0?<>
        <path d="M-20 0V-13H-12V-21H-5V-28H4V-21H12V-13H21V0Z" fill="#dcc39a" stroke="#8e704b" strokeWidth=".8"/>
        <path d="M-5 -28H4V-21H12V-13H21V0H8V-11H1V-20H-5Z" fill="#b1946d"/>
        <path d="M-22 0V-14H-17V-17H-13V-14H-9V-17H-5V-14H1V-17H5V-14H10V-17H14V-14H19V-17H23V0Z" fill="#d8bc8d" stroke="#816744" strokeWidth=".9"/>
        <path d="M-6 0V-20H-9V-24H-5V-21H-1V-24H3V-20H6V0Z" fill="#729495" stroke="#647b71" strokeWidth=".8"/>
        <path d="M-2 0V-8Q0 -12 3 -8V0" fill="#725f48"/>
        <path d="M-21 -11H-8M8 -11H22M-21 -5H-9M8 -5H22M-4 -17H4" stroke="#f0dfba" strokeWidth=".9" fill="none"/>
      </>:<>
        <path d={i===1?'M-21 0V-12H-12V-20H-3V-27H8V-17H17V-10H23V0Z':'M-22 0V-10H-12V-16H-6V-25H7V-17H13V-10H22V0Z'} fill="#ddc6a0" stroke="#8d7450" strokeWidth=".9"/>
        <path d="M4 -22H8V-17H17V-10H23V0H7V-9H1V-17H4Z" fill="#af936d"/>
        <path d="M-21 0V-10H-13V-13H-9V-10H3V-13H7V-10H21V0Z" fill="#d0b58a" stroke="#8e704b" strokeWidth=".8"/>
        <path d="M-4 0V-6Q0 -10 4 -6V0" fill="#806b4e"/>
        <path d="M-17 -6h6m-3 -10h7m-8 -4h7m-2 -8h10m-2 17h6" stroke="#f2e1bd" strokeWidth="1" fill="none"/>
      </>}
    </symbol>)}
    {[0,1].map(i=><symbol key={`fortress-${i}`} id={`scenery-fortress-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-19 0V-14H-10V-21H8V-14H19V0Z':'M-19 0V-14H-10V-19H-2V-25H8V-14H19V0Z'} fill="#dec6a0" stroke="#88704c" strokeWidth=".9"/>
      <path d="M3 -20H8V-14H19V0H7V-12H3Z" fill="#ad9169"/>
      <path d="M-23 0V-23H-20V-27H-17V-23H-14V-27H-11V-23H-8V-14H8V-23H11V-27H14V-23H17V-27H20V-23H23V0Z" fill="#cfb286" stroke="#806642" strokeWidth="1"/>
      <path d="M-23 -23H-18V0H-23ZM8 -23H12V0H8Z" fill="#efdbb4" opacity=".8"/>
      <path d="M-12 -22H-8V0H-12M19 -23H23V0H19" fill="#a98b63"/>
      <path d="M-4 0V-8Q0 -13 4 -8V0" fill="#776348"/>
      <path d="M-6 -13H6M-22 -17h12M10 -17h12M-22 -8h12M10 -8h12" fill="none" stroke="#f0deba" strokeWidth=".9"/>
      <path d="M-17 -21v5M15 -21v5" stroke="#866d49" strokeWidth="1.4"/>
    </symbol>)}
    {[0,1].map(i=><symbol key={`village-${i}`} id={`scenery-village-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-19 0V-10H-6V-16H8V-9H21V0Z':'M-21 0V-8H-10V-15H5V-10H18V0Z'} fill="#dfc7a0" stroke="#947954" strokeWidth=".9"/>
      <path d="M4 -14H8V-9H21V0H8V-8H4Z" fill="#b3956d"/>
      <path d="M-20 -9H-8M-7 -15H7M8 -8H21" stroke="#f4e1bb" strokeWidth="1.4" fill="none"/>
      <path d="M-14 0v-6h4v6M12 0v-5h4v5" stroke="#8b7150" fill="#8b7150" strokeWidth=".6"/>
      <path d="M-5 0V-5H2V0" fill="#ceb085" stroke="#a58b63" strokeWidth=".7"/>
    </symbol>)}
  </>
}

export function BabyloniaScenery({objects}:{objects:readonly SceneryObject[]}) {
  return <g className="map-scenery" aria-hidden="true" pointerEvents="none">
    {objects.map(({placement:p,x,y,size,opacity})=><g key={p.id} data-scenery={p.id} data-asset={p.asset} data-state={p.asset==='settlement'?p.stateId:undefined} data-tier={p.asset==='settlement'?p.tier:undefined} data-capital={p.asset==='settlement'?p.isCapital:undefined} data-ground-y={p.position[1]} data-anchor-x={x} data-anchor-y={y} opacity={opacity} transform={`translate(${x} ${y}) scale(${size})`}>
      {p.asset==='settlement'&&<title>{p.name}{p.isCapital?' · province capital':''}</title>}
      <ellipse className="scenery-shadow" cx="4" cy="1.5" rx={p.asset==='settlement'?23:19} ry="3.5"/>
      <use href={`#scenery-${p.asset==='settlement'?p.tier:p.asset}-${p.variant??0}`} x="-24" y="-40" width="48" height="40"/>
    </g>)}
  </g>
}
