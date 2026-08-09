import { OAuth2Client } from "google-auth-library";

export const verifyGoogleToken = async (idToken) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error(
        "GOOGLE_CLIENT_ID is missing from server/.env"
      );
    }

    const googleClient = new OAuth2Client(clientId);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    console.log("Google token verified successfully");
    console.log("Google user:", {
      sub: payload?.sub,
      email: payload?.email,
      name: payload?.name,
      audience: payload?.aud,
    });

    if (!payload) {
      throw new Error("Google token payload is missing");
    }

    return {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      avatar: payload.picture || "",
    };
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};