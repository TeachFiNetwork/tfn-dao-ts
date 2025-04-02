import { AddVotingToken } from "@/components/BoardPanel/AddVotingToken";
import { ChangeBoardQuorum } from "@/components/BoardPanel/ChangeBoardQuorum";
import { ProposeAddMember } from "@/components/BoardPanel/ProposeAddMember";
import { RemoveBoardMember } from "@/components/BoardPanel/RemoveBoardMember";
import { RemoveVotingToken } from "@/components/BoardPanel/RemoveVotingToken";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contracts } from "@/utils/config";
import { useInteraction } from "@/utils/Interaction";
import { Address } from "@multiversx/sdk-core/out";
import { useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";

export const BoardPanel = () => {
  const [proposalTypeSelect, setProposalTypeSelect] = useState("Propose add board member");
  const [contractInfo, setContractInfo] = useState<any>({});
  const { viewMethod } = useInteraction();
  const { hasPendingTransactions } = useGetPendingTransactions();

  const formatVotingPeriod = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getContractInfo = async () => {
    const contractInfo = await viewMethod({
      contract: contracts.DAO,
      method: "getContractInfo",
      args: [],
    });
    setContractInfo(contractInfo);
  };

  useEffect(() => {
    getContractInfo();
  }, [hasPendingTransactions]);

  console.log(contractInfo);

  return (
    <div className="flex flex-col h-[70dvh] pt-20 w-full md:px-10 px-5">
      <div className="flex flex-col gap-6">
        <h1 className="text-5xl font-semibold">DAO Proposals</h1>
        <h4 className="text-xl font-normal text-zinc-500">
          Empowering our community to shape the future of financial education through innovative,
          decentralized governance.
        </h4>
      </div>
      <div className="h-32"></div>
      <div className="md:flex hidden flex-row justify-end">
        <div className="flex gap-2">
          <Select onValueChange={setProposalTypeSelect}>
            <SelectTrigger>
              <SelectValue placeholder={proposalTypeSelect} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Propose add board member">Propose add board member</SelectItem>
              <SelectItem value="Propose remove board member">
                Propose remove board member
              </SelectItem>
              <SelectItem value="Propose change board quorum">
                Propose change board quorum
              </SelectItem>
              <SelectItem value="Propose add voting token">Propose add voting token</SelectItem>
              <SelectItem value="Propose remove voting token">
                Propose remove voting token
              </SelectItem>
              <SelectItem value="Propose change voting quorum">
                Propose change voting quorum
              </SelectItem>
              <SelectItem value="Propose change voting period">
                Propose change voting period
              </SelectItem>
              <SelectItem value="Propose upgrade franchise">Propose upgrade franchise</SelectItem>
            </SelectContent>
          </Select>
          <RemoveVotingToken tokenIdentifier={contractInfo.voting_tokens} />
        </div>
      </div>

      <div className="flex w-full gap-3">
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-3/4">
          <h2 className="text-xl font-semibold underline">Board members</h2>
          <div>
            {contractInfo.board_members?.map((member: any, index: number) => {
              return <div key={index}>{index + 1 + ". " + member.toBech32()}</div>;
            })}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/4">
          <h2 className="text-xl font-semibold underline">Voting tokens</h2>
          <div className="text-base font-medium">
            {contractInfo.voting_tokens?.map((token: any, index: number) => {
              return (
                <div key={index} className="flex flex-col">
                  <div>{index + 1 + ". " + token}</div>
                  <div>
                    Vote weight:{" "}
                    {BigNumber(contractInfo.voting_token_weights[index])
                      .dividedBy(10 ** 18)
                      .toNumber()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex w-full gap-3">
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/3">
          <h2 className="text-xl font-semibold underline">Board quorum</h2>
          <div className="text-base font-medium">
            {contractInfo.board_quorum ? BigNumber(contractInfo.board_quorum).toNumber() : 0}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/3">
          <h2 className="text-xl font-semibold underline">Voting period</h2>
          <div className="text-base font-medium">
            {contractInfo.voting_period
              ? formatVotingPeriod(BigNumber(contractInfo.voting_period).toNumber())
              : "0d 0h 0m"}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/3">
          <h2 className="text-xl font-semibold underline">Quorum</h2>
          <div className="text-base font-medium">
            {contractInfo.quorum ? BigNumber(contractInfo.quorum).toNumber() : 0}
          </div>
        </div>
      </div>
    </div>
  );
};
