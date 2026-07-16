/**
 * Study Maps — universal "study path" structure: Topic → branches → leaves,
 * each leaf with a 4-level mastery. Haiku generates the hierarchy for any topic;
 * stored locally (like goals). Domain-agnostic: math, writing, music, anything.
 */
import { apiFetch } from "../../auth/cloudSync.js";

const KEY = "inkling-studymaps-v1";

export const MASTERY = ["Not yet", "Learning", "Confident", "Mastered"]; // 0..3
export const MASTERY_COLOR = ["#6b7280", "#f5a623", "#58a6ff", "#39d98a"];

function uid(p = "n") { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }

export function loadStudyMaps() {
  try { const r = localStorage.getItem(KEY); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; }
  catch { return []; }
}
function saveAll(maps) { try { localStorage.setItem(KEY, JSON.stringify(maps)); return true; } catch { return false; } }

export function getStudyMap(id) { return loadStudyMaps().find((m) => m.id === id) || null; }

export function saveStudyMap(map) {
  const maps = loadStudyMaps();
  const i = maps.findIndex((m) => m.id === map.id);
  if (i >= 0) maps[i] = map; else maps.unshift(map);
  saveAll(maps);
  return map;
}

export function deleteStudyMap(id) { saveAll(loadStudyMaps().filter((m) => m.id !== id)); }

/** Cycle a leaf's mastery 0→1→2→3→0 and persist. */
export function cycleMastery(mapId, leafId) {
  const map = getStudyMap(mapId);
  if (!map) return null;
  for (const br of map.branches) {
    const leaf = br.leaves.find((l) => l.id === leafId);
    if (leaf) { leaf.mastery = ((leaf.mastery || 0) + 1) % 4; saveStudyMap(map); return leaf.mastery; }
  }
  return null;
}

/** Mark a leaf at least "Learning" by label (auto-light from chat). */
export function touchLeavesByLabel(labels = []) {
  const want = new Set(labels.map((l) => String(l).toLowerCase()));
  if (!want.size) return 0;
  const maps = loadStudyMaps();
  let touched = 0;
  for (const map of maps) {
    for (const br of map.branches) {
      for (const leaf of br.leaves) {
        if (want.has(leaf.label.toLowerCase()) && (leaf.mastery || 0) < 1) { leaf.mastery = 1; touched++; }
      }
    }
  }
  if (touched) saveAll(maps);
  return touched;
}

export function mapProgress(map) {
  let sum = 0, total = 0;
  for (const br of map.branches) for (const leaf of br.leaves) { sum += (leaf.mastery || 0); total++; }
  return { total, pct: total ? Math.round((sum / (total * 3)) * 100) : 0 };
}

/**
 * Built-in study maps for the questionnaires already mapped out in the app, so
 * they show up under Study Maps automatically (no need to search/generate). Seeds
 * ONCE — if the user later deletes one, it stays deleted (we don't re-add).
 */
const BUILTIN_SEEDED_KEY = "inkling-studymaps-builtin-seeded-v1";

function buildPrecalcMap() {
  const leaf = (label) => ({ id: uid("l"), label, mastery: 0 });
  const branch = (label, labels) => ({ id: uid("b"), label, leaves: labels.map(leaf) });
  return {
    id: "sm_builtin_precalc",
    topic: "OpenStax Precalculus",
    builtin: true,
    createdAt: Date.now(),
    branches: [
      branch("Chapter 1 · Functions", [
        "1.1 Functions & Function Notation",
        "1.2 Domain and Range",
        "1.3 Rates of Change & Behavior of Graphs",
        "1.4 Composition of Functions",
        "1.5 Transformation of Functions",
        "1.6 Absolute Value Functions",
        "1.7 Inverse Functions"
      ]),
      branch("Chapter 2 · Linear Functions", [
        "2.1 Linear Functions",
        "2.2 Graphs of Linear Functions",
        "2.3 Modeling with Linear Functions",
        "2.4 Fitting Linear Models to Data"
      ]),
      branch("Chapter 3 · Polynomial & Rational Functions", [
        "3.1 Complex Numbers",
        "3.2 Quadratic Functions",
        "3.3 Power Functions & Polynomial Functions"
      ])
    ]
  };
}

