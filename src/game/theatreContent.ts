import type { LonLat } from './geographyContent.ts'

// First-pass geographic districts, not a dated political settlement. The first
// centre in each row is the proposed provincial seat. Coordinates and names are
// editable independently of geometry and of the existing playable campaign.
type Centre = readonly [id: string, name: string, at: LonLat]
type Region = readonly [id: string, name: string, centres: readonly Centre[]]
const regions: readonly Region[] = [
  ['cisalpine','Cisalpine Italy',[
    ['taurini','Taurini',[7.7,45.1]],['mediolanum','Mediolanum',[9.2,45.4]],['patavium','Patavium',[11.9,45.4]],['bononia','Bononia',[11.3,44.5]]]],
  ['etruria','Etruria',[
    ['volaterrae','Volaterrae',[10.9,43.4]],['pisae','Pisae',[10.5,43.7]],['clusium','Clusium',[11.95,43.0]]]],
  ['central-italy','Central Italy',[
    ['roma','Roma',[12.5,41.9]],['umbria','Umbria',[12.6,43.2]],['picenum','Picenum',[13.5,43.0]],['samnium','Samnium',[14.3,41.5]]]],
  ['southern-italy','Southern Italy',[
    ['taras','Taras',[17.25,40.5]],['neapolis','Neapolis',[14.3,40.9]],['apulia','Apulia',[16.4,41.2]],['lucania','Lucania',[16.1,40.2]],['bruttium','Bruttium',[16.25,39.2]]]],
  ['sicily','Sicily',[
    ['syracusae','Syracusae',[15.2,37.1]],['panormus','Panormus',[13.4,38.05]],['akragas','Akragas',[13.6,37.35]]]],
  ['sardinia','Sardinia',[
    ['caralis','Caralis',[9.1,39.3]],['northern-sardinia','Northern Sardinia',[8.7,40.6]]]],
  ['corsica','Corsica',[
    ['aleria','Aleria',[9.45,42.1]],['northern-corsica','Northern Corsica',[9.15,42.55]]]],
  ['illyrian-coast','Illyrian Coast',[
    ['scodra','Scodra',[19.5,42.1]],['dalmatian-coast','Dalmatian Coast',[16.6,43.55]],['istria','Istria',[14.1,45.0]]]],
  ['macedonia','Macedonia',[
    ['pella','Pella',[22.5,40.8]],['upper-macedonia','Upper Macedonia',[21.5,40.7]],['pieria','Pieria',[22.4,40.1]],['amphipolis','Amphipolis',[23.8,40.85]]]],
  ['epirus','Epirus',[
    ['dodona','Dodona',[20.8,39.55]],['chaonia','Chaonia',[20.1,39.9]],['ambracia','Ambracia',[21.0,39.2]]]],
  ['thessaly','Thessaly',[
    ['larissa','Larissa',[22.4,39.65]],['trikka','Trikka',[21.8,39.55]],['phthiotis','Phthiotis',[22.5,39.05]]]],
  ['central-greece','Central Greece',[
    ['athens','Athens',[23.7,38.05]],['boeotia','Boeotia',[23.2,38.3]],['aetolia','Aetolia',[21.4,38.6]],['euboea','Euboea',[23.85,38.65]]]],
  ['peloponnese','Peloponnese',[
    ['corinth','Corinth',[22.9,37.9]],['arcadia','Arcadia',[22.3,37.5]],['laconia','Laconia',[22.5,37.05]],['elis','Elis',[21.6,37.8]],['messenia','Messenia',[21.95,37.1]]]],
  ['thrace','Thrace',[
    ['lysimacheia','Lysimacheia',[26.85,40.55]],['hebrus-valley','Hebrus Valley',[26.2,41.55]],['western-thrace','Western Thrace',[25.2,41.05]],['byzantion','Byzantion',[28.9,41.1]]]],
  ['crete','Crete',[
    ['knossos','Knossos',[25.15,35.25]],['western-crete','Western Crete',[24.0,35.35]]]],
  ['aegean-islands','Aegean Islands',[
    ['naxos','Naxos',[25.45,37.05]],['chios','Chios',[26.05,38.4]],['lesbos','Lesbos',[26.3,39.2]],['samos','Samos',[26.85,37.75]]]],
  ['cyprus','Cyprus',[
    ['salamis','Salamis',[33.85,35.15]],['paphos','Paphos',[32.45,34.85]],['kition','Kition',[33.6,34.95]]]],
  ['bithynia','Bithynia',[
    ['astakos','Astakos',[29.95,40.8]],['bithynian-uplands','Bithynian Uplands',[30.4,40.25]],['sangarius-valley','Sangarius Valley',[30.8,40.75]]]],
  ['mysia','Mysia',[
    ['pergamon','Pergamon',[27.2,39.15]],['troas','Troas',[26.4,39.85]],['cyzicus','Cyzicus',[27.85,40.3]]]],
  ['lydia','Lydia',[
    ['sardis','Sardis',[28.05,38.5]],['ephesus','Ephesus',[27.4,37.95]],['maeander-valley','Maeander Valley',[28.8,37.8]]]],
  ['phrygia','Phrygia',[
    ['celaenae','Celaenae',[30.2,38.05]],['western-phrygia','Western Phrygia',[30.7,39.85]],['phrygian-uplands','Phrygian Uplands',[30.1,39.2]]]],
  ['caria','Caria',[
    ['halicarnassus','Halicarnassus',[27.45,37.05]],['mylasa','Mylasa',[27.8,37.3]],['rhodes','Rhodes',[28.1,36.35]]]],
  ['lycia','Lycia',[
    ['xanthos','Xanthos',[29.35,36.35]],['termessus','Termessus',[30.45,37.0]],['eastern-lycia','Eastern Lycia',[30.1,36.55]]]],
  ['pamphylia','Pamphylia',[
    ['perge','Perge',[30.85,36.95]],['western-pisidia','Western Pisidia',[30.6,37.6]]]],
  ['judaea','Judaea',[
    ['jerusalem','Jerusalem',[35.2,31.8]],['gaza','Gaza',[34.5,31.5]]]],
  ['transjordan','Transjordan',[
    ['petra','Petra',[35.45,30.35]],['amman','Ammon',[35.9,31.9]],['hauran','Hauran',[36.8,32.25]]]],
  ['cyrenaica','Cyrenaica',[
    ['cyrene','Cyrene',[21.85,32.65]],['barce','Barce',[20.85,32.5]],['eastern-cyrenaica','Eastern Cyrenaica',[23.2,32.0]]]],
  ['marmarica','Marmarica',[
    ['paraetonium','Paraetonium',[27.2,31.25]],['marmarican-coast','Marmarican Coast',[25.2,31.6]],['siwa','Siwa',[25.5,29.2]]]],
  ['lower-egypt','Lower Egypt',[
    ['alexandria','Alexandria',[29.95,31.15]],['western-delta','Western Delta',[30.45,30.8]],['eastern-delta','Eastern Delta',[31.7,30.9]],['pelusium','Pelusium',[32.5,31.0]]]],
  ['middle-egypt','Middle Egypt',[
    ['memphis','Memphis',[31.25,29.85]],['fayum','Fayum',[30.7,29.3]],['heracleopolis','Heracleopolis',[30.95,29.05]],['hermopolis','Hermopolis',[30.8,27.8]]]],
  ['upper-egypt','Upper Egypt',[
    ['thebes','Thebes',[32.65,25.7]],['abydos','Abydos',[31.9,26.2]],['elephantine','Elephantine',[32.9,24.1]],['upper-nile','Upper Nile',[31.85,22.65]]]],
  ['egyptian-oases','Egyptian Oases',[
    ['kharga','Kharga',[30.5,25.4]],['dakhla','Dakhla',[29.0,25.4]],['western-desert','Western Desert',[26.8,25.7]]]],
  ['eastern-desert','Eastern Desert',[
    ['red-sea-coast','Red Sea Coast',[34.2,25.6]],['northern-eastern-desert','Northern Eastern Desert',[32.5,27.3]],['southern-eastern-desert','Southern Eastern Desert',[33.5,23.8]]]],
  ['sinai','Sinai',[
    ['sinai-uplands','Sinai Uplands',[33.8,28.7]],['northern-sinai','Northern Sinai',[33.7,30.75]]]],
  ['colchis','Colchis',[
    ['colchian-coast','Colchian Coast',[41.3,42.4]],['colchian-valleys','Colchian Valleys',[42.5,42.4]]]],
  ['iberia','Iberia',[
    ['iberian-basin','Iberian Basin',[44.8,41.8]],['western-iberia','Western Iberia',[43.7,42.1]]]],
  ['albania','Caucasian Albania',[
    ['kura-basin','Kura Basin',[46.7,40.8]],['caspian-west-coast','Caspian West Coast',[48.7,39.4]]]],
  ['hyrcania','Hyrcania',[
    ['hyrcanian-plain','Hyrcanian Plain',[54.3,37.0]],['western-hyrcania','Western Hyrcania',[52.6,36.6]],['hyrcanian-foothills','Hyrcanian Foothills',[55.0,36.2]]]],
  ['parthia','Parthia',[
    ['hecatompylos','Hecatompylos',[54.0,35.9]],['nisa','Nisa',[58.3,38.0]],['eastern-parthia','Eastern Parthia',[57.1,36.8]]]],
  ['persis','Persis',[
    ['persepolis','Persepolis',[52.9,29.95]],['pasargadae','Pasargadae',[53.2,30.2]],['western-persis','Western Persis',[51.35,30.25]],['persian-coast','Persian Coast',[52.7,27.8]],['central-plateau','Central Plateau',[53.8,32.1]]]],
  ['carmania','Carmania',[
    ['karmana','Karmana',[57.1,30.3]],['carmanian-uplands','Carmanian Uplands',[55.9,29.0]],['carmanian-coast','Carmanian Coast',[57.2,27.2]]]],
  ['drangiana','Drangiana',[
    ['drangian-basin','Drangian Basin',[61.5,30.9]],['helmand-basin','Helmand Basin',[62.4,31.5]],['southern-drangiana','Southern Drangiana',[61.4,29.4]]]],
  ['aria','Aria',[
    ['herat','Herat',[62.2,34.35]],['hari-valley','Hari Valley',[63.4,34.4]],['western-aria','Western Aria',[60.3,34.3]]]],
  ['margiana','Margiana',[
    ['merv','Merv',[62.2,37.65]],['murghab-valley','Murghab Valley',[63.0,36.7]],['western-margiana','Western Margiana',[60.7,38.1]]]],
  ['bactria','Bactria',[
    ['bactra','Bactra',[66.9,36.8]],['western-bactria','Western Bactria',[65.3,36.9]],['eastern-bactria','Eastern Bactria',[69.0,37.0]],['upper-oxus','Upper Oxus',[70.4,37.6]]]],
  ['sogdiana','Sogdiana',[
    ['maracanda','Maracanda',[66.95,39.65]],['sogdian-valleys','Sogdian Valleys',[68.5,39.4]],['western-sogdiana','Western Sogdiana',[64.5,39.9]]]],
  ['paropamisadae','Paropamisadae',[
    ['kabul-basin','Kabul Basin',[69.2,34.55]],['bamiyan-valley','Bamiyan Valley',[67.8,34.85]],['hindu-kush-passes','Hindu Kush Passes',[69.8,35.6]]]],
  ['arachosia','Arachosia',[
    ['kandahar','Kandahar',[65.7,31.6]],['arghandab-valley','Arghandab Valley',[66.7,32.2]],['southern-arachosia','Southern Arachosia',[66.5,30.15]]]],
  ['gedrosia','Gedrosia',[
    ['gedrosian-interior','Gedrosian Interior',[63.3,27.2]],['western-gedrosia','Western Gedrosia',[60.7,26.2]],['gedrosian-coast','Gedrosian Coast',[64.6,25.5]]]],
  ['sindh','Lower Indus',[
    ['patala','Patala',[68.4,25.5]],['middle-sindh','Middle Sindh',[68.3,27.4]],['eastern-sindh','Eastern Sindh',[69.5,26.1]]]],
  ['gandhara','Gandhara',[
    ['taxila','Taxila',[72.8,33.75]],['peshawar-basin','Peshawar Basin',[71.55,34.0]],['swat-valley','Swat Valley',[72.3,34.75]]]],
  ['punjab','Punjab',[
    ['hydaspes-district','Hydaspes District',[73.5,32.65]],['upper-punjab','Upper Punjab',[74.4,32.0]],['lower-punjab','Lower Punjab',[71.5,30.2]],['eastern-punjab','Eastern Punjab',[75.9,30.9]]]],
  ['rajasthan','Rajasthan',[
    ['aravalli-district','Aravalli District',[74.8,26.6]],['western-rajasthan','Western Rajasthan',[72.0,26.8]],['southern-rajasthan','Southern Rajasthan',[74.2,24.4]]]],
  ['upper-ganges','Upper Ganges',[
    ['mathura','Mathura',[77.7,27.5]],['yamuna-district','Yamuna District',[77.4,29.1]],['ganges-headplain','Ganges Headplain',[78.5,29.4]],['panchala','Panchala',[79.4,28.25]]]],
  ['kosala','Kosala',[
    ['ayodhya','Ayodhya',[82.2,26.8]],['middle-ganges','Middle Ganges',[81.7,25.4]],['kosalan-plain','Kosalan Plain',[82.8,27.6]]]],
  ['magadha','Magadha',[
    ['pataliputra','Pataliputra',[85.15,25.6]],['gaya','Gaya',[85.0,24.8]],['eastern-magadha','Eastern Magadha',[86.5,25.5]]]],
  ['bengal','Bengal',[
    ['bengal-interior','Bengal Interior',[88.8,25.0]],['western-bengal','Western Bengal',[87.4,23.8]],['ganges-delta','Ganges Delta',[90.1,23.3]],['eastern-bengal','Eastern Bengal',[91.5,24.5]]]],
]

