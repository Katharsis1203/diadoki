// Approximate western spheres around autumn 312 BCE, after Gaza. The eastern
// satraps are deliberate scenario abstractions, not claims about named rulers.
// Political atlas ownership is separate from the original 48-state campaign.
export type MapFaction = { id:string; name:string; color:string; kind:'successor'|'regional'|'satrap'; seatStateId:string }
const ruler = (id:string,name:string,color:string,seatStateId:string,kind:MapFaction['kind']='regional'):MapFaction=>({id,name,color,seatStateId,kind})
export const mapFactions:readonly MapFaction[] = [
  ruler('babylon','Seleucids','#ad741b','babylon','successor'),
  ruler('ptolemy','Ptolemies','#23758a','alexandria','successor'),
  ruler('antigonus','Antigonids','#aa463b','mazaca','successor'),
  ruler('cassander','Cassander','#576fa0','pella','successor'),
  ruler('lysimachus','Lysimachus','#7b5293','lysimacheia','successor'),
  ruler('rome','Roman Republic','#a33e61','roma'),
  ruler('etruscans','Etruscan Cities','#6d8351','clusium'),
  ruler('italics','Italic Peoples','#886238','samnium'),
  ruler('gauls','Cisalpine Peoples','#427777','mediolanum'),
  ruler('italian-greeks','Italian Greek Cities','#6b759c','taras'),
  ruler('syracuse','Syracuse','#b68028','syracusae'),
  ruler('carthage','Carthage','#44764b','panormus'),
  ruler('epirus','Epirus','#7e658f','dodona'),
  ruler('illyria','Illyrian Peoples','#6b8664','scodra'),
  ruler('greek-cities','Greek Cities','#52887a','knossos'),
  ruler('bithynia','Bithynia','#97783c','astakos'),
  ruler('colchis','Colchis','#627249','colchian-coast'),
  ruler('iberia','Iberia','#916557','iberian-basin'),
  ruler('albania','Caucasian Albania','#6b7491','kura-basin'),
  ruler('nabataea','Nabataeans','#997446','petra'),
  ruler('maurya','Mauryas','#a36930','pataliputra'),
  ruler('rajasthan','Rajasthan Chiefs','#8a7950','aravalli-district'),
  ruler('nicanor','Nicanor','#78638a','ecbatana','satrap'),
  ruler('atropatene','Atropatene','#3f8278','ganzak'),
  ruler('parthian-satrap','Parthian Satrap','#55784a','hecatompylos','satrap'),
  ruler('persian-satrap','Persian Satrap','#8c5472','persepolis','satrap'),
  ruler('carmanian-satrap','Carmanian Satrap','#438b8a','karmana','satrap'),
  ruler('arian-satrap','Arian Satrap','#a67534','herat','satrap'),
  ruler('bactrian-satrap','Bactrian Satrap','#6972a0','bactra','satrap'),
  ruler('hindu-kush-satrap','Hindu Kush Satrap','#7f6851','kabul-basin','satrap'),
  ruler('arachosian-satrap','Arachosian Satrap','#648447','kandahar','satrap'),
  ruler('gandharan-satrap','Gandharan Satrap','#9b5872','taxila','satrap'),
  ruler('indus-satrap','Indus Satrap','#3e818f','patala','satrap'),
]
export const mapFactionById=new Map(mapFactions.map(f=>[f.id,f]))
// Whole-province defaults with explicit exceptions for politically divided
// western districts. Each independent eastern satrap holds one or two provinces.
export const provinceOwners:Readonly<Record<string,string>> = {
  cisalpine:'gauls',etruria:'etruscans','central-italy':'italics','southern-italy':'italics',sicily:'syracuse',sardinia:'carthage',corsica:'carthage','illyrian-coast':'illyria',
  macedonia:'cassander',epirus:'epirus',thessaly:'cassander','central-greece':'cassander',peloponnese:'antigonus',thrace:'lysimachus',crete:'greek-cities','aegean-islands':'antigonus',cyprus:'ptolemy',
  bithynia:'bithynia',mysia:'antigonus',lydia:'antigonus',phrygia:'antigonus',caria:'antigonus',lycia:'antigonus',pamphylia:'antigonus',
  judaea:'ptolemy',transjordan:'ptolemy',cyrenaica:'ptolemy',marmarica:'ptolemy','lower-egypt':'ptolemy','middle-egypt':'ptolemy','upper-egypt':'ptolemy','egyptian-oases':'ptolemy','eastern-desert':'ptolemy',sinai:'ptolemy',
  colchis:'colchis',iberia:'iberia',albania:'albania',
  hyrcania:'parthian-satrap',parthia:'parthian-satrap',persis:'persian-satrap',carmania:'carmanian-satrap',gedrosia:'carmanian-satrap',aria:'arian-satrap',margiana:'arian-satrap',bactria:'bactrian-satrap',sogdiana:'bactrian-satrap',paropamisadae:'hindu-kush-satrap',drangiana:'arachosian-satrap',arachosia:'arachosian-satrap',gandhara:'gandharan-satrap',punjab:'gandharan-satrap',sindh:'indus-satrap',
  rajasthan:'rajasthan','upper-ganges':'maurya',kosala:'maurya',magadha:'maurya',bengal:'maurya',
}
export const stateOwnerOverrides:Readonly<Record<string,string>>={
  roma:'rome',neapolis:'rome',taras:'italian-greeks',panormus:'carthage',
  aetolia:'greek-cities',boeotia:'antigonus',euboea:'antigonus',laconia:'greek-cities',byzantion:'greek-cities',rhodes:'greek-cities',petra:'nabataea',
}
export function atlasOwner(state:{id:string;provinceId:string}) {
  const owner=stateOwnerOverrides[state.id]??provinceOwners[state.provinceId]
  if(!owner||!mapFactionById.has(owner))throw new Error(`Missing political owner for ${state.id}`)
  return owner
}
