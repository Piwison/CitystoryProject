import Link from "next/link";
import { cn } from "@/lib/utils";

type User = { isModerator?: boolean } | null;

const Navbar = () => {
  const user: User = null; // Replace with actual user data
  const pathname: string = "/"; // Replace with actual pathname

  return (
    <div className="flex items-center space-x-4">
      {user?.isModerator && (
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