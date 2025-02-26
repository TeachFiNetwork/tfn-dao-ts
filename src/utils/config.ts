import { TeachFiDao, TeachFiLaunchpad } from "@/utils/abiConfig.ts";

export const isDev = true;

export const contracts = {
  DAO: {
    address: "erd1qqqqqqqqqqqqqpgqkm4w8fwx3ltxd5h5ydalsrmsqd38wtldvcqsll86rw",
    abi: TeachFiDao,
  },
  Launchpad: {
    address: "erd1qqqqqqqqqqqqqpgq2cgjfc9n76xkqmcfaxwgq3dzm7pm3y6fvcqses2haj",
    abi: TeachFiLaunchpad,
  },
  Wrap0: {
    address: "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy",
  },
  Wrap1: {
    address: "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3",
  },
  Wrap2: {
    address: "erd1qqqqqqqqqqqqqpgqmuk0q2saj0mgutxm4teywre6dl8wqf58xamqdrukln",
  },
};

export const ElrondGatewayUrl = isDev
  ? "https://devnet-gateway.multiversx.com"
  : "https://gateway.multiversx.com";
export const ElrondApiUrl = isDev
  ? "https://devnet-api.multiversx.com"
  : "https://multiversx-api.beaconx.app/public-mainnet-api";

export const ONE = isDev ? "ONE-83a7c0" : "ONE-f9954f";
