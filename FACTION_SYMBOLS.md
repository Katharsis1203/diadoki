# Faction symbols

The map seals are original simplified SVG drawings inspired by surviving artifacts. They are visual faction identifiers, not reconstructions of standardized royal flags or coats of arms. Small-scale readability takes precedence over reproducing every detail of a coin.

## Ptolemy: eagle standing on a thunderbolt

The side-facing eagle now stands on a thunderbolt rather than appearing as a generic spread-wing bird. The motif appears on coins of Ptolemy I; see the [University of Colorado Art Museum's silver tetradrachm](https://www.colorado.edu/project/expressionsofidentity/silver-tetradrachm-alexandria-late-4th-early-3rd-century-bce-ptolemy-i). The eagle, folded wing, feet and thunderbolt are simplified to remain legible in the seal.

## Antigonus: Macedonian shield

The seal uses a round Macedonian shield with a central boss and a few crescent rim ornaments. It omits the monogram, deity portrait, and fine rim decoration to stay simple at small sizes. The [National Hellenic Research Foundation's bronze-coin record](https://pandektis.ekt.gr/pandektis/handle/10442/75821) describes a Macedonian shield on the obverse. [Museums Victoria's Antigonus II tetradrachm](https://collections.museumsvictoria.com.au/items/52802) depicts a Macedonian shield with Pan at its centre.

These references belong to Antigonus II Gonatas, 277/276–239 BCE. The scenario currently features Antigonus I and has no fixed opening year. The seal is an Antigonid dynastic visual reference, rather than an exact emblem of a particular ruler and year.

## Seleucids: anchor

The player faction is displayed as Seleucids, opening from Babylon. Its seal uses a simple anchor with a ring, shaft, crossbar and upward-pointing flukes. The anchor is documented on the coinage of Seleucus I in the [American Numismatic Society's Seleucid Coins Online catalogue](https://numismatics.org/sco/id/sc.1.88), including issues from Babylon.

The internal faction identifier remains `babylon`; labels and symbols use the Seleucid identity. The predecessor regional sun-disc emblem has been replaced. The palette remains the user-approved atlas palette; the reference image's suggested dynastic colours have not been applied.

## Dominion boundaries

The map keeps a shared parchment land palette. Slim ink outlines with faction-coloured bands mark the edges of holdings, while medium solid lines divide provinces and fine solid lines divide their states. The edge mesh and current owners determine all three border scales. After conquest, the faction outline between friendly states disappears, their administrative border remains, and new enemy frontiers receive faction outlines. A divided province reports mixed ownership in its derived summary. The default atlas shows Successor seats at Babylon, Alexandria, Mazaca, Pella and Lysimacheia; the districts and province captions have no repeated coin. A seat marker disappears when its faction loses that state.

`src/components/FactionSeals.tsx` holds the glyphs and `src/game/factionSymbols.ts` holds their display descriptions. `src/game/geography.ts` derives frontier and internal-division paths. The coins follow principal-seat ownership, and borders update from live campaign ownership and the authored atlas ownership in `politicalContent.ts`. The original playable campaign remains separate from those new atlas territories.

## Cassander and Lysimachus

These two atlas rulers reuse the simplified Macedonian shield in their own faction colours. This is an illustrative identifier, without additional historical provenance or a claim that either ruler used the exact Antigonid coin motif. The western map uses a loose 312 BCE reference while retaining the prototype’s original roster and established place names. The core-only authoring comparison retains Damascus as its original Ptolemaic seat; the full atlas uses Alexandria.
