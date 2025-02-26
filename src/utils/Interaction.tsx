import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { createContext, useCallback, useContext, useMemo } from "react";
import { BigZero, IInteractionContext, TCallMethod, TViewMethod } from "@/utils/types.ts";
import {
  Account,
  Address,
  ContractFunction,
  Interaction,
  ProxyNetworkProvider,
  ResultsParser,
  SmartContract,
  TokenTransfer,
} from "@multiversx/sdk-core/out";
import { contracts, ElrondGatewayUrl, isDev } from "@/utils/config.ts";
import { convertEsdtToWei } from "@/utils/functions.tsx";

const InteractionContext = createContext<IInteractionContext>({} as IInteractionContext);

const InteractionProvider = ({ children }: { children: any }) => {
  const {
    account: { address: userAddress, shard },
  } = useGetAccountInfo();

  const networkProvider = new ProxyNetworkProvider(ElrondGatewayUrl, {
    timeout: 10000,
  });

  const viewMethod = useCallback<TViewMethod>(
    async ({
      contract,
      method,
      args = [],
    }: {
      contract: any;
      method: string;
      args?: any[];
    }): Promise<any> => {
      const { address, abi } = contract;

      const contractAddress = new Address(address);
      // const contractAbi = new SmartContractAbi(abi);
      const smartContract = new SmartContract({
        address: contractAddress,
        abi: abi,
      });

      const query = smartContract.createQuery({
        func: new ContractFunction(method),
        args,
      });

      const queryResponse = await networkProvider.queryContract(query);

      const resultsParser = new ResultsParser();
      const endpointDefinition = smartContract.getEndpoint(method);

      const { firstValue } = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);

      return firstValue?.valueOf();
    },
    [userAddress]
  );

  const callMethod = useCallback<TCallMethod>(
    async ({
      contract,
      method,
      args = [],
      egld = BigZero,
      fts = [],
      nfts = [],
      sfts = [],
      wrap = BigZero,
      gasLimit = "75000000",
      // unwrap = BigZero
    }) => {
      if (userAddress) {
        const { address, abi } = contract;

        const contractAddress = new Address(address);
        // const contractAbi = new SmartContractAbi(abi);
        const smartContract = new SmartContract({
          address: contractAddress,
          abi: abi,
        });

        const userAccount = new Account(new Address(userAddress));

        const updatedUserAccount = await networkProvider.getAccount(new Address(userAddress));

        userAccount.update(updatedUserAccount);

        const transactions = [];

        if (BigZero.lt(wrap)) {
          let wrapAddress = new Address(contracts.Wrap0.address);

          if (shard === 1) {
            wrapAddress = new Address(contracts.Wrap1.address);
          } else if (shard === 2) {
            wrapAddress = new Address(contracts.Wrap2.address);
          }
          const wrapContract = new SmartContract({ address: wrapAddress });
          const wrapFunction = new ContractFunction("wrapEgld");
          const wrapInteraction = new Interaction(wrapContract, wrapFunction, []);

          const wrapTx = wrapInteraction
            .withNonce(userAccount.nonce)
            .withValue(TokenTransfer.egldFromAmount(wrap))
            .withGasLimit(20000000)
            .withChainID(isDev ? "D" : "1")
            .buildTransaction();

          const wrapTxData = {
            value: convertEsdtToWei(wrap),
            data: wrapTx.getData().toString(),
            receiver: wrapAddress.toString(),
            gasLimit: "20000000",
          };

          transactions.push(wrapTxData);
        }

        const tx = smartContract.methodsExplicit[method](args)
          .withNonce(BigZero.lt(wrap) ? userAccount.nonce.valueOf() + 1 : userAccount.nonce)
          .withGasLimit(method == "userClaim" || method == "userUnstake" ? 30_000_000 : 50_000_000)
          .withChainID(isDev ? "D" : "1");

        if (BigZero.lt(egld)) {
          tx.withValue(TokenTransfer.egldFromAmount(egld));
        }

        const esdtPayment = [];
        for (const ft of fts) {
          esdtPayment.push(TokenTransfer.fungibleFromAmount(ft.token, ft.amount, ft.decimals));
        }
        for (const nft of nfts) {
          esdtPayment.push(TokenTransfer.nonFungible(nft.token, nft.nonce));
        }
        for (const sft of sfts) {
          esdtPayment.push(TokenTransfer.semiFungible(sft.token, sft.nonce, sft.amount));
        }
        if (fts.length === 1) {
          tx.withSingleESDTTransfer(esdtPayment[0]);
        } else if (esdtPayment.length >= 1) {
          tx.withMultiESDTNFTTransfer(esdtPayment);
        }

        const transaction = tx.buildTransaction();

        const txData = {
          value: convertEsdtToWei(egld),
          data: transaction.getData().toString(),
          sender: userAddress,
          receiver: esdtPayment.length === 0 || fts.length === 1 ? address : userAddress,
          gasLimit: gasLimit,
        };

        transactions.push(txData);

        // console.log(transactions);

        const result = await sendTransactions({
          transactions: transactions,
          transactionsDisplayInfo: {
            processingMessage: "Processing Transaction",
            errorMessage: "Transaction Failed",
            successMessage: "Transaction Success",
          },
          redirectAfterSign: false,
        });
        return result;
      }

      return "";
    },
    [userAddress]
  );

  const values = useMemo(
    () => ({
      viewMethod,
      callMethod,
    }),
    [viewMethod, callMethod]
  );
  return <InteractionContext.Provider value={values}>{children}</InteractionContext.Provider>;
};

const useInteraction = () => useContext(InteractionContext);

export { useInteraction, InteractionProvider };
