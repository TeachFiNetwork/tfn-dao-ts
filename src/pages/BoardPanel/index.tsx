import { ProposeAddMember } from "@/components/BoardPanel/ProposeAddMember";
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
  const [boardMembers, setBoardMembers] = useState<Address[]>([]);
  const [boardQuorum, setBoardQuorum] = useState<number>(0);
  const [votingTokens, setVotingTokens] = useState<string[]>([]);
  const [quorum, setQuorum] = useState<number>(0);
  const [votingPeriod, setVotingPeriod] = useState<number>(0);
  const { viewMethod } = useInteraction();
  const { hasPendingTransactions } = useGetPendingTransactions();

  const getBoardMembers = async () => {
    const boardMembers = await viewMethod({
      contract: contracts.DAO,
      method: "getBoardMembers",
      args: [],
    });
    setBoardMembers(boardMembers);
  };

  const getBoardQuorum = async () => {
    const quorum = await viewMethod({
      contract: contracts.DAO,
      method: "getBoardQuorum",
      args: [],
    });
    setBoardQuorum(quorum);
  };

  const getVotingTokens = async () => {
    const votingTokens = await viewMethod({
      contract: contracts.DAO,
      method: "getVotingTokens",
      args: [],
    });
    setVotingTokens(votingTokens);
  };

  const getQuorum = async () => {
    const quorum = await viewMethod({
      contract: contracts.DAO,
      method: "getQuorum",
      args: [],
    });
    setQuorum(quorum);
  };

  const getVotingPeriod = async () => {
    const votingPeriod = await viewMethod({
      contract: contracts.DAO,
      method: "getVotingPeriod",
      args: [],
    });
    setVotingPeriod(votingPeriod);
  };

  const formatVotingPeriod = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  useEffect(() => {
    getBoardMembers();
    getBoardQuorum();
    getVotingTokens();
    getQuorum();
    getVotingPeriod();
  }, [hasPendingTransactions]);

  console.log(votingTokens);

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
          <ProposeAddMember />
        </div>
      </div>

      <div className="flex w-full gap-3">
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-3/4">
          <h2 className="text-xl font-semibold underline">Board members</h2>
          <div>
            {boardMembers.map((member, index) => {
              return <div key={index}>{index + 1 + ". " + member.toBech32()}</div>;
            })}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/4">
          <h2 className="text-xl font-semibold underline">Voting tokens</h2>
          <div className="text-base font-medium">
            {votingTokens.map((tokens, index) => {
              return <div key={index}>{index + 1 + ". " + tokens[0]}</div>;
            })}
          </div>
        </div>
      </div>
      <div className="flex w-full gap-3">
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/3">
          <h2 className="text-xl font-semibold underline">Board quorum</h2>
          <div className="text-base font-medium">{BigNumber(boardQuorum).toNumber()}</div>
        </div>
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/3">
          <h2 className="text-xl font-semibold underline">Voting period</h2>
          <div className="text-base font-medium">
            {formatVotingPeriod(BigNumber(votingPeriod).toNumber())}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start py-3 px-3 mt-3 border border-gray-500 rounded-xl w-1/3">
          <h2 className="text-xl font-semibold underline">Quorum</h2>
          <div className="text-base font-medium">{BigNumber(quorum).toNumber()}</div>
        </div>
      </div>
    </div>
  );
};
