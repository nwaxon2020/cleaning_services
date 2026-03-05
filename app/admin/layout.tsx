import AdminClientWrapper from "@/components/auth/AdminClientWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminClientWrapper>{children}</AdminClientWrapper>;
}