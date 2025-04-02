import { useGetAccount, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import { useState } from "react";
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
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useInteraction } from "@/utils/Interaction";
import { contracts } from "@/utils/config";
import { Address, AddressValue } from "@multiversx/sdk-core/out";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type RemoveBoardMemberProps = {
  addresses: Address[];
};

export const RemoveBoardMember = ({ addresses }: RemoveBoardMemberProps) => {
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [proposalAddressSelect, setProposalAddressSelect] = useState(
    (addresses && addresses[0]?.bech32()) ?? new Address("").bech32()
  );
  const { callMethod } = useInteraction();

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleRemoveBoardMember = async (address: string) => {
    await callMethod({
      contract: contracts.DAO,
      method: "proposeRemoveUser",
      args: [new AddressValue(new Address(address))],
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
          <DialogTitle className="pt-6">Remove Board Member</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col w-full gap-2">
          <Label htmlFor="address" className="pl-1 text-gray-700">
            Address
          </Label>
          <Select onValueChange={setProposalAddressSelect}>
            <SelectTrigger>
              <SelectValue placeholder={proposalAddressSelect} />
            </SelectTrigger>
            <SelectContent>
              {addresses &&
                addresses.map((address) => {
                  return (
                    <SelectItem key={address.bech32()} value={address.bech32()}>
                      {address.bech32()}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
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
            onClick={() => handleRemoveBoardMember(proposalAddressSelect)}
            type="submit">
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
