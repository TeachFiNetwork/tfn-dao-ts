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
import { bytesToBN, formatAddress, formatNumber, numberToBytes } from "@/utils/functions";
import { useInteraction } from "@/utils/Interaction";
import { Proposal } from "@/utils/types";
import { U64Value } from "@multiversx/sdk-core/out";
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
  const [votingPeriod, setVotingPeriod] = useState<number>(0);
  const [responseGate, setResponseGate] = useState<number>(0);
  const [countdownPasses, setCountdownPassed] = useState<boolean>(false);
  const [decimalsMap, setDecimalsMap] = useState(new Map<string, number>());
  const navigate = useNavigate();
  console.log(proposals);

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
      // console.log(Buffer.from(data1, "base64").toString());
      const decimals = Number(Buffer.from(data1, "base64").toString().split("-")[1]);
      setDecimalsMap((prev) => new Map(prev).set(token, decimals));
    } catch (e) {
      throw e;
    }
  };

  const getWalletToken = () => {
    const url = `${ElrondGatewayUrl}/address/${address}/esdt/${GOUVERNANCE_TOKEN}`;
    axios.get(url).then((res) => {
      setTokenAmount(res.data.data.tokenData.balance);
    });
  };

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

  useEffect(() => {
    const getFranchise = async () => {
      const franchise = await viewMethod({
        contract: contracts.DAO,
        method: "getProposals",
        args: [new U64Value(0), new U64Value(20)],
      }).catch((err) => {
        console.log(err);
      });
      setProposals(franchise);
    };
    getFranchise();
    if (address) {
      getWalletToken();
      getVotiongPeriod();
    }
    if (countdownPasses) {
      getFranchise();
      setCountdownPassed(false);
    }
  }, [hasPendingTransactions, countdownPasses]);

  useEffect(() => {
    const fetchTokenInfo = async () => {
      for (const item of proposals) {
        if (
          Buffer.from(item.action.arguments[3]).toString() === "c" ||
          Buffer.from(item.action.arguments[4]).toString() === "d"
        ) {
          continue;
        }
        await getResponseGate(Buffer.from(item.action.arguments[4]).toString());
        await getResponseGate(Buffer.from(item.action.arguments[3]).toString());
      }
    };

    if (proposals.length > 0) {
      fetchTokenInfo();
    }
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    if (activeTab === "viewAll") return proposals;
    return proposals.filter(
      (proposal) => proposal.status.name.toLowerCase() === activeTab.toLowerCase()
    );
  }, [proposals, activeTab]);

  const redeemTokens = async (proposalId: number) => {
    await callMethod({
      contract: contracts.DAO,
      method: "redeem",
      args: [new U64Value(proposalId)],
    });
  };

  const executeProposal = async (proposalId: number) => {
    await callMethod({
      contract: contracts.DAO,
      method: "execute",
      args: [new U64Value(proposalId)],
    });
  };

  return (
    <div className="flex flex-col w-full pt-40 md:px-20 px-5">
      <div className="flex flex-col gap-6">
        <h1 className="text-5xl font-semibold">DAO Proposals</h1>
        <h4 className="text-xl font-normal text-zinc-500">
          The latest industry news, interviews, technologies, and resources.
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
        <AddProposalModal votingPeriod={votingPeriod} decimalsMap={decimalsMap} />
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
          {filteredProposals.map((token) => {
            // console.log(Buffer.from(token.action.arguments[4]).toString());

            // getResponseGate(Buffer.from(token.action.arguments[4]).toString());

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
                        {Buffer.from(token.action.arguments[3]).toString()}
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
                      {formatAddress(token.proposer.bech32())}{" "}
                    </p>
                  </span>
                  <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                    KYC
                    <p className="text-stone-500 font-normal">
                      {(() => {
                        const bytes = token.action.arguments[1];
                        return bytes[0] === numberToBytes(1)[0] ? "Yes" : "No";
                      })()}
                    </p>
                  </span>
                  <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                    Price
                    <p className="text-stone-500 font-normal">
                      {BigNumber(bytesToBN(token.action.arguments[5]).toString())
                        .dividedBy(
                          10 **
                            (decimalsMap.get(Buffer.from(token.action.arguments[4]).toString()) ||
                              0)
                        )
                        .toNumber() +
                        " " +
                        Buffer.from(token.action.arguments[4]).toString().split("-")[0]}{" "}
                    </p>
                  </span>
                  <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                    Min Buy
                    <p className="text-stone-500 font-normal">
                      {BigNumber(bytesToBN(token.action.arguments[6]).toString())
                        .dividedBy(
                          10 **
                            (decimalsMap.get(Buffer.from(token.action.arguments[3]).toString()) ||
                              18)
                        )
                        .toNumber() +
                        " " +
                        Buffer.from(token.action.arguments[3]).toString().split("-")[0]}{" "}
                    </p>
                  </span>
                  <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                    Max Buy
                    <p className="text-stone-500 font-normal">
                      {BigNumber(bytesToBN(token.action.arguments[7]).toString())
                        .dividedBy(
                          10 **
                            (decimalsMap.get(Buffer.from(token.action.arguments[3]).toString()) ||
                              18)
                        )
                        .toNumber() +
                        " " +
                        Buffer.from(token.action.arguments[3]).toString().split("-")[0]}{" "}
                    </p>
                  </span>
                  <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                    Start time
                    <p className="text-stone-500 font-normal">
                      {new Date(
                        bytesToBN(token.action.arguments[8]).toNumber() * 1000
                      ).toLocaleDateString()}
                    </p>
                  </span>
                  <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                    End time
                    <p className="text-stone-500 font-normal">
                      {new Date(
                        bytesToBN(token.action.arguments[9]).toNumber() * 1000
                      ).toLocaleDateString()}
                    </p>
                  </span>
                  <span className="flex justify-between gap-1 text-base font-light text-gray-500/80 pb-1">
                    Vote period
                    <p className="text-stone-500 font-normal">
                      <CountdownTimer
                        startDate={Math.floor(new Date().getTime() / 1000)}
                        endDate={BigNumber(token.creation_timestamp).plus(votingPeriod).toNumber()}
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
                        // console.log(BigNumber(token.u).toNumber());
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
                          <VoteUpModal proposalId={token.id} oneTokenAmount={tokenAmount} />
                          <VoteDownModal proposalId={token.id} oneTokenAmount={tokenAmount} />
                        </>
                      ) : token.status.name === "Succeeded" ? (
                        <div className="flex md:flex-row flex-col w-full justify-center gap-2 items-center">
                          <Button
                            variant="outline"
                            className="md:w-3/6 w-full border-2 border-[#00394F]"
                            onClick={() => redeemTokens(BigNumber(token.id).toNumber())}
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
