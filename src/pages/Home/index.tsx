import { AddProposalModal } from "@/components/Home/AddProposalModal";
import { CountdownTimer } from "@/components/Home/CountdownTimer";
import { VoteDownModal } from "@/components/Home/VoteDownModal";
import { VoteUpModal } from "@/components/Home/VoteUpModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contracts, ElrondGatewayUrl, GOUVERNANCE_TOKEN } from "@/utils/config";
import { formatAddress, formatNumber, getWalletToken } from "@/utils/functions";
import { useInteraction } from "@/utils/Interaction";
import { Proposal } from "@/utils/types";
import { Address, AddressValue, U64Value } from "@multiversx/sdk-core/out";
import { useGetAccountInfo, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import axios from "axios";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
  const { address } = useGetAccountInfo();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const { viewMethod, callMethod } = useInteraction();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("viewAll");
  const [proposalTypeSelect, setProposalTypeSelect] = useState("New Launchpad");
  const [votingPeriod, setVotingPeriod] = useState<number>(0);
  const [countdownPasses, setCountdownPassed] = useState<boolean>(false);
  const [decimalsMap, setDecimalsMap] = useState(new Map<string, number>());
  const [votingTokens, setVotingTokens] = useState<string[]>([]);
  const [redeemableProposals, setRedeemableProposals] = useState<number[]>([]);
  const navigate = useNavigate();
  // console.log(proposals);

  const getResponseGate = async (token: string) => {
    if (decimalsMap.has(token)) {
      return;
    }
    try {
      const test = Buffer.from(token).toString("hex");

      const url = `${ElrondGatewayUrl}/vm-values/query`;
      const response = await axios.post(url, {
        "scAddress": "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
        "funcName": "getTokenProperties",
        "args": [test],
      });

      if (!response.data?.data?.data?.returnData[5]) {
        throw new Error("invalid token");
      }
      const data1 = await JSON.stringify(response.data.data.data.returnData[5]);
      const decimals = Number(Buffer.from(data1, "base64").toString().split("-")[1]);
      setDecimalsMap((prev) => new Map(prev).set(token, decimals));
    } catch (e) {
      throw e;
    }
  };

  // const getWalletToken = () => {
  //   const url = `${ElrondGatewayUrl}/address/${address}/esdt/${GOUVERNANCE_TOKEN}`;
  //   axios.get(url).then((res) => {
  //     setTokenAmount(res.data.data.tokenData.balance);
  //   });
  // };

  const getVotiongPeriod = async () => {
    const period = await viewMethod({
      contract: contracts.DAO,
      method: "getVotingPeriod",
      args: [],
    }).catch((err) => {
      console.log(err);
    });
    setVotingPeriod(period);
  };

  const getVotiongTokens = async () => {
    const tokens = await viewMethod({
      contract: contracts.DAO,
      method: "getVotingTokens",
      args: [],
    }).catch((err) => {
      console.log(err);
    });
    setVotingTokens(tokens);
  };

  const getFranchise = async () => {
    const proposalTypeToNumber = proposalTypeSelect === "New Launchpad" ? 1 : 2;
    const franchise = await viewMethod({
      contract: contracts.DAO,
      method: "getProposals",
      args: [new U64Value(0), new U64Value(20), new U64Value(proposalTypeToNumber)],
    }).catch((err) => {
      console.log(err);
    });
    // console.log(franchise);

    setProposals(franchise);
  };

  const redeemTokens = async (proposalId: number) => {
    try {
      await callMethod({
        contract: contracts.DAO,
        method: "redeem",
        args: [new U64Value(proposalId)],
      });

      setRedeemableProposals((prev) => prev.filter((id) => id !== proposalId));
    } catch (error) {
      console.error("Error redeeming tokens:", error);
    }
  };

  const executeProposal = async (proposalId: number) => {
    await callMethod({
      contract: contracts.DAO,
      method: "execute",
      args: [new U64Value(proposalId)],
    });
  };

  const getRedeemableProposal = async () => {
    const proposals = await viewMethod({
      contract: contracts.DAO,
      method: "getRedeemableProposalIDs",
      args: [new AddressValue(new Address(address))],
    }).catch((err) => {
      console.log(err);
    });
    // Convert BigNumber objects to numbers for easier comparison
    if (proposals && Array.isArray(proposals)) {
      const proposalNumbers = proposals.map((id) => BigNumber(id).toNumber());
      setRedeemableProposals(proposalNumbers);
    } else {
      setRedeemableProposals([]);
    }
  };

  useEffect(() => {
    getFranchise();
    if (address) {
      const fetchTokenBalance = async () => {
        const tokenTotal = await getWalletToken(address, GOUVERNANCE_TOKEN);
        setTokenAmount(tokenTotal);
      };
      fetchTokenBalance();
      getVotiongPeriod();
      getRedeemableProposal();
    }
  }, [hasPendingTransactions, proposalTypeSelect]);

  useEffect(() => {
    if (countdownPasses) {
      getFranchise();
      setCountdownPassed(false);
    }
  }, [countdownPasses]);

  useEffect(() => {
    if (address) {
      getRedeemableProposal();
    }
  }, [address]);

  useEffect(() => {
    const fetchTokenInfo = async () => {
      console.log(proposals);

      for (const item of proposals) {
        await getResponseGate(Buffer.from(item.proposal_data.fields[0].payment_token).toString());
        await getResponseGate(Buffer.from(item.proposal_data.fields[0].token).toString());
      }
    };

    if (proposals && proposals.length > 0) {
      fetchTokenInfo();

      getVotiongTokens();
    }
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    if (activeTab === "viewAll") return proposals;
    return proposals.filter(
      (proposal) => proposal.status.name.toLowerCase() === activeTab.toLowerCase()
    );
  }, [proposals, activeTab]);
  console.log(filteredProposals);

  return (
    <div className="flex flex-col w-full pt-40 md:px-10 px-5">
      <div className="flex flex-col gap-6">
        <h1 className="text-5xl font-semibold">DAO Proposals</h1>
        <h4 className="text-xl font-normal text-zinc-500">
          Empowering our community to shape the future of financial education through innovative,
          decentralized governance.
        </h4>
      </div>
      <div className="h-32"></div>
      <div className="md:flex hidden flex-row  justify-between">
        <Tabs defaultValue="viewAll" className="w-[600px]" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="viewAll">View all</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="defeated">Defeated</TabsTrigger>
            <TabsTrigger value="succeeded">Succeeded</TabsTrigger>
            <TabsTrigger value="executed">Executed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select onValueChange={setProposalTypeSelect}>
            <SelectTrigger>
              <SelectValue placeholder={proposalTypeSelect} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New Launchpad">New Launchpad</SelectItem>
              <SelectItem value="New Transfer">New Transfer</SelectItem>
            </SelectContent>
          </Select>
          <AddProposalModal votingPeriod={votingPeriod} decimalsMap={decimalsMap} />
        </div>
      </div>

      <div className="flex md:hidden flex-col justify-between w-full gap-2">
        <Select onValueChange={setActiveTab}>
          <SelectTrigger>
            <SelectValue placeholder={activeTab} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewAll">View all</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="defeated">Defeated</SelectItem>
            <SelectItem value="succeeded">Succeeded</SelectItem>
            <SelectItem value="executed">Executed</SelectItem>
          </SelectContent>
        </Select>
        <AddProposalModal votingPeriod={votingPeriod} />
      </div>
      <div className="flex justify-center items-center py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {filteredProposals &&
            filteredProposals.map((token) => {
              return (
                <div
                  key={BigNumber(token.id).toNumber()}
                  className="relative rounded-xl p-6 border border-gray-200 bg-gray-50 shadow-sm flex flex-col max-w-[24rem] h-[40rem]">
                  <div className="flex flex-col items-start justify-between pb-4 gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center gap-2">
                        <h3 className="font-semibold text-[1.5rem] text-gray-900">
                          Proposal {BigNumber(token.id).toNumber() + 1}
                        </h3>
                        <span className="text-gray-900/40 font-medium md:text-base text-sm">
                          {Buffer.from(token.proposal_data.fields[0].token).toString()}
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`px-2 py-0.5 rounded-full text-xs font-medium hover:cursor-default gap-2 ${
                        token.status.name === "Active"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : token.status.name === "Succeeded"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : token.status.name === "Executed"
                              ? "bg-sky-100 text-sky-600 hover:bg-sky-100"
                              : token.status.name === "Defeated"
                                ? "bg-red-100 text-red-700 hover:bg-red-100"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-200"
                      }`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          token.status.name === "Active" || token.status.name === "Succeeded"
                            ? "bg-emerald-500"
                            : token.status.name === "Executed"
                              ? "bg-sky-500"
                              : token.status.name === "Defeated"
                                ? "bg-rose-500"
                                : "bg-gray-500"
                        } `}></span>
                      {token.status.name === "Active"
                        ? "Active"
                        : token.status.name === "Succeeded"
                          ? "Succeeded"
                          : token.status.name === "Executed"
                            ? "Executed"
                            : token.status.name === "Defeated"
                              ? "Defeated"
                              : "Pending"}
                    </Badge>
                  </div>

                  <p className="text-base font-normal text-gray-600 h-[4.5rem] line-clamp-3">
                    {Buffer.from(token.title, "base64").toString("utf8")}
                  </p>

                  <div className="flex flex-col gap-1 pt-5">
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Proposer
                      <p className="text-stone-500 font-normal">
                        {formatAddress(token.proposer.bech32(), 6)}{" "}
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      KYC
                      <p className="text-stone-500 font-normal">
                        {(() => {
                          const bytes = token.proposal_data.fields[0].kyc_enforced;
                          return bytes ? "Yes" : "No";
                        })()}
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Price
                      <p className="text-stone-500 font-normal">
                        {BigNumber(token.proposal_data.fields[0].price.toString())
                          .dividedBy(
                            10 **
                              (decimalsMap.get(token.proposal_data.fields[0].payment_token) || 0)
                          )
                          .toNumber() +
                          " " +
                          token.proposal_data.fields[0].payment_token.split("-")[0]}{" "}
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Min Buy
                      <p className="text-stone-500 font-normal">
                        {BigNumber(token.proposal_data.fields[0].min_buy_amount)
                          .dividedBy(
                            10 ** (decimalsMap.get(token.proposal_data.fields[0].token) || 18)
                          )
                          .toNumber() +
                          " " +
                          token.proposal_data.fields[0].token.split("-")[0]}{" "}
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Max Buy
                      <p className="text-stone-500 font-normal">
                        {BigNumber(token.proposal_data.fields[0].max_buy_amount)
                          .dividedBy(
                            10 **
                              (decimalsMap.get(token.proposal_data.fields[0].payment_token) || 18)
                          )
                          .toNumber() +
                          " " +
                          token.proposal_data.fields[0].payment_token.split("-")[0]}{" "}
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Start time
                      <p className="text-stone-500 font-normal">
                        {new Date(
                          BigNumber(token.proposal_data.fields[0].start_time).toNumber() * 1000
                        ).toLocaleDateString()}
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      End time
                      <p className="text-stone-500 font-normal">
                        {new Date(
                          BigNumber(token.proposal_data.fields[0].end_time).toNumber() * 1000
                        ).toLocaleDateString()}
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Vote period
                      <p className="text-stone-500 font-normal">
                        <CountdownTimer
                          startDate={Math.floor(new Date().getTime() / 1000)}
                          endDate={BigNumber(token.creation_timestamp)
                            .plus(votingPeriod)
                            .toNumber()}
                          setCountdownPassed={setCountdownPassed}
                        />
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Up votes
                      <p className="text-stone-500 font-normal">
                        {(() => {
                          const percentage =
                            (BigNumber(token.num_upvotes).toNumber() /
                              (BigNumber(token.num_downvotes).toNumber() +
                                BigNumber(token.num_upvotes).toNumber())) *
                            100;
                          return isNaN(percentage)
                            ? "0"
                            : formatNumber(BigNumber(percentage).toNumber(), 2);
                        })()}{" "}
                        %
                      </p>
                    </span>
                    <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                      Down votes
                      <p className="text-stone-500 font-normal">
                        {(() => {
                          const percentage =
                            (BigNumber(token.num_downvotes).toNumber() /
                              (BigNumber(token.num_downvotes).toNumber() +
                                BigNumber(token.num_upvotes).toNumber())) *
                            100;
                          return isNaN(percentage)
                            ? "0"
                            : formatNumber(BigNumber(percentage).toNumber(), 2);
                        })()}{" "}
                        %
                      </p>
                    </span>
                  </div>

                  <div className="flex gap-3 mt-auto justify-center">
                    {!address ? (
                      <Button
                        size="sm"
                        onClick={() => navigate("/unlock")}
                        className="!w-full !border-0 !m-0 bg-[#00394F] hover:bg-[#00394F]/90 text-white font-semibold py-2">
                        Connect Wallet
                      </Button>
                    ) : (
                      <>
                        {token.status.name === "Active" ? (
                          <>
                            <VoteUpModal
                              proposalId={token.id}
                              oneTokenAmount={tokenAmount}
                              votingTokens={votingTokens}
                            />
                            <VoteDownModal
                              proposalId={token.id}
                              oneTokenAmount={tokenAmount}
                              votingTokens={votingTokens}
                            />
                          </>
                        ) : token.status.name === "Succeeded" ? (
                          <div className="flex md:flex-row flex-col w-full justify-center gap-2 items-center">
                            <Button
                              variant="outline"
                              className="md:w-3/6 w-full border-2 border-[#00394F]"
                              onClick={() => redeemTokens(BigNumber(token.id).toNumber())}
                              disabled={
                                !redeemableProposals.includes(BigNumber(token.id).toNumber())
                              }
                              type="button">
                              Redeem
                            </Button>
                            <Button
                              className="md:w-3/6 w-full bg-[#00394F] hover:bg-[#00394F]/90"
                              type="button"
                              onClick={() => executeProposal(BigNumber(token.id).toNumber())}>
                              Execute
                            </Button>
                          </div>
                        ) : token.status.name === "Defeated" || token.status.name === "Executed" ? (
                          <>
                            <Button
                              variant="outline"
                              className="w-3/6 border-2 border-[#00394F]"
                              onClick={() => redeemTokens(BigNumber(token.id).toNumber())}
                              disabled={
                                !redeemableProposals.includes(BigNumber(token.id).toNumber())
                              }
                              type="button">
                              Redeem
                            </Button>
                            <Button
                              className="w-3/6 bg-[#00394F] hover:bg-[#00394F]/90"
                              disabled
                              type="button">
                              Execute
                            </Button>
                          </>
                        ) : (
                          <></>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
