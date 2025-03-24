import { useInteraction } from "@/utils/Interaction";
import { contracts, GOUVERNANCE_TOKEN } from "@/utils/config";
import { formatNumber } from "@/utils/functions";
import { Vote } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { U64Value } from "@multiversx/sdk-core/out";
import { useGetAccountInfo, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import BigNumber from "bignumber.js";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export const VoteDownModal = (props: any) => {
  const { address } = useGetAccountInfo();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const { proposalId, oneTokenAmount, votingTokens } = props;
  const { callMethod } = useInteraction();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState(GOUVERNANCE_TOKEN);

  const validationSchema = z.object({
    token: z.string().min(1, "Token is required"),
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
    setValue,
    formState: { errors },
    reset,
  } = useForm<Vote>({
    defaultValues: {
      token: GOUVERNANCE_TOKEN,
      amount: 0,
    },
    mode: "onChange",
    resolver: zodResolver(validationSchema),
  });

  const submitDownvote = async (data: Vote) => {
    if (data.amount > 0) {
      await callMethod({
        contract: contracts.DAO,
        method: "downvote",
        args: [new U64Value(BigNumber(proposalId).toNumber())],
        fts: [
          {
            token: data.token,
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
      <DialogTrigger className="flex-1" asChild disabled={!address}>
        <Button
          variant="default"
          disabled={!address}
          className="flex w-full bg-[#D05229] text-white hover:text-white text-base hover:bg-[#D05229]/90 px-1">
          <ChevronDown className="!h-5 !w-5 text-[#FF7B28]" />
          Vote Down
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[40rem] bg-white"
        onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="p-3 border w-12 h-12 rounded-xl flex justify-center items-center shadow">
            <ChevronDown className="!w-6 !h-6" />
          </div>
          <DialogTitle className="pt-6">Vote down</DialogTitle>
          <DialogDescription>
            Vote down for proposal {BigNumber(proposalId).toNumber() + 1}
          </DialogDescription>
          <DialogDescription className="text-cyan-500">
            *By voting with SLEARN you will have a higher impact in the vote
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitDownvote)}>
          <div className="flex gap-2">
            <div className="flex flex-col w-full gap-2 pt-2">
              <Label htmlFor="token" className="pl-1 text-gray-700">
                Token
              </Label>
              <Select
                defaultValue={selectedToken}
                onValueChange={(value) => {
                  setSelectedToken(value);
                  setValue("token", value);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedToken} />
                </SelectTrigger>
                <SelectContent className="cursor-pointer">
                  {votingTokens &&
                    votingTokens.map((token: any) => {
                      return (
                        <SelectItem value={token[0]} key={token[0]}>
                          {token[0]}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {/* <Input
                type="text"
                id="token"
                disabled
                value={GOUVERNANCE_TOKEN}
                className="shadow"
                {...register("token")}
              /> */}
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
                  {GOUVERNANCE_TOKEN.split("-")[0]}
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
              className="bg-[#D05229] text-white hover:text-white text-base hover:bg-[#D05229]/90 w-2/4 rounded-lg"
              type="submit">
              Down Vote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
