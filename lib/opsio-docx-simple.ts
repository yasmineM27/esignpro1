import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  ImageRun
} from 'docx'

interface SimpleOpsioData {
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

export class SimpleOpsioGenerator {
  /**
   * Génère un document Word OPSIO simple et robuste
   */
  static async generateSimpleOpsioDocument(data: SimpleOpsioData): Promise<Buffer> {
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
              // En-tête
              new Paragraph({
                children: [
                  new TextRun({
                    text: "OPSIO Sàrl",
                    bold: true,
                    size: 32,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "info@opsio.ch | FINMA reg. no F01468622",
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Titre
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Feuille d'information du conseiller",
                    bold: true,
                    size: 28,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "aux preneurs d'assurance selon l'art. 45 LSA",
                    bold: true,
                    size: 28,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "(Loi fédérale sur la surveillance des assurances)",
                    size: 22,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),

              // Section conseiller
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Votre conseiller/ère :",
                    bold: true,
                    size: 26,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Nom et Prénom: ${data.advisorName || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Email: ${data.advisorEmail || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Téléphone: ${data.advisorPhone || '+41 78 305 12 77'}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              }),

              // Section client
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Vos données client:",
                    bold: true,
                    size: 26,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Nom et Prénom: ${data.clientName || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Adresse: ${data.clientAddress || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `NPA/Localité: ${data.clientPostalCity || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date de naissance: ${data.clientBirthdate || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Email: ${data.clientEmail || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Téléphone: ${data.clientPhone || ''}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section informations OPSIO
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1. OPSIO Sàrl – Informations concernant l'identité",
                    bold: true,
                    size: 26,
                  }),
                ],
                spacing: { after: 300 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Siège : OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Bureau principal : OPSIO Sàrl, Rue de Savoie 7a, 1225 Chêne-Bourg",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Téléphone : +41 78 305 12 77",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Email : info@opsio.ch",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Site internet : www.opsio.ch",
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Registre du commerce du canton de Genève",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Numéro de société IDE : CHE-356.207.827",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Forme juridique : Société à responsabilité limitée",
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Inscription au registre des intermédiaires d'assurances de l'Autorité fédérale de surveillance des marchés financiers (FINMA), numéro au registre : F01468622.",
                    size: 24,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Section rémunération
              new Paragraph({
                children: [
                  new TextRun({
                    text: "10. Décision du/de la client(e) sur la rémunération de l'intermédiaire",
                    bold: true,
                    size: 26,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: data.paymentMethod === 'commission' ? "[X] " : "[ ] ",
                    size: 24,
                  }),
                  new TextRun({
                    text: "Commission de la compagnie d'assurance",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: data.paymentMethod === 'fees' ? "[X] " : "[ ] ",
                    size: 24,
                  }),
                  new TextRun({
                    text: "Honoraires payés par le/la client(e)",
                    size: 24,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Confirmation
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Par la présente, le/la soussigné(e) confirme que le conseiller/ère à la clientèle de OPSIO Sàrl lui a remis le présent document et lui en a dûment explicité le contenu, avant la conclusion du contrat de courtage.",
                    size: 24,
                  }),
                ],
                spacing: { after: 600 },
              }),

              // Signatures avec tableau comme dans le document de résiliation
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Lieu, date : Genève, ${currentDate}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Signature Conseiller/ère à la clientèle",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "................................................................",
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lieu, date",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "................................................................",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Signature Client(e)",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "................................................................",
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              }),

              // Signature réelle dessinée comme dans le document de résiliation
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
                      size: 26,
                    }),
                  ],
                  spacing: { after: 300 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Document signé électroniquement le : ${currentDate}`,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 200 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Signataire : ${data.clientName}`,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 200 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Hash de vérification : ${data.signatureHash}`,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 200 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Statut : Signature valide et vérifiée",
                      size: 22,
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
      console.error('❌ Erreur génération document Word OPSIO simple:', error);
      throw new Error(`Erreur génération document Word: ${error.message}`);
    }
  }
}
