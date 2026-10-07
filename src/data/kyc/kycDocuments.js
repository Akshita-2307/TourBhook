export const kycDocumentDefinitions = [
  {
    key: "panCard",
    label: "PAN Card",
    fileName: "PAN_Card.pdf",
    fileUrl: "/mock-documents/pan-card.pdf",
    previewUrl: "/mock-documents/pan-card-preview.png",
    documentNumber: "ABCDE1234F",
    issuedBy: "Income Tax Department",
  },
  {
    key: "aadhaarCard",
    label: "Aadhaar Card",
    fileName: "Aadhaar_Card.pdf",
    fileUrl: "/mock-documents/aadhaar-card.pdf",
    previewUrl: "/mock-documents/aadhaar-card-preview.png",
    documentNumber: "XXXX XXXX 1234",
    issuedBy: "Government of India",
  },
];

export const createDocumentSet = (submittedKeys) =>
  Object.fromEntries(
    kycDocumentDefinitions.map((document) => [
      document.key,
      {
        ...document,
        submitted: submittedKeys.includes(document.key),
        fileUrl: submittedKeys.includes(document.key) ? document.fileUrl : null,
        previewUrl: submittedKeys.includes(document.key) ? document.previewUrl : null,
      },
    ]),
  );
