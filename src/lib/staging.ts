export const STAGING_VERIFICATION_REF = "bookstore-staging-verification";

export function isStagingVerificationBuild(): boolean {
  return process.env.VERCEL_GIT_COMMIT_REF === STAGING_VERIFICATION_REF;
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}
