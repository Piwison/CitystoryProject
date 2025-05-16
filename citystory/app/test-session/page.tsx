"use client";
import { useSession } from "next-auth/react";

export default function TestSession() {
  const { data, status } = useSession();
  return (
    <div style={{ padding: 32 }}>
      <h1>Session Test</h1>
      <pre>Status: {status}</pre>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
} 