import { useGetAccount, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BadgeInfo, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const ProposeAddMember = () => {
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (hasPendingTransactions) {
      handleCloseModal();
    }
  }, [hasPendingTransactions]);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!address} onClick={() => setShowModal(!showModal)}>
          <Plus className="text-emerald-500" />
          Proposal
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[23rem] md:max-w-[40rem] bg-white p-4 md:p-6 max-h-[90vh] md:overflow-visible overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="pb-5">
          <div className="p-3 border w-12 h-12 rounded-xl flex justify-center items-center shadow">
            <BadgeInfo className="!w-6 !h-6" />
          </div>
          <DialogTitle className="pt-6">Propose new Board Member</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col w-full gap-2">
          <Label htmlFor="address" className="pl-1 text-gray-700">
            Address
          </Label>
          <Input type="text" id="address" placeholder="Address" className="shadow" />
        </div>

        <DialogFooter className="w-full pt-8 gap-1 md:gap-0 flex items-center !justify-center sticky bottom-0 bg-white mt-auto">
          <DialogPrimitive.Close asChild>
            <Button variant="outline" className="w-full md:w-3/6" type="button">
              Cancel
            </Button>
          </DialogPrimitive.Close>
          <Button
            variant="outline"
            className="bg-[#00394F] hover:bg-[#00394F]/90 text-white hover:text-white w-full md:w-3/6 rounded-lg"
            type="submit">
            Propose
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
