import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  UnderlineType,
  BorderStyle,
  WidthType,
  Table,
  TableRow,
  TableCell,
  SectionType,
  PageBreak,
  TabStopPosition,
  TabStopType,
  convertInchesToTwip
} from 'docx'

interface OpsioDocumentData {
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
}

export class OpsioDocxGenerator {
  /**
   * Génère un document Word (.docx) pour la feuille d'information OPSIO
   */
  static async generateOpsioDocument(data: OpsioDocumentData): Promise<Buffer> {
    try {
      const currentDate = new Date().toLocaleDateString('fr-CH')

      // Créer les paragraphes du document de manière plus simple
      const children = [
        // En-tête
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
              text: "info@opsio.ch FINMA reg. no F01468622",
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Titre principal
        new Paragraph({
          children: [
            new TextRun({
              text: "Feuille d'information du conseiller aux preneurs d'assurance",
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
              text: "selon l'art. 45 LSA",
              bold: true,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "(Loi fédérale sur la surveillance des assurances)",
              size: 20,
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
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Nom et Prénom: ${data.advisorName || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Email: ${data.advisorEmail || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Téléphone: ${data.advisorPhone || '+41 78 305 12 77'}`,
              size: 22,
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
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Nom et Prénom: ${data.clientName || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Adresse: ${data.clientAddress || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `NPA/Localité: ${data.clientPostalCity || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Date de naissance: ${data.clientBirthdate || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Email: ${data.clientEmail || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Numéro de téléphone: ${data.clientPhone || ''}`,
              size: 22,
            }),
          ],
          spacing: { after: 600 },
        }),
      ];

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440, // 1 inch in twips
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: children,
          },
        ],
      });

      // Ajouter les sections principales
      children.push(
        // Section 1
        new Paragraph({
          children: [
            new TextRun({
              text: "1. OPSIO Sàrl – Informations concernant l'identité",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Siège : OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Bureau principal : OPSIO Sàrl, Rue de Savoie 7a, 1225 Chêne-Bourg",
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Téléphone : +41 78 305 12 77 | Email : info@opsio.ch | Site : www.opsio.ch",
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

        // Section 10 - Décision sur rémunération
        new Paragraph({
          children: [
            new TextRun({
              text: "10. Décision du/de la client(e) sur la rémunération de l'intermédiaire",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 300 },
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
              text: "Par la présente, le/la soussigné(e) confirme que le conseiller/ère à la clientèle de OPSIO Sàrl lui a remis le présent document et lui en a dûment explicité le contenu, avant la conclusion du contrat de courtage.",
              size: 22,
            }),
          ],
          spacing: { after: 600 },
        }),

        // Signatures
        new Paragraph({
          children: [
            new TextRun({
              text: `Lieu, date : Genève, ${currentDate}`,
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Signature Conseiller/ère à la clientèle",
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.advisorName || '',
              size: 22,
              underline: {
                type: UnderlineType.SINGLE,
              },
            }),
          ],
          spacing: { after: 400 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Signature Client(e)",
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.clientName || '',
              size: 22,
              underline: {
                type: UnderlineType.SINGLE,
              },
            }),
          ],
          spacing: { after: 400 },
        })
      );

      // Ajouter le bloc de signature électronique si disponible
      if (data.signatureHash) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Signature Électronique Sécurisée",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 200 },
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
          })
        );
      }

      return await Packer.toBuffer(doc);

    } catch (error) {
      console.error('❌ Erreur génération document Word OPSIO:', error);
      throw new Error(`Erreur génération document Word: ${error.message}`);
    }
  }
}
