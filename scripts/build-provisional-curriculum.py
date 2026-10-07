"""Generates content/curriculum.json — the PROVISIONAL concept inventory.

This inventory is NOT extracted from the user's reviewer (which was not provided).
It is a starting scaffold based on the general scope of the exam tracks. When the
reviewer arrives, concepts get `reviewerRef` (chapter/pages), and concepts that the
reviewer does not cover should be flagged rather than silently kept.

Run: python3 scripts/build-provisional-curriculum.py
"""
import json, pathlib

B = ["ascp", "mtle"]
A = ["ascp"]
M = ["mtle"]

# (domain id, title, tracks, sequence, [(topic id, title, [(concept id, title, prereqs, tracks|None)])])
D = [
 ("qc-ops", "Quality Control, Laboratory Operations & Safety", B, 1, [
   ("safety", "Laboratory safety", [
     ("standard-precautions", "Standard precautions and PPE", [], None),
     ("biosafety-levels", "Biosafety levels and biosafety cabinets", ["qc-ops.safety.standard-precautions"], None),
     ("chemical-fire-safety", "Chemical hazards, SDS and fire safety", [], None),
     ("waste", "Biomedical waste segregation and disposal", [], None)]),
   ("qc", "Quality control", [
     ("qc-stats", "Mean, SD and coefficient of variation in QC", ["math.stats.central-dispersion"], None),
     ("levey-jennings", "Levey–Jennings charts", ["qc-ops.qc.qc-stats"], None),
     ("westgard", "Westgard multirules: random vs systematic error", ["qc-ops.qc.levey-jennings"], None),
     ("accuracy-precision", "Accuracy, precision and bias", [], None)]),
   ("method", "Method evaluation", [
     ("sens-spec", "Sensitivity, specificity, predictive values", [], None),
     ("reference-intervals", "Reference intervals and why they are method- and population-dependent", [], None),
     ("phases", "Pre-analytical, analytical and post-analytical errors", [], None)]),
   ("instrumentation", "Instrumentation principles", [
     ("photometry", "Spectrophotometry and Beer's law", ["math.solutions.concentration"], None),
     ("ise", "Ion-selective electrodes", [], None),
     ("flow-impedance", "Electrical impedance and flow cytometry", [], None)])]),
 ("math", "Laboratory Mathematics", B, 2, [
   ("solutions", "Solutions and dilutions", [
     ("concentration", "Concentration units: %, molarity, normality", [], None),
     ("dilutions", "Simple and serial dilutions", [], None),
     ("unit-conversion", "SI and conventional unit conversion", [], None)]),
   ("stats", "Statistics", [
     ("central-dispersion", "Mean, median, mode, SD, CV", [], None)]),
   ("calculations", "Clinical calculations", [
     ("rbc-indices", "RBC indices (MCV, MCH, MCHC)", ["math.solutions.unit-conversion"], None),
     ("creatinine-clearance", "Creatinine clearance and eGFR", [], None),
     ("anion-gap-osm", "Anion gap and calculated osmolality", [], None),
     ("ldl-calc", "Calculated LDL (Friedewald) and its limits", [], None)])]),
 ("immuno", "Immunology & Serology", B, 3, [
   ("basics", "Immune system basics", [
     ("innate-adaptive", "Innate vs adaptive immunity", [], None),
     ("immunoglobulins", "Immunoglobulin classes: structure and function", ["immuno.basics.innate-adaptive"], None),
     ("complement", "Complement pathways", ["immuno.basics.immunoglobulins"], None)]),
   ("ag-ab", "Antigen–antibody reactions", [
     ("agglutination", "Agglutination: sensitization and lattice formation", ["immuno.basics.immunoglobulins"], None),
     ("precipitation", "Precipitation and the zone of equivalence (prozone)", ["immuno.basics.immunoglobulins"], None),
     ("labeled-immunoassays", "Labeled immunoassays (EIA/ELISA, chemiluminescence)", [], None)]),
   ("serology", "Serologic diagnosis", [
     ("syphilis", "Syphilis serology: treponemal vs nontreponemal", ["immuno.ag-ab.agglutination"], None),
     ("hepatitis-b", "Hepatitis B serologic markers", ["immuno.ag-ab.labeled-immunoassays"], None),
     ("hiv", "HIV testing algorithms", ["immuno.ag-ab.labeled-immunoassays"], None),
     ("autoimmune", "Autoantibodies and ANA patterns", [], None)]),
   ("hypersensitivity", "Hypersensitivity and transplant", [
     ("hypersensitivity-types", "Types I–IV hypersensitivity", [], None),
     ("hla", "HLA and transplant compatibility", [], None)])]),
 ("ih", "Immunohematology & Transfusion Medicine", B, 4, [
   ("abo", "ABO system", [
     ("abo-antigens-genetics", "ABO and H antigen biosynthesis", ["immuno.basics.immunoglobulins"], None),
     ("abo-forward-reverse", "ABO forward and reverse typing", ["immuno.ag-ab.agglutination", "ih.abo.abo-antigens-genetics"], None),
     ("abo-discrepancies", "ABO discrepancies and their resolution", ["ih.abo.abo-forward-reverse"], None),
     ("bombay-subgroups", "Bombay phenotype and A subgroups", ["ih.abo.abo-forward-reverse"], None)]),
   ("rh", "Rh system", [
     ("rh-d", "D antigen, weak D and partial D", ["ih.abo.abo-forward-reverse"], None),
     ("rh-nomenclature", "Rh nomenclature (Fisher–Race, Wiener)", [], None)]),
   ("agt", "Antiglobulin testing", [
     ("dat-iat", "Direct vs indirect antiglobulin test", ["immuno.ag-ab.agglutination"], None),
     ("antibody-id", "Antibody screen and panel identification", ["ih.agt.dat-iat"], None),
     ("crossmatch", "Compatibility testing and crossmatch", ["ih.agt.antibody-id"], None)]),
   ("clinical", "Clinical transfusion", [
     ("hdfn", "Hemolytic disease of the fetus and newborn", ["ih.rh.rh-d", "ih.agt.dat-iat"], None),
     ("transfusion-reactions", "Transfusion reactions", ["ih.agt.crossmatch"], None),
     ("components", "Blood components: preparation, storage, indications", [], None),
     ("donor", "Donor selection and testing", [], None)])]),
 ("hema", "Hematology", B, 5, [
   ("hematopoiesis", "Hematopoiesis", [
     ("erythropoiesis", "Erythropoiesis: maturation stages", [], None),
     ("granulopoiesis", "Granulopoiesis: maturation stages", [], None),
     ("hemoglobin", "Hemoglobin structure, function and variants", [], None)]),
   ("rbc-disorders", "Red cell disorders", [
     ("anemia-classification", "Anemia classification by indices and mechanism", ["math.calculations.rbc-indices"], None),
     ("iron-deficiency", "Iron deficiency vs anemia of inflammation vs thalassemia", ["hema.rbc-disorders.anemia-classification"], None),
     ("megaloblastic", "Megaloblastic anemia (B12/folate)", ["hema.rbc-disorders.anemia-classification"], None),
     ("hemolytic", "Hemolytic anemias (intrinsic vs extrinsic)", ["hema.rbc-disorders.anemia-classification"], None),
     ("hemoglobinopathies", "Sickle cell and other hemoglobinopathies", ["hema.hematopoiesis.hemoglobin"], None)]),
   ("wbc-disorders", "White cell disorders", [
     ("reactive", "Reactive vs malignant leukocytosis", ["hema.hematopoiesis.granulopoiesis"], None),
     ("acute-leukemia", "Acute leukemias: classification and cytochemistry", ["hema.wbc-disorders.reactive"], None),
     ("mpn", "Myeloproliferative neoplasms", ["hema.wbc-disorders.reactive"], None),
     ("lymphoid", "Lymphoid neoplasms and plasma cell disorders", [], None)]),
   ("lab-methods", "Hematology methods", [
     ("cbc-analyzer", "Automated CBC: impedance, scatter, flags", ["qc-ops.instrumentation.flow-impedance"], None),
     ("smear", "Peripheral smear preparation and review", [], None),
     ("esr-retic", "ESR and reticulocyte count", [], None)])]),
 ("hemo", "Hemostasis & Coagulation", B, 6, [
   ("primary", "Primary hemostasis", [
     ("platelet-function", "Platelet adhesion, activation, aggregation", [], None),
     ("vwd", "von Willebrand disease and platelet function disorders", ["hemo.primary.platelet-function"], None)]),
   ("secondary", "Secondary hemostasis", [
     ("cascade", "Coagulation cascade and the cell-based model", [], None),
     ("pt-aptt", "PT/INR and aPTT: what each measures", ["hemo.secondary.cascade"], None),
     ("mixing-study", "Mixing studies: factor deficiency vs inhibitor", ["hemo.secondary.pt-aptt"], None)]),
   ("fibrinolysis", "Fibrinolysis and thrombosis", [
     ("d-dimer", "Fibrinolysis, D-dimer and FDPs", ["hemo.secondary.cascade"], None),
     ("dic", "DIC laboratory pattern", ["hemo.fibrinolysis.d-dimer"], None),
     ("anticoagulant-monitoring", "Anticoagulant therapy monitoring", ["hemo.secondary.pt-aptt"], None)])]),
 ("chem", "Clinical Chemistry", B, 7, [
   ("carbs", "Carbohydrates", [
     ("glucose-regulation", "Glucose regulation and diabetes diagnosis", [], None),
     ("hba1c", "HbA1c and its interferences", ["chem.carbs.glucose-regulation"], None)]),
   ("proteins", "Proteins and enzymes", [
     ("electrophoresis", "Serum protein electrophoresis patterns", [], None),
     ("enzymes", "Clinical enzymology (kinetics, isoenzymes)", [], None),
     ("cardiac", "Cardiac biomarkers (troponin, natriuretic peptides)", [], None)]),
   ("lipids", "Lipids", [("lipoproteins", "Lipoprotein metabolism and lipid panel", [], None)]),
   ("renal", "Renal function and NPN", [
     ("npn", "Urea, creatinine, uric acid, ammonia", [], None)]),
   ("liver", "Liver function", [
     ("bilirubin", "Bilirubin metabolism and jaundice types", [], None)]),
   ("electrolytes", "Electrolytes and acid–base", [
     ("electrolytes", "Na, K, Cl, HCO3 and their regulation", [], None),
     ("blood-gas", "Blood gases and acid–base interpretation", ["chem.electrolytes.electrolytes"], None)]),
   ("endocrine", "Endocrinology", [
     ("thyroid", "Thyroid function testing", [], None),
     ("adrenal", "Adrenal and pituitary testing", [], None)]),
   ("tdm-tox", "TDM and toxicology", [("tdm", "Therapeutic drug monitoring: peak and trough", [], None)])]),
 ("ua", "Urinalysis & Other Body Fluids", B, 8, [
   ("physical-chemical", "Physical and chemical urinalysis", [
     ("specimen", "Urine specimen types and preservation", [], None),
     ("reagent-strip", "Reagent strip reactions and interferences", [], None),
     ("renal-physiology", "Renal physiology for urinalysis", [], None)]),
   ("microscopy", "Urine microscopy", [
     ("casts", "Casts: formation and significance", ["ua.physical-chemical.renal-physiology"], None),
     ("crystals", "Crystals: normal vs abnormal", [], None)]),
   ("fluids", "Other body fluids", [
     ("csf", "Cerebrospinal fluid analysis", [], None),
     ("serous", "Serous fluids: transudate vs exudate", [], None),
     ("synovial", "Synovial fluid and crystals", [], None),
     ("semen", "Semen analysis", [], None),
     ("feces", "Fecal analysis and occult blood", [], None),
     ("amniotic", "Amniotic fluid testing", [], None)])]),
 ("bact", "Bacteriology", B, 9, [
   ("basics", "Specimens, stains and media", [
     ("specimen-collection", "Specimen collection and transport", [], None),
     ("gram-stain", "Gram stain: mechanism and errors", [], None),
     ("media", "Selective vs differential media", [], None)]),
   ("gpc", "Gram-positive cocci", [
     ("staph", "Staphylococci: catalase, coagulase, identification", ["bact.basics.gram-stain"], None),
     ("strep", "Streptococci and enterococci: hemolysis and grouping", ["bact.basics.gram-stain"], None)]),
   ("gnr", "Gram-negative rods", [
     ("enterobacterales", "Enterobacterales identification", ["bact.basics.media"], None),
     ("nonfermenters", "Non-fermenters (Pseudomonas, Acinetobacter)", ["bact.basics.media"], None)]),
   ("special", "Special organisms", [
     ("anaerobes", "Anaerobes", [], None),
     ("mycobacteria", "Mycobacteria and acid-fast staining", [], None),
     ("fastidious", "Fastidious organisms (Haemophilus, Neisseria)", [], None)]),
   ("ast", "Antimicrobial susceptibility", [
     ("ast-methods", "Disk diffusion, MIC and breakpoints", [], None),
     ("resistance", "Resistance mechanisms (ESBL, carbapenemase, MRSA, VRE)", ["bact.ast.ast-methods"], None)])]),
 ("myco-viro", "Mycology & Virology", B, 10, [
   ("mycology", "Mycology", [
     ("yeasts", "Yeasts: Candida and Cryptococcus", [], None),
     ("dimorphic", "Dimorphic fungi", [], None),
     ("moulds", "Dermatophytes and opportunistic moulds", [], None)]),
   ("virology", "Virology", [
     ("viral-diagnostics", "Viral detection methods (culture, antigen, NAAT)", [], None),
     ("respiratory-viruses", "Respiratory viruses", [], None)])]),
 ("para", "Parasitology", B, 11, [
   ("protozoa", "Protozoa", [
     ("intestinal-protozoa", "Intestinal amoebae and flagellates", [], None),
     ("blood-protozoa", "Plasmodium and blood/tissue protozoa", [], None)]),
   ("helminths", "Helminths", [
     ("nematodes", "Nematodes", [], None),
     ("cestodes", "Cestodes", [], None),
     ("trematodes", "Trematodes (incl. Schistosoma)", [], None)]),
   ("methods", "Parasitology methods", [("ova-parasite", "Ova and parasite examination; concentration techniques", [], None)])]),
 ("mdx", "Molecular Diagnostics", B, 12, [
   ("basics", "Nucleic acids", [("dna-structure", "DNA/RNA structure and extraction", [], None)]),
   ("amplification", "Amplification and detection", [
     ("pcr", "PCR and real-time PCR", ["mdx.basics.dna-structure"], None),
     ("sequencing", "Sequencing basics", ["mdx.basics.dna-structure"], None),
     ("contamination", "Contamination control and unidirectional workflow", ["mdx.amplification.pcr"], None)])]),
 ("histo", "Histopathologic & Cytologic Techniques", M, 13, [
   ("processing", "Tissue processing", [
     ("fixation", "Fixation and fixatives", [], None),
     ("processing-steps", "Dehydration, clearing, infiltration, embedding", ["histo.processing.fixation"], None),
     ("microtomy", "Microtomy and sectioning artifacts", ["histo.processing.processing-steps"], None)]),
   ("staining", "Staining", [
     ("he", "H&E staining", [], None),
     ("special-stains", "Special stains", ["histo.staining.he"], None)]),
   ("cytology", "Cytology", [("pap", "Papanicolaou staining and cytologic preparation", [], None)])]),
 ("law", "Medical Technology Laws & Ethics (PH)", M, 14, [
   ("laws", "Laws", [
     ("ra-5527", "R.A. 5527: Philippine Medical Technology Act", [], None),
     ("related-laws", "Related laws and implementing rules (e.g. clinical laboratory regulation, blood services, HIV, dangerous drugs)", [], None)]),
   ("ethics", "Ethics", [("code-of-ethics", "Code of ethics for medical technologists", [], None)])]),
 ("mgmt", "Laboratory Management & Education", B, 15, [
   ("management", "Management", [
     ("management-principles", "Management functions and personnel", [], None),
     ("lab-regulation", "Accreditation and regulation (track-specific)", [], None)]),
   ("education", "Education principles", [("education-principles", "Education principles and competency assessment", [], A)])]),
]

