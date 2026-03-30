import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "short.hasankurt.com — URL Shortener",
  description:
    "Serverless URL shortener built on AWS Lambda, API Gateway, DynamoDB, and CloudFront.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}