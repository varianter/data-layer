import {
  BlobServiceClient,
  ContainerClient,
  newPipeline,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import createFetch from "@vercel/fetch";
import isAfter from "date-fns/isAfter";
const fetch = createFetch();

if (
  !process.env.AZURE_STORAGE_ACCOUNT_NAME ||
  !process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY
) {
  throw new Error("Required Azure Storage environment variables not set");
}

const sharedKeyCredential = new StorageSharedKeyCredential(
  process.env.AZURE_STORAGE_ACCOUNT_NAME,
  process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY
);
const pipeline = newPipeline(sharedKeyCredential);

const blobServiceClient = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  pipeline
);

const containerName = "employees";

export default async function handleImage(employee: {
  name: string;
  imageUrl: string;
}) {
  try {
    // Check if images exsist already
    const userFileName = toFileName(employee.name);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists({
      access: "blob",
    });

    const res = await downloadAndStore(
      userFileName,
      containerClient,
      employee.imageUrl
    );
    return res;
  } catch (e) {
    console.error(`Could not get image for ${employee.name}`);
    console.error(e);
  }
}

async function downloadAndStore(
  fileName: string,
  containerClient: ContainerClient,
  imageUrl: string
) {
  const request = await fetch(imageUrl);
  const outputFileName = `${fileName}.png`;
  const blockBlobClient = containerClient.getBlockBlobClient(outputFileName);

  if (await blockBlobClient.exists()) {
    const { lastModified: lastModifiedStoredImage } =
      await blockBlobClient.getProperties();
    const lastModifiedOriginalImage = new Date(
      request.headers.get("Last-Modified") as string
    );

    if (
      lastModifiedStoredImage &&
      isAfter(lastModifiedStoredImage, lastModifiedOriginalImage)
    ) {
      return blockBlobClient.url;
    }
  }

  await blockBlobClient.uploadData(await request.arrayBuffer(), {
    blobHTTPHeaders: { blobContentType: "image/png" },
  });

  return blockBlobClient.url;
}

function toFileName(name: string) {
  // Could be unstable when string is large
  const baseString = name.trimStart().replace(" ", "-");
  let hash = 0,
    i,
    chr;
  for (i = 0; i < baseString.length; i++) {
    chr = baseString.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}