function buildBiologyMap() {
  const leaf = (label) => ({ id: uid("l"), label, mastery: 0 });
  const branch = (label, labels) => ({ id: uid("b"), label, leaves: labels.map(leaf) });
  return {
    id: "sm_builtin_biology",
    topic: "OpenStax Biology",
    builtin: true,
    createdAt: Date.now(),
    branches: [
      branch("Chapter 1 · The Study of Life", [
        "1.1.1 Science of biology",
        "1.1.2 Inductive vs deductive reasoning",
        "1.1.3 Steps of the scientific method",
        "1.1.4 Hypothesis vs theory",
        "1.2.1 Properties of life",
        "1.2.2 Levels of organization",
        "1.2.3 Phylogenetic tree of life",
        "1.2.4 Evolution as biology's core theme"
      ]),
      branch("Chapter 2 · The Chemical Foundation of Life", [
        "2.1.1 Atomic structure",
        "2.1.2 Isotopes and radioactivity",
        "2.1.3 Ions and electron shells",
        "2.1.4 Covalent vs ionic bonds",
        "2.1.5 Hydrogen bonds",
        "2.2.1 Water polarity and cohesion",
        "2.2.2 Solvent of life",
        "2.2.3 pH, acids, and bases",
        "2.2.4 Buffers stabilize pH",
        "2.3.1 Carbon's four bonds",
        "2.3.2 Hydrocarbons and isomers",
        "2.3.3 Functional groups"
      ]),
      branch("Chapter 3 · Biological Macromolecules", [
        "3.1.1 Monomers and polymers",
        "3.1.2 Dehydration synthesis",
        "3.1.3 Hydrolysis reactions",
        "3.2.1 Mono-, di-, polysaccharides",
        "3.2.2 Glucose, starch, glycogen",
        "3.2.3 Cellulose and chitin",
        "3.3.1 Fats and fatty acids",
        "3.3.2 Saturated vs unsaturated",
        "3.3.3 Phospholipids and bilayers",
        "3.3.4 Steroids and cholesterol",
        "3.4.1 Amino acids and peptide bonds",
        "3.4.2 Four levels of protein structure",
        "3.4.3 Denaturation",
        "3.4.4 Enzymes as proteins",
        "3.5.1 DNA vs RNA",
        "3.5.2 Nucleotide structure",
        "3.5.3 Base pairing and the double helix"
      ]),
      branch("Chapter 4 · Cell Structure", [
        "4.1.1 Cell theory",
        "4.1.2 Microscopy",
        "4.1.3 Surface-area-to-volume ratio",
        "4.2.1 Prokaryotic cell features",
        "4.2.2 Nucleoid and no membrane organelles",
        "4.2.3 Cell wall and capsule",
        "4.3.1 Nucleus and ribosomes",
        "4.3.2 Mitochondria and chloroplasts",
        "4.3.3 ER and Golgi",
        "4.3.4 Plant vs animal cells",
        "4.4.1 Endomembrane system",
        "4.4.2 Rough vs smooth ER",
        "4.4.3 Golgi sorting",
        "4.4.4 Lysosomes and vesicles",
        "4.5.1 Microfilaments, microtubules",
        "4.5.2 Intermediate filaments",
        "4.5.3 Flagella and cilia",
        "4.6.1 Extracellular matrix",
        "4.6.2 Tight junctions, desmosomes",
        "4.6.3 Gap junctions and plasmodesmata"
      ]),
      branch("Chapter 5 · Structure and Function of Plasma Membranes", [
        "5.1.1 Fluid mosaic model",
        "5.1.2 Phospholipid bilayer",
        "5.1.3 Membrane proteins",
        "5.1.4 Membrane fluidity",
        "5.2.1 Diffusion",
        "5.2.2 Osmosis and tonicity",
        "5.2.3 Facilitated diffusion",
        "5.3.1 Primary active transport",
        "5.3.2 Sodium-potassium pump",
        "5.3.3 Secondary transport",
        "5.4.1 Endocytosis",
        "5.4.2 Phagocytosis and pinocytosis",
        "5.4.3 Exocytosis"
      ]),
      branch("Chapter 6 · Metabolism", [
        "6.1.1 Anabolism vs catabolism",
        "6.1.2 Bioenergetics",
        "6.1.3 Metabolic pathways",
        "6.2.1 Potential vs kinetic energy",
        "6.2.2 Free energy (Gibbs)",
        "6.2.3 Activation energy",
        "6.2.4 Exergonic vs endergonic",
        "6.3.1 First law of thermodynamics",
        "6.3.2 Second law and entropy",
        "6.4.1 ATP structure",
        "6.4.2 ATP–ADP cycle",
        "6.4.3 Phosphorylation",
        "6.5.1 Active site and substrate",
        "6.5.2 Induced fit",
        "6.5.3 Cofactors and coenzymes",
        "6.5.4 Enzyme inhibition and regulation"
      ]),
      branch("Chapter 7 · Cellular Respiration", [
        "7.1.1 Redox reactions",
        "7.1.2 Electron carriers NAD+/FAD",
        "7.1.3 ATP from glucose overview",
        "7.2.1 Glycolysis splits glucose",
        "7.2.2 Net 2 ATP, 2 NADH",
        "7.2.3 Pyruvate product",
        "7.3.1 Pyruvate to acetyl-CoA",
        "7.3.2 Citric acid (Krebs) cycle",
        "7.3.3 CO2, NADH, FADH2 output",
        "7.4.1 Electron transport chain",
        "7.4.2 Chemiosmosis",
        "7.4.3 ATP synthase",
        "7.4.4 Oxygen as final acceptor",
        "7.5.1 Anaerobic respiration",
        "7.5.2 Lactic acid fermentation",
        "7.5.3 Alcohol fermentation",
        "7.6.1 Catabolism of proteins and lipids",
        "7.6.2 Pathway connections",
        "7.6.3 Beta-oxidation",
        "7.7.1 Feedback inhibition",
        "7.7.2 Regulation by ATP/AMP"
      ]),
      branch("Chapter 8 · Photosynthesis", [
        "8.1.1 Autotrophs and photoautotrophs",
        "8.1.2 Chloroplasts and pigments",
        "8.1.3 Two stages overview",
        "8.2.1 Light-dependent reactions",
        "8.2.2 Photosystems I and II",
        "8.2.3 ATP and NADPH made",
        "8.2.4 Photolysis of water",
        "8.3.1 Calvin cycle",
        "8.3.2 Carbon fixation and RuBisCO",
        "8.3.3 G3P sugar product",
        "8.3.4 C3, C4, and CAM plants"
      ]),
      branch("Chapter 9 · Cell Communication", [
        "9.1.1 Signaling molecules (ligands)",
        "9.1.2 Receptor types",
        "9.1.3 Intracellular vs cell-surface receptors",
        "9.2.1 Signal transduction cascade",
        "9.2.2 Second messengers",
        "9.2.3 Phosphorylation relays",
        "9.3.1 Cellular responses",
        "9.3.2 Gene expression changes",
        "9.3.3 Signal termination",
        "9.4.1 Quorum sensing",
        "9.4.2 Yeast mating signals"
      ]),
      branch("Chapter 10 · Cell Reproduction", [
        "10.1.1 Genome and chromosomes",
        "10.1.2 Chromatin and chromosome structure",
        "10.2.1 Interphase (G1, S, G2)",
        "10.2.2 Mitosis phases",
        "10.2.3 Cytokinesis",
        "10.3.1 Cell-cycle checkpoints",
        "10.3.2 Cyclins and Cdks",
        "10.3.3 p53 and regulators",
        "10.4.1 Proto-oncogenes and oncogenes",
        "10.4.2 Tumor suppressors",
        "10.4.3 How cancer arises",
        "10.5.1 Binary fission",
        "10.5.2 FtsZ ring"
      ]),
      branch("Chapter 11 · Meiosis and Sexual Reproduction", [
        "11.1.1 Diploid vs haploid",
        "11.1.2 Meiosis I and II",
        "11.1.3 Crossing over and recombination",
        "11.1.4 Homologous chromosomes",
        "11.2.1 Sexual vs asexual reproduction",
        "11.2.2 Genetic variation benefits",
        "11.2.3 Life-cycle types"
      ]),
      branch("Chapter 12 · Mendel's Experiments and Heredity", [
        "12.1.1 Mendel's pea experiments",
        "12.1.2 Dominant and recessive",
        "12.1.3 Probability rules",
        "12.1.4 Punnett squares",
        "12.2.1 Genotype vs phenotype",
        "12.2.2 Test cross",
        "12.2.3 Law of segregation",
        "12.3.1 Law of independent assortment",
        "12.3.2 Dihybrid cross",
        "12.3.3 Linked genes",
        "12.3.4 Epistasis"
      ]),
      branch("Chapter 13 · Modern Understanding of Inheritance", [
        "13.1.1 Chromosomal theory of inheritance",
        "13.1.2 Genetic linkage and maps",
        "13.1.3 Recombination frequency",
        "13.2.1 Nondisjunction and aneuploidy",
        "13.2.2 Sex-linked disorders",
        "13.2.3 Chromosomal mutations"
      ]),
      branch("Chapter 14 · DNA Structure and Function", [
        "14.1.1 Griffith's transformation",
        "14.1.2 Avery and Hershey-Chase",
        "14.1.3 DNA as genetic material",
        "14.2.1 Watson-Crick double helix",
        "14.2.2 Antiparallel strands",
        "14.2.3 Sequencing methods",
        "14.3.1 Semiconservative replication",
        "14.3.2 Origin of replication",
        "14.3.3 Leading and lagging strands",
        "14.4.1 DNA polymerase III",
        "14.4.2 Okazaki fragments",
        "14.4.3 Helicase, primase, ligase",
        "14.5.1 Telomeres and telomerase",
        "14.5.2 Eukaryotic replication forks",
        "14.6.1 Proofreading",
        "14.6.2 Mismatch and excision repair",
        "14.6.3 Mutations"
      ]),
      branch("Chapter 15 · Genes and Proteins", [
        "15.1.1 Central dogma",
        "15.1.2 Codons and the genetic code",
        "15.1.3 Degeneracy of the code",
        "15.2.1 Prokaryotic transcription",
        "15.2.2 RNA polymerase and promoter",
        "15.2.3 Termination",
        "15.3.1 Eukaryotic RNA polymerases",
        "15.3.2 Transcription factors",
        "15.4.1 5' cap and poly-A tail",
        "15.4.2 Splicing and introns/exons",
        "15.4.3 Alternative splicing",
        "15.5.1 Translation steps",
        "15.5.2 tRNA and ribosomes",
        "15.5.3 Initiation, elongation, termination"
      ]),
      branch("Chapter 16 · Gene Expression", [
        "16.1.1 Gene regulation overview",
        "16.1.2 Why cells regulate expression",
        "16.2.1 Operons (lac, trp)",
        "16.2.2 Inducible vs repressible",
        "16.3.1 Epigenetics",
        "16.3.2 DNA methylation",
        "16.3.3 Histone modification",
        "16.4.1 Promoters and enhancers",
        "16.4.2 Transcription-factor control",
        "16.5.1 RNA stability and microRNA",
        "16.5.2 Post-transcriptional control",
        "16.6.1 Translational control",
        "16.6.2 Protein modification and degradation",
        "16.7.1 Cancer as mis-regulation",
        "16.7.2 Mutated regulators"
      ]),
      branch("Chapter 17 · Biotechnology and Genomics", [
        "17.1.1 Recombinant DNA and plasmids",
        "17.1.2 Restriction enzymes",
        "17.1.3 PCR and gel electrophoresis",
        "17.1.4 Cloning",
        "17.2.1 Genetic and physical maps",
        "17.2.2 Linkage mapping",
        "17.3.1 Whole-genome sequencing",
        "17.3.2 Shotgun sequencing",
        "17.4.1 Genomics applications",
        "17.4.2 GMOs and gene therapy",
        "17.5.1 Proteomics",
        "17.5.2 Transcriptomics"
      ]),
      branch("Chapter 18 · Evolution and the Origin of Species", [
        "18.1.1 Darwin and natural selection",
        "18.1.2 Evidence for evolution",
        "18.1.3 Homologous structures",
        "18.2.1 Speciation",
        "18.2.2 Reproductive isolation",
        "18.2.3 Allopatric vs sympatric",
        "18.3.1 Hybrid zones",
        "18.3.2 Gradualism vs punctuated equilibrium"
      ]),
      branch("Chapter 19 · The Evolution of Populations", [
        "19.1.1 Population as evolution's unit",
        "19.1.2 Gene pool and allele frequency",
        "19.2.1 Hardy-Weinberg equilibrium",
        "19.2.2 Genetic drift",
        "19.2.3 Gene flow and mutation",
        "19.3.1 Fitness and adaptation",
        "19.3.2 Directional, stabilizing, disruptive selection",
        "19.3.3 Sexual selection"
      ]),
      branch("Chapter 20 · Phylogenies and the History of Life", [
        "20.1.1 Taxonomy and binomial naming",
        "20.1.2 Domains and kingdoms",
        "20.1.3 Linnaean hierarchy",
        "20.2.1 Cladistics and clades",
        "20.2.2 Shared derived characters",
        "20.2.3 Molecular clocks",
        "20.3.1 Horizontal gene transfer",
        "20.3.2 Web vs tree of life"
      ]),
      branch("Chapter 21 · Viruses", [
        "21.1.1 Virus structure and capsids",
        "21.1.2 Viral classification",
        "21.1.3 Origins of viruses",
        "21.2.1 Lytic vs lysogenic cycles",
        "21.2.2 Host range and tropism",
        "21.3.1 Vaccines and antivirals",
        "21.3.2 Emerging viruses",
        "21.4.1 Prions",
        "21.4.2 Viroids"
      ]),
      branch("Chapter 22 · Prokaryotes: Bacteria and Archaea", [
        "22.1.1 Bacteria vs Archaea",
        "22.1.2 Extremophiles",
        "22.1.3 Prokaryote diversity",
        "22.2.1 Cell wall and peptidoglycan",
        "22.2.2 Gram stain",
        "22.2.3 Plasmids and pili",
        "22.3.1 Metabolic diversity",
        "22.3.2 Nitrogen fixation",
        "22.3.3 Chemoautotrophs",
        "22.4.1 Pathogenic bacteria",
        "22.4.2 Antibiotic resistance",
        "22.4.3 Foodborne illness",
        "22.5.1 Microbiome",
        "22.5.2 Decomposers and bioremediation"
      ]),
      branch("Chapter 23 · Protists", [
        "23.1.1 Endosymbiotic theory",
        "23.1.2 Origin of eukaryotes",
        "23.2.1 Protist diversity",
        "23.2.2 Modes of nutrition",
        "23.2.3 Locomotion",
        "23.3.1 Major protist groups",
        "23.3.2 Algae, protozoa, slime molds",
        "23.4.1 Protists as producers",
        "23.4.2 Disease-causing protists (malaria)"
      ]),
      branch("Chapter 24 · Fungi", [
        "24.1.1 Fungal structure",
        "24.1.2 Heterotrophic absorption",
        "24.1.3 Chitin walls",
        "24.2.1 Fungal phyla",
        "24.2.2 Spores and reproduction",
        "24.3.1 Decomposers",
        "24.3.2 Mycorrhizae and lichens",
        "24.4.1 Fungal pathogens of plants/animals",
        "24.4.2 Mycoses",
        "24.5.1 Food and medicine (penicillin)",
        "24.5.2 Fermentation"
      ]),
      branch("Chapter 25 · Seedless Plants", [
        "25.1.1 Plant adaptations to land",
        "25.1.2 Alternation of generations",
        "25.1.3 Cuticle and stomata",
        "25.2.1 Charophytes",
        "25.2.2 Green algae ancestry",
        "25.3.1 Mosses and liverworts",
        "25.3.2 Gametophyte dominant",
        "25.3.3 No vascular tissue",
        "25.4.1 Ferns",
        "25.4.2 Xylem and phloem",
        "25.4.3 Spores over seeds"
      ]),
      branch("Chapter 26 · Seed Plants", [
        "26.1.1 Seeds and pollen",
        "26.1.2 Sporophyte dominance",
        "26.2.1 Conifers and cones",
        "26.2.2 Naked seeds",
        "26.3.1 Flowers and fruit",
        "26.3.2 Double fertilization",
        "26.3.3 Monocots vs eudicots",
        "26.4.1 Plants as food and oxygen",
        "26.4.2 Crops and medicine"
      ]),
      branch("Chapter 27 · Introduction to Animal Diversity", [
        "27.1.1 Animal characteristics",
        "27.1.2 Multicellularity and tissues",
        "27.2.1 Body symmetry",
        "27.2.2 Germ layers",
        "27.2.3 Coelom types",
        "27.3.1 Protostomes vs deuterostomes",
        "27.3.2 Animal phylogeny",
        "27.4.1 Cambrian explosion",
        "27.4.2 Early animal fossils"
      ]),
      branch("Chapter 28 · Invertebrates", [
        "28.1.1 Sponges (Porifera)",
        "28.1.2 Filter feeding",
        "28.2.1 Cnidarians",
        "28.2.2 Polyp and medusa",
        "28.2.3 Cnidocytes",
        "28.3.1 Flatworms, mollusks, annelids",
        "28.3.2 Lophophore and trochophore",
        "28.4.1 Arthropods and nematodes",
        "28.4.2 Molting (ecdysis)",
        "28.4.3 Exoskeleton",
        "28.5.1 Echinoderms",
        "28.5.2 Water vascular system"
      ]),
      branch("Chapter 29 · Vertebrates", [
        "29.1.1 Chordate features",
        "29.1.2 Notochord and dorsal nerve cord",
        "29.2.1 Jawless, cartilaginous, bony fish",
        "29.2.2 Gills and fins",
        "29.3.1 Amphibians",
        "29.3.2 Metamorphosis",
        "29.3.3 Tied to water",
        "29.4.1 Reptiles and amniotic egg",
        "29.4.2 Ectothermy",
        "29.5.1 Birds",
        "29.5.2 Feathers and flight adaptations",
        "29.5.3 Endothermy",
        "29.6.1 Mammals",
        "29.6.2 Hair and mammary glands",
        "29.6.3 Monotremes, marsupials, placentals",
        "29.7.1 Primate traits",
        "29.7.2 Hominin evolution",
        "29.7.3 Bipedalism"
      ]),
      branch("Chapter 30 · Plant Form and Physiology", [
        "30.1.1 Root, stem, leaf systems",
        "30.1.2 Meristems",
        "30.1.3 Dermal, ground, vascular tissue",
        "30.2.1 Stem structure",
        "30.2.2 Primary and secondary growth",
        "30.2.3 Wood and bark",
        "30.3.1 Root types and zones",
        "30.3.2 Root hairs",
        "30.4.1 Leaf anatomy",
        "30.4.2 Mesophyll and stomata",
        "30.4.3 Photosynthesis site",
        "30.5.1 Transpiration and cohesion-tension",
        "30.5.2 Xylem and phloem transport",
        "30.5.3 Translocation",
        "30.6.1 Tropisms",
        "30.6.2 Plant hormones (auxin)",
        "30.6.3 Photoperiodism"
      ]),
      branch("Chapter 31 · Soil and Plant Nutrition", [
        "31.1.1 Macro- and micronutrients",
        "31.1.2 Essential elements",
        "31.2.1 Soil composition and horizons",
        "31.2.2 Soil and nutrient availability",
        "31.3.1 Nitrogen fixation symbiosis",
        "31.3.2 Mycorrhizae",
        "31.3.3 Carnivorous and parasitic plants"
      ]),
      branch("Chapter 32 · Plant Reproduction", [
        "32.1.1 Flower structure",
        "32.1.2 Stamen and carpel",
        "32.1.3 Gametophyte development",
        "32.2.1 Pollination",
        "32.2.2 Double fertilization",
        "32.2.3 Seed and fruit formation",
        "32.3.1 Vegetative propagation",
        "32.3.2 Grafting and cuttings"
      ]),
      branch("Chapter 33 · The Animal Body: Basic Form and Function", [
        "33.1.1 Form fits function",
        "33.1.2 Body plans",
        "33.1.3 Bioenergetics and size",
        "33.2.1 Epithelial, connective, muscle, nervous tissue",
        "33.3.1 Homeostasis",
        "33.3.2 Negative feedback",
        "33.3.3 Set points"
      ]),
      branch("Chapter 34 · Animal Nutrition and the Digestive System", [
        "34.1.1 Digestive system types",
        "34.1.2 Alimentary canal",
        "34.2.1 Essential nutrients",
        "34.2.2 Calories and energy balance",
        "34.3.1 Ingestion, digestion, absorption, elimination",
        "34.3.2 Enzymes and organs",
        "34.4.1 Hormonal control of digestion",
        "34.4.2 Insulin and glucagon"
      ]),
      branch("Chapter 35 · The Nervous System", [
        "35.1.1 Neuron structure",
        "35.1.2 Glial cells",
        "35.1.3 Axons and dendrites",
        "35.2.1 Action potential",
        "35.2.2 Resting membrane potential",
        "35.2.3 Synapse and neurotransmitters",
        "35.3.1 Brain and spinal cord",
        "35.3.2 CNS regions",
        "35.4.1 Somatic and autonomic",
        "35.4.2 Sympathetic vs parasympathetic",
        "35.5.1 Neurodegenerative disease",
        "35.5.2 Stroke and injury"
      ]),
      branch("Chapter 36 · Sensory Systems", [
        "36.1.1 Sensory reception and transduction",
        "36.1.2 Receptor types",
        "36.2.1 Touch, pressure, pain",
        "36.2.2 Proprioception",
        "36.3.1 Chemoreception",
        "36.3.2 Taste and smell",
        "36.4.1 Ear anatomy",
        "36.4.2 Hearing and balance",
        "36.5.1 Eye anatomy",
        "36.5.2 Rods and cones",
        "36.5.3 Phototransduction"
      ]),
      branch("Chapter 37 · The Endocrine System", [
        "37.1.1 Hormone classes",
        "37.1.2 Steroid vs peptide hormones",
        "37.2.1 Receptor binding",
        "37.2.2 Signal amplification",
        "37.3.1 Regulation of metabolism, water, calcium",
        "37.4.1 Feedback control",
        "37.4.2 Hypothalamus-pituitary axis",
        "37.5.1 Major endocrine glands",
        "37.5.2 Thyroid, adrenal, pancreas"
      ]),
      branch("Chapter 38 · The Musculoskeletal System", [
        "38.1.1 Hydrostatic, exo-, endoskeletons",
        "38.2.1 Bone structure and remodeling",
        "38.2.2 Osteoblasts and osteoclasts",
        "38.3.1 Joint types",
        "38.3.2 Range of motion",
        "38.4.1 Sarcomere and sliding filaments",
        "38.4.2 Actin and myosin",
        "38.4.3 Excitation-contraction coupling"
      ]),
      branch("Chapter 39 · The Respiratory System", [
        "39.1.1 Gills, tracheae, lungs",
        "39.1.2 Respiratory surfaces",
        "39.2.1 Partial pressure and diffusion",
        "39.2.2 Surface area",
        "39.3.1 Ventilation mechanics",
        "39.3.2 Diaphragm and lung volumes",
        "39.4.1 Hemoglobin and O2 transport",
        "39.4.2 CO2 transport and bicarbonate"
      ]),
      branch("Chapter 40 · The Circulatory System", [
        "40.1.1 Open vs closed circulation",
        "40.1.2 Single vs double loops",
        "40.2.1 Plasma, red and white cells",
        "40.2.2 Platelets and clotting",
        "40.3.1 Heart chambers and cardiac cycle",
        "40.3.2 Arteries, veins, capillaries",
        "40.4.1 Blood pressure",
        "40.4.2 Baroreceptors and regulation"
      ]),
      branch("Chapter 41 · Osmotic Regulation and Excretion", [
        "41.1.1 Osmoregulation",
        "41.1.2 Osmoconformers vs regulators",
        "41.2.1 Nephron structure",
        "41.2.2 Filtration, reabsorption, secretion",
        "41.3.1 Excretory organs across animals",
        "41.3.2 Malpighian tubules",
        "41.4.1 Ammonia, urea, uric acid",
        "41.5.1 ADH and aldosterone",
        "41.5.2 Renin-angiotensin"
      ]),
      branch("Chapter 42 · The Immune System", [
        "42.1.1 Physical barriers",
        "42.1.2 Inflammation",
        "42.1.3 Phagocytes and complement",
        "42.2.1 B and T lymphocytes",
        "42.2.2 Clonal selection",
        "42.2.3 Immunological memory",
        "42.3.1 Antibody structure",
        "42.3.2 Antigen-antibody binding",
        "42.4.1 Allergies and autoimmunity",
        "42.4.2 Immunodeficiency (HIV)"
      ]),
      branch("Chapter 43 · Animal Reproduction and Development", [
        "43.1.1 Asexual vs sexual reproduction",
        "43.1.2 External vs internal fertilization",
        "43.2.1 Sperm-egg fusion",
        "43.2.2 Acrosome reaction",
        "43.3.1 Reproductive anatomy",
        "43.3.2 Spermatogenesis and oogenesis",
        "43.4.1 Sex hormones",
        "43.4.2 Menstrual cycle",
        "43.4.3 GnRH, LH, FSH",
        "43.5.1 Pregnancy trimesters",
        "43.5.2 Placenta",
        "43.5.3 Labor and birth",
        "43.6.1 Cleavage and gastrulation",
        "43.6.2 Blastula",
        "43.7.1 Organogenesis",
        "43.7.2 Germ-layer fates"
      ]),
      branch("Chapter 44 · Ecology and the Biosphere", [
        "44.1.1 Ecology levels",
        "44.1.2 Biotic and abiotic factors",
        "44.2.1 Biogeography",
        "44.2.2 Species distribution",
        "44.3.1 Terrestrial biomes",
        "44.3.2 Climate and vegetation",
        "44.4.1 Aquatic biomes",
        "44.4.2 Marine and freshwater zones",
        "44.5.1 Greenhouse effect",
        "44.5.2 Climate change impacts"
      ]),
      branch("Chapter 45 · Population and Community Ecology", [
        "45.1.1 Population density and dispersion",
        "45.1.2 Life tables and survivorship",
        "45.2.1 r- vs K-selection",
        "45.2.2 Life-history trade-offs",
        "45.3.1 Exponential vs logistic growth",
        "45.3.2 Carrying capacity",
        "45.4.1 Density-dependent vs independent factors",
        "45.5.1 Human population growth",
        "45.5.2 Age structure",
        "45.6.1 Competition, predation, symbiosis",
        "45.6.2 Niche and keystone species",
        "45.6.3 Succession",
        "45.7.1 Innate vs learned behavior",
        "45.7.2 Proximate and ultimate causes"
      ]),
      branch("Chapter 46 · Ecosystems", [
        "46.1.1 Ecosystem structure",
        "46.1.2 Food chains and webs",
        "46.1.3 Trophic levels",
        "46.2.1 Energy flow and productivity",
        "46.2.2 Ecological pyramids",
        "46.2.3 10% rule",
        "46.3.1 Carbon, nitrogen, phosphorus cycles",
        "46.3.2 Water cycle"
      ]),
      branch("Chapter 47 · Conservation Biology and Biodiversity", [
        "47.1.1 Biodiversity loss",
        "47.1.2 Extinction rates",
        "47.2.1 Ecosystem services",
        "47.2.2 Value of biodiversity",
        "47.3.1 Habitat loss, invasive species",
        "47.3.2 Pollution and overharvesting",
        "47.4.1 Conservation strategies",
        "47.4.2 Protected areas and restoration"
      ])
    ]
  };
}

