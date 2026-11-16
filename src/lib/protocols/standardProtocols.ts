// src/lib/protocols/standardProtocols.ts
// Standard, peer-reviewed laboratory Standard Operating Procedures (SOPs)
// Spans Molecular Biology, Biochemistry, Cell Biology, Chemistry, and Materials Science.

export interface StandardProtocolStep {
  id: string;
  text: string;
  timerDuration?: number | null;
}

export type ProtocolCategory =
  | 'Molecular Biology'
  | 'Biochemistry'
  | 'Cell Biology'
  | 'Chemistry'
  | 'Materials Science';

export interface StandardProtocol {
  slug: string;
  name: string;
  category: ProtocolCategory;
  description: string;
  version: number;
  steps: StandardProtocolStep[];
  estimatedDuration: string;
}

export const STANDARD_PROTOCOLS: StandardProtocol[] = [
  {
    slug: 'pcr-thermal-cycling',
    name: 'PCR Amplification & Thermal Cycling SOP',
    category: 'Molecular Biology',
    description: 'High-fidelity target DNA amplicon generation with hot-start polymerase and temperature cycling checkpoints.',
    version: 1,
    estimatedDuration: '2.5 hours',
    steps: [
      { id: 'pcr-1', text: 'Thaw 2X High-Fidelity PCR Master Mix, forward/reverse primers (10 µM), and template DNA on ice.', timerDuration: null },
      { id: 'pcr-2', text: 'Assemble reaction on ice: 12.5 µL Master Mix, 1.0 µL Fwd Primer, 1.0 µL Rev Primer, 2.0 µL Template (10-50 ng), nuclease-free water to 25.0 µL.', timerDuration: null },
      { id: 'pcr-3', text: 'Gently pulse-vortex and spin down PCR tubes in microcentrifuge for 5 seconds.', timerDuration: 5 },
      { id: 'pcr-4', text: 'Initial Denaturation: Heat reaction at 98°C for 30 seconds.', timerDuration: 30 },
      { id: 'pcr-5', text: '30 Cycles of Denaturation: 98°C for 10 seconds.', timerDuration: 10 },
      { id: 'pcr-6', text: '30 Cycles of Primer Annealing: 58°C for 30 seconds.', timerDuration: 30 },
      { id: 'pcr-7', text: '30 Cycles of Extension: 72°C for 45 seconds (30s/kb).', timerDuration: 45 },
      { id: 'pcr-8', text: 'Final Extension: 72°C for 5 minutes to complete full-length amplicons.', timerDuration: 300 },
      { id: 'pcr-9', text: 'Hold at 4°C indefinitely; verify amplicon size via 1.0% agarose gel electrophoresis.', timerDuration: null },
    ],
  },
  {
    slug: 'western-blot-assay',
    name: 'SDS-PAGE & Western Blot Chemiluminescence SOP',
    category: 'Biochemistry',
    description: 'Denaturing protein electrophoresis, wet tank membrane transfer, blocking, and antibody chemiluminescence detection.',
    version: 1,
    estimatedDuration: '5 hours',
    steps: [
      { id: 'wb-1', text: 'Quantify protein lysates with BCA assay; normalize samples to 20 µg protein per 15 µL volume in RIPA buffer.', timerDuration: null },
      { id: 'wb-2', text: 'Add 4X Laemmli sample buffer with 10% beta-mercaptoethanol; boil samples at 95°C for 5 minutes.', timerDuration: 300 },
      { id: 'wb-3', text: 'Load samples and prestained molecular weight ladder into 4-20% Tris-Glycine SDS-PAGE gel; run at 120V for 70 minutes.', timerDuration: 4200 },
      { id: 'wb-4', text: 'Equilibrate PVDF membrane in 100% methanol for 1 min, then transfer buffer for 5 minutes.', timerDuration: 300 },
      { id: 'wb-5', text: 'Assemble transfer sandwich; wet transfer to PVDF membrane at 100V for 60 minutes with ice block cooling.', timerDuration: 3600 },
      { id: 'wb-6', text: 'Block membrane in 5% non-fat dry milk in TBST (0.1% Tween-20) for 1 hour at room temperature with gentle rocking.', timerDuration: 3600 },
      { id: 'wb-7', text: 'Incubate primary antibody (1:1000 in 5% BSA/TBST) overnight at 4°C with orbital shaking.', timerDuration: null },
      { id: 'wb-8', text: 'Wash membrane 3 times for 10 minutes each with 1X TBST buffer.', timerDuration: 600 },
      { id: 'wb-9', text: 'Incubate HRP-conjugated secondary antibody (1:5000 in 5% milk/TBST) for 1 hour at room temperature.', timerDuration: 3600 },
      { id: 'wb-10', text: 'Wash 3 times for 10 minutes with TBST; apply ECL substrate and image chemiluminescence.', timerDuration: 120 },
    ],
  },
  {
    slug: 'mammalian-cell-passaging',
    name: 'Adherent Mammalian Cell Culture Passaging SOP',
    category: 'Cell Biology',
    description: 'Aseptic trypsinization, cell detachment, counting, and subculturing of adherent mammalian cell lines.',
    version: 1,
    estimatedDuration: '45 minutes',
    steps: [
      { id: 'cp-1', text: 'Examine cell morphology and verify 75-85% confluence under inverted phase-contrast microscope.', timerDuration: null },
      { id: 'cp-2', text: 'Pre-warm complete growth medium (10% FBS) and 0.25% Trypsin-EDTA in 37°C water bath for 20 minutes.', timerDuration: 1200 },
      { id: 'cp-3', text: 'In laminar flow hood, aspirate spent medium from culture vessel without disturbing monolayer.', timerDuration: null },
      { id: 'cp-4', text: 'Wash monolayer with 5 mL sterile 1X DPBS (without calcium or magnesium); aspirate PBS.', timerDuration: null },
      { id: 'cp-5', text: 'Add 2.0 mL 0.25% Trypsin-EDTA; incubate at 37°C for 3-5 minutes until cells round up and detach.', timerDuration: 240 },
      { id: 'cp-6', text: 'Neutralize dissociation by adding 6.0 mL complete growth medium; gently pipette to disperse into single-cell suspension.', timerDuration: null },
      { id: 'cp-7', text: 'Pellet cells by centrifugation at 300 x g for 5 minutes at room temperature.', timerDuration: 300 },
      { id: 'cp-8', text: 'Aspirate supernatant, resuspend in 5 mL fresh complete medium, count viable cells with Trypan Blue (1:1 ratio).', timerDuration: null },
      { id: 'cp-9', text: 'Seed new culture flasks at target density (e.g. 1.0 x 10^4 cells/cm²) and return to 37°C / 5% CO2 incubator.', timerDuration: null },
    ],
  },
  {
    slug: 'plasmid-miniprep-isolation',
    name: 'Alkaline Lysis Plasmid DNA Miniprep SOP',
    category: 'Molecular Biology',
    description: 'Isolation and spin-column silica purification of high-copy plasmid DNA from recombinant E. coli cultures.',
    version: 1,
    estimatedDuration: '40 minutes',
    steps: [
      { id: 'mp-1', text: 'Pellet 3.0 mL of saturated overnight bacterial culture by centrifugation at 6,800 x g for 3 minutes; discard supernatant.', timerDuration: 180 },
      { id: 'mp-2', text: 'Resuspend pellet thoroughly in 250 µL chilled Resuspension Buffer P1 (with RNase A) by pipetting until uniform.', timerDuration: null },
      { id: 'mp-3', text: 'Add 250 µL Lysis Buffer P2; invert tube gently 4-6 times to mix until solution clears and becomes viscous (do not vortex; max 5 min).', timerDuration: 240 },
      { id: 'mp-4', text: 'Add 350 µL Neutralization Buffer N3; invert immediately 4-6 times until dense white precipitate forms.', timerDuration: null },
      { id: 'mp-5', text: 'Centrifuge lysate at 17,900 x g for 10 minutes at room temperature to compact cellular debris.', timerDuration: 600 },
      { id: 'mp-6', text: 'Pipette cleared supernatant into silica spin column; centrifuge at 17,900 x g for 60 seconds; discard flow-through.', timerDuration: 60 },
      { id: 'mp-7', text: 'Add 750 µL Wash Buffer PE (with ethanol); centrifuge for 60 seconds; discard flow-through.', timerDuration: 60 },
      { id: 'mp-8', text: 'Centrifuge empty column at 17,900 x g for 1 minute to dry silica membrane of residual ethanol.', timerDuration: 60 },
      { id: 'mp-9', text: 'Place column into sterile 1.5 mL tube, add 50 µL Elution Buffer EB directly to membrane center, incubate 1 min, spin 1 min.', timerDuration: 60 },
    ],
  },
  {
    slug: 'bacterial-transformation-heat-shock',
    name: 'Bacterial Heat-Shock Transformation & SOC Recovery SOP',
    category: 'Molecular Biology',
    description: 'Competent E. coli transformation with plasmid DNA, thermal pulse, and antibiotic selection plating (iGEM & synthetic biology standard).',
    version: 1,
    estimatedDuration: '1.5 hours',
    steps: [
      { id: 'bt-1', text: 'Thaw chemically competent E. coli cells (DH5-alpha or TOP10) on wet ice for 10 minutes.', timerDuration: 600 },
      { id: 'bt-2', text: 'Add 1-5 µL plasmid DNA (1-10 ng) directly to 50 µL cell suspension; tap gently to mix (do not pipette or vortex).', timerDuration: null },
      { id: 'bt-3', text: 'Incubate DNA-cell mixture on ice for 30 minutes.', timerDuration: 1800 },
      { id: 'bt-4', text: 'Heat-shock tubes in 42°C calibrated water bath for exactly 45 seconds without agitation.', timerDuration: 45 },
      { id: 'bt-5', text: 'Rapidly transfer tubes back to ice for 2 minutes to stabilize membrane pores.', timerDuration: 120 },
      { id: 'bt-6', text: 'Add 450 µL pre-warmed SOC outgrowth medium (room temp or 37°C) under aseptic conditions.', timerDuration: null },
      { id: 'bt-7', text: 'Incubate tubes at 37°C with vigorous shaking (225 rpm) for 60 minutes for antibiotic resistance gene expression.', timerDuration: 3600 },
      { id: 'bt-8', text: 'Spread 50-100 µL transformation mix onto pre-warmed LB agar selection plates containing appropriate antibiotic.', timerDuration: null },
      { id: 'bt-9', text: 'Invert plates and incubate overnight (14-16 hours) at 37°C until discrete colonies form.', timerDuration: null },
    ],
  },
  {
    slug: 'bradford-protein-assay',
    name: 'Bradford Protein Quantification Microplate Assay SOP',
    category: 'Biochemistry',
    description: 'Colorimetric Bradford reagent assay with bovine serum albumin (BSA) 8-point standard curve and 595 nm absorbance reading.',
    version: 1,
    estimatedDuration: '40 minutes',
    steps: [
      { id: 'ba-1', text: 'Equilibrate Coomassie G-250 Bradford reagent to room temperature; invert bottle gently to resuspend dye.', timerDuration: null },
      { id: 'ba-2', text: 'Prepare BSA 8-point standard curve in diluent matching sample buffer (0, 125, 250, 500, 750, 1000, 1500, 2000 µg/mL).', timerDuration: null },
      { id: 'ba-3', text: 'Pipette 5.0 µL of each standard and unknown experimental sample in technical triplicates into clear 96-well flat-bottom plate.', timerDuration: null },
      { id: 'ba-4', text: 'Dispense 250 µL Bradford reagent into each well using multichannel pipette; mix on plate shaker for 30 seconds.', timerDuration: 30 },
      { id: 'ba-5', text: 'Incubate microplate at room temperature protected from light for 10 minutes.', timerDuration: 600 },
      { id: 'ba-6', text: 'Measure absorbance at 595 nm on microplate spectrophotometer; verify blank absorbance and generate linear calibration curve (R² ≥ 0.99).', timerDuration: null },
    ],
  },
  {
    slug: 'buffer-prep-ph-titration',
    name: 'Analytical Buffer Formulation & pH Titration SOP',
    category: 'Chemistry',
    description: 'Precision molar solute dissolution, two-point temperature-compensated pH electrode calibration, titration, and 0.22 µm filtration.',
    version: 1,
    estimatedDuration: '1 hour',
    steps: [
      { id: 'buf-1', text: 'Calculate target reagent molarities; tare analytical balance and record exact weights and manufacturer lot numbers of dry solutes.', timerDuration: null },
      { id: 'buf-2', text: 'Dissolve solutes in 80% final target volume of Type I Milli-Q water (18.2 MOhm·cm) using PTFE magnetic stir bar.', timerDuration: null },
      { id: 'buf-3', text: 'Perform two-point calibration on digital pH meter with NIST-traceable standard buffers (pH 4.00, 7.00, 10.00) with automatic temperature compensation.', timerDuration: null },
      { id: 'buf-4', text: 'Immerse probe into stirring solution; titrate dropwise with standardized 1.0 M HCl or 1.0 M NaOH to target pH ± 0.02.', timerDuration: null },
      { id: 'buf-5', text: 'Quantitatively transfer solution to calibrated Class A volumetric flask; bring to graduation line with Type I water.', timerDuration: null },
      { id: 'buf-6', text: 'Filter sterilize through 0.22 µm PES membrane or autoclave at 121°C / 15 psi for 20 minutes as specified by chemical stability.', timerDuration: 1200 },
      { id: 'buf-7', text: 'Affix GHS hazard label with concentration, pH, preparation date, expiration date, and preparer initials.', timerDuration: null },
    ],
  },
  {
    slug: 'tensile-materials-testing',
    name: 'Tensile & Materials Mechanical Testing SOP',
    category: 'Materials Science',
    description: 'Uniaxial tensile strength, yield modulus, and elongation-to-failure testing on universal testing machine (ASTM D638 / E8).',
    version: 1,
    estimatedDuration: '1.5 hours',
    steps: [
      { id: 'mat-1', text: 'Measure specimen gauge dimensions (width and thickness) at 3 locations using calibrated digital micrometer; compute average cross-sectional area.', timerDuration: null },
      { id: 'mat-2', text: 'Power on Universal Testing Machine (UTM) and calibrate load cell zero and crosshead displacement transducer.', timerDuration: null },
      { id: 'mat-3', text: 'Align specimen axially within pneumatic or mechanical wedge grips; verify grip pressure prevents slippage without jaw crushing.', timerDuration: null },
      { id: 'mat-4', text: 'Attach axial extensometer to gauge section; zero strain channel and set crosshead test speed (e.g. 5.0 mm/min).', timerDuration: null },
      { id: 'mat-5', text: 'Initiate tensile test; stream load-displacement telemetry continuously through yield point, ultimate tensile strength (UTS), and fracture.', timerDuration: 300 },
      { id: 'mat-6', text: 'Remove extensometer prior to specimen rupture if specified to prevent transducer shock damage.', timerDuration: null },
      { id: 'mat-7', text: 'Record failure location (ensure failure occurs within gauge length, not inside grip jaws).', timerDuration: null },
      { id: 'mat-8', text: 'Calculate Youngs Modulus (E), 0.2% Offset Yield Strength, Ultimate Tensile Strength, and Fracture Elongation percentage.', timerDuration: null },
    ],
  },
];

/**
 * Builds the TipTap document JSON tree for a standard protocol, ready to be saved into
 * a ProtocolTemplate or loaded directly into an active Trial document.
 */
export function buildTipTapProtocolDoc(protocol: StandardProtocol): Record<string, unknown> {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: protocol.name }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `${protocol.description} Standard Category: ${protocol.category} · Estimated Duration: ${protocol.estimatedDuration}.`,
          },
        ],
      },
      {
        type: 'protocolBlock',
        attrs: {
          title: protocol.name,
          version: protocol.version,
          steps: protocol.steps.map((s) => ({
            id: s.id,
            text: s.text,
            checked: false,
            checkedAt: null,
            deviation: null,
            timerDuration: s.timerDuration ?? null,
          })),
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Experimental observations, sensor telemetry, and protocol deviations are recorded below:',
          },
        ],
      },
    ],
  };
}
