import { memo } from 'react'
import type { SceneryObject } from '../game/babyloniaScenery'

// All symbols share a bottom-centre origin (0,0). Ink, lit upper-left faces
// and shaded right faces give depth without raster assets or object filters.
export function ScenerySymbols() {
  const mountainPeaks = [
    ['M-24 0L-18 -14L-12 -8L-7 -36L6 -15L13 -22L24 0Z','M-7 -36L-5 -16L6 -15L13 -22L24 0Z','M-11 -28L-7 -36L-2 -27L-6 -29Z'],
    ['M-24 0L-16 -20L-9 -13L-2 -34L9 -14L15 -18L24 0Z','M-2 -34L2 -15L9 -14L15 -18L24 0Z','M-6 -26L-2 -34L4 -25L-1 -27Z'],
    ['M-24 0L-19 -12L-12 -26L-2 -15L8 -31L16 -14L23 0Z','M8 -31L9 -13L23 0L1 0Z','M4 -24L8 -31L12 -23L8 -25Z'],
  ]
  const hills=['M-23 0Q-17 -19 -6 -20Q6 -22 23 0Z','M-24 0Q-12 -27 1 -18Q11 -13 23 0Z','M-23 0Q-14 -15 -4 -12Q7 -24 23 0Z']
  return <>
    {[0,1].map(i=><symbol key={`rocks-${i}`} id={`scenery-rocks-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-21 0L-18 -5L-11 -7L-5 -3L-6 0ZM-3 0L-1 -8L6 -10L13 -5L12 0ZM14 0L16 -4L20 -5L24 -1V0Z':'M-23 0L-19 -3L-14 -4L-10 0ZM-8 0L-6 -6L1 -9L8 -5L9 0ZM11 0L13 -4L20 -6L23 -2V0Z'} fill="#b9a685" stroke="#817255" strokeWidth=".85" strokeLinejoin="round"/>
      <path d={i===0?'M-11 -7L-10 -2L-6 0L-5 -3ZM6 -10L5 -3L12 0L13 -5ZM20 -5L19 -1L24 0V-1Z':'M-14 -4L-15 -1L-10 0ZM1 -9L0 -3L9 0L8 -5ZM20 -6L18 -2L23 0V-2Z'} fill="#948367" opacity=".75"/>
      <path d={i===0?'M-17 -4l5 -2M0 -6l5 -2M16 -2l3 -2':'M-19 -2l4 -1M-5 -4l5 -3M14 -2l4 -3'} fill="none" stroke="#decba5" strokeWidth=".9"/>
    </symbol>)}
    {[0,1].map(i=><symbol key={`scrub-${i}`} id={`scenery-scrub-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-20 0q6 -3 12 0M-2 0q6 -3 12 0M15 0h7':'M-22 0h7M-11 0q6 -3 12 0M8 0q6 -3 13 0'} stroke="#8e906c" strokeOpacity=".5" strokeWidth="1.5" fill="none"/>
      <path d={i===0?'M-14 0v-6m0 5l-5 -3m5 3l4 -5M5 0l-1 -8m0 7l-4 -4m4 4l5 -5M18 0l1 -4':'M-18 0l-1 -4M-5 0v-8m0 7l-5 -4m5 4l5 -6M14 0l1 -6m0 5l-4 -3m4 3l5 -4'} stroke="#79815b" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      <path d="M-20 2h4m18 0h3m11 -1h5" stroke="#a58c60" strokeWidth=".7" fill="none"/>
    </symbol>)}
    <symbol id="scenery-persian-city" viewBox="-24 -40 48 40">
      {/* Surviving stone terrace and roofless columns beside the smaller town. */}
      <path d="M-23 0V-6H7V0Z" fill="#bfa77a" stroke="#796b50" strokeWidth=".8"/>
      <path d="M-23 -6L-19 -10H6L7 -6Z" fill="#e1cfaa" stroke="#8b7b5c" strokeWidth=".7"/>
      <path d="M-20 -10V-24h3v14m4 0V-25h3v15m4 0V-23h3v13m4 0V-18h3v8" fill="#d7c5a0" stroke="#887b60" strokeWidth=".65"/>
      <path d="M-21 -24h5m2 -1h5m2 2h5m2 5h5" fill="none" stroke="#a89470" strokeWidth="1.5"/>
      <path d="M-21 -23v12m7 -13v13m7 -11v11m7 -6v6" stroke="#f0e0bd" strokeWidth=".9"/>
      <path d="M-5 0V-7H2V-10H10V-5H17V0Z" fill="#c6aa79" stroke="#7c6848" strokeWidth=".8"/>
      <path d="M2 -9H10M10 -4h7M-4 -6H1" stroke="#eddbb5" strokeWidth="1.1"/>
      <path d="M5 0V-5H8V0m5 0V-3h2V0" fill="#807053"/>
      <path d="M-16 0v-2h7v-2h7" fill="none" stroke="#e4d3ae" strokeWidth=".85"/>
    </symbol>
    <symbol id="scenery-pasargadan-village" viewBox="-24 -40 48 40">
      <path d="M-4 0V-3H-1V-6H2V-9H5V-13H14V-9H18V-6H21V-3H24V0Z" fill="#d7c3a0" stroke="#857557" strokeWidth=".7"/>
      <path d="M5 -13L9.5 -18L14 -13Z" fill="#ead8b5" stroke="#857557" strokeWidth=".7"/>
      <path d="M10 -12h4v3h4v3h3v3h3v3H14V-9H10Z" fill="#ad9875"/>
      <path d="M7 -9v-3h3v3" fill="#756950"/>
      <path d="M-17 0V-6H-9V-9H-3V-4H1V0Z" fill="#c8a77b" stroke="#7b674b" strokeWidth=".8"/>
      <path d="M-16 -5h7m0 -3h5" stroke="#e9d2a9" strokeWidth="1"/>
      <path d="M-13 0v-3h3v3" fill="#786247"/>
    </symbol>
    <symbol id="scenery-assyrian-city" viewBox="-24 -40 48 40">
      <path d="M-21 0V-12H-13V-19H-6V-28H10V-19H17V-12H22V0Z" fill="#c5ad85" stroke="#66513b" strokeWidth=".9"/>
      <path d="M5 -27H10V-19H17V-12H22V0H10V-11H5Z" fill="#947956"/>
      <path d="M-24 0V-17H-21V-20H-17V-17H-13V-20H-9V-12H9V-20H13V-17H17V-20H21V-17H24V0Z" fill="#bfa078" stroke="#654d34" strokeWidth=".9"/>
      <path d="M-24 -17H-20V0H-24M9 -17H12V0H9" fill="#e5ceaa"/>
      <path d="M20 -17H24V0H20" fill="#937552"/>
      <path d="M-5 0V-8Q0 -14 5 -8V0" fill="#584734"/>
      <path d="M-8 -11H8M-23 -9H-10M11 -9H23M-5 -25H9M-10 -18H4" stroke="#e8d2ac" strokeWidth="1" fill="none"/>
      <path d="M-17 -14v4M16 -14v4" stroke="#766043" strokeWidth="1.2"/>
    </symbol>
    {[0,1].map(i=><symbol key={`grove-${i}`} id={`scenery-grove-${i}`} viewBox="-24 -40 48 40">
      <path d="M-11 0V-15M5 0V-22M17 0V-12" stroke="#79603f" strokeWidth="1.8"/>
      <path d={i===0?'M-19 -9Q-23 -18 -16 -21Q-9 -27 -4 -19Q1 -11 -8 -8ZM-3 -16Q-9 -25 -2 -29Q5 -35 12 -28Q21 -17 11 -14ZM11 -7Q6 -16 13 -19Q22 -24 25 -15Q28 -7 18 -5Z':'M-21 -7Q-25 -17 -15 -21Q-6 -25 -2 -15Q0 -7 -11 -5ZM-3 -17Q-8 -29 2 -31Q11 -34 15 -23Q19 -13 7 -12ZM11 -7Q7 -17 16 -18Q25 -20 25 -11Q26 -5 18 -4Z'} fill="#879063" stroke="#69774e" strokeWidth=".8"/>
      <path d="M-17 -16q4 -5 8 -2M0 -24q5 -5 10 0M15 -13q4 -3 7 0" stroke="#b0ad7b" strokeWidth="1.1" fill="none"/>
    </symbol>)}
    <symbol id="scenery-susian-city" viewBox="-24 -40 48 40">
      <path d="M-23 0V-7H-18V-12H-9V-17H13V-12H21V0Z" fill="#c5a675" stroke="#6c5438" strokeWidth=".9"/>
      <path d="M-15 -13V-27H17V-13Z" fill="#dcc398" stroke="#766041" strokeWidth=".8"/>
      <path d="M-15 -27H17L21 -24H-19Z" fill="#ead4aa" stroke="#6b563b" strokeWidth=".8"/>
      <path d="M17 -24L21 -24V-12L17 -13Z" fill="#977c54"/>
      <path d="M-11 -24V-14M-4 -24V-14M3 -24V-14M10 -24V-14" stroke="#876d48" strokeWidth="2.5"/>
      <path d="M-12 -24V-14M-5 -24V-14M2 -24V-14M9 -24V-14" stroke="#f0dbb5" strokeWidth="1.2"/>
      <path d="M-17 -13H19M-19 -10H21M-20 -7H22" stroke="#ecd4a7" strokeWidth="1.2"/>
      <path d="M-23 0V-9H-17V-12H-11V-9H-5V0Z" fill="#b99561" stroke="#6c5438" strokeWidth=".8"/>
      <path d="M-15 0V-5H-11V0M4 0V-5H8V0" fill="#655039"/>
      <path d="M10 0V-8H21V0Z" fill="#ac895c" stroke="#705639" strokeWidth=".8"/>
      <path d="M11 -7H20M-22 -8H-17" stroke="#e6cda1" strokeWidth="1"/>
    </symbol>
    {mountainPeaks.map(([outline,shade,summit],i)=><symbol key={`mountain-${i}`} id={`scenery-mountain-${i}`} viewBox="-24 -40 48 40">
      <path d={outline} fill="#b49c7b" stroke="#655642" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d={shade} fill="#786654" opacity=".88"/><path d={summit} fill="#e0cfad"/>
      <path d="M-17 -2l5 -7m6 5l3 -7m11 8l-3 -5" stroke="#685644" strokeWidth=".65" fill="none" opacity=".6"/>
    </symbol>)}
    {hills.map((outline,i)=><symbol key={`hill-${i}`} id={`scenery-hill-${i}`} viewBox="-24 -40 48 40">
      <path d={outline} fill="#b49b70" stroke="#776444" strokeWidth=".8"/>
      <path d="M-18 -1Q-13 -16 -5 -17Q-1 -11 2 0Z" fill="#dac99b" opacity=".75"/>
      <path d="M3 -11Q11 -9 19 -1" stroke="#8d734d" fill="none" strokeWidth="1"/>
    </symbol>)}
    {[0,1].map(i=><symbol key={`trees-${i}`} id={`scenery-trees-${i}`} viewBox="-24 -40 48 40">
      {(i===0?[[-12,-4,.7],[1,0,1],[14,-2,.64]]:[[11,-5,.77],[-9,0,.9],[1,-3,.63]]).map(([x,y,s],j)=><g key={j} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M0 0Q2 -10 0 -23" stroke="#705634" strokeWidth="2.2" fill="none"/>
        <path d="M0 -23Q-12 -32 -16 -19Q-7 -25 0 -23M0 -23Q12 -33 17 -20Q8 -26 0 -23M0 -23Q-2 -34 -8 -31M0 -23Q6 -35 10 -30M0 -23Q-10 -21 -11 -13M0 -23Q10 -23 12 -14" stroke="#536f3e" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M-13 -21Q-6 -27 0 -23Q7 -28 13 -23" stroke="#9dab67" strokeWidth="1.5" fill="none"/>
      </g>)}
    </symbol>)}
    {[0,1].map(i=><symbol key={`reeds-${i}`} id={`scenery-reeds-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-19 0l2 -17m-2 11l-5 -5m6 4l6 -7M-5 0l-1 -24m0 13l-6 -5m6 2l6 -8M9 0l2 -19m-1 11l6 -6M19 0l-2 -11':'M-20 0l-2 -10M-10 0l2 -22m-2 12l-7 -6m8 2l5 -8M5 0l-2 -16m0 7l-5 -5m5 3l6 -9M17 0l2 -23m-1 12l-6 -5m7 2l5 -6'} fill="none" stroke="#536f4b" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M-22 -1q9 -3 16 0m9 0q9 -3 19 -1" stroke="#508c7d" strokeWidth="1" fill="none"/>
    </symbol>)}
    {[0,1,2].map(i=><symbol key={`city-${i}`} id={`scenery-city-${i}`} viewBox="-24 -40 48 40">
      {i===0?<>
        <path d="M-20 0V-13H-12V-21H-5V-28H4V-21H12V-13H21V0Z" fill="#c5a172" stroke="#665037" strokeWidth=".8"/>
        <path d="M-5 -28H4V-21H12V-13H21V0H8V-11H1V-20H-5Z" fill="#97744e"/>
        <path d="M-22 0V-14H-17V-17H-13V-14H-9V-17H-5V-14H1V-17H5V-14H10V-17H14V-14H19V-17H23V0Z" fill="#c19c65" stroke="#59432d" strokeWidth=".9"/>
        <path d="M-6 0V-20H-9V-24H-5V-21H-1V-24H3V-20H6V0Z" fill="#347f83" stroke="#315b58" strokeWidth=".8"/>
        <path d="M-2 0V-8Q0 -12 3 -8V0" fill="#4e4030"/>
        <path d="M-21 -11H-8M8 -11H22M-21 -5H-9M8 -5H22M-4 -17H4" stroke="#ebcea0" strokeWidth=".9" fill="none"/>
      </>:<>
        <path d={i===1?'M-21 0V-12H-12V-20H-3V-27H8V-17H17V-10H23V0Z':'M-22 0V-10H-12V-16H-6V-25H7V-17H13V-10H22V0Z'} fill="#c4a477" stroke="#634e36" strokeWidth=".9"/>
        <path d="M4 -22H8V-17H17V-10H23V0H7V-9H1V-17H4Z" fill="#94754f"/>
        <path d="M-21 0V-10H-13V-13H-9V-10H3V-13H7V-10H21V0Z" fill="#ba955f" stroke="#665037" strokeWidth=".8"/>
        <path d="M-4 0V-6Q0 -10 4 -6V0" fill="#594630"/>
        <path d="M-17 -6h6m-3 -10h7m-8 -4h7m-2 -8h10m-2 17h6" stroke="#edd3a5" strokeWidth="1" fill="none"/>
      </>}
    </symbol>)}
    {[0,1].map(i=><symbol key={`fortress-${i}`} id={`scenery-fortress-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-19 0V-14H-10V-21H8V-14H19V0Z':'M-19 0V-14H-10V-19H-2V-25H8V-14H19V0Z'} fill="#c6a477" stroke="#635035" strokeWidth=".9"/>
      <path d="M3 -20H8V-14H19V0H7V-12H3Z" fill="#95744e"/>
      <path d="M-23 0V-23H-20V-27H-17V-23H-14V-27H-11V-23H-8V-14H8V-23H11V-27H14V-23H17V-27H20V-23H23V0Z" fill="#bc9663" stroke="#5a452c" strokeWidth="1"/>
      <path d="M-23 -23H-18V0H-23ZM8 -23H12V0H8Z" fill="#ecd0a0" opacity=".8"/>
      <path d="M-12 -22H-8V0H-12M19 -23H23V0H19" fill="#98764e"/>
      <path d="M-4 0V-8Q0 -13 4 -8V0" fill="#4b3d29"/>
      <path d="M-6 -13H6M-22 -17h12M10 -17h12M-22 -8h12M10 -8h12" fill="none" stroke="#eacf9e" strokeWidth=".9"/>
      <path d="M-17 -21v5M15 -21v5" stroke="#634e34" strokeWidth="1.4"/>
    </symbol>)}
    {[0,1].map(i=><symbol key={`homestead-${i}`} id={`scenery-homestead-${i}`} viewBox="-24 -40 48 40">
      {i===0?<>
        <path d="M-16 0V-8L-10 -12H1L7 -8V0Z" fill="#c6a273" stroke="#695039" strokeWidth="1.1"/>
        <path d="M-10 -12H1L7 -8H-16Z" fill="#e2c18b"/>
        <path d="M1 -8H7V0H1Z" fill="#93704c"/><path d="M-8 0v-5h4v5" fill="#5e4730"/>
        <path d="M11 0V-6H20V0Z" fill="#ad8958" stroke="#705637" strokeWidth=".9"/>
      </>:<>
        <path d="M-19 0L-9 -12L2 0ZM2 0L10 -8L21 0Z" fill="#d7b986" stroke="#6d5238" strokeWidth="1.1"/>
        <path d="M-9 -12L2 0H-7ZM10 -8L21 0H12Z" fill="#a78455"/>
        <path d="M-9 -7L-12 0H-6Z" fill="#675039"/>
      </>}
    </symbol>)}
    {[0,1].map(i=><symbol key={`village-${i}`} id={`scenery-village-${i}`} viewBox="-24 -40 48 40">
      <path d={i===0?'M-19 0V-10H-6V-16H8V-9H21V0Z':'M-21 0V-8H-10V-15H5V-10H18V0Z'} fill="#c4a16e" stroke="#695238" strokeWidth=".9"/>
      <path d="M4 -14H8V-9H21V0H8V-8H4Z" fill="#91714b"/>
      <path d="M-20 -9H-8M-7 -15H7M8 -8H21" stroke="#edcfa0" strokeWidth="1.4" fill="none"/>
      <path d="M-14 0v-6h4v6M12 0v-5h4v5" stroke="#60492f" fill="#60492f" strokeWidth=".6"/>
      <path d="M-5 0V-5H2V0" fill="#b99561" stroke="#7e6543" strokeWidth=".7"/>
    </symbol>)}
  </>
}

const ScenerySprite = memo(function ScenerySprite({object}:{object:SceneryObject}) {
  const {placement:p,x,y,size,opacity} = object
  return <g data-scenery={p.id} data-asset={p.asset} data-state={p.asset==='settlement'?p.stateId:undefined} data-tier={p.asset==='settlement'?p.tier:undefined} data-capital={p.asset==='settlement'?p.isCapital:undefined} data-range={p.rangeId} data-ground-y={p.position[1]} data-anchor-x={x} data-anchor-y={y} opacity={opacity} transform={`translate(${x} ${y}) scale(${size})`}>
    {p.asset==='settlement'&&<title>{p.name}{p.isCapital?' · province capital':''}</title>}
    <ellipse className="scenery-shadow" cx="4" cy="1.5" rx={p.asset==='settlement'?23:19} ry="3.5"/>
    <use href={p.asset==='settlement'&&p.style&&p.style!=='pasargadan'&&p.tier==='city'?`#scenery-${p.style}-city`:p.asset==='settlement'&&p.style==='pasargadan'&&p.tier==='village'?'#scenery-pasargadan-village':`#scenery-${p.asset==='settlement'?p.tier:p.asset}-${p.asset==='settlement'&&p.tier==='city'?(p.isCapital?0:1+(p.variant??0)%2):p.variant??0}`} x="-24" y="-40" width="48" height="40"/>
  </g>
})

export function BabyloniaScenery({objects}:{objects:readonly SceneryObject[]}) {
  return <g className="map-scenery" aria-hidden="true" pointerEvents="none">
    {objects.map(object=><ScenerySprite key={object.placement.id} object={object}/>)}
  </g>
}
