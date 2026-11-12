export type TemplateCategory =
  | 'Molecular Biology'
  | 'Cell Biology'
  | 'Chemistry'
  | 'Materials Science'
  | 'General';

export type TemplateIconKey = 'dna' | 'flask' | 'microscope' | 'gauge' | 'file';

export interface TemplateMetadataSeed {
  key: string;
  value: string;
}

export interface ExperimentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  defaultTitle: string;
  previewSummary: string;
  iconKey: TemplateIconKey;
  metadata: TemplateMetadataSeed[];
  content: Record<string, unknown>;
}

interface TipTapTextNode {
  type: 'text';
  text: string;
}

interface TipTapParagraphNode {
  type: 'paragraph';
  content?: TipTapTextNode[];
}

function p(text?: string): TipTapParagraphNode {
  return text
    ? { type: 'paragraph', content: [{ type: 'text', text }] }
    : { type: 'paragraph' };
}

function h(level: 1 | 2 | 3, text: string): Record<string, unknown> {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  };
}

function makeTable(headers: string[], rows: string[][]): Record<string, unknown> {
  return {
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: headers.map((header) => ({
          type: 'tableHeader',
          content: [p(header)],
        })),
      },
      ...rows.map((row) => ({
        type: 'tableRow',
        content: row.map((cell) => ({
          type: 'tableCell',
          content: [p(cell)],
        })),
      })),
    ],
  };
}

export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = [
  'Molecular Biology',
  'Cell Biology',
  'Chemistry',
  'Materials Science',
  'General',
];

