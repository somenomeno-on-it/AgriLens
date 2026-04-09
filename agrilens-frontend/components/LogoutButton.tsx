"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/auth";

type LogoutButtonProps = {
  variant?: "default" | "outline" | "destructive";
  className?: string;
};

export default function LogoutButton({
  variant = "outline",
  className,
}: LogoutButtonProps) {
  const router = useRouter();

  const onLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  return (
    <Button type="button" variant={variant} className={className} onClick={onLogout}>
      Logout
    </Button>
  );
}
