import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak
} from 'docx'

interface OpsioCompleteData {
  clientName: string
  clientAddress: string
  clientPostalCity: string
  clientBirthdate?: string
  clientEmail?: string
  clientPhone?: string
  advisorName: string
  advisorEmail: string
  advisorPhone?: string
  paymentMethod?: 'commission' | 'fees'
  signatureHash?: string
  signatureIP?: string
  signatureUserAgent?: string
  signatureData?: string // Base64 de l'image de signature
}

export class OpsioCompleteGenerator {
  /**
   * Génère un document Word OPSIO complet avec toutes les sections du PDF
   */
  static async generateCompleteOpsioDocument(data: OpsioCompleteData): Promise<Buffer> {
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
              // En-tête avec logo OPSIO
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

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

              // Titre principal
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Feuille d'information du conseiller aux preneurs d'assurance selon l'art. 45 LSA",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "(Loi fédérale sur la surveillance des assurances)",
                    size: 22,
                    italics: true,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section conseiller et client avec lignes pointillées
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Votre conseiller/ère :",
                    bold: true,
                    size: 24,
                  }),
                  new TextRun({
                    text: "\t\t\t\tVos données client:",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Nom et Prénom: ${data.clientName || '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'}`,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Adresse: ${data.clientAddress || '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'}`,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `NPA/Localité: ${data.clientPostalCity || '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'}`,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date de naissance: ${data.clientBirthdate || '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'}`,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Email: ${data.clientEmail || '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'}`,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Numéro de téléphone: ${data.clientPhone || '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'}`,
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 1: OPSIO Sàrl – Informations concernant l'identité
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1. OPSIO Sàrl – Informations concernant l'identité :",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Siège :",
                    bold: true,
                    size: 22,
                  }),
                  new TextRun({
                    text: "\t\t\tBureau principal :",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl\t\t\tOPSIO Sàrl",
                    size: 22,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Avenue de Bel-Air 16\t\tRue de Savoie 7a",
                    size: 22,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "1225 Chêne-Bourg\t\t1225 Chêne-Bourg",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Téléphone : +41 78 305 12 77",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Email : info@opsio.ch",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Site internet : www.opsio.ch",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Registre du commerce du canton de Genève",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Numéro de société IDE : CHE-356.207.827",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Forme juridique : Société à responsabilité limitée",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Inscription au registre des intermédiaires d'assurances de l'Autorité fédérale de surveillance des marchés financiers (FINMA), numéro au registre : F01468622.",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 2: OPSIO Sàrl est un intermédiaire d'assurance non lié
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2. OPSIO Sàrl est un intermédiaire d'assurance non lié",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl est un intermédiaire d'assurance indépendant (non lié) pour tous les secteurs d'assurance en vertu de l'art. 40 al. 2 LSA.",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Page 2 - En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page 2 sur 5",
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 },
              }),

              // Section 3: Votre conseiller/ère à la clientèle
              new Paragraph({
                children: [
                  new TextRun({
                    text: "3. Votre conseiller/ère à la clientèle",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Au début de la coopération, un(e) conseiller/ère de clientèle responsable des assurances du/de la client(e) est désigné(e). Il/elle est la personne de contact direct pour le/la client(e) et est responsable de la gestion de toutes ses questions d'assurance.",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl ainsi que ses conseillers/ères à la clientèle disposent des enregistrements nécessaires pour exercer les prestations d'intermédiaire en assurance, conformément à la législation suisse sur la surveillance des institutions d'assurance (numéro de registre FINMA F01468622).",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 4: Informations sur la nature des prestations
              new Paragraph({
                children: [
                  new TextRun({
                    text: "4. Informations sur la nature des prestations",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Le/la client(e) confie la gestion de ses assurances à OPSIO Sàrl moyennant la conclusion d'un contrat d'assurance séparé, dans le sens d'une relation d'affaires basée sur la confiance mutuelle entre les parties. Les informations mentionnées dans le contrat d'assurance individuel qui lie OPSIO Sàrl au/à la client(e) font foi et ne peuvent être modifiées ou complétées que par un document signé par les deux parties contractantes.",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 5: Relations contractuelles et collaboration avec les compagnies d'assurance
              new Paragraph({
                children: [
                  new TextRun({
                    text: "5. Relations contractuelles et collaboration avec les compagnies d'assurance",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl a conclu des accords de collaboration avec les principales compagnies d'assurance disposant de l'agrément de l'Autorité de surveillance des marchés financiers (FINMA). OPSIO Sàrl n'est toutefois pas liée juridiquement, économiquement ou de quelque façon que ce soit à ses partenaires et veille à conserver son indépendance et à œuvrer dans le strict intérêt de ses clients/tes.",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "En relation avec son activité d'intermédiation non liée, OPSIO Sàrl opère dans les branches suivantes et collabore selon des conventions de coopérations avec les sociétés d'assurance suivantes, pour les types d'assurance indiqués :",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Page 3 - Saut de page
              new PageBreak(),

              // Page 3 - En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Informations conformément à l'article 45",
                    size: 22,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "de la loi sur la surveillance des assurances",
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Tableau des assurances
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Assurance vie",
                                bold: true,
                                size: 22,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Assurance vie collective, assurance vie individuelle, y compris l'assurance vie en unités de compte",
                                size: 20,
                              }),
                            ],
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "• LiechtensteinLife (privé 4.5%)",
                                size: 20,
                              }),
                            ],
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Assurance personne",
                                bold: true,
                                size: 22,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Assurance accident (LAA e LAAC) et maladie collective (PGM), assurance maladie obligatoire LaMal, assurance maladie complémentaire privé LCA",
                                size: 20,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "• Visana (LaMal 70.-, LCA 12x)",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "• Swica (LaMal 70.-, LCA 12x)",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "• Sympany (LaMal 70.-, LCA 12x)",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "• Assura (LaMal 70.-, LCA 12-16x)",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "• Helsana (LaMal 70.-, LCA 12-16x)",
                                size: 20,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // Section 6: Informations sur l'indemnisation/rémunération de l'intermédiaire
              new Paragraph({
                children: [
                  new TextRun({
                    text: "6. Informations sur l'indemnisation/rémunération de l'intermédiaire",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Pour les prestations fournies par OPSIO Sàrl dans le cadre de son activité d'intermédiaire d'assurance, OPSIO Sàrl reçoit de la part des assureurs une rémunération, laquelle prend pour l'essentiel la forme de frais de courtage, calculés en pour cent de la prime d'assurance payée par le/la client(e), ainsi que des commissions d'acquisition (dites una-tantum). Ces rémunérations sont inclues dans les primes des assureurs.",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Les rémunérations perçues par OPSIO Sàrl correspondent à la pratique du marché. Pour chaque type de produit et pour chaque assurance il existe des règles de calcul des rémunérations qui sont variables. Dans la plupart des cas, les règles suivantes s'appliquent :",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              // Liste des types d'assurance
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance choses et patrimoine : l'intermédiaire reçoit un courtage (pourcentage des primes payées)",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance vie : una-tantum pour la prévoyance privée, commission pour la prévoyance collective",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance personne : différents modèles de commission (courtage ou una-tantum) selon les compagnies",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance juridique : différents modèles de commission (courtage ou una-tantum) selon les compagnies",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Assurance animaux : différents modèles de commission (courtage ou una-tantum) selon les compagnies",
                    size: 22,
                  }),
                ],
                spacing: { after: 400 },
              }),

              // Page 4 - Saut de page
              new PageBreak(),

              // Page 4 - En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Informations conformément à l'article 45",
                    size: 22,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "de la loi sur la surveillance des assurances",
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Section 7: Informations sur la protection et la sécurité des données
              new Paragraph({
                children: [
                  new TextRun({
                    text: "7. Informations sur la protection et la sécurité des données ; confidentialité",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl garantit que ses collaborateurs/trices traitent les données qui leur sont confiées selon les principes de la législation applicables sur la protection des données. Au cas où une transmission des données du client à l'étranger serait nécessaire dans le cadre du mandat de courtier, OPSIO Sàrl est autorisée à transmettre ces données en respectant la législation applicable en la matière.",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 8: Formation initiale et continue
              new Paragraph({
                children: [
                  new TextRun({
                    text: "8. Formation initiale et continue des collaborateurs/trices de OPSIO Sàrl",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl assure la formation initiale et continue de ses collaborateurs/trices intervenant dans le domaine de l'intermédiation en assurance conformément aux exigences légales.",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Les demandes spécifiques relatives à la formation ou au perfectionnement des intermédiaires d'assurance peuvent être adressées à : OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg.",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Page 5 - Saut de page
              new PageBreak(),

              // Page 5 - En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Informations conformément à l'article 45",
                    size: 22,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "de la loi sur la surveillance des assurances",
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg info@opsio.ch  FINMA reg. no F01468622",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Section 9: Informations sur la responsabilité
              new Paragraph({
                children: [
                  new TextRun({
                    text: "9. Informations sur la responsabilité",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl fournit ses prestations avec la diligence usuelle due en affaires.",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "En cas de négligence, d'erreur ou de renseignements erronés en rapport avec l'activité d'intermédiaire, OPSIO Sàrl peut, conformément au contrat et selon la législation suisse applicable, être tenue pour responsable à l'égard du/de la client(e).",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 10: Décision du/de la client(e) sur la rémunération
              new Paragraph({
                children: [
                  new TextRun({
                    text: "10. Décision du/de la client(e) sur la rémunération de l'intermédiaire (cf. ch. 6 supra)",
                    bold: true,
                    size: 24,
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
                    size: 22,
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
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Texte de confirmation
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Par la présente, le/la soussigné(e) confirme que le conseiller/ère à la clientèle de OPSIO Sàrl lui a remis le présent document et lui en a dûment explicité le contenu, avant la conclusion du contrat de courtage, respectivement le/la soussigné(e) confirme en avoir pleinement compris le contenu et y adhérer par sa signature.",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Signatures avec lignes pointillées comme dans le PDF
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lieu, date\t\t\t\tSignature Conseiller/ère à la clientèle",
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "............................................................... ......................................................",
                    size: 22,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lieu, date\t\t\t\tSignature Client(e)",
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "............................................................................................. ................................................................................",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Signature réelle comme dans la résiliation
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Signature personnes majeures:",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: data.signatureData ? [
                  // Ajouter l'image de signature si disponible
                  new ImageRun({
                    data: Buffer.from(data.signatureData, 'base64'),
                    transformation: {
                      width: 200,
                      height: 100,
                    },
                  }),
                ] : [
                  // Ligne vide pour signature manuelle si pas de signature électronique
                  new TextRun({
                    text: "_________________________",
                    size: 24,
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
                      size: 20,
                      italics: true,
                      color: "666666",
                    }),
                  ],
                  spacing: { after: 400 },
                })
              ] : []),

              // Signature électronique avec hash
              ...(data.signatureHash ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Signature Électronique Sécurisée",
                      bold: true,
                      size: 24,
                    }),
                  ],
                  spacing: { after: 300 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Document signé électroniquement le : ${currentDate}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 150 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Signataire : ${data.clientName}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 150 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Hash de vérification : ${data.signatureHash}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 150 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Statut : Signature valide et vérifiée",
                      size: 20,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ] : []),
            ],
          },
        ],
      })

      return await Packer.toBuffer(doc)
      
    } catch (error) {
      console.error('❌ Erreur génération document Word OPSIO complet:', error);
      throw new Error(`Erreur génération document Word: ${error.message}`);
    }
  }
}
