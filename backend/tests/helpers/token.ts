import jwt from "jsonwebtoken";

import type {
  SignOptions,
} from "jsonwebtoken";

interface SignQaTokenOptions {
  sub: string | number;

  secret?: string;

  expiresIn?:
    SignOptions["expiresIn"];

  issuer?: string;

  audience?: string;

  tipo?: string;

  payload?:
    Record<string, unknown>;
}

export const signQaToken = (
  options: SignQaTokenOptions
) => {
  const secret =
    options.secret ??
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET no está configurado para QA"
    );
  }

  const signOptions:
    SignOptions = {
      subject:
        String(
          options.sub
        ),

      expiresIn:
        options.expiresIn ??
        "1h",

      issuer:
        options.issuer ??
        "sistemahotel",

      audience:
        options.audience ??
        "sistemahotel-web",
    };

  return jwt.sign(
    {
      tipo:
        options.tipo ??
        "access",

      ...(
        options.payload ??
        {}
      ),
    },
    secret,
    signOptions
  );
};