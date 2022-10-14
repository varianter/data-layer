# Data layer

Used for fetching and collecting different data.

## APIs

- Employees

## Test run

Start with

```
yarn vercel dev
```

## Configuration

To integrate with CV Partner for fetching employees and Blob Storage to cache/store CV photos you can set that by creating a `.env.local` file based on the [`.env.example` file](./env.example).

```
# Set to integrate with CV Partner
CV_PARTNER_API_SECRET=<API_KEY>

# Blob Storage settings for storing cached CV images
AZURE_STORAGE_ACCOUNT_ACCESS_KEY=<ACCESS_KEY>
AZURE_STORAGE_ACCOUNT_NAME=variantno

# Connect to Bemanning to get start/end date for consultants
BEMANNING_CONNECTION_STRING=<connection_string>
```
