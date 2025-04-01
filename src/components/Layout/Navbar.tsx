import { Button } from "@/components/ui/button";
import logo from "@/assets/Logo.png";
import { useNavigate } from "react-router-dom";
import { useGetAccountInfo, useGetIsLoggedIn } from "@multiversx/sdk-dapp/hooks";
import { logout } from "@multiversx/sdk-dapp/utils";
import { WalletMinimal } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import React from "react";
import { cn } from "@/lib/utils";

const applicationItems = [
  {
    title: "Launchpad",
    description: "The latest industry new and guides curated by our expert team.",
    icon: "📱",
  },
  {
    title: "DAO",
    description: "Learn how our customers are using Untitled UI to 10x their growth.",
    icon: "⭐",
  },
  {
    title: "DEX",
    description: "Get up and running on our newest features and in-depth guides.",
    icon: "▶️",
  },
  {
    title: "NFT Marketplace",
    description: "In-depth articles on our tools and technologies to empower teams.",
    icon: "🎨",
  },
  {
    title: "Educational Platform",
    description: "In-depth articles on our tools and technologies to empower teams.",
    icon: "📚",
  },
];

export const Navbar = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccountInfo();
  const navigate = useNavigate();

  const disconnectWallet = () => {
    logout("/").then(() => window.location.reload());
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="md:px-10 px-5 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src={logo} alt="TeachFi" />
          </a>
          <Button className="" onClick={() => navigate("/boardPanel")} variant="ghost">
            Board Panel
          </Button>
          {isLoggedIn ? (
            <div className="flex gap-2">
              <div className="sm:flex hidden items-center gap-1">
                <WalletMinimal className="w-4 h-4" />
                <p>
                  {address && address.slice(0, 6)}...
                  {address.slice(address.length - 6, address.length)}
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  size="sm"
                  onClick={() => disconnectWallet()}
                  className="!w-full !border-0 !m-0 bg-[#00394F] hover:bg-[#00394F]/90 text-white font-semibold py-2">
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                size="sm"
                onClick={() => navigate("/unlock")}
                className="!w-full !border-0 !m-0 bg-[#00394F] hover:bg-[#00394F]/90 text-white font-semibold py-2">
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const ListItem = React.forwardRef<React.ElementRef<"a">, React.ComponentPropsWithoutRef<"a">>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <ul>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}>
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </ul>
    );
  }
);
ListItem.displayName = "ListItem";