function buildChemistryMap() {
  const leaf = (label) => ({ id: uid("l"), label, mastery: 0 });
  const branch = (label, labels) => ({ id: uid("b"), label, leaves: labels.map(leaf) });
  return {
    id: "sm_builtin_chemistry",
    topic: "OpenStax Chemistry 2e",
    builtin: true,
    createdAt: Date.now(),
    branches: [
      branch("Chapter 1 · Essential Ideas", [
        "1.1 Chemistry in Context",
        "1.2 Phases and Classification of Matter",
        "1.3 Physical and Chemical Properties",
        "1.4 Measurements",
        "1.5 Measurement Uncertainty, Accuracy, and Precision",
        "1.6 Mathematical Treatment of Measurement Results"
      ]),
      branch("Chapter 2 · Atoms, Molecules, and Ions", [
        "2.1 Early Ideas in Atomic Theory",
        "2.2 Evolution of Atomic Theory",
        "2.3 Atomic Structure and Symbolism",
        "2.4 Chemical Formulas",
        "2.5 The Periodic Table",
        "2.6 Molecular and Ionic Compounds",
        "2.7 Chemical Nomenclature"
      ]),
      branch("Chapter 3 · Composition of Substances and Solutions", [
        "3.1 Formula Mass and the Mole Concept",
        "3.2 Determining Empirical and Molecular Formulas",
        "3.3 Molarity",
        "3.4 Other Units for Solution Concentrations"
      ]),
      branch("Chapter 4 · Stoichiometry of Chemical Reactions", [
        "4.1 Writing and Balancing Chemical Equations",
        "4.2 Classifying Chemical Reactions",
        "4.3 Reaction Stoichiometry",
        "4.4 Reaction Yields",
        "4.5 Quantitative Chemical Analysis"
      ]),
      branch("Chapter 5 · Thermochemistry", [
        "5.1 Energy Basics",
        "5.2 Calorimetry",
        "5.3 Enthalpy"
      ]),
      branch("Chapter 6 · Electronic Structure and Periodic Properties of Elements", [
        "6.1 Electromagnetic Energy",
        "6.2 The Bohr Model",
        "6.3 Development of Quantum Theory",
        "6.4 Electronic Structure of Atoms (Electron Configurations)",
        "6.5 Periodic Variations in Element Properties"
      ]),
      branch("Chapter 7 · Chemical Bonding and Molecular Geometry", [
        "7.1 Ionic Bonding",
        "7.2 Covalent Bonding",
        "7.3 Lewis Symbols and Structures",
        "7.4 Formal Charges and Resonance",
        "7.5 Strengths of Ionic and Covalent Bonds",
        "7.6 Molecular Structure and Polarity"
      ]),
      branch("Chapter 8 · Advanced Theories of Covalent Bonding", [
        "8.1 Valence Bond Theory",
        "8.2 Hybrid Atomic Orbitals",
        "8.3 Multiple Bonds",
        "8.4 Molecular Orbital Theory"
      ]),
      branch("Chapter 9 · Gases", [
        "9.1 Gas Pressure",
        "9.2 Relating Pressure, Volume, Amount, and Temperature: The Ideal Gas Law",
        "9.3 Stoichiometry of Gaseous Substances, Mixtures, and Reactions",
        "9.4 Effusion and Diffusion of Gases",
        "9.5 The Kinetic-Molecular Theory",
        "9.6 Non-Ideal Gas Behavior"
      ]),
      branch("Chapter 10 · Liquids and Solids", [
        "10.1 Intermolecular Forces",
        "10.2 Properties of Liquids",
        "10.3 Phase Transitions",
        "10.4 Phase Diagrams",
        "10.5 The Solid State of Matter",
        "10.6 Lattice Structures in Crystalline Solids"
      ]),
      branch("Chapter 11 · Solutions and Colloids", [
        "11.1 The Dissolution Process",
        "11.2 Electrolytes",
        "11.3 Solubility",
        "11.4 Colligative Properties",
        "11.5 Colloids"
      ]),
      branch("Chapter 12 · Kinetics", [
        "12.1 Chemical Reaction Rates",
        "12.2 Factors Affecting Reaction Rates",
        "12.3 Rate Laws",
        "12.4 Integrated Rate Laws",
        "12.5 Collision Theory",
        "12.6 Reaction Mechanisms",
        "12.7 Catalysis"
      ]),
      branch("Chapter 13 · Fundamental Equilibrium Concepts", [
        "13.1 Chemical Equilibria",
        "13.2 Equilibrium Constants",
        "13.3 Shifting Equilibria: Le Chatelier's Principle",
        "13.4 Equilibrium Calculations"
      ]),
      branch("Chapter 14 · Acid-Base Equilibria", [
        "14.1 Brønsted-Lowry Acids and Bases",
        "14.2 pH and pOH",
        "14.3 Relative Strengths of Acids and Bases",
        "14.4 Hydrolysis of Salts",
        "14.5 Polyprotic Acids",
        "14.6 Buffers",
        "14.7 Acid-Base Titrations"
      ]),
      branch("Chapter 15 · Equilibria of Other Reaction Classes", [
        "15.1 Precipitation and Dissolution",
        "15.2 Lewis Acids and Bases",
        "15.3 Coupled Equilibria"
      ]),
      branch("Chapter 16 · Thermodynamics", [
        "16.1 Spontaneity",
        "16.2 Entropy",
        "16.3 The Second and Third Laws of Thermodynamics",
        "16.4 Free Energy"
      ]),
      branch("Chapter 17 · Electrochemistry", [
        "17.1 Balancing Oxidation-Reduction Reactions",
        "17.2 Galvanic Cells",
        "17.3 Standard Reduction Potentials",
        "17.4 The Nernst Equation",
        "17.5 Batteries and Fuel Cells",
        "17.6 Corrosion",
        "17.7 Electrolysis"
      ]),
      branch("Chapter 18 · Representative Metals, Metalloids, and Nonmetals", [
        "18.1 Periodicity",
        "18.2 Occurrence and Preparation of the Representative Metals",
        "18.3 Structure and General Properties of the Metalloids",
        "18.4 Structure and General Properties of the Nonmetals",
        "18.5 Occurrence, Preparation, and Compounds of Hydrogen",
        "18.6 Occurrence, Preparation, and Properties of Carbonates",
        "18.7 Occurrence, Preparation, and Properties of Nitrogen",
        "18.8 Occurrence, Preparation, and Properties of Phosphorus",
        "18.9 Occurrence, Preparation, and Compounds of Oxygen",
        "18.10 Occurrence, Preparation, and Properties of Sulfur",
        "18.11 Occurrence, Preparation, and Properties of Halogens",
        "18.12 Occurrence, Preparation, and Properties of the Noble Gases"
      ]),
      branch("Chapter 19 · Transition Metals and Coordination Chemistry", [
        "19.1 Occurrence, Preparation, and Properties of Transition Metals and Their Compounds",
        "19.2 Coordination Chemistry of Transition Metals",
        "19.3 Spectroscopic and Magnetic Properties of Coordination Compounds"
      ]),
      branch("Chapter 20 · Organic Chemistry", [
        "20.1 Hydrocarbons",
        "20.2 Alcohols and Ethers",
        "20.3 Aldehydes, Ketones, Carboxylic Acids, and Esters",
        "20.4 Amines and Amides"
      ]),
      branch("Chapter 21 · Nuclear Chemistry", [
        "21.1 Nuclear Structure and Stability",
        "21.2 Nuclear Equations",
        "21.3 Radioactive Decay",
        "21.4 Transmutation and Nuclear Energy",
        "21.5 Uses of Radioisotopes",
        "21.6 Biological Effects of Radiation"
      ])
    ]
  };
}

