import { useInteraction } from "@/utils/Interaction";
import { contracts, ONE } from "@/utils/config";
import { formatNumber } from "@/utils/functions";
import { Vote } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { U64Value } from "@multiversx/sdk-core/out";
import { useGetAccountInfo, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import BigNumber from "bignumber.js";
import { ChevronUp } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useEffect, useState } from "react";

export const VoteUpModal = (props: any) => {
  const { address } = useGetAccountInfo();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const { proposalId, oneTokenAmount } = props;
  const { callMethod } = useInteraction();
  const [showModal, setShowModal] = useState<boolean>(false);

  const validationSchema = z.object({
    amount: z
      .string()
      .min(1, "Amount is required")
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val > 0, "Amount must be a valid number greater than 0")
      .refine((val) => {
        const maxAmount = BigNumber(oneTokenAmount)
          .dividedBy(10 ** 18)
          .toNumber();
        return val <= maxAmount;
      }, "Amount exceeds your available balance"),
  });

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (hasPendingTransactions) {
      handleCloseModal();
    }
  }, [hasPendingTransactions]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Vote>({
    defaultValues: {
      token: ONE,
      amount: 0,
    },
    mode: "onChange",
    resolver: zodResolver(validationSchema),
  });

  const submitUpvote = async (data: Vote) => {
    if (data.amount > 0) {
      await callMethod({
        contract: contracts.DAO,
        method: "upvote",
        args: [new U64Value(BigNumber(proposalId).toNumber())],
        fts: [
          {
            token: ONE,
            amount: Number(data.amount),
            decimals: 18,
          },
        ],
      });
      reset();
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogTrigger className="flex-1" asChild>
        <Button
          variant="default"
          disabled={!address}
          className="flex w-full bg-[#00394F] hover:bg-[#00394F]/90 text-base text-white px-1">
          Vote Up
          <ChevronUp className="!h-5 !w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[40rem] bg-white !z-50"
        onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="p-3 border w-12 h-12 rounded-xl flex justify-center items-center shadow">
            <ChevronUp className="!w-6 !h-6" />
          </div>
          <DialogTitle className="pt-6">Vote up</DialogTitle>
          <DialogDescription>
            Vote up for proposal {BigNumber(proposalId).toNumber() + 1}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitUpvote)}>
          <div className="flex gap-2">
            <div className="flex flex-col w-full gap-2 pt-2">
              <Label htmlFor="token" className="pl-1 text-gray-700">
                Token
              </Label>
              <Input
                type="text"
                id="token"
                disabled
                value={ONE}
                className="shadow"
                {...register("token")}
              />
            </div>
            <div className="flex flex-col w-full gap-2 pt-2">
              <Label htmlFor="amount" className="flex justify-between pl-1 text-gray-700">
                Amount
                <div>
                  Max:{" "}
                  {formatNumber(
                    BigNumber(oneTokenAmount)
                      .dividedBy(10 ** 18)
                      .toNumber(),
                    0
                  )}{" "}
                  ONE
                </div>
              </Label>
              <Input
                type="number"
                id="amount"
                placeholder="$$$"
                className="shadow"
                {...register("amount")}
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
            </div>
          </div>
          <DialogFooter className="w-full pt-8 flex items-center !justify-center">
            <DialogPrimitive.Close asChild>
              <Button variant="outline" className="w-3/6" type="button" onClick={() => reset()}>
                Cancel
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant="outline"
              disabled={
                BigNumber(oneTokenAmount)
                  .dividedBy(10 ** 18)
                  .toNumber() < 1
              }
              className="bg-[#00394F] hover:bg-[#00394F]/90 text-white hover:text-white w-2/4 rounded-lg"
              type="submit">
              Vote Up
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
