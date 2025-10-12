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

interface OpsioExactData {
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

export class OpsioExactGenerator {
  /**
   * Génère un document Word OPSIO exact basé sur le PDF officiel
   */
  static async generateExactOpsioDocument(data: OpsioExactData): Promise<Buffer> {
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
              // Logo et en-tête OPSIO (comme dans le PDF)
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO",
                    bold: true,
                    size: 48,
                    color: "0066CC", // Bleu OPSIO
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "LA CROISSANCE POSITIVE",
                    size: 16,
                    color: "0066CC",
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
                alignment: AlignmentType.LEFT,
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
                alignment: AlignmentType.LEFT,
                spacing: { after: 600 },
              }),

              // Tableau des données conseiller et client (comme dans le PDF)
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
                                text: "Votre conseiller/ère",
                                bold: true,
                                size: 24,
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
                                text: "Vos données client:",
                                bold: true,
                                size: 24,
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
                                text: `Nom et Prénom: ${data.advisorName || ''}`,
                                size: 20,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Email: ${data.advisorEmail || ''}`,
                                size: 20,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Téléphone: ${data.advisorPhone || '+41 78 305 12 77'}`,
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
                                text: `Nom et Prénom: ${data.clientName || ''}`,
                                size: 20,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Adresse: ${data.clientAddress || ''}`,
                                size: 20,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `NPA/Localité: ${data.clientPostalCity || ''}`,
                                size: 20,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Date de naissance: ${data.clientBirthdate || ''}`,
                                size: 20,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Email: ${data.clientEmail || ''}`,
                                size: 20,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Numéro de téléphone: ${data.clientPhone || ''}`,
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

              new Paragraph({
                children: [new TextRun({ text: "", size: 20 })],
                spacing: { after: 600 },
              }),

              // Section 1: OPSIO Sàrl – Informations concernant l'identité
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1.",
                    bold: true,
                    size: 24,
                  }),
                  new TextRun({
                    text: "\tOPSIO Sàrl – Informations concernant l'identité :",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 },
              }),

              // Tableau des informations OPSIO
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
                                text: "Siège",
                                bold: true,
                                size: 22,
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
                                text: "Bureau principal",
                                bold: true,
                                size: 22,
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
                                text: "OPSIO Sàrl",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Avenue de Bel-Air 16",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "1225 Chêne-Bourg",
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
                                text: "OPSIO Sàrl",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Rue de Savoie 7a",
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "1225 Chêne-Bourg",
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

              new Paragraph({
                children: [new TextRun({ text: "", size: 20 })],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Téléphone :\t+41 78 305 12 77",
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Site internet :\twww.opsio.ch",
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Email :\t",
                    size: 22,
                  }),
                  new TextRun({
                    text: "info@opsio.ch",
                    size: 22,
                    underline: { type: UnderlineType.SINGLE },
                    color: "0066CC",
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "FINMA reg. n° F01468622",
                    size: 22,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 600 },
              }),

              // Section 2: OPSIO Sàrl est un intermédiaire d'assurance non lié
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2.",
                    bold: true,
                    size: 24,
                  }),
                  new TextRun({
                    text: "\tOPSIO Sàrl est un intermédiaire d'assurance non lié",
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

              // Page 2 - Continuation des sections
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
                    text: "OPSIO",
                    bold: true,
                    size: 32,
                    color: "0066CC",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 },
              }),

              // Section 3: Votre conseiller/ère à la clientèle
              new Paragraph({
                children: [
                  new TextRun({
                    text: "3.",
                    bold: true,
                    size: 24,
                  }),
                  new TextRun({
                    text: "\tVotre conseiller/ère à la clientèle",
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

              // Section 9: Informations sur la responsabilité
              new Paragraph({
                children: [
                  new TextRun({
                    text: "9.",
                    bold: true,
                    size: 24,
                  }),
                  new TextRun({
                    text: "\tInformations sur la responsabilité",
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
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "En cas de négligence, d'erreur ou de renseignements erronés en rapport avec l'activité d'intermédiaire, OPSIO Sàrl peut, conformément au contrat et selon la législation suisse applicable, être tenue pour responsable à l'égard du ou de la client(e).",
                    size: 22,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section 10: Décision du/de la client(e) sur la rémunération
              new Paragraph({
                children: [
                  new TextRun({
                    text: "10.",
                    bold: true,
                    size: 24,
                  }),
                  new TextRun({
                    text: "\tDécision du/de la client(e) sur la rémunération de l'intermédiaire (cf. ch. 6 supra)",
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

              // Signatures avec tableau comme dans le PDF
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Lieu, date",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "................................................................",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 400 },
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Signature Conseiller/ère à la clientèle",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "................................................................",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 400 },
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
                                text: "Lieu, date",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "................................................................",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 400 },
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Signature Client(e)",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "................................................................",
                                size: 22,
                              }),
                            ],
                            spacing: { after: 400 },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // Signature réelle dessinée comme dans la résiliation
              ...(data.signatureData ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Signature personnes majeures:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                  spacing: { after: 300 },
                }),

                new Paragraph({
                  children: [
                    new ImageRun({
                      data: Buffer.from(data.signatureData, 'base64'),
                      transformation: {
                        width: 200,
                        height: 100,
                      },
                    }),
                  ],
                  spacing: { after: 400 },
                }),
              ] : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Signature personnes majeures:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                  spacing: { after: 300 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: "[Signature manuscrite à apposer ici]",
                      size: 20,
                      italics: true,
                    }),
                  ],
                  spacing: { after: 400 },
                }),
              ]),

              // Signature électronique
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

              // Pied de page avec informations OPSIO
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
                    text: "info@opsio.ch",
                    size: 18,
                    underline: { type: UnderlineType.SINGLE },
                    color: "0066CC",
                  }),
                  new TextRun({
                    text: "\t\t\tFINMA reg. n° F01468622",
                    size: 18,
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
      console.error('❌ Erreur génération document Word OPSIO exact:', error);
      throw new Error(`Erreur génération document Word: ${error.message}`);
    }
  }
}
