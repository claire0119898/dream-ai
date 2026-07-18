"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useReportWebVitals } from "next/web-vitals";

declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

const reportWebVital: Parameters<typeof useReportWebVitals>[0] = (metric) => {
  window.gtag?.("event", metric.name, {
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    metric_rating: metric.rating,
    non_interaction: true,
  });
};

export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    if (!ready) return;
    window.gtag?.("config", measurementId, {
      page_path: pathname,
      anonymize_ip: true,
    });
  }, [measurementId, pathname, ready]);

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
      onReady={() => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer.push(args));
        window.gtag("js", new Date());
        setReady(true);
      }}
    />
  );
}