function buildAIMap() {
  const leaf = (label) => ({ id: uid("l"), label, mastery: 0 });
  const branch = (label, labels) => ({ id: uid("b"), label, leaves: labels.map(leaf) });
  return {
    id: "sm_builtin_ai",
    topic: "Artificial Intelligence",
    builtin: true,
    createdAt: Date.now(),
    branches: [
      branch("Chapter 1 · Introduction to AI", [
        "1.1 What Is Artificial Intelligence?",
        "1.2 The History of AI",
        "1.3 The State of the Art Today",
        "1.4 Risks and Benefits of AI"
      ]),
      branch("Chapter 2 · Intelligent Agents", [
        "2.1 Agents and Environments",
        "2.2 Good Behavior: The Rationality Concept",
        "2.3 The Nature of Environments",
        "2.4 The Structure of Agents"
      ]),
      branch("Chapter 3 · Solving Problems by Searching", [
        "3.1 Problem-Solving Agents",
        "3.2 Example Problems",
        "3.3 Uninformed Search Strategies",
        "3.4 Informed (Heuristic) Search Strategies",
        "3.5 Heuristic Functions"
      ]),
      branch("Chapter 4 · Beyond Classical Search", [
        "4.1 Local Search and Optimization",
        "4.2 Local Search in Continuous Spaces",
        "4.3 Search with Nondeterministic Actions",
        "4.4 Search in Partially Observable Environments",
        "4.5 Online Search Agents"
      ]),
      branch("Chapter 5 · Adversarial Search and Games", [
        "5.1 Game Theory",
        "5.2 Optimal Decisions in Games (Minimax)",
        "5.3 Alpha-Beta Pruning",
        "5.4 Monte Carlo Tree Search",
        "5.5 Stochastic and Partially Observable Games"
      ]),
      branch("Chapter 6 · Constraint Satisfaction Problems", [
        "6.1 Defining Constraint Satisfaction Problems",
        "6.2 Constraint Propagation",
        "6.3 Backtracking Search for CSPs",
        "6.4 Local Search for CSPs",
        "6.5 The Structure of Problems"
      ]),
      branch("Chapter 7 · Logical Agents", [
        "7.1 Knowledge-Based Agents",
        "7.2 The Wumpus World",
        "7.3 Propositional Logic",
        "7.4 Inference in Propositional Logic",
        "7.5 Effective Propositional Model Checking"
      ]),
      branch("Chapter 8 · First-Order Logic", [
        "8.1 Representation Revisited",
        "8.2 Syntax and Semantics of First-Order Logic",
        "8.3 Using First-Order Logic",
        "8.4 Knowledge Engineering"
      ]),
      branch("Chapter 9 · Inference in First-Order Logic", [
        "9.1 Propositional vs. First-Order Inference",
        "9.2 Unification and First-Order Inference",
        "9.3 Forward Chaining",
        "9.4 Backward Chaining",
        "9.5 Resolution"
      ]),
      branch("Chapter 10 · Knowledge Representation", [
        "10.1 Ontological Engineering",
        "10.2 Categories and Objects",
        "10.3 Events and Time",
        "10.4 Reasoning Systems for Categories",
        "10.5 The Semantic Web"
      ]),
      branch("Chapter 11 · Automated Planning", [
        "11.1 Definition of Classical Planning",
        "11.2 Algorithms for Planning",
        "11.3 Heuristics for Planning",
        "11.4 Hierarchical Planning",
        "11.5 Planning and Acting in the Real World"
      ]),
      branch("Chapter 12 · Quantifying Uncertainty", [
        "12.1 Acting under Uncertainty",
        "12.2 Basic Probability Notation",
        "12.3 Inference Using Full Joint Distributions",
        "12.4 Independence and Bayes' Rule",
        "12.5 Naive Bayes Models"
      ]),
      branch("Chapter 13 · Probabilistic Reasoning", [
        "13.1 Representing Knowledge in an Uncertain Domain",
        "13.2 Bayesian Networks",
        "13.3 Exact Inference in Bayesian Networks",
        "13.4 Approximate Inference",
        "13.5 Hidden Markov Models"
      ]),
      branch("Chapter 14 · Making Simple Decisions", [
        "14.1 Combining Beliefs and Desires under Uncertainty",
        "14.2 The Basis of Utility Theory",
        "14.3 Utility Functions",
        "14.4 Decision Networks"
      ]),
      branch("Chapter 15 · Making Complex Decisions", [
        "15.1 Sequential Decision Problems",
        "15.2 Markov Decision Processes",
        "15.3 Value and Policy Iteration",
        "15.4 Partially Observable MDPs",
        "15.5 Multiagent Decision Making"
      ]),
      branch("Chapter 16 · Machine Learning: Learning from Examples", [
        "16.1 Forms of Learning",
        "16.2 Supervised Learning",
        "16.3 Decision Trees",
        "16.4 Model Selection and Overfitting",
        "16.5 Ensemble Learning: Bagging, Boosting, Random Forests",
        "16.6 Support Vector Machines"
      ]),
      branch("Chapter 17 · Learning Probabilistic Models", [
        "17.1 Statistical Learning",
        "17.2 Naive Bayes Models",
        "17.3 Maximum Likelihood and MAP Estimation",
        "17.4 Unsupervised Clustering (EM Algorithm)"
      ]),
      branch("Chapter 18 · Deep Learning", [
        "18.1 Simple Feedforward Networks",
        "18.2 Backpropagation and Gradient Descent",
        "18.3 Convolutional Neural Networks",
        "18.4 Recurrent Neural Networks",
        "18.5 Transformers and Attention",
        "18.6 Generative Models: GANs, Diffusion, Autoencoders"
      ]),
      branch("Chapter 19 · Reinforcement Learning", [
        "19.1 Learning from Rewards",
        "19.2 Passive Reinforcement Learning",
        "19.3 Active Reinforcement Learning (Q-Learning)",
        "19.4 Policy Search",
        "19.5 Deep Reinforcement Learning"
      ]),
      branch("Chapter 20 · Natural Language Processing", [
        "20.1 Language Models",
        "20.2 Text Classification",
        "20.3 Information Retrieval",
        "20.4 Grammar and Parsing",
        "20.5 Machine Translation",
        "20.6 Large Language Models"
      ]),
      branch("Chapter 21 · Computer Vision", [
        "21.1 Image Formation",
        "21.2 Feature Extraction and Edge Detection",
        "21.3 Object Recognition",
        "21.4 Convolutional Networks for Vision",
        "21.5 3D Vision and Video Understanding"
      ]),
      branch("Chapter 22 · Robotics", [
        "22.1 Robots and Robotic Systems",
        "22.2 Robotic Perception",
        "22.3 Planning and Control in Robotics",
        "22.4 Reinforcement Learning in Robotics",
        "22.5 Human-Robot Interaction"
      ]),
      branch("Chapter 23 · Philosophy, Ethics, and Safety of AI", [
        "23.1 Weak vs Strong AI",
        "23.2 Bias and Fairness",
        "23.3 Privacy and Surveillance",
        "23.4 AI Safety and Alignment",
        "23.5 The Future of AI and Society"
      ])
    ]
  };
}

/**
 * Precalc/Biology were seeded under an older, non-id-tracked scheme before the
 * id-tracked seeding below existed, so some users ended up with two entries per
 * topic (an orphaned legacy copy + the canonical "sm_builtin_*" one) — the dedup
 * below only ever checked ids, which never matched the legacy copy. This merges
 * mastery (keeping the higher value per leaf, matched by label) from every
 * duplicate into the canonical builtin map, then drops the extras. Runs once.
 */
const DEDUPED_KEY = "inkling-studymaps-builtin-deduped-v1";
function normalizeTopic(topic) {
  return String(topic || "").trim().toLowerCase().replace(/^openstax\s+/, "");
}
function buildEEMap() {
  const leaf = (label) => ({ id: uid("l"), label, mastery: 0 });
  const branch = (label, labels) => ({ id: uid("b"), label, leaves: labels.map(leaf) });
  return {
    id: "sm_builtin_ee",
    topic: "Electrical Engineering",
    builtin: true,
    createdAt: Date.now(),
    branches: [
      branch("Stage 0 · Foundations", [
        "Algebra & Trigonometry",
        "Calculus I–II",
        "Calculus III · Multivariable",
        "Differential Equations",
        "Linear Algebra ★",
        "Probability & Statistics ★",
        "Physics I · Mechanics",
        "Physics II · Electricity & Magnetism ★",
        "Programming · C/C++ & Python ★",
        "Intro Chemistry"
      ]),
      branch("Stage 1 · Core Circuits & Logic", [
        "Circuit Analysis I · DC ★",
        "Circuit Analysis II · AC ★",
        "Digital Logic Design ★",
        "Signals & Systems ★",
        "Electronics I ★"
      ]),
      branch("Stage 2 · The Pillars", [
        "Electronics II",
        "Microcontrollers & Embedded Systems ★",
        "Electromagnetic Fields & Waves",
        "Control Systems ★",
        "Digital Signal Processing ★",
        "Computer Architecture ★"
      ]),
      branch("Stage 3 · Embedded & Robotics (your path)", [
        "RTOS & Real-Time Programming ★",
        "Sensors & Actuators ★",
        "Motor Control ★",
        "Robot Kinematics ★",
        "ROS · Robot Operating System ★",
        "PCB Design · KiCad ★"
      ]),
      branch("Stage 3 · Other EE Branches (breadth)", [
        "Power & Energy",
        "Communications & RF",
        "Computer Engineering / VLSI",
        "Signals, Controls & ML"
      ]),
      branch("Stage 4 · Capstone & Mastery", [
        "Senior Design / Capstone ★",
        "Advanced Branch Electives",
        "Target Build · autonomous robot / embedded AI ★"
      ]),
      branch("Throughout · Lab & Tools", [
        "Lab instruments · scope, multimeter, soldering",
        "Simulation · SPICE, MATLAB/Simulink",
        "PCB / CAD · KiCad",
        "Git & documentation"
      ])
    ]
  };
}

