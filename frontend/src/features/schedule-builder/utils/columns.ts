import type { ColumnConfig } from '../types';

export const DEFAULT_COLUMNS: ColumnConfig[] = [
    {
        key: 'designation',
        label: 'Designation',
        visible: true,
        isDefault: true,
        description: `A unique identifier for the fixture type, following a specific naming convention. First, identify the Luminaire Category from the data sheet, then construct the designation string precisely according to the format for that category.

**Step 1: Identify Luminaire Category (One-letter code)**
- A: Volumetric (e.g., troffers, flat panels)
- C: Cove / Flexible Strip (use this for "flexible LED tape" or "encapsulated" LED strips)
- D: Decorative or Detention
- E: Exit Sign or Emergency Light
- F: Flood or Facade
- G: Garage Luminaire
- H: Heliport or Hazardous Location
- K: Lensed Troffer
- L: Linear Luminaire (pendant, surface, recessed linear)
- M: Medical / Patient Care / Hospital (follows same pattern as Linear)
- N: Downlight (recessed, surface, or pendant cans)
- R: Round Luminaire (general purpose round)
- S: Strip or Turret
- T: Track. For Track *Heads*, use the special designation format 'TA', 'TB', etc.
- U: Undercabinet
- X: Exterior Pole
- Y: Bollard
- Z: Other Exterior (e.g., steplight, uplight)

**Step 2: Find the matching format and build the designation.**
The designation is built from several components. Use the codes from the tables below. The '#' symbol represents a sequential number you assign (e.g., 1, 2, 3...) for different fixtures of the same category.

**Component Code Tables:**
*   **[Category] Codes (Mounting):**
    *   F: Flanged / Flangeless
    *   P: Pendant
    *   R: Recessed
    *   S: Surface Ceiling
    *   W: Wall
    *   X: Exterior
*   **[Output] Codes:**
    *   L: Low
    *   M: Medium
    *   H: High
    *   C: Color Changing
*   **[Distribution] Codes:**
    *   NS: Narrow Spot
    *   S: Spot
    *   NF: Narrow Flood
    *   F: Flood
    *   G: Graze
    *   D: Direct / Down
    *   U: Indirect / Up
    *   D/U: Direct/Indirect
    *   W: Wall Wash
    *   A: Adjustable
*   **[Size] Codes:** Look for dimensions. For rectangular fixtures, use LxW in feet (e.g., 24 for 2'x4'). For round fixtures, use diameter in inches (e.g., 4 for 4" dia).

**IMPORTANT NOTE ON LENGTHS:** For any fixture type that requires a length or height (e.g., Linear, Track, Flood, Exterior Pole, Cove), always use \`(##)\` as a placeholder in the designation. **DO NOT** attempt to extract a specific length value from the data sheet.

**Designation Formats by Luminaire Category:**
- **A (Volumetric):** A[Size][Category][Output]. Example: A24RM for a 2'x4' Recessed Medium-output volumetric fixture.
- **C (Cove/Strip):** C#[Output](##). Example: C1M(##) for the first cove fixture with Medium output.
- **D (Decorative/Detention):** D#[Category][Output]. Example: D1SH for the first decorative Surface-mount High-output fixture.
- **E (Exit/Emergency):** E#. Example: E1 for the first exit sign.
- **F (Flood/Facade):** F#[Output][Distribution](##). Example: F1MG(##) for the first Flood, Medium output, Graze. Length is a placeholder.
- **G (Garage):** G#[Output]. Example: G1M for the first Garage fixture with Medium output.
- **H (Heliport/Hazardous):** H[Size or #][Category][Output]. Example: H14RL for a 14" Hazardous Recessed Low-output fixture.
- **K (Lensed Troffer):** K[Size][Category][Output]. Example: K24RM for a 2'x4' Recessed Medium-output troffer.
- **L (Linear):** L#[Category][Output][Distribution](##). Example: L2PLD(##) for the second linear fixture, Pendant, Low output, Direct distribution.
- **M (Medical):** M#[Category][Output][Distribution](##). Follows the same pattern as Linear. Example: M1SMD(##)
- **N (Downlight):** N[Size in inches][Category][Output][Distribution]. Example: N4FMF for a 4" Flanged Medium-output Flood downlight.
- **R (Round):** R[Size in inches][Category][Output]. Example: R4SM for a 4" round Surface-mount Medium-output fixture.
- **S (Strip/Turret):** S[Size][Category][Output]. Example: S4PM for a 4" Strip Pendant Medium-output.
- **T (Track):** T[# of Circuits][Category](##). Example: T2R(##) for a 2-circuit Recessed track.
- **TA/TB... (Track Head):** T#, where # is a letter (A, B, C...). Example: TA for the first track head type.
- **U (Undercabinet):** U[Size][Output]. Example: U1M for a size 1 undercabinet with Medium output.
- **X (Exterior Pole):** X[# of Heads]#[Height(##)]. Example: X21(##) for an exterior pole with 2 heads, type 1.
- **Y (Bollard):** Y#. Example: Y1 for the first bollard type.
- **Z (Other Exterior):** Z#[Output][Distribution]. Example: Z1MF for the first "other exterior", Medium output, Flood distribution.

If you cannot determine all parts of the designation, construct it with the information you can find. The Category letter is the most important part.`
    },
    { key: 'description', label: 'Description', visible: true, isDefault: true, description: 'A comprehensive description including generic type, aperture/size, housing dimensions, materials, lens type, IP rating, and other relevant ratings. E.g., "4-inch round recessed downlight, aluminum housing, clear lens, IP65".' },
    { key: 'manufacturer', label: 'Manufacturer', visible: true, isDefault: true, description: 'The manufacturing company name. Pick from the header or footer of the document. Do not pick conglomerates; pick the specific manufacturer name. E.g., "Lumenture", "Acuity Brands".' },
    { key: 'series', label: 'Series', visible: true, isDefault: true, description: 'The product series or model name. Prioritize extracting the full ordering code or part number if available, as this provides the most detail. Do not extract anything that is explicitly marked as an "example" or "sample ordering code". E.g., "Evo 4S-R-D-S-15-930-10-1-S-WH", "Cylinders Series".' },
    { key: 'lampType', label: 'Source', visible: true, isDefault: true, description: 'The light source technology. If the text contains "LED" in any form (e.g., "Integral LED", "Integrated LED array"), simplify the output to only "LED".' },
    { key: 'voltage', label: 'Voltage', visible: true, isDefault: true, description: 'Operating voltage. **Your highest priority is to find a user annotation (highlight, circle, checkmark). If an option is marked, extract that specific value.** If no annotations are present, extract the most common or default value from the available options. E.g., "120-277V", "UNV", "MVOLT", "120V".' },
    { key: 'wattage', label: 'Wattage', visible: true, isDefault: true, description: 'The total power consumption in watts. **First, check for user annotations (highlights, circles). If a specific wattage is marked, extract that value.** If there are no annotations, then follow this rule: for NON-LINEAR fixtures (downlights, troffers), extract the wattage. For LINEAR fixtures (categories L, C, M, T), this field should be "--".' },
    { key: 'wattPerFoot', label: 'Watt/Ft', visible: true, isDefault: true, description: 'The wattage per foot (W/ft), primarily for LINEAR fixtures. **First, check for user annotations (highlights, circles). If a specific "W/ft" value is marked, extract it.** If there are no annotations, then follow this rule: for LINEAR fixtures (categories L, C, M, T), find and extract the W/ft value. For NON-LINEAR fixtures (downlights, troffers), this field should be "--".' },
    { key: 'deliveredLumens', label: 'Lumens', visible: true, isDefault: true, description: 'The light output in lumens. **Your highest priority is to find a user annotation (highlight, circle, checkmark). If a lumen value is marked, extract that specific value.** If no annotations are present, extract the default or a representative value from the available options.' },
    { key: 'cct', label: 'CCT', visible: true, isDefault: true, description: 'Correlated Color Temperature (CCT). **Your highest priority is to find a user annotation (highlight, circle, checkmark). If a CCT value (e.g., 3000K, 4000K) is marked, extract that specific value.** If no annotations are present, extract the default or most common value.' },
    { key: 'cri', label: 'CRI', visible: true, isDefault: true, description: 'Color Rendering Index (CRI). **Your highest priority is to find a user annotation (highlight, circle, checkmark). If a CRI value (e.g., 80, 90+) is marked, extract that specific value.** If no annotations are present, extract the default or highest available value.' },
    { key: 'mounting', label: 'Mounting', visible: true, isDefault: true, description: 'The mounting type of the fixture. Extract terms like "Recessed", "Surface Mount", "Pendant Mount", "Suspended", "Track Mount", or "Wall Mount". This can often be inferred from the product description or specific mounting diagrams/sections.' },
    { key: 'finish', label: 'Finish', visible: true, isDefault: true, description: 'The finish or color of the fixture. **Your highest priority is to find a user annotation (highlight, circle, checkmark). If a finish option (e.g., "White", "Black", "Satin Nickel") is marked, extract that specific value.** If no annotations are present, extract the default or most common finish from the available options.' },
    { key: 'driverInfo', label: 'Driver Info', visible: true, isDefault: true, description: 'Dimming protocol or driver type. **Check carefully for user annotations (highlights, circles) indicating a specific driver or dimming option.** If an option like "0-10V", "TRIAC/ELV", "DALI", or "Lutron EcoSystem" is marked, extract it. If not, extract the most likely default or general type like "Integral Driver".' },
    { key: 'notes', label: 'Notes', visible: true, isDefault: true, description: 'This field is for user-entered notes. The AI should always return "--" for this field.' },
];
