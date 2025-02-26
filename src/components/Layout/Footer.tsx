import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/Logo.png";

export const Footer = () => {
  return (
    <footer className="bg-[#1C2024] text-white py-5">
      <div className="px-4">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <img src={logo} alt="TeachFi" className="h-8" />

          {/* Newsletter */}
          {/* <div className="flex gap-2 w-full max-w-sm">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-transparent border-gray-700"
            />
            <Button className="bg-[#00394F] hover:bg-[#00394F]/90">Subscribe</Button>
          </div> */}

          {/* Copyright */}
          <div className="text-sm text-gray-400">© 2024 TeachFi. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};
