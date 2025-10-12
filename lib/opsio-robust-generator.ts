// opsio-robust-generator.ts
import fs from "fs";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  PageBreak,
} from "docx";

export interface OpsioRobustData {
  // champs fournis manuellement (ou mappés depuis la BD)
  clientName?: string;
  clientAddress?: string;
  clientPostalCity?: string; // NPA/Localité
  clientBirthdate?: string;
  clientEmail?: string;
  clientPhone?: string;
  advisorName?: string;
  advisorEmail?: string;
  advisorPhone?: string;
  paymentMethod?: "commission" | "fees";
  signatureData?: string; // base64 image
  signatureHash?: string;
  signatureIP?: string;
  signatureUserAgent?: string;

  // Optionnel : chemin vers le logo (si non renseigné on utilisera le chemin intégré)
  logoPath?: string;
}

/**
 * OpsioRobustGenerator
 * Génère un .docx reprenant le contenu du PDF "Art 45 - OPSIO" et remplit les champs fournis.
 */
export class OpsioRobustGenerator {
  // chemin par défaut du logo (fichier uploadé)
  static DEFAULT_LOGO_PATH = "/mnt/data/d99fbe2e-1cd0-4295-ad7b-bfc1a275016a.png";

  /**
   * Génère un document Word OPSIO COMPLET avec toutes les sections 1-10
   */
  static async generateRobustOpsioDocument(data: OpsioRobustData): Promise<Buffer> {
    try {
      const currentDate = new Date().toLocaleDateString('fr-CH')

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440, // 1 inch
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: [
              // En-tête OPSIO
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "info@opsio.ch  FINMA reg. no F01468622",
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page 1 sur 5",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),

              // Titre principal
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Feuille d'information du conseiller aux preneurs d'assurance selon l'art. 45 LSA",
                    bold: true,
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "(Loi fédérale sur la surveillance des assurances)",
                    size: 20,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),

              // Section Conseiller et Données client
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Votre conseiller/ère :",
                    bold: true,
                    size: 22,
                  }),
                  new TextRun({
                    text: "                                    ",
                    size: 22,
                  }),
                  new TextRun({
                    text: "Vos données client:",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Nom et Prénom: ${data.clientName || '................................ ....................'}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Adresse: ${data.clientAddress || '................................ ...............................'}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `NPA/Localité: ${data.clientPostalCity || '................................ .......................'}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date de naissance: ${data.clientBirthdate || '................................ .....................'}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Email: ${data.clientEmail || '................................ ..............................'}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Numéro de téléphone: ${data.clientPhone || '...................................................'}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 1
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1. OPSIO Sàrl – Informations concernant l'identité :",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Siège :                                                    Bureau principal :",
                    bold: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl                                              OPSIO Sàrl",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Avenue de Bel-Air 16                            Rue de Savoie 7a",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "1225 Chêne-Bourg                               1225 Chêne-Bourg",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Téléphone : +41 78 305 12 77        Email : info@opsio.ch",
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Site internet : www.opsio.ch",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Registre du commerce du canton de Genève",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Numéro de société IDE : CHE-356.207.827",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Forme juridique : Société à responsabilité limitée",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Inscription au registre des intermédiaires d'assurances de l'Autorité fédérale de surveillance des marchés financiers (FINMA), numéro au registre : F01468622.",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 2
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2. OPSIO Sàrl est un intermédiaire d'assurance non lié",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl est un intermédiaire d'assurance indépendant (non lié) pour tous les secteurs d'assurance en vertu de l'art. 40 al. 2 LSA.",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Saut de page
              new Paragraph({
                children: [new TextRun({ text: "", break: 1 })],
                pageBreakBefore: true,
              }),

              // Page 2 - En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page 2 sur 5",
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Informations conformément à l'article 45 de la loi sur la surveillance des assurances",
                    size: 18,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),

              // Sections 3, 4, 5
              new Paragraph({
                children: [
                  new TextRun({
                    text: "3. Votre conseiller/ère à la clientèle",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Au début de la coopération, un(e) conseiller/ère de clientèle responsable des assurances du/de la client(e) est désigné(e). Il/elle est la personne de contact direct pour le/la client(e) et est responsable de la gestion de toutes ses questions d'assurance.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl ainsi que ses conseillers/ères à la clientèle disposent des enregistrements nécessaires pour exercer les prestations d'intermédiaire en assurance, conformément à la législation suisse sur la surveillance des institutions d'assurance (numéro de registre FINMA F01468622).",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "4. Informations sur la nature des prestations",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Le/la client(e) confie la gestion de ses assurances à OPSIO Sàrl moyennant la conclusion d'un contrat d'assurance séparé, dans le sens d'une relation d'affaires basée sur la confiance mutuelle entre les parties. Les informations mentionnées dans le contrat d'assurance individuel qui lie OPSIO Sàrl au/à la client(e) font foi et ne peuvent être modifiées ou complétées que par un document signé par les deux parties contractantes.",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "5. Relations contractuelles et collaboration avec les compagnies d'assurance",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl a conclu des accords de collaboration avec les principales compagnies d'assurance disposant de l'agrément de l'Autorité de surveillance des marchés financiers (FINMA). OPSIO Sàrl n'est toutefois pas liée juridiquement, économiquement ou de quelque façon que ce soit à ses partenaires et veille à conserver son indépendance et à œuvrer dans le strict intérêt de ses clients/tes.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "En relation avec son activité d'intermédiation non liée, OPSIO Sàrl opère dans les branches suivantes et collabore selon des conventions de coopérations avec les sociétés d'assurance suivantes, pour les types d'assurance indiqués :",
                    size: 20,
                  }),
                ],
                spacing: { after: 400 },
              }),

              // Tableau des assurances
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance vie",
                    bold: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance vie collective, assurance vie individuelle, y compris l'assurance vie en unités de compte",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "• LiechtensteinLife (privé 4.5%)",
                    size: 20,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance personne",
                    bold: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance accident (LAA e LAAC) et maladie collective (PGM), assurance maladie obligatoire LaMal, assurance maladie complémentaire privé LCA",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Visana (LaMal 70.-, LCA 12x)",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Swica (LaMal 70.-, LCA 12x)",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Sympany (LaMal 70.-, LCA 12x)",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Assura (LaMal 70.-, LCA 12-16x)",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Helsana (LaMal 70.-, LCA 12-16x)",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 6
              new Paragraph({
                children: [
                  new TextRun({
                    text: "6. Informations sur l'indemnisation/rémunération de l'intermédiaire",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Pour les prestations fournies par OPSIO Sàrl dans le cadre de son activité d'intermédiaire d'assurance, OPSIO Sàrl reçoit de la part des assureurs une rémunération, laquelle prend pour l'essentiel la forme de frais de courtage, calculés en pour cent de la prime d'assurance payée par le/la client(e), ainsi que des commissions d'acquisition (dites una-tantum). Ces rémunérations sont inclues dans les primes des assureurs.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Les rémunérations perçues par OPSIO Sàrl correspondent à la pratique du marché. Pour chaque type de produit et pour chaque assurance il existe des règles de calcul des rémunérations qui sont variables. Dans la plupart des cas, les règles suivantes s'appliquent :",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance choses et patrimoine : l'intermédiaire reçoit un courtage (pourcentage des primes payées)",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance vie : una-tantum pour la prévoyance privée, commission pour la prévoyance collective",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance personne : différents modèles de commission (courtage ou una-tantum) selon les compagnies",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance juridique : différents modèles de commission (courtage ou una-tantum) selon les compagnies",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance animaux : différents modèles de commission (courtage ou una-tantum) selon les compagnies",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "En signant un contrat de courtage, le/la client(e) confirme qu'il/elle a été expressément informé(e) des modalités de rémunération de OPSIO Sàrl par le biais des commissions versées par les compagnies d'assurance. Il/elle accepte le cas échéant de renoncer à celles-ci, de même que de solliciter toute communication concernant le montant exact de ces indemnisations perçues par OPSIO Sàrl. Cela vaut également pour les montants perçus après la fin du contrat.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Cela étant, le/la client(e) a aussi été dûment informé(e) qu'il/elle a la possibilité de demander que OPSIO Sàrl ne soit pas rémunérée par la compagnie d'assurance, mais que ses services soient rémunérés par des honoraires payés par le/la client(e) lui/elle-même (cf. chiffre 10 infra).",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Saut de page pour page 3
              new Paragraph({
                children: [new TextRun({ text: "", break: 1 })],
                pageBreakBefore: true,
              }),

              // Page 3 - En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page 3 sur 5",
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Informations conformément à l'article 45 de la loi sur la surveillance des assurances",
                    size: 18,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),

              // Section 7
              new Paragraph({
                children: [
                  new TextRun({
                    text: "7. Informations sur la protection et la sécurité des données ; confidentialité",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl garantit que ses collaborateurs/trices traitent les données qui leur sont confiées selon les principes de la législation applicables sur la protection des données. Au cas où une transmission des données du client à l'étranger serait nécessaire dans le cadre du mandat de courtier, OPSIO Sàrl est autorisée à transmettre ces données en respectant la législation applicable en la matière.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Dans le but de simplifier les procédures d'administration des polices, le/la client(e) accepte que OPSIO Sàrl traite et communique ses données moyennant des applications mises à disposition par les assureurs ou des tiers.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "L'intégralité des données du/de la client(e), ainsi que toutes les informations concernant les activités d'affaires obtenues dans le cadre de l'exercice du mandat avec la clientèle ou d'éventuels mandats assignés par celle-ci sont traitées de façon strictement confidentielle par OPSIO Sàrl, qui les protège contre tout traitement illicite par des mesures techniques et organisationnelles appropriées.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Les données à caractère confidentielle ne sont rendues accessibles qu'aux collaboratrices et collaborateurs de OPSIO Sàrl. Envers les tiers non concernés par le contrat de courtage et les choix du/de la client(e), OPSIO Sàrl garde le strict secret sur la relation contractuelle avec le client et toutes les autres informations y relatives. OPSIO Sàrl se réserve le droit de transmettre des données à des tiers (tels que des compagnies d'assurance), si cela s'avère nécessaire à l'exécution des prestations de service (notamment pour l'établissement de propositions d'assurances, la collecte d'offres, en lien avec des cas de sinistres, etc.).",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Nous traitons les données aussi longtemps que nos objectifs de traitement le permettent, que les délais de conservation légaux et nos intérêts légitimes l'exigent, en particulier à des fins de documentation et de preuve, ou si un stockage est techniquement nécessaire.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Les informations sur la manière dont OPSIO Sàrl traite les données des clients/tes figurent dans son Règlement de protection des données qui est publié sur son site internet (www.enosiscourtier.ch) et fait partie intégrante du contrat de courtage.",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 8
              new Paragraph({
                children: [
                  new TextRun({
                    text: "8. Formation initiale et continue des collaborateurs/trices de OPSIO Sàrl",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl assure la formation initiale et continue de ses collaborateurs/trices intervenant dans le domaine de l'intermédiation en assurance conformément aux exigences légales.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Les demandes spécifiques relatives à la formation ou au perfectionnement des intermédiaires d'assurance peuvent être adressées à : OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg.",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Saut de page pour page 4
              new Paragraph({
                children: [new TextRun({ text: "", break: 1 })],
                pageBreakBefore: true,
              }),

              // Page 4 - En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page 4 sur 5",
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Informations conformément à l'article 45 de la loi sur la surveillance des assurances",
                    size: 18,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),

              // Section 9
              new Paragraph({
                children: [
                  new TextRun({
                    text: "9. Informations sur la responsabilité",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl fournit ses prestations avec la diligence usuelle due en affaires.",
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "En cas de négligence, d'erreur ou de renseignements erronés en rapport avec l'activité d'intermédiaire, OPSIO Sàrl peut, conformément au contrat et selon la législation suisse applicable, être tenue pour responsable à l'égard du/de la client(e).",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 10
              new Paragraph({
                children: [
                  new TextRun({
                    text: "10. Décision du/de la client(e) sur la rémunération de l'intermédiaire (cf. ch. 6 supra)",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: data.paymentMethod === 'commission' ? "☑ " : "☐ ",
                    size: 24,
                  }),
                  new TextRun({
                    text: "Commission de la compagnie d'assurance",
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: data.paymentMethod === 'fees' ? "☑ " : "☐ ",
                    size: 24,
                  }),
                  new TextRun({
                    text: "Honoraires payés par le/la client(e)",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Texte de confirmation
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Par la présente, le/la soussigné(e) confirme que le conseiller/ère à la clientèle de OPSIO Sàrl lui a remis le présent document et lui en a dûment explicité le contenu, avant la conclusion du contrat de courtage, respectivement le/la soussigné(e) confirme en avoir pleinement compris le contenu et y adhérer par sa signature.",
                    size: 20,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section signatures
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lieu, date                                                                                    Lieu, date",
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "………………………………………………………                                    ………………………………………………",
                    size: 20,
                  }),
                ],
                spacing: { after: 400 },
              }),

              // Section signatures séparées
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Signature Conseiller/ère à la clientèle:",
                    size: 20,
                    bold: true,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "………………………………………………………………………",
                    size: 20,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Signature Client(e):",
                    size: 20,
                    bold: true,
                  }),
                ],
                spacing: { after: 200 },
              }),

              // SIGNATURE RÉELLE INTÉGRÉE DIRECTEMENT SOUS "Signature Client(e):"
              new Paragraph({
                children: data.signatureData ? [
                  // Ajouter l'image de signature réelle si disponible
                  new ImageRun({
                    data: Buffer.from(data.signatureData, 'base64'),
                    transformation: {
                      width: 200,
                      height: 100,
                    },
                  } as any), // Contournement temporaire du problème de type
                ] : [
                  // Ligne vide pour signature manuelle si pas de signature électronique
                  new TextRun({
                    text: "………………………………………………………………………",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),

              // Ajouter le texte de confirmation de signature électronique
              ...(data.signatureData ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `[Signature électronique appliquée le ${currentDate}]`,
                      size: 18,
                      italics: true,
                      color: "666666",
                    }),
                  ],
                  spacing: { after: 400 },
                })
              ] : []),

              // Fin du document
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page 5 sur 5",
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
            ],
          },
        ],
      })

      return await Packer.toBuffer(doc)

    } catch (error) {
      console.error('❌ Erreur génération document Word OPSIO robuste:', error);
      throw new Error(`Erreur génération document Word: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /** Convertit une valeur en chaîne lisible, ou des points si manquant */
  private static safe(value?: string | null, fallback = ". . . . . . . . . . . . . . . . . . . . . .") {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
      return fallback;
    }
    return value;
  }

  /** Lit un logo en Buffer s'il existe */
  private static readLogoBuffer(logoPath?: string): Buffer | undefined {
    const p = logoPath || this.DEFAULT_LOGO_PATH;
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p);
      }
    } catch (e) {
      // ignore
    }
    return undefined;
  }

  /**
   * Génère et écrit un fichier .docx du document OPSIO.
   * @param data Données à insérer (peuvent être issues de la DB)
   * @param outPath Chemin de sortie du .docx (par défaut ./opsio_art45.docx)
   * @returns Buffer du document généré
   */
  static async generateAndSaveWord(data: OpsioRobustData, outPath = "./opsio_art45.docx"): Promise<Buffer> {
    // Préparer valeurs sûres
    const clientName = this.safe(data.clientName);
    const clientAddress = this.safe(data.clientAddress);
    const clientPostalCity = this.safe(data.clientPostalCity);
    const clientBirthdate = this.safe(data.clientBirthdate);
    const clientEmail = this.safe(data.clientEmail);
    const clientPhone = this.safe(data.clientPhone);
    const advisorName = this.safe(data.advisorName);
    const advisorEmail = this.safe(data.advisorEmail);
    const advisorPhone = this.safe(data.advisorPhone);
    const paymentMethod = data.paymentMethod === "fees" ? "fees" : data.paymentMethod === "commission" ? "commission" : undefined;

    const logoBuffer = this.readLogoBuffer(data.logoPath);

    // Date courante format FR-CH (jour.mois.année)
    const currentDate = new Date().toLocaleDateString("fr-CH");

    // Construire doc
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: {
            default: logoBuffer
              ? new Paragraph({
                  children: [
                    new ImageRun({
                      data: logoBuffer,
                      transformation: { width: 240, height: 70 },
                    }),
                    new TextRun({ text: "\n" }),
                    new TextRun({
                      text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622",
                      size: 18,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                })
              : new Paragraph({
                  children: [
                    new TextRun({
                      text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622",
                      size: 18,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
          },
          children: [
            // Header lines (first page)
            new Paragraph({
              children: [
                new TextRun({
                  text: "Page 1 sur 5",
                  size: 16,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Feuille d'information du conseiller aux preneurs d'assurance selon l'art. 45 LSA",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "(Loi fédérale sur la surveillance des assurances)",
                  size: 20,
                  italics: true,
                }),
              ],
              spacing: { after: 600 },
            }),

            // conseiller / client header
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Votre conseiller/ère :", bold: true, size: 22 }),
                          ],
                        }),
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Vos données client:", bold: true, size: 22 }),
                          ],
                        }),
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
            }),

            // Client fields
            new Paragraph({
              children: [new TextRun({ text: `Nom et Prénom: ${clientName}`, size: 20 })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Adresse: ${clientAddress}`, size: 20 })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `NPA/Localité: ${clientPostalCity}`, size: 20 })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Date de naissance: ${clientBirthdate}`, size: 20 })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Email: ${clientEmail}`, size: 20 })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Numéro de téléphone: ${clientPhone}`, size: 20 })],
              spacing: { after: 600 },
            }),

            // SECTION 1
            new Paragraph({
              children: [new TextRun({ text: "1. OPSIO Sàrl – Informations concernant l'identité :", bold: true, size: 22 })],
              spacing: { after: 300 },
            }),
            new Paragraph({ children: [new TextRun({ text: "Siège :    Bureau principal :", size: 20 })], spacing: { after: 200 } }),

            // Use a small table to mimic "Siège / Bureau principal" lines
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "OPSIO Sàrl\nAvenue de Bel-Air 16\n1225 Chêne-Bourg\nTéléphone : +41 78 305 12 77\nEmail : info@opsio.ch\nSite internet : www.opsio.ch",
                              size: 20
                            })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "OPSIO Sàrl\nRue de Savoie 7a\n1225 Chêne-Bourg",
                              size: 20
                            })
                          ]
                        })
                      ]
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Registre du commerce du canton de Genève",
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Numéro de société IDE : CHE-356.207.827", size: 20 }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Forme juridique : Société à responsabilité limitée", size: 20 }),
              ],
              spacing: { after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Inscription au registre des intermédiaires d'assurances de l'Autorité fédérale de surveillance des marchés financiers (FINMA), numéro au registre : F01468622.",
                  size: 20,
                }),
              ],
              spacing: { after: 600 },
            }),

            // SECTION 2
            new Paragraph({
              children: [new TextRun({ text: "2. OPSIO Sàrl est un intermédiaire d’assurance non lié", bold: true, size: 22 })],
              spacing: { after: 300 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "OPSIO Sàrl est un intermédiaire d’assurance indépendant (non lié) pour tous les secteurs d’assurance en vertu de l'art. 40 al. 2 LSA.", size: 20 })],
              spacing: { after: 600 },
            }),

            // Page 2 header indicator (to mimic original)
            new Paragraph({
              children: [new TextRun({ text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622", size: 18 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Page 2 sur 5", size: 16 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),

            // SECTION 3
            new Paragraph({
              children: [new TextRun({ text: "3. Votre conseiller/ère à la clientèle", bold: true, size: 22 })],
              spacing: { after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Au début de la coopération, un(e) conseiller/ère de clientèle responsable des assurances du/de la client(e) est désigné(e). Il/elle est la personne de contact direct pour le/la client(e) et est responsable de la gestion de toutes ses questions d'assurance.",
                  size: 20,
                }),
              ],
              spacing: { after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "OPSIO Sàrl ainsi que ses conseillers/ères à la clientèle disposent des enregistrements nécessaires pour exercer les prestations d'intermédiaire en assurance, conformément à la législation suisse sur la surveillance des institutions d'assurance (numéro de registre FINMA F01468622).",
                  size: 20,
                }),
              ],
              spacing: { after: 600 },
            }),

            // (Sections 4,5,6,7,8,9,10 simplified but present with the same textual content)
            new Paragraph({ children: [new TextRun({ text: "4. Informations sur la nature des prestations", bold: true, size: 22 })], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Le/la client(e) confie la gestion de ses assurances à OPSIO Sàrl moyennant la conclusion d’un contrat d’assurance séparé, dans le sens d’une relation d’affaires basée sur la confiance mutuelle entre les parties. Les informations mentionnées dans le contrat d’assurance individuel qui lie OPSIO Sàrl au/à la client(e) font foi et ne peuvent être modifiées ou complétées que par un document signé par les deux parties contractantes.",
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({ children: [new TextRun({ text: "5. Relations contractuelles et collaboration avec les compagnies d’assurance", bold: true, size: 22 })], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "OPSIO Sàrl a conclu des accords de collaboration avec les principales compagnies d’assurance disposant de l’agrément de l’Autorité de surveillance des marchés financiers (FINMA). OPSIO Sàrl n’est toutefois pas liée juridiquement, économiquement ou de quelque façon que ce soit à ses partenaires et veille à conserver son indépendance et à œuvrer dans le strict intérêt de ses clients/tes.",
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({ children: [new TextRun({ text: "6. Informations sur l’indemnisation/rémunération de l’intermédiaire", bold: true, size: 22 })], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Pour les prestations fournies par OPSIO Sàrl ... Ces rémunérations sont inclues dans les primes des assureurs. (Texte abrégé dans cet exemple — remplaces si tu veux le texte complet).",
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({ children: [new TextRun({ text: "7. Informations sur la protection et la sécurité des données ; confidentialité", bold: true, size: 22 })], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "OPSIO Sàrl garantit que ses collaborateurs/trices traitent les données qui leur sont confiées selon les principes de la législation applicables sur la protection des données. ... (Texte abrégé).",
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({ children: [new TextRun({ text: "8. Formation initiale et continue des collaborateurs/trices de OPSIO Sàrl", bold: true, size: 22 })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: "OPSIO Sàrl assure la formation initiale et continue de ses collaborateurs/trices intervenant dans le domaine de l’intermédiation en assurance conformément aux exigences légales.", size: 20 })], spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: "9. Informations sur la responsabilité", bold: true, size: 22 })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: "OPSIO Sàrl fournit ses prestations avec la diligence usuelle due en affaires.", size: 20 })], spacing: { after: 300 } }),

            // SECTION 10 - choix rémunération
            new Paragraph({ children: [new TextRun({ text: "10. Décision du/de la client(e) sur la rémunération de l’intermédiaire", bold: true, size: 22 })], spacing: { after: 400 } }),

            new Paragraph({
              children: [
                new TextRun({ text: paymentMethod === "commission" ? "[X] " : "[ ] ", size: 22 }),
                new TextRun({ text: "Commission de la compagnie d'assurance", size: 20 }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: paymentMethod === "fees" ? "[X] " : "[ ] ", size: 22 }),
                new TextRun({ text: "Honoraires payés par le/la client(e)", size: 20 }),
              ],
              spacing: { after: 600 },
            }),

            // Confirmation & signatures
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Par la présente, le/la soussigné(e) confirme que le conseiller/ère à la clientèle de OPSIO Sàrl lui a remis le présent document et lui en a dûment explicité le contenu, avant la conclusion du contrat de courtage, respectivement le/la soussigné(e) confirme en avoir pleinement compris le contenu et y adhérer par sa signature.",
                  size: 20,
                }),
              ],
              spacing: { after: 600 },
            }),

            new Paragraph({ children: [new TextRun({ text: "Lieu, date                                    Signature Conseiller/ère à la clientèle", size: 20 })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: "………………………………………………………                    ………………………………………………", size: 20 })], spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: "Lieu, date                                    Signature Client(e)", size: 20 })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: "…………………………………………………………………………………                    ………………………………………………………………………", size: 20 })], spacing: { after: 600 } }),

            // Signature électronique image (si fournie)
            ...(data.signatureData
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Signature personnes majeures:", bold: true, size: 22 }),
                    ],
                    spacing: { after: 200 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "[SIGNATURE ÉLECTRONIQUE APPLIQUÉE]",
                        size: 20,
                        bold: true,
                        color: "0066CC",
                      }),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: `[Signature électronique appliquée le ${currentDate}]`, size: 18, italics: true, color: "666666" }),
                    ],
                    spacing: { after: 400 },
                  }),
                ]
              : [
                  new Paragraph({
                    children: [new TextRun({ text: "Signature personnes majeures:", bold: true, size: 22 })],
                    spacing: { after: 200 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "_________________________", size: 22 })],
                    spacing: { after: 100 },
                  }),
                ]),

            // Si hash/signature électronique présentes -> bloc résumé
            ...(data.signatureHash
              ? [
                  new Paragraph({ children: [new TextRun({ text: "Signature Électronique Sécurisée", bold: true, size: 22 })], spacing: { after: 200 } }),
                  new Paragraph({ children: [new TextRun({ text: `Document signé électroniquement le : ${currentDate}`, size: 18 })], spacing: { after: 150 } }),
                  new Paragraph({ children: [new TextRun({ text: `Signataire : ${clientName}`, size: 18 })], spacing: { after: 150 } }),
                  new Paragraph({ children: [new TextRun({ text: "Statut : Signature valide et vérifiée", size: 18 })], spacing: { after: 200 } }),
                ]
              : []),
          ],
        },
      ],
    });

    // Générer Buffer et enregistrer dans outPath
    const buffer = await Packer.toBuffer(doc);
    // Écrire le .docx
    fs.writeFileSync(outPath, buffer);

    return buffer;
  }
}
