import type { ExerciseText } from './exerciseText'

/** Dutch exercise names and instructions (same number of steps as the English source). */
export const NL_EXERCISES: Record<string, ExerciseText> = {
  'glute-bridge': { name: 'Bilbrug', instructions: [
    'Lig op je rug met gebogen knieën en de voeten plat en heupbreed uit elkaar.',
    'Knijp je billen aan en til je heupen op tot schouders, heupen en knieën op één lijn staan.',
    'Houd kort vast bovenaan en zak gecontroleerd terug.',
  ] },
  'single-leg-glute-bridge': { name: 'Bilbrug op één been', instructions: [
    'Lig op je rug met één voet plat op de grond en het andere been gestrekt.',
    'Duw door de hiel van het steunbeen en til je heupen op, met horizontale heupen.',
    'Zak langzaam terug. Het werkende been is het been met de voet op de grond.',
  ] },
  'bodyweight-squat': { name: 'Squat', instructions: [
    'Sta met de voeten op schouderbreedte en de armen naar voren.',
    'Duw je heupen naar achter en omlaag, met je borst omhoog en je hielen op de grond.',
    'Zak tot je dijen ongeveer horizontaal staan en duw dan weer omhoog.',
  ] },
  'reverse-lunge': { name: 'Achterwaartse lunge', instructions: [
    'Sta rechtop met je handen op je heupen.',
    'Stap met één been naar achter en zak tot beide knieën ongeveer 90 graden gebogen zijn.',
    'Duw door de voorste hiel terug naar staan. Houd je romp rechtop.',
  ] },
  'step-up': { name: 'Step-up', instructions: [
    'Sta voor een stevige trede of bank met één voet er volledig op.',
    'Duw door de voet op de trede om rechtop te staan en til de andere knie op.',
    'Zak langzaam terug. Het werkende been is het been op de trede.',
  ] },
  'single-leg-calf-raise': { name: 'Kuitheffing op één been', instructions: [
    'Sta op één voet (gebruik een muur voor houvast) met de andere voet achter je opgetild.',
    'Kom zo hoog mogelijk op de bal van je voet.',
    'Zak langzaam in ongeveer drie seconden. Goed voor de veerkracht van achillespees en kuit.',
  ] },
  'forearm-plank': { name: 'Onderarmplank', instructions: [
    'Steun op je onderarmen, ellebogen onder je schouders, lichaam in één rechte lijn.',
    'Span je buik aan en knijp je billen samen. Laat je heupen niet zakken of omhoog steken.',
    'Adem rustig door en houd vast.',
  ] },
  'side-plank': { name: 'Zijwaartse plank', instructions: [
    'Lig op je zij met je elleboog onder je schouder en je benen op elkaar.',
    'Til je heupen op zodat je lichaam een rechte lijn vormt van hoofd tot voeten.',
    'Houd vast met hoge heupen boven elkaar. De bovenste arm wijst naar het plafond.',
  ] },
  'clamshell': { name: 'Clamshell', instructions: [
    'Lig op je zij met gebogen knieën en de hielen tegen elkaar.',
    'Til de bovenste knie op terwijl je voeten elkaar blijven raken, zonder je bekken achterover te rollen.',
    'Zak gecontroleerd terug. Traint de heupstabilisatoren die je knieën goed laten tracken.',
  ] },
  'side-leg-raise': { name: 'Zijwaartse beenheffing', instructions: [
    'Lig op je zij met gestrekte benen in lijn met je lichaam.',
    'Til het bovenste been op tot ongeveer 45 graden, met de tenen naar voren.',
    'Zak langzaam terug zonder je heupen te laten rollen.',
  ] },
  'single-leg-rdl': { name: 'Roemeense deadlift op één been', instructions: [
    'Sta op één been met een licht gebogen knie.',
    'Scharnier in de heupen en strek het andere been recht naar achter terwijl je romp voorover kantelt.',
    'Houd je rug vlak en knijp dan je bil aan om rechtop te komen. Het standbeen is het werkende been.',
  ] },
  'dead-bug': { name: 'Dead bug', instructions: [
    'Lig op je rug met de armen omhoog en heupen en knieën 90 graden gebogen.',
    'Strek langzaam de tegenovergestelde arm en het been uit terwijl je je onderrug in de grond drukt.',
    'Kom terug en wissel van kant. Eén herhaling = één strekking aan elke kant.',
  ] },
  'hip-flexor-stretch': { name: 'Heupbuigerrek (geknield)', instructions: [
    'Kniel op één knie met de andere voet voor je, knie boven de enkel.',
    'Kantel je bekken naar onder en verplaats je gewicht rustig naar voren.',
    'Voel de rek aan de voorkant van de heup van het knielende been. Houd je romp rechtop.',
  ] },
  'quad-stretch': { name: 'Quadricepsrek (staand)', instructions: [
    'Sta rechtop (houd je vast aan een muur indien nodig) en buig één knie, grijp je enkel achter je.',
    'Breng je hiel naar je bil met de knieën dicht bij elkaar.',
    'Knijp je bil aan en duw je heup lichtjes naar voren om de voorkant van de dij te voelen.',
  ] },
  'calf-stretch': { name: 'Kuitrek tegen de muur', instructions: [
    'Handen tegen een muur, één been naar achter met de hiel plat en de knie gestrekt.',
    'Leun naar de muur tot je de kuit van het achterste been voelt rekken.',
    'Buig de achterste knie lichtjes om de onderste kuit en de achillespees te rekken.',
  ] },
  'hamstring-stretch': { name: 'Hamstringrek (zittend)', instructions: [
    'Zit met één been gestrekt en de andere voet naar je binnenkant van de dij getrokken.',
    'Houd je rug lang en scharnier vanuit de heupen naar voren richting het gestrekte been.',
    'Stop als je een trek achter de dij voelt. Rond je rug niet om verder te reiken.',
  ] },
  'figure-4-stretch': { name: 'Cijfer-4 bilrek', instructions: [
    'Lig op je rug en leg één enkel over de tegenoverliggende knie, zodat een 4 ontstaat.',
    'Trek de steunende dij naar je borst en houd je hoofd op de grond.',
    'Voel de rek diep in de bil van het gekruiste been (piriformis).',
  ] },
  'butterfly-stretch': { name: 'Vlinderrek (adductoren)', instructions: [
    'Zit rechtop met de voetzolen tegen elkaar en de knieën naar buiten.',
    'Houd je voeten vast en laat je knieën naar de grond zakken.',
    'Voor meer rek scharnier je vanuit de heupen naar voren met een lange rug.',
  ] },
  'childs-pose': { name: 'Kindhouding', instructions: [
    'Kniel, zit met je heupen terug naar je hielen en reik met je armen naar voren.',
    'Laat je voorhoofd rusten en adem langzaam naar je onderrug.',
    'Laat je heupen bij elke uitademing wat verder zakken.',
  ] },
  'worlds-greatest-stretch': { name: 'Wereldbeste rek', instructions: [
    'Plaats vanuit een diepe lunge beide handen op de grond binnen de voorste voet.',
    'Draai je borst naar de voorste knie en reik met de binnenste arm naar het plafond.',
    'Zet de hand terug op de grond. Eén herhaling = omlaag en omhoog.',
  ] },
  'leg-swings': { name: 'Beenzwaaien', instructions: [
    'Sta rechtop en houd een muur of paal vast voor evenwicht.',
    'Zwaai één been ontspannen en gecontroleerd naar voor en naar achter.',
    'Vergroot geleidelijk het bereik en houd je romp stil. Ideaal voor een loopsessie.',
  ] },
  'single-leg-balance': { name: 'Evenwicht op één been', instructions: [
    'Sta op één been met een licht gebogen knie en til de andere knie op tot heuphoogte.',
    'Houd je heupen horizontaal en je blik op een vast punt. Een beetje wiebelen is normaal.',
    'Maak het moeilijker door je ogen te sluiten of op een opgevouwen handdoek of kussen te staan.',
  ] },
  'bulgarian-split-squat': { name: 'Bulgaarse split squat', instructions: [
    'Sta een stap voor een bank en leg de bovenkant van je achterste voet erop.',
    'Zak recht naar beneden tot de voorste dij ongeveer horizontaal staat.',
    'Houd je romp rechtop en je voorste hiel op de grond en duw dan weer omhoog. Het voorste been is het werkende been.',
  ] },
  'single-leg-half-squat': { name: 'Halve squat op één been', instructions: [
    'Sta op één been met het andere been voor je uitgestrekt en de armen naar voren voor evenwicht.',
    'Buig de standknie tot ongeveer 45 à 60 graden, heupen naar achter, knie boven je tenen.',
    'Duw terug omhoog naar staan. Ga niet dieper dan je kunt beheersen.',
  ] },
  'straight-leg-calf-raise-box': { name: 'Kuitheffing met gestrekte knie (op verhoging)', instructions: [
    'Sta met de ballen van beide voeten op de rand van een kist of trede, hielen in de lucht. Houd een muur vast voor evenwicht.',
    'Houd je knieën gestrekt en kom zo hoog mogelijk op je tenen.',
    'Zak langzaam tot je hielen onder de trede komen voor een volledige rek. Traint de gastrocnemius.',
  ] },
  'bent-knee-calf-raise-box': { name: 'Kuitheffing met gebogen knie (op verhoging)', instructions: [
    'Sta met de ballen van beide voeten op de rand van een kist en buig je knieën lichtjes, met een hand tegen een muur.',
    'Houd de knieën de hele tijd gebogen en kom zo hoog mogelijk op je tenen.',
    'Zak langzaam onder de trede. De gebogen knie legt de belasting op de diepere soleusspier.',
  ] },
  'push-up': { name: 'Push-up', instructions: [
    'Begin in een hoge plank met de handen onder je schouders en het lichaam in één rechte lijn.',
    'Zak met je borst naar de grond met de ellebogen op ongeveer 45 graden van je lichaam.',
    'Duw weer omhoog zonder je heupen te laten zakken. Ga op je knieën voor een makkelijkere versie.',
  ] },
  'toe-curls-towel': { name: 'Tenen krullen met handdoek', instructions: [
    'Zit op een stoel met één voet plat op een kleine handdoek op een gladde vloer.',
    'Krul je tenen om de handdoek naar je toe te schuiven, met je hiel op de grond.',
    'Ontspan en spreid je tenen en herhaal. Versterkt de kleine spieren onder de voetboog.',
  ] },
  'calf-stretch-step': { name: 'Kuitrek op een trede', instructions: [
    'Sta met de ballen van je voeten op een trede en de hielen in de lucht. Houd een leuning of muur vast.',
    'Laat je hielen onder de trede zakken tot je de rek in je kuiten en achillespezen voelt.',
    'Houd je knieën gestrekt. Buig ze lichtjes om de rek lager naar de achillespees te verplaatsen.',
  ] },
  'toe-extension': { name: 'Teenstrekking', instructions: [
    'Kniel met je tenen onder je gevouwen zodat de zolen naar achter wijzen.',
    'Zit langzaam terug naar je hielen tot je de rek voelt langs de onderkant van tenen en voetboog.',
    'Houd vast en ga minder diep als het scherp aanvoelt. Til je heupen op om los te laten.',
  ] },
  'bird-dog': { name: 'Bird dog', instructions: [
    'Begin op handen en knieën, polsen onder schouders en knieën onder heupen, rug vlak.',
    'Reik met één arm naar voren en het tegenovergestelde been naar achter tot beide in lijn met je romp zijn.',
    'Pauzeer zonder je heupen te draaien of je rug te hol te trekken, keer terug en wissel. Eén herhaling = één strekking aan elke kant.',
  ] },
  'donkey-kick': { name: 'Donkey kick', instructions: [
    'Begin op handen en knieën met een vlakke rug en aangespannen core.',
    'Houd de knie 90 graden gebogen en duw de voetzool naar het plafond tot de dij op één lijn met je rug ligt.',
    'Knijp de bil aan bovenaan zonder je onderrug hol te trekken en zak gecontroleerd terug.',
  ] },
  'wall-sit': { name: 'Wall sit', instructions: [
    'Leun met je rug plat tegen een muur en loop met je voeten naar voren tot je knieën ongeveer 90 graden gebogen zijn.',
    'Houd je knieën boven je enkels en je gewicht op je hielen.',
    'Houd vast en adem rustig door. Schuif iets hoger om het makkelijker te maken.',
  ] },
  'hollow-hold': { name: 'Hollow hold', instructions: [
    'Lig op je rug met de armen boven je hoofd en de benen gestrekt en druk je onderrug in de grond.',
    'Til je schouders en benen een paar centimeter van de grond zodat je lichaam een ondiepe banaanvorm krijgt.',
    'Houd vast. Buig je knieën of verlaag je armen om het makkelijker te maken en stop als je onderrug hol komt te staan.',
  ] },
  'tibialis-raise': { name: 'Scheenspierheffing tegen de muur', instructions: [
    'Leun met je rug tegen een muur met je voeten ongeveer een halve meter voor je.',
    'Houd je hielen op de grond en trek je tenen zo ver mogelijk naar je schenen.',
    'Zak langzaam. Versterkt de scheenspieren die schokken opvangen en helpen bij scheenbeenvliesontsteking.',
  ] },
  'cat-cow': { name: 'Kat-koe', instructions: [
    'Begin op handen en knieën, polsen onder schouders en knieën onder heupen.',
    'Koe: adem in, laat je buik zakken en til je borst en staartbeen op.',
    'Kat: adem uit, rond je rug naar het plafond en trek je kin in. Eén herhaling = koe en dan kat.',
  ] },
  'cobra-stretch': { name: 'Cobrarek', instructions: [
    'Lig op je buik met je handen onder je schouders en je benen ontspannen achter je.',
    'Duw door je handen om je borst op te tillen terwijl je heupen op de grond blijven.',
    'Houd je schouders weg van je oren en stop waar het comfortabel voelt, zonder knellen in de onderrug.',
  ] },
  'knee-to-chest-stretch': { name: 'Knie-naar-borstrek', instructions: [
    'Lig op je rug met één been gestrekt op de grond.',
    'Trek de andere knie met beide handen naar je borst, met je hoofd en onderrug op de grond.',
    'Houd vast en adem. Je voelt het in de bil en onderrug aan de kant van het opgetrokken been.',
  ] },
  'prone-y-raise': { name: 'Y-heffing op de buik', instructions: [
    'Lig op je buik met je armen in een Y-vorm boven je hoofd, duimen omhoog en je voorhoofd net boven de grond.',
    'Trek je schouderbladen naar achter en omlaag en til beide armen een paar centimeter op zonder op te schouderen.',
    'Zak langzaam terug. Bouwt de schouderbladstabiliteit op die de schouders van een zwemmer beschermt.',
  ] },
  'prone-w-raise': { name: 'W-heffing op de buik', instructions: [
    'Lig op je buik met gebogen ellebogen langs je ribben en de handen bij je hoofd in een W-vorm.',
    'Knijp je schouderbladen naar elkaar en til je ellebogen en handen op terwijl je de armen naar buiten draait.',
    'Pauzeer en zak dan langzaam terug. Traint de rotatorcuff en middenrug die je bij de zwemgreep gebruikt.',
  ] },
  'thoracic-rotation': { name: 'Borstwervelrotatie op handen en knieën', instructions: [
    'Begin op handen en knieën en leg één hand achter je hoofd, elleboog naar beneden.',
    'Draai je borst en til die elleboog naar het plafond, met je ogen erachteraan. Houd je heupen recht.',
    'Breng de elleboog terug naar de andere arm. Werkt een stijve bovenrug van het fietsen tegen en helpt de zwemrotatie.',
  ] },
  'wall-angel': { name: 'Wall angel', instructions: [
    'Sta met je rug, hoofd en heupen tegen een muur en je voeten een kleine stap naar voren. Armen gebogen naast je.',
    'Schuif je armen langs de muur omhoog boven je hoofd zonder je ribben te laten uitsteken of je onderrug hol te trekken.',
    'Schuif gecontroleerd terug omlaag. Opent de borst en bovenrug na tijd in de aeropositie.',
  ] },
  'couch-stretch': { name: 'Couch stretch', instructions: [
    'Kniel met de scheen van je achterste been tegen de muur (of op een zetel) en je andere voet voor je geplant.',
    'Knijp de bil van het achterste been aan en kom rechtop tot je de voorkant van de dij en de heup voelt rekken.',
    'Houd vast en adem. Werkt strakke heupbuigers van lange ritten en zwemtrappen tegen. Gebruik een kussen onder de knie.',
  ] },
  'seated-band-row': { name: 'Zittende roei met band', instructions: [
    'Zit rechtop met gestrekte benen en leg een weerstandsband om je voetzolen, met een uiteinde in elke hand.',
    'Knijp je schouderbladen naar elkaar en trek je ellebogen langs je ribben naar achter. Houd je borst omhoog en leun niet achterover.',
    'Keer langzaam gecontroleerd terug. Bouwt de trekspieren op die zwemmen en een rechte fietshouding ondersteunen.',
  ] },
  'goblet-squat': { name: 'Goblet squat', instructions: [
    'Sta met de voeten op schouderbreedte en houd één dumbbell verticaal met beide handen tegen je borst.',
    'Duw je heupen naar achter en omlaag met een rechte borst en ellebogen binnen je knieën, tot je dijen ongeveer horizontaal staan.',
    'Duw door je hielen om op te staan. Het gewicht voor je helpt je rechtop te blijven.',
  ] },
  'standing-band-kickback': { name: 'Staande kickback met band', instructions: [
    'Doe een band om één enkel en bevestig het andere uiteinde laag voor je, bijvoorbeeld aan een deuranker of stevig meubel. Houd een muur vast voor evenwicht.',
    'Houd je romp rechtop en duw het been met de band recht naar achter door je bil aan te knijpen. Trek je onderrug niet hol.',
    'Keer langzaam terug tegen de band in. Het werkende been is het been met de band.',
  ] },
  'band-straight-arm-pulldown': { name: 'Pulldown met gestrekte armen (band)', instructions: [
    'Bevestig een band hoog voor je, bijvoorbeeld over een deur. Sta rechtop met de band in beide handen en gestrekte armen, naar voren en omhoog reikend.',
    'Houd je armen gestrekt en haal ze naar je dijen door je brede rugspieren aan te spannen. Houd je ribben omlaag.',
    'Keer langzaam terug. Bootst de trekfase van de borstcrawl na.',
  ] },
  'banded-clamshell': { name: 'Clamshell met band', instructions: [
    'Lig op je zij met een kleine lusband net boven je knieën, knieën gebogen en hielen tegen elkaar.',
    'Til de bovenste knie tegen de band in op terwijl je voeten elkaar blijven raken, zonder je bekken achterover te rollen.',
    'Zak gecontroleerd terug. Een zwaardere versie van de clamshell voor de heupstabilisatoren.',
  ] },
  'band-pull-through': { name: 'Pull-through met band', instructions: [
    'Bevestig een band laag achter je. Sta met je rug naar de band toe, met de band tussen je benen en houd hem met beide handen vast.',
    'Scharnier in de heupen en duw ze naar achter met een vlakke rug en lichte knieën, terwijl de band je handen door je benen trekt.',
    'Duw je heupen naar voren en knijp je billen aan om rechtop te komen. Leert de heupscharnier met belasting.',
  ] },
  'banded-ankle-dorsiflexion': { name: 'Enkeldorsiflexie met band', instructions: [
    'Zit op de grond met één been gestrekt en een band om de bovenkant van die voet, bevestigd aan iets stevigs voor je.',
    'Trek je tenen naar je scheen tegen de band in, met je hiel omlaag en je knie gestrekt.',
    'Laat langzaam los. Versterkt de scheenspieren die helpen bij scheenbeenvliesontsteking en voetlanding.',
  ] },
  'seated-band-calf-press': { name: 'Zittende kuitpress met band', instructions: [
    'Zit met één been gestrekt, een band om de bal van die voet en een uiteinde in elke hand.',
    'Duw je voet weg alsof je op een gaspedaal drukt tot je tenen wijzen, met je knie gestrekt.',
    'Keer langzaam terug tegen de band in. Bouwt kuit- en achillespeeskracht op zonder belasting van de gewrichten.',
  ] },
  'dumbbell-rdl': { name: 'Roemeense deadlift met dumbbells', instructions: [
    'Sta rechtop met een dumbbell in elke hand voor je dijen en de voeten heupbreed.',
    'Duw je heupen naar achter met lichte knieën en een vlakke rug en schuif de gewichten langs je dijen tot halverwege je scheen.',
    'Knijp je billen aan om rechtop te komen. Houd de gewichten de hele tijd dicht bij je benen.',
  ] },
  'bent-over-dumbbell-row': { name: 'Voorovergebogen roeien met dumbbells', instructions: [
    'Scharnier voorover in de heupen met een vlakke rug en lichte knieën, met een dumbbell in elke hand en hangende armen.',
    'Roei de gewichten naar je heupen door je ellebogen naar achter te sturen en je schouderbladen samen te knijpen.',
    'Zak langzaam terug. Houd je romp stil en je nek neutraal.',
  ] },
  'dumbbell-single-leg-calf-raise': { name: 'Kuitheffing op één been met gewicht', instructions: [
    'Sta op één voet met een dumbbell in de hand aan dezelfde kant (de andere hand tegen een muur) en de andere voet achter je opgetild.',
    'Kom zo hoog mogelijk op de bal van je voet.',
    'Zak langzaam in ongeveer drie seconden. Ga hiernaartoe als kuitheffingen met lichaamsgewicht makkelijk aanvoelen.',
  ] },
  'dumbbell-reverse-lunge': { name: 'Achterwaartse lunge met dumbbells', instructions: [
    'Sta rechtop met een dumbbell in elke hand langs je zij.',
    'Stap met één been naar achter en zak tot beide knieën ongeveer 90 graden gebogen zijn, met je romp rechtop.',
    'Duw door de voorste hiel terug naar staan. Ga hiernaartoe als lunges met lichaamsgewicht makkelijk aanvoelen.',
  ] },
  'superman': { name: 'Superman', instructions: [
    'Lig op je buik met de armen gestrekt boven je hoofd en de benen gestrekt.',
    'Til je armen, borst en benen samen een paar centimeter van de grond, met een lange nek.',
    'Knijp een seconde je billen en rug aan en zak dan gecontroleerd terug.',
  ] },
  'fire-hydrant': { name: 'Fire hydrant', instructions: [
    'Begin op handen en knieën met een vlakke rug en aangespannen core.',
    'Houd de knie 90 graden gebogen en til één knie zijwaarts op zonder je bekken te draaien.',
    'Pauzeer bovenaan en zak dan gecontroleerd terug. Traint de buitenste bilspier en heupstabilisatoren.',
  ] },
  'glute-bridge-march': { name: 'Bilbrug met marcheren', instructions: [
    'Lig op je rug met gebogen knieën en til op in een bilbrug.',
    'Houd je heupen horizontaal, til één voet van de grond en breng de knie naar je borst.',
    'Zet de voet weer neer en wissel. Eén herhaling = één optilling aan elke kant.',
  ] },
  'lying-leg-raise': { name: 'Liggende beenheffing', instructions: [
    'Lig op je rug met gestrekte benen en je handen onder je heupen; druk je onderrug in de grond.',
    'Til beide benen samen op tot ze naar het plafond wijzen.',
    'Zak langzaam, en stop voor je rug hol komt. Buig de knieën als dit te zwaar is.',
  ] },
  'plank-shoulder-tap': { name: 'Plank met schoudertik', instructions: [
    'Begin in een hoge plank met de handen onder de schouders en de voeten iets breder dan heupbreed.',
    'Tik met één hand de tegenovergestelde schouder aan zonder dat je heupen schommelen.',
    'Keer terug en wissel af. Eén herhaling = één tik aan elke kant.',
  ] },
  'mountain-climber': { name: 'Mountain climber', instructions: [
    'Begin in een hoge plank met je schouders boven je polsen en je lichaam in één lijn.',
    'Trek één knie naar je borst en wissel dan van been in een loopbeweging.',
    'Houd je heupen laag en je core aangespannen. Ga trager als je techniek verslapt.',
  ] },
  'good-morning': { name: 'Good morning (lichaamsgewicht)', instructions: [
    'Sta met de voeten heupbreed, lichte knieën en de handen achter je hoofd.',
    'Duw je heupen naar achter en scharnier voorover met een vlakke rug tot je je hamstrings voelt werken.',
    'Duw je heupen naar voren om weer rechtop te komen. De beweging komt uit de heupen, niet uit de rug.',
  ] },
  'deep-squat-hold': { name: 'Diepe squat vasthouden', instructions: [
    'Sta met de voeten iets breder dan je schouders en de tenen een beetje naar buiten gedraaid.',
    'Zak in een diepe squat met de hielen op de grond en je borst omhoog, handen samen voor je borst.',
    'Duw met je ellebogen zachtjes je knieën naar buiten. Houd een deurpost vast als je steun nodig hebt.',
  ] },
  'supine-twist': { name: 'Liggende rugdraai', instructions: [
    'Lig op je rug met de armen opzij gestrekt en de knieën gebogen.',
    'Laat beide knieën langzaam naar één kant vallen terwijl je schouders op de grond blijven.',
    'Adem uit en ontspan in de draai, kom dan terug naar het midden en wissel van kant.',
  ] },
  'seated-forward-fold': { name: 'Zittende voorwaartse buiging', instructions: [
    'Zit met beide benen gestrekt voor je en de tenen omhoog.',
    'Scharnier vanuit de heupen en reik naar je voeten met een lange rug.',
    'Stop waar je een rek achter de dijen voelt. Forceer niet en rond je rug niet sterk.',
  ] },
  'cross-body-shoulder-stretch': { name: 'Schouderrek over de borst', instructions: [
    'Sta rechtop en breng één arm gestrekt over je borst op schouderhoogte.',
    'Houd hem met de andere hand net boven de elleboog vast en trek hem zachtjes dichterbij.',
    'Houd je schouder omlaag en ontspannen. Je voelt het aan de achterkant van de schouder.',
  ] },
  'triceps-stretch': { name: 'Tricepsrek boven het hoofd', instructions: [
    'Sta rechtop en til één arm op, met gebogen elleboog zodat je hand achter je hoofd zakt.',
    'Duw met de andere hand de opgeheven elleboog zachtjes naar achter en omlaag.',
    'Houd je ribben omlaag en trek je rug niet hol.',
  ] },
  'doorway-chest-stretch': { name: 'Borstrek in een deuropening', instructions: [
    'Sta naast een deurpost of muur met je onderarm ertegen, elleboog ongeveer 90 graden gebogen.',
    'Zet een kleine stap naar voren en draai je lichaam zachtjes weg tot je de voorkant van schouder en borst voelt openen.',
    'Houd je schouder omlaag en je nek ontspannen. Ideaal na veel bureau- of fietstijd.',
  ] },
}