function buildElectricianMap() {
  const leaf = (label) => ({ id: uid("l"), label, mastery: 0 });
  const branch = (label, labels) => ({ id: uid("b"), label, leaves: labels.map(leaf) });
  return {
    id: "sm_builtin_electrician",
    topic: "Electrician Apprenticeship",
    builtin: true,
    createdAt: Date.now(),
    branches: [
      branch("Year 1 · Fundamentals", [
        "Electrical theory · Ohm's law",
        "DC circuits · series, parallel, Kirchhoff",
        "Electrical math (applied)",
        "Safety · OSHA, arc flash, lockout/tagout",
        "Hand & power tools",
        "Intro to the National Electrical Code (NEC)",
        "Wiring methods & materials",
        "Print / blueprint reading"
      ]),
      branch("Year 2 · AC & Residential", [
        "AC theory · impedance, power factor",
        "Transformers",
        "Conduit bending",
        "Grounding & bonding",
        "Residential wiring",
        "NEC · branch circuits & loads"
      ]),
      branch("Year 3 · Commercial & Industrial", [
        "Three-phase power",
        "Motor controls · relays, contactors, overloads",
        "Commercial wiring",
        "Raceways & cable",
        "Lighting systems",
        "NEC load calculations",
        "Low-voltage / fire alarm"
      ]),
      branch("Year 4 · Automation & Advanced", [
        "PLCs · programmable logic controllers",
        "VFDs & industrial motor control",
        "Instrumentation",
        "Power distribution & switchgear",
        "Advanced code calculations",
        "Solar PV / renewables"
      ]),
      branch("Throughout · On the Job & Code", [
        "On-the-job training hours (OJT)",
        "The National Electrical Code (NEC)",
        "Safety & first aid",
        "Journeyman exam prep"
      ])
    ]
  };
}

