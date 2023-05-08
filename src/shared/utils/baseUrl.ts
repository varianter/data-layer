export const getBaseUrl = (): string => process.env.NODE_ENV === "development"
    ? `http://${process.env.VERCEL_URL}`
    : `https://${process.env.VERCEL_URL}`

