import { IAddress, TypedValue } from "@multiversx/sdk-core/out";
import BigNumber from "bignumber.js";

export type TCallMethodProperties = {
  contract: any;
  method: string;
  args?: TypedValue[];
  egld?: BigNumber.Value;
  fts?: FTPayment[];
  nfts?: NFTPayment[];
  sfts?: SFTPayment[];
  wrap?: BigNumber.Value;
  gasLimit?: string;
  // unwrap?: BigNumber.Value
};

export const BigZero = new BigNumber(0);

export type TViewMethodProperties = {
  contract: any;
  method: string;
  args?: TypedValue[];
};

export type TViewMethod = (values: TViewMethodProperties) => Promise<any>;

export type TCallMethod = (values: TCallMethodProperties) => Promise<any>;

export interface FTPayment {
  token: string;
  amount: BigNumber.Value;
  decimals: number;
}

export interface NFTPayment {
  token: string;
  nonce: number;
}

export interface SFTPayment {
  token: string;
  nonce: number;
  amount: number;
}

export interface IInteractionContext {
  viewMethod: TViewMethod;
  callMethod: TCallMethod;
}

export type Launchpad = {
  title: string;
  description: string;
  token: string;
  payment_token: string;
  price: string;
  min_buy_amount: string;
  max_buy_amount: string;
  start_time: number;
  end_time: number;
  kyc_enforced: number;
};

export type ProposalCreation = {
  title: string;
  description: string;
  launchpad_proposal: Launchpad;
};

export type Action = {
  gas_limit: number;
  dest_address: IAddress;
  payment_token: string;
  payment_amount: number;
  endpoint_name: string;
  arguments: Uint8Array[];
};

export type Proposal = {
  id: BigNumber.Value;
  proposer: IAddress;
  title: string;
  description: string;
  creation_timestamp: BigNumber.Value;
  status: StatusProposal;
  proposal_data: ProposalData;
  proposal_type: ProposalType;
  was_executed: boolean;
  num_upvotes: BigNumber.Value;
  num_downvotes: BigNumber.Value;
};

type ProposalData = {
  name: string;
  fields: Launchpad[];
};

type ProposalType = {
  name: string;
  fields: [];
};

type StatusProposal = {
  name: string;
  fields: [];
};

export type Vote = {
  token: string;
  amount: number;
};