export const theatreProvinces = regions.map(([id,name,centres]) => ({
  id,name,capitalStateId:centres[0][0],stateIds:centres.map(c=>c[0]),
}))
export const theatreStates = regions.flatMap(([provinceId,,centres]) => centres.map(([id,name,center]) => ({
  id,name,provinceId,center,isCapital:id===centres[0][0],
})))

// Relevant theatre only: Alps, southern Balkans, Iranian satrapies and northern
// India through Bengal. Deep steppe, Arabia, Sahara and southern India remain
// physical context. All coastlines are taken from the existing terrain data.
export const theatreFootprints: readonly (readonly LonLat[])[] = [
  [[6,46.7],[13.6,46.7],[16,43.8],[19,42.7],[24.5,42.7],[29.8,43],[35,42],[39.5,43.7],
    [41.8,43.4],[44.6,42.8],[47.5,41.5],[50,40.5],[56,40.8],[61,40.5],[66,41.5],[71,41],[73,39],
    [75,36],[78,33],[82,30.4],[86,28.8],[90,27.5],[92.5,26.8],[92.5,21.5],[85,21.5],
    [80,23],[75,22],[70,22],[67,23.5],[59,24.8],[55,25.8],[50,28.8],[48.5,30.5],[46,31.5],[42,33],
    [39,32],[35,29],[32,32],[27,34],[21,34],[15,35.4],[11.6,36.0],[11.6,38.1],[8,38.5],[6,40]],
  [[18,33],[25,33],[33,33],[35,29],[35.0,26],[35.0,22],[29,22],[26,23],[25,28],[18,29]],
]