out = {
  "provenance": {
    "status": "provisional",
    "statement": "PROVISIONAL inventory built from the general scope of the MLS(ASCP)/ASCPi and PH MTLE frameworks because the user's reviewer was not provided. It is not extracted from the reviewer and not verified against the ASCP content guideline (inaccessible) or Annex A of PRB-MT Res. 13 s. 2023 (inaccessible). Every concept has reviewerRef = null until mapped.",
    "revisedAt": "2026-10-07"
  },
  "domains": []
}
for did, title, tracks, seq, topics in D:
  dom = {"id": did, "title": title, "tracks": tracks, "sequence": seq, "topics": []}
  for tid, ttitle, concepts in topics:
    top = {"id": f"{did}.{tid}", "title": ttitle, "concepts": []}
    for cid, ctitle, pre, ctr in concepts:
      top["concepts"].append({"id": f"{did}.{tid}.{cid}", "title": ctitle, "tracks": ctr or tracks, "prerequisites": pre, "reviewerRef": None})
    dom["topics"].append(top)
  out["domains"].append(dom)

p = pathlib.Path(__file__).resolve().parent.parent / "content" / "curriculum.json"
p.write_text(json.dumps(out, indent=2) + "\n")
n = sum(len(t["concepts"]) for d in out["domains"] for t in d["topics"])
print(f"wrote {p} — {len(out['domains'])} domains, {n} concepts")