function dedupeLegacyBuiltins(maps) {
  if (localStorage.getItem(DEDUPED_KEY)) return false;
  localStorage.setItem(DEDUPED_KEY, "1");
  const byTopic = new Map();
  for (const m of maps) {
    if (!m.topic) continue;
    const key = normalizeTopic(m.topic);          // "Biology" and "OpenStax Biology" collapse together
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key).push(m);
  }
  let changed = false;
  for (const group of byTopic.values()) {
    if (group.length < 2) continue;
    const canonical = group.find((m) => m.id.startsWith("sm_builtin_")) || group[0];
    for (const dup of group) {
      if (dup === canonical) continue;
      for (const br of dup.branches || []) {
        for (const leaf of br.leaves || []) {
          const target = canonical.branches
            .flatMap((b) => b.leaves)
            .find((l) => l.label.toLowerCase() === leaf.label.toLowerCase());
          if (target && (leaf.mastery || 0) > (target.mastery || 0)) target.mastery = leaf.mastery;
        }
      }
      maps.splice(maps.indexOf(dup), 1);
      changed = true;
    }
  }
  return changed;
}

/** Ensure the built-in maps exist. Idempotent; each builtin seeds once (tracked by id),
 *  so deletes stick AND a newly-added builtin (Biology, Chemistry, AI) shows up for
 *  existing users too. Also runs the one-time legacy-duplicate cleanup above. */
export function seedBuiltInStudyMaps() {
  try {
    let seeded;
    try { const v = JSON.parse(localStorage.getItem(BUILTIN_SEEDED_KEY) || "[]"); seeded = Array.isArray(v) ? v : ["sm_builtin_precalc"]; }
    catch { seeded = []; }
    const maps = loadStudyMaps();
    let changed = dedupeLegacyBuiltins(maps);
    [buildPrecalcMap, buildBiologyMap, buildChemistryMap, buildAIMap, buildEEMap, buildElectricianMap].forEach((fn) => {
      const m = fn();
      if (seeded.includes(m.id)) return;                     // already seeded before (or user deleted it)
      if (!maps.some((x) => x.id === m.id)) { maps.unshift(m); changed = true; }
      seeded.push(m.id);
    });
    if (changed) saveAll(maps);
    // One-time: light the recommended first-semester EE subjects as "Learning" so
    // the map starts with a clear day-one starting point, not a wall of untouched.
    try {
      const EE_FS_KEY = "inkling-ee-firstsem-seeded-v1";
      if (!localStorage.getItem(EE_FS_KEY) && maps.some((x) => x.id === "sm_builtin_ee")) {
        touchLeavesByLabel([
          "Calculus I–II",
          "Programming · C/C++ & Python ★",
          "Physics II · Electricity & Magnetism ★",
          "Digital Logic Design ★",
          "Circuit Analysis I · DC ★"
        ]);
        localStorage.setItem(EE_FS_KEY, "1");
      }
    } catch { /* non-fatal */ }
    localStorage.setItem(BUILTIN_SEEDED_KEY, JSON.stringify(seeded));
  } catch { /* non-fatal */ }
}

/**
 * Generate a study map for a topic via Haiku (server). Saves + returns it.
 * @returns {Promise<{ok:boolean, map?:object, reason?:string}>}
 */
export async function generateStudyMap(topic) {
  const clean = String(topic || "").trim();
  if (clean.length < 2) return { ok: false, reason: "empty" };
  let data;
  try {
    data = await apiFetch("/api/inkling/studymap", { method: "POST", body: JSON.stringify({ topic: clean }) });
  } catch { return { ok: false, reason: "offline" }; }
  if (data?.source === "guest") return { ok: false, reason: "signin" };
  if (data?.source === "capped") return { ok: false, reason: "capped" };
  if (!data?.branches?.length) return { ok: false, reason: "empty" };
  const map = {
    id: uid("sm"),
    topic: data.topic || clean,
    createdAt: Date.now(),
    branches: data.branches.map((br) => ({
      id: uid("b"),
      label: br.label,
      leaves: (br.leaves || []).map((label) => ({ id: uid("l"), label, mastery: 0 }))
    }))
  };
  saveStudyMap(map);
  return { ok: true, map };
}
