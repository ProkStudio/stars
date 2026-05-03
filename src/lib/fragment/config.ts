export type FragmentMode = "partner_api" | "direct_wallet" | "disabled";

export function getFragmentMode(): FragmentMode {
  const m = process.env.FRAGMENT_MODE as FragmentMode | undefined;
  if (m === "partner_api" || m === "direct_wallet" || m === "disabled") {
    return m;
  }
  return "disabled";
}

export function defaultPartnerBaseUrl(): string {
  return (
    process.env.FRAGMENT_API_BASE_URL?.replace(/\/$/, "") ||
    "https://v1.fragmentapi.com/api/v1/partner"
  );
}
