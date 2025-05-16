import Link from "next/link";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const user = null; // Replace with actual user data
  const pathname = "/"; // Replace with actual pathname

  return (
    <div className="flex items-center space-x-4">
      {user?.is_moderator && (
        <Link
          href="/moderation"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/moderation"
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          Moderation
        </Link>
      )}
    </div>
  );
};

export default Navbar; 