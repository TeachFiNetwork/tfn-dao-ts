import tfnDAO from "@/assets/abi/tfn-dao.abi.json";
import { AbiRegistry } from "@multiversx/sdk-core/out";

export const TeachFiDao = AbiRegistry.create(tfnDAO);
export const TeachFiLaunchpad = AbiRegistry.create(tfnDAO);
