import RedirectClient from "./redirect-client";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ code: "_" }];
}

export default function RedirectPage() {
  return <RedirectClient />;
}