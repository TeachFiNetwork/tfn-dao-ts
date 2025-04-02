import { useGetAccount, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import { ChangeEventHandler, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { BadgeInfo, Plus } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { U32Value } from "@multiversx/sdk-core/out";
import { contracts } from "@/utils/config";
import { useInteraction } from "@/utils/Interaction";

export const ChangeBoardQuorum = () => {
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newBoardQuorum, setNewBoardQuorum] = useState<number>(0);
  const { callMethod } = useInteraction();

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (hasPendingTransactions) {
      handleCloseModal();
    }
  }, [hasPendingTransactions]);

  const handleChangeBoardQuorum = async (boardQuorum: number) => {
    await callMethod({
      contract: contracts.DAO,
      method: "proposeChangeBoardQuorum",
      args: [new U32Value(boardQuorum)],
    });
  };

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
          <DialogTitle className="pt-6">Change Board Quorum</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col w-full gap-2">
          <Label htmlFor="quorumMembers" className="pl-1 text-gray-700">
            Quorum members
          </Label>
          <Input
            type="number"
            id="quorumMembers"
            placeholder="Quorum members"
            className="shadow"
            onChange={(e) => setNewBoardQuorum(Number(e.target.value))}
          />
        </div>

        <DialogFooter className="w-full pt-8 gap-1 md:gap-0 flex items-center !justify-center sticky bottom-0 bg-white mt-auto">
          <DialogPrimitive.Close asChild>
            <Button
              variant="outline"
              className="w-full md:w-3/6"
              type="button"
              onClick={() => handleCloseModal}>
              Cancel
            </Button>
          </DialogPrimitive.Close>
          <Button
            variant="outline"
            className="bg-[#00394F] hover:bg-[#00394F]/90 text-white hover:text-white w-full md:w-3/6 rounded-lg"
            onClick={() => handleChangeBoardQuorum(newBoardQuorum)}
            type="submit">
            Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
