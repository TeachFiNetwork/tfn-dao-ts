import BigNumber from "bignumber.js";
import { ElrondGatewayUrl } from "./config";
import axios from "axios";

export const convertEsdtToWei = (amount: BigNumber.Value, decimals?: number): BigNumber => {
  if (!amount) amount = "0";
  return new BigNumber(amount)
    .shiftedBy(decimals == null ? 18 : decimals)
    .decimalPlaces(0, BigNumber.ROUND_FLOOR);
};

export function formatNumber(number: number, decimals: number = 4) {
  const multiplier = Math.pow(10, decimals);
  return (Math.floor(number * multiplier) / multiplier).toFixed(decimals);
}

export function formatAddress(address: string, length: number = 4) {
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export const numberToBytes = (num: number): Uint8Array => {
  return new Uint8Array([num]);
};

export const BNtoBytes = (num: BigNumber): Buffer => {
  const base16Num = num.toString(16);
  return Buffer.from(base16Num.length % 2 === 1 ? "0" + base16Num : base16Num, "hex");
};

export const bytesToBN = (bytes: Uint8Array): BigNumber => {
  const hexString = Buffer.from(bytes).toString("hex");
  return new BigNumber(hexString, 16);
};

export function formatSeconds(seconds: number) {
  if (seconds <= 0) {
    return "00:00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

export const getWalletToken = async (address: string, token: string): Promise<number> => {
  const url = `${ElrondGatewayUrl}/address/${address}/esdt/${token}`;
  try {
    const res = await axios.get(url);
    return Number(res.data.data.tokenData.balance);
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return 0;
  }
};
