import { ElrondApiUrl } from "@/utils/config.ts";
import { InteractionProvider } from "@/utils/Interaction.tsx";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import { NotificationModal } from "@multiversx/sdk-dapp/UI/NotificationModal/NotificationModal";
import { SignTransactionsModals } from "@multiversx/sdk-dapp/UI/SignTransactionsModals/SignTransactionsModals";
import { TransactionsToastList } from "@multiversx/sdk-dapp/UI/TransactionsToastList/TransactionsToastList";
import { DappProvider } from "@multiversx/sdk-dapp/wrappers/DappProvider/DappProvider";
import { FC, ReactNode } from "react";
import { apiTimeout, ELROND_NETWORK, walletConnectV2ProjectId } from "../config.tsx";

export const MvxContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const {
    network: { chainId: chainID },
  } = useGetNetworkConfig();
  // console.log("chainID", chainID);
  return (
    <>
      <DappProvider
        environment={ELROND_NETWORK}
        customNetworkConfig={{
          name: "TeachFiDAO", //put your dapp name here
          apiTimeout,
          walletConnectV2ProjectId, //here you will have to create one
          apiAddress: ElrondApiUrl,
        }}
        dappConfig={{
          shouldUseWebViewProvider: true,
        }}>
        <InteractionProvider>
          <TransactionsToastList successfulToastLifetime={3000} />
          <NotificationModal />
          <SignTransactionsModals className="custom-class-for-modals" />
          {children}
        </InteractionProvider>
      </DappProvider>
    </>
  );
};
