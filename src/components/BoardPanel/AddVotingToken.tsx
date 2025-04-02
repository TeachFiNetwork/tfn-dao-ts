import { useGetAccount, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import { useEffect, useState } from "react";
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
import { useInteraction } from "@/utils/Interaction";
import { contracts } from "@/utils/config";
import { BigUIntValue, TokenIdentifierValue } from "@multiversx/sdk-core/out";

export const AddVotingToken = () => {
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [tokenIdentifier, setTokenIdentifier] = useState<string>("");
  const [weight, setWeight] = useState<number>(0);
  const { callMethod } = useInteraction();

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (hasPendingTransactions) {
      handleCloseModal();
    }
  }, [hasPendingTransactions]);

  const handleAddVotingToken = async (tokenIdentifier: string, weight: number) => {
    await callMethod({
      contract: contracts.DAO,
      method: "proposeAddVotingToken",
      args: [new TokenIdentifierValue(tokenIdentifier), new BigUIntValue(weight)],
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
          <DialogTitle className="pt-6">Add new voting token</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <div className="flex flex-col w-full gap-2">
            <Label htmlFor="tokenIdentifier" className="pl-1 text-gray-700">
              Token Identifier
            </Label>
            <Input
              type="text"
              id="tokenIdentifier"
              placeholder="Token identifier"
              className="shadow"
              onChange={(e) => setTokenIdentifier(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-full gap-2">
            <Label htmlFor="weight" className="pl-1 text-gray-700">
              Weight
            </Label>
            <Input
              type="number"
              id="weight"
              placeholder="Weight"
              className="shadow"
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </div>
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
            onClick={() => handleAddVotingToken(tokenIdentifier, weight)}
            type="submit">
            Add token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