export const EXPERIMENT_TEMPLATES: readonly ExperimentTemplate[] = [
  {
    id: 'blank-experiment',
    name: 'Blank Experiment',
    category: 'General',
    description: 'Clean notebook canvas ready for freeform notes, slash commands, and instrumentation.',
    defaultTitle: 'Untitled Experiment',
    previewSummary: 'Empty canvas',
    iconKey: 'file',
    metadata: [],
    content: {
      type: 'doc',
      content: [p()],
    },
  },
  {
    id: 'standard-pcr',
    name: 'Standard PCR',
    category: 'Molecular Biology',
    description: 'Thermocycling checklist with live reaction timers, primer sequence block, and agarose gel readout.',
    defaultTitle: 'PCR Amplification & Gel Verification',
    previewSummary: 'PCR SOP + Sequence block + Gel verification table',
    iconKey: 'dna',
    metadata: [
      { key: 'category', value: 'Molecular Biology' },
      { key: 'polymerase', value: 'High-Fidelity Master Mix' },
      { key: 'expected_amplicon', value: 'TBD (bp)' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Objective & Target Amplicon'),
        p('Document template DNA source, expected amplicon length, and negative no-template control (NTC).'),
        {
          type: 'sequenceBlock',
          attrs: {
            name: 'Target Primer / Amplicon Reference',
            type: 'DNA',
            sequence: 'ATGCGTACGTTAGCTAAGTCGGATC',
          },
        },
        h(2, 'Thermocycling Protocol'),
        {
          type: 'protocolBlock',
          attrs: {
            title: 'Standard 3-Step PCR Amplification SOP',
            version: 1,
            steps: [
              { id: 'tpcr-1', text: 'Thaw primers, template DNA, and 2X Master Mix on ice; spin briefly to collect volume.', checked: false, checkedAt: null, deviation: null },
              { id: 'tpcr-2', text: 'Prepare 25 µL or 50 µL reaction mix on ice including NTC well; gently pipette to mix without bubbles.', checked: false, checkedAt: null, deviation: null },
              { id: 'tpcr-3', text: 'Run initial denaturation at 95°C for 3 minutes in calibrated thermal cycler.', checked: false, checkedAt: null, deviation: null, timerDuration: 180 },
              { id: 'tpcr-4', text: 'Execute 30 cycles: 95°C (30 s) → Tm - 5°C annealing (30 s) → 72°C extension (1 min/kb).', checked: false, checkedAt: null, deviation: null },
              { id: 'tpcr-5', text: 'Hold final extension at 72°C for 5 minutes, then cool to 4°C.', checked: false, checkedAt: null, deviation: null, timerDuration: 300 },
            ],
          },
        },
        h(2, 'Agarose Gel Electrophoresis Verification'),
        makeTable(
          ['Lane', 'Sample ID', 'Amplicon Expected (bp)', 'Observed Band (bp)', 'Result / Purity'],
          [
            ['1', 'DNA Ladder (1 kb Plus)', 'Reference', '', ''],
            ['2', 'No-Template Control (NTC)', 'None', '', ''],
            ['3', 'Sample A', '', '', ''],
          ]
        ),
        p(),
      ],
    },
  },
  {
    id: 'primer-design-worksheet',
    name: 'Primer Design Worksheet',
    category: 'Molecular Biology',
    description: 'Paired forward & reverse primer blocks with automated GC%, Wallace & salt-adjusted Tm, and reaction setup.',
    defaultTitle: 'Primer Design & Reaction Setup Worksheet',
    previewSummary: 'Fwd/Rev primer analysis + PCR mix stoichiometry',
    iconKey: 'dna',
    metadata: [
      { key: 'category', value: 'Molecular Biology' },
      { key: 'target_gene', value: 'TBD' },
      { key: 'delta_tm', value: '≤ 2.0 °C' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Primer Pair Candidates'),
        p('Paste candidate oligonucleotides below to verify GC%, melting temperature parity, and reverse complements.'),
        {
          type: 'sequenceBlock',
          attrs: {
            name: "Forward Primer (5'→3')",
            type: 'DNA',
            sequence: 'ATGCGTACGTTAGCTAAGTC',
          },
        },
        {
          type: 'sequenceBlock',
          attrs: {
            name: "Reverse Primer (5'→3')",
            type: 'DNA',
            sequence: 'GACTTAGCTAACGTACGCAT',
          },
        },
        h(2, 'Reaction Master Mix Setup (50 µL Total)'),
        makeTable(
          ['Component', 'Stock Concentration', 'Final Concentration', 'Volume per Reaction (µL)'],
          [
            ['2X Polymerase Master Mix', '2X', '1X', '25.0'],
            ['Forward Primer', '10 µM', '0.5 µM', '2.5'],
            ['Reverse Primer', '10 µM', '0.5 µM', '2.5'],
            ['Template DNA', '10 ng/µL', '10–50 ng', '2.0'],
            ['Nuclease-Free Water', '—', 'Bring to 50 µL', '18.0'],
          ]
        ),
        p(),
      ],
    },
  },
  {
    id: 'plasmid-miniprep',
    name: 'Plasmid Miniprep',
    category: 'Molecular Biology',
    description: 'Alkaline lysis SOP paired with reagent deductions for Buffers P1, P2, N3, and absolute ethanol.',
    defaultTitle: 'Plasmid DNA Miniprep Isolation',
    previewSummary: 'Alkaline lysis SOP + 4 Reagent blocks + Yield table',
    iconKey: 'dna',
    metadata: [
      { key: 'category', value: 'Molecular Biology' },
      { key: 'strain', value: 'E. coli DH5α' },
      { key: 'selection_marker', value: 'Ampicillin / Kanamycin' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Reagents Consumed'),
        {
          type: 'reagentBlock',
          attrs: { initialChemical: 'Buffer P1 (with RNase A)', initialQuantity: '250', initialUnit: 'uL' },
        },
        {
          type: 'reagentBlock',
          attrs: { initialChemical: 'Buffer P2 (Lysis)', initialQuantity: '250', initialUnit: 'uL' },
        },
        {
          type: 'reagentBlock',
          attrs: { initialChemical: 'Buffer N3 (Neutralization)', initialQuantity: '350', initialUnit: 'uL' },
        },
        {
          type: 'reagentBlock',
          attrs: { initialChemical: 'Ethanol (Wash / PE Prep)', initialQuantity: '750', initialUnit: 'uL' },
        },
        h(2, 'Miniprep Isolation Protocol'),
        {
          type: 'protocolBlock',
          attrs: {
            title: 'Alkaline Lysis Spin Column SOP',
            version: 1,
            steps: [
              { id: 'tmp-1', text: 'Pellet 3 mL overnight LB + antibiotic culture at 6,800 x g for 3 min; discard media.', checked: false, checkedAt: null, deviation: null, timerDuration: 180 },
              { id: 'tmp-2', text: 'Resuspend completely in 250 µL chilled Buffer P1 until homogeneous.', checked: false, checkedAt: null, deviation: null },
              { id: 'tmp-3', text: 'Add 250 µL Buffer P2, invert gently 4–6 times (do not exceed 5 minutes lysis).', checked: false, checkedAt: null, deviation: null },
              { id: 'tmp-4', text: 'Add 350 µL Buffer N3, invert 4–6 times, centrifuge 10 min at 17,900 x g.', checked: false, checkedAt: null, deviation: null, timerDuration: 600 },
              { id: 'tmp-5', text: 'Load supernatant onto silica column, centrifuge 60 s, wash with 750 µL Buffer PE, and dry spin 60 s.', checked: false, checkedAt: null, deviation: null, timerDuration: 60 },
              { id: 'tmp-6', text: 'Elute purified plasmid in 50 µL Buffer EB or nuclease-free water; quantify A260/A280.', checked: false, checkedAt: null, deviation: null },
            ],
          },
        },
        h(2, 'Spectrophotometric Yield & Purity'),
        makeTable(
          ['Construct / Clone ID', 'Conc. (ng/µL)', 'A260/A280', 'A260/A230', 'Storage Box / Slot'],
          [
            ['Clone #1', '', '', '', ''],
            ['Clone #2', '', '', '', ''],
          ]
        ),
        p(),
      ],
    },
  },
  {
    id: 'cell-passaging-log',
    name: 'Cell Passaging Log',
    category: 'Cell Biology',
    description: 'Adherent cell trypsinization & split protocol pre-tagged with cell line, passage #, and flask geometry.',
    defaultTitle: 'Mammalian Cell Passaging Log',
    previewSummary: 'Passaging SOP + Split density table + Flask metadata',
    iconKey: 'microscope',
    metadata: [
      { key: 'category', value: 'Cell Biology' },
      { key: 'cell_line', value: 'HEK293 / HeLa' },
      { key: 'passage_number', value: 'P' },
      { key: 'flask_size', value: 'T-75 (75 cm²)' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Culture Observation & Pre-Passaging State'),
        p('Inspect culture confluency, media clarity/phenol red color, and absence of microbial contamination before hood entry.'),
        {
          type: 'protocolBlock',
          attrs: {
            title: 'Adherent Cell Trypsinization & Passaging SOP',
            version: 1,
            steps: [
              { id: 'tcp-1', text: 'Warm DPBS, 0.25% Trypsin-EDTA, and complete growth medium to 37°C in bead/water bath.', checked: false, checkedAt: null, deviation: null },
              { id: 'tcp-2', text: 'Aspirate spent media and rinse monolayer gently with 5 mL sterile 1X DPBS (Ca2+/Mg2+-free).', checked: false, checkedAt: null, deviation: null },
              { id: 'tcp-3', text: 'Dispense 2 mL Trypsin-EDTA across monolayer; incubate at 37°C, 5% CO2 for 3–4 minutes until cells round and detach.', checked: false, checkedAt: null, deviation: null, timerDuration: 240 },
              { id: 'tcp-4', text: 'Quench trypsin with 6 mL pre-warmed serum-containing media and pipette gently to produce a single-cell suspension.', checked: false, checkedAt: null, deviation: null },
              { id: 'tcp-5', text: 'Centrifuge at 300 x g for 5 minutes, resuspend in fresh media, count viable cells, and seed daughter flasks at target split ratio.', checked: false, checkedAt: null, deviation: null, timerDuration: 300 },
            ],
          },
        },
        h(2, 'Daughter Vessel Seeding Record'),
        makeTable(
          ['Vessel ID', 'Flask / Plate Format', 'Split Ratio or Seeding Density', 'New Passage #', 'Incubator Shelf'],
          [
            ['Vessel A', 'T-75', '1:5', 'P+1', ''],
            ['Vessel B', 'T-75', '1:5', 'P+1', ''],
          ]
        ),
        p(),
      ],
    },
  },
  {
    id: 'cell-viability-assay',
    name: 'Cell Viability Assay',
    category: 'Cell Biology',
    description: 'Trypan Blue hemocytometer cell counting grid paired with automated viability percentage equation.',
    defaultTitle: 'Trypan Blue Cell Viability & Density Assay',
    previewSummary: 'Hemocytometer count table + Viability math formula',
    iconKey: 'microscope',
    metadata: [
      { key: 'category', value: 'Cell Biology' },
      { key: 'assay_method', value: '0.4% Trypan Blue Exclusion' },
      { key: 'dilution_factor', value: '2 (1:1 dye)' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Viability Calculation Formula'),
        {
          type: 'mathBlock',
          attrs: {
            latex: '\\text{Viability (\\%)} = \\frac{N_{\\text{viable}}}{N_{\\text{viable}} + N_{\\text{non-viable}}} \\times 100 \\qquad C_{\\text{viable}} = \\bar{N}_{\\text{quad}} \\times \\text{DF} \\times 10^{4}\\ \\text{cells/mL}',
          },
        },
        h(2, 'Hemocytometer Quadrant Counts (4 Corner 1 mm² Squares)'),
        makeTable(
          ['Sample ID', 'Q1 Live / Dead', 'Q2 Live / Dead', 'Q3 Live / Dead', 'Q4 Live / Dead', 'Mean Viable/Quad', 'Total Conc. (cells/mL)', 'Viability (%)'],
          [
            ['Control Flask', '', '', '', '', '', '', ''],
            ['Treated Condition A', '', '', '', '', '', '', ''],
          ]
        ),
        p(),
      ],
    },
  },
  {
    id: 'buffer-preparation',
    name: 'Buffer Preparation',
    category: 'Chemistry',
    description: 'Analytical buffer preparation SOP with stoichiometry mass/volume table and calibrated pH record.',
    defaultTitle: 'Standard Analytical Buffer Preparation',
    previewSummary: 'Buffer SOP + Mass/Volume stoichiometry + pH verification',
    iconKey: 'flask',
    metadata: [
      { key: 'category', value: 'Chemistry' },
      { key: 'target_ph', value: '7.40' },
      { key: 'final_volume', value: '1000 mL' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Formulation & Mass/Volume Calculation'),
        makeTable(
          ['Component', 'MW (g/mol)', 'Target Concentration', 'Calculated Mass / Vol', 'Measured Actual', 'Lot #'],
          [
            ['Sodium Chloride (NaCl)', '58.44', '137 mM', '8.006 g', '', ''],
            ['Potassium Chloride (KCl)', '74.55', '2.7 mM', '0.201 g', '', ''],
            ['Na2HPO4 (Dibasic)', '141.96', '10.0 mM', '1.420 g', '', ''],
            ['KH2PO4 (Monobasic)', '136.09', '1.8 mM', '0.245 g', '', ''],
          ]
        ),
        h(2, 'Preparation & pH Adjustment SOP'),
        {
          type: 'protocolBlock',
          attrs: {
            title: 'Analytical Buffer Formulation & Sterilization',
            version: 1,
            steps: [
              { id: 'tbp-1', text: 'Dissolve weighed dry salts in ~800 mL Type I ultrapure H2O under continuous magnetic stirring.', checked: false, checkedAt: null, deviation: null },
              { id: 'tbp-2', text: 'Perform two-point pH meter calibration (pH 4.00 & 7.00); record temperature compensation reading.', checked: false, checkedAt: null, deviation: null },
              { id: 'tbp-3', text: 'Titrate dropwise with 1 M HCl or 1 M NaOH to achieve final pH 7.40 ± 0.02.', checked: false, checkedAt: null, deviation: null },
              { id: 'tbp-4', text: 'Bring volume to 1000 mL in Class A volumetric flask and filter-sterilize (0.22 µm) or autoclave at 121°C.', checked: false, checkedAt: null, deviation: null },
            ],
          },
        },
        h(2, 'Final Quality Verification'),
        makeTable(
          ['Parameter', 'Specification', 'Measured Value', 'Calibration Meter ID', 'Pass / Fail'],
          [
            ['Final pH (at 22°C)', '7.40 ± 0.02', '', '', ''],
            ['Conductivity / Osmolality', 'Record baseline', '', '', ''],
          ]
        ),
        p(),
      ],
    },
  },
  {
    id: 'compound-library-entry',
    name: 'Compound Library Entry',
    category: 'Chemistry',
    description: 'PubChem-connected small molecule entry in name-lookup mode with analytical property and source provenance table.',
    defaultTitle: 'Compound Registration & Analytical Profile',
    previewSummary: 'Molecule lookup block + Physicochemical & source table',
    iconKey: 'flask',
    metadata: [
      { key: 'category', value: 'Chemistry' },
      { key: 'vendor_source', value: 'TBD' },
      { key: 'cas_number', value: 'TBD' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Chemical Structure & PubChem Resolution'),
        p('Enter a common compound name or IUPAC identifier below to fetch canonical SMILES, formula, molar mass, and InChIKey.'),
        {
          type: 'moleculeBlock',
          attrs: {
            smiles: '',
            name: '',
            mw: '',
            formula: '',
            iupacName: '',
            inchiKey: '',
            lookupMode: true,
          },
        },
        h(2, 'Compound Properties & Inventory Provenance'),
        makeTable(
          ['Attribute', 'Recorded Value', 'Analytical / Documentation Notes'],
          [
            ['CAS Registry Number', '', 'Verify against Certificate of Analysis'],
            ['Supplier & Catalog #', '', ''],
            ['Lot / Batch Number', '', ''],
            ['Appearance / Physical State', '', 'e.g. off-white crystalline solid'],
            ['Solvent & Stock Conc.', '', 'e.g. 10 mM in anhydrous DMSO'],
            ['Storage Condition', '', 'e.g. -20°C desiccated, light-protected'],
          ]
        ),
        p(),
      ],
    },
  },
  {
    id: 'tensile-test-record',
    name: 'Tensile Test Record',
    category: 'Materials Science',
    description: 'ASTM mechanical specimen geometry table paired with an interactive stress-strain telemetry chart.',
    defaultTitle: 'Uniaxial Tensile Testing Record',
    previewSummary: 'Specimen parameters table + Stress-Strain chart node',
    iconKey: 'gauge',
    metadata: [
      { key: 'category', value: 'Materials Science' },
      { key: 'test_standard', value: 'ASTM D638 / E8' },
      { key: 'crosshead_speed', value: '5.0 mm/min' },
    ],
    content: {
      type: 'doc',
      content: [
        h(2, 'Specimen Geometry & Load Frame Parameters'),
        makeTable(
          ['Specimen ID', 'Material / Alloy / Polymer', 'Gauge Length L₀ (mm)', 'Width × Thickness (mm)', 'Cross-Section A₀ (mm²)', 'Crosshead Rate (mm/min)', 'Ambient Temp / RH'],
          [
            ['SPEC-01', '', '50.0', '', '', '5.0', '23°C / 50% RH'],
            ['SPEC-02', '', '50.0', '', '', '5.0', '23°C / 50% RH'],
            ['SPEC-03', '', '50.0', '', '', '5.0', '23°C / 50% RH'],
          ]
        ),
        h(2, 'Engineering Stress vs. Strain Telemetry'),
        p('Drop CSV export from universal testing machine or stream live load-cell / extensometer telemetry below.'),
        {
          type: 'interactiveChart',
          attrs: { csvData: null },
        },
        h(2, 'Derived Mechanical Properties'),
        makeTable(
          ['Specimen ID', "Young's Modulus E (GPa)", 'Yield Strength σy (MPa)', 'Ultimate Tensile UTS (MPa)', 'Elongation at Break (%)', 'Failure Mode'],
          [
            ['SPEC-01', '', '', '', '', ''],
            ['SPEC-02', '', '', '', '', ''],
          ]
        ),
        p(),
      ],
    },
  },
];
