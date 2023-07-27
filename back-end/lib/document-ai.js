const { cloudStorageEncodedFileProvider } = require('./file-processor');

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_PROJECT_LOCATION; // Format is 'us' or 'eu'
const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID; // Create processor in Cloud Console

// The full resource name of the processor, e.g.:
// projects/project-id/locations/location/processor/processor-id
// You must create new processors in the Cloud Console first
const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;


const {DocumentProcessorServiceClient} =
  require('@google-cloud/documentai').v1;

// Instantiates a client
// apiEndpoint regions available: eu-documentai.googleapis.com, us-documentai.googleapis.com (Required if using eu based processor)
// const client = new DocumentProcessorServiceClient({apiEndpoint: 'eu-documentai.googleapis.com'});
const client = new DocumentProcessorServiceClient({apiEndpoint: 'us-documentai.googleapis.com'});
// console.log(client);
async function analyzeFileByDocumentAI(userID, fileName, contentType) {
  const encodedImage = await cloudStorageEncodedFileProvider(userID, fileName);

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: contentType,
    },
  };
  //console.log(request);
  // Recognizes text entities in the PDF document
  let result;
  try {
    [result] = await client.processDocument(request);
  } catch (error) {
    console.log(error);
    throw new Error("Error in processDocument() in analyzeFileByDocumentAI()!");
  }
  const {document} = result;
  // console.log(document);

  // Get all of the document text as one big string
  const {entities} = document;

  return {entities, selectedEntities: extractEntities(entities)};
}

const matchEntityTypes = ['AMOUNT', 'CALORIES', 'CARBOHYDRATE', 'FAT', 'PROTEIN', 'SODIUM'];
const lineItemEntityTypes = ['description', 'amount', 'quantity', 'unit_price'];
const numberEntityTypes = ['net_amount', 'total_tax_amount', 'total_amount', 'amount', 'quantity', 'unit_price'];
const priceEntityTypes = ['net_amount', 'total_tax_amount', 'total_amount', 'amount', 'unit_price'];

function extractEntities(entities) {
  let selectedEntities = {};
  for (const entity of entities) {
      const type = entity.type;
      if (! matchEntityTypes.includes(type)) {
        continue;
      }
      selectedEntities[type] = entity.mentionText || entity.normalizedValue.text;
  }

  return selectedEntities;
}

module.exports = {analyzeFileByDocumentAI, matchEntityTypes, lineItemEntityTypes, numberEntityTypes, priceEntityTypes};

