import type { NextApiRequest, NextApiResponse } from "next";

/** Response body for the test API route. */
type TestResponse = {
  /** Static confirmation message. */
  message: string;
  /** ISO timestamp of when the request was handled. */
  timestamp: string;
};

/** Test Pages Router API route for external apps to verify connectivity. */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  res.status(200).json({
    message: "Hello from arsenal test API route!",
    timestamp: new Date().toISOString(),
  });
}
