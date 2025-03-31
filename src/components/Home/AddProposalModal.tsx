import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useInteraction } from "@/utils/Interaction";
import { TeachFiDao } from "@/utils/abiConfig";
import { contracts, ElrondGatewayUrl } from "@/utils/config";
import { Launchpad } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Address,
  AddressValue,
  BigIntValue,
  BigUIntValue,
  BooleanValue,
  BytesValue,
  Field,
  IAddress,
  List,
  Struct,
  TokenIdentifierValue,
  U64Value,
} from "@multiversx/sdk-core/out";
import { useGetAccount, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import axios from "axios";
import { format, setHours, setMinutes } from "date-fns";
import { BadgeInfo, CalendarIcon, Plus } from "lucide-react";
import { ChangeEventHandler, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "../ui/checkbox";
import BigNumber from "bignumber.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BNtoBytes, numberToBytes } from "@/utils/functions";

const validationSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    token: z.string().min(1, "Token is required"),
    paymentToken: z.string().min(1, "Payment token is required"),
    price: z
      .string()
      .regex(/^[0-9.]+$/, "Only numbers and decimal points are allowed")
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Price must be greater than 0"
      ),
    minBuy: z
      .string()
      .regex(/^[0-9.]+$/, "Only numbers and decimal points are allowed")
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Min buy must be greater than 0"
      ),
    maxBuy: z
      .string()
      .regex(/^[0-9.]+$/, "Only numbers and decimal points are allowed")
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Max buy is required"),
    startDate: z.number().min(1, "Start date is required"),
    endDate: z.number().min(1, "End date is required"),
    kycEnforced: z.number(),
  })
  .refine(
    (data) => {
      const minBuy = parseFloat(data.minBuy);
      const maxBuy = parseFloat(data.maxBuy);
      return maxBuy > minBuy;
    },
    {
      message: "Min buy must be at least 1 lower than max buy",
      path: ["minBuy"],
    }
  )
  .refine(
    (data) => {
      return data.endDate > data.startDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export const AddProposalModal = (props: any) => {
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTimeValue, setStartTimeValue] = useState<string>("00:00");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTimeValue, setEndTimeValue] = useState<string>("00:00");
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [launchpadAddress, setLaunchpadAddress] = useState<IAddress>(new Address(""));
  const { callMethod, viewMethod } = useInteraction();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [responseGate, setResponseGate] = useState(new Map<string, number>());

  const { votingPeriod } = props;

  const handleStartTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value;
    if (!startDate) {
      setStartTimeValue(time);
      return;
    }
    const [hours, minutes] = time.split(":").map((str) => parseInt(str, 10));
    const newSelectedDate = setHours(setMinutes(startDate, minutes), hours);
    setStartDate(newSelectedDate);
    setStartTimeValue(time);
  };

  const handleEndTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value;
    if (!endDate) {
      setEndTimeValue(time);
      return;
    }
    const [hours, minutes] = time.split(":").map((str) => parseInt(str, 10));
    const newSelectedDate = setHours(setMinutes(endDate, minutes), hours);
    setEndDate(newSelectedDate);
    setEndTimeValue(time);
  };

  // const todayDate = new Date();
  // console.log(BigNumber(votingPeriod).toNumber());

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    (async () => {
      await viewMethod({
        contract: contracts.DAO,
        method: "getLaunchpadAddress",
      }).then((res) => {
        if (res) {
          const data = res;
          setLaunchpadAddress(new Address(data));
        }
      });
    })();
  }, []);

  useEffect(() => {
    if (hasPendingTransactions) {
      handleCloseModal();
    }
  }, [hasPendingTransactions]);

  const getResponseGate = async (token: string) => {
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
      setResponseGate((prev) => new Map(prev).set(token, decimals));
    } catch (e) {
      throw e;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    setError,
    reset,
    getValues,
    clearErrors,
    watch,
    trigger,
  } = useForm<Launchpad>({
    defaultValues: {
      title: "",
      description: "",
      token: "",
      paymentToken: "",
      price: "",
      minBuy: "",
      maxBuy: "",
      startDate: 0,
      endDate: 0,
      kycEnforced: 1,
    },
    mode: "onChange",
    resolver: zodResolver(validationSchema),
  });

  // useEffect(() => {
  //   if (responseGate.size > 0) {
  //     trigger();
  //   }
  // }, [responseGate, trigger]);

  const handleStartDateSelect = (selectedDate: Date | undefined) => {
    setStartDate(selectedDate);
    const date = selectedDate && selectedDate?.getTime() / 1000;
    if (selectedDate) {
      // Convert to UTC
      const [hours, minutes] = startTimeValue.split(":").map((str) => parseInt(str, 10));
      const utcDate = new Date(
        Date.UTC(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          hours,
          minutes
        )
      );
      setValue("startDate", utcDate.getTime() / 1000);
    } else {
      setValue("startDate", date ?? 0);
    }
    clearErrors("startDate"); // Add this line to clear the error
    setOpenStartDate(false); // Close the popover after selection
  };

  const handleEndDateSelect = (selectedDate: Date | undefined) => {
    if (!startDate) {
      setError("endDate", {
        type: "onChange",
        message: "Please select start date first",
      });
      return;
    }

    clearErrors("endDate");
    setEndDate(selectedDate);
    const date = selectedDate && selectedDate?.getTime() / 1000;
    if (selectedDate) {
      // Convert to UTC
      const [hours, minutes] = endTimeValue.split(":").map((str) => parseInt(str, 10));
      const utcDate = new Date(
        Date.UTC(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          hours,
          minutes
        )
      );
      setValue("endDate", utcDate.getTime() / 1000);
    } else {
      setValue("endDate", date ?? 0);
    }
    trigger();
    setOpenEndDate(false); // Close the popover after selection
  };

  const submitProposal = async (formData: Launchpad) => {
    console.log(formData);

    const paymentTokenDecimals = responseGate.get(formData.paymentToken);
    const tokenDecimals = responseGate.get(formData.token);

    if (!paymentTokenDecimals || !tokenDecimals) {
      // Handle missing token information
      setError("token", {
        type: "onChange",
        message: "Token information is incomplete. Please check both tokens.",
      });
      return;
    }

    const launchpadCreationType = TeachFiDao.getStruct("LaunchpadProposal");

    const struct2 = new Struct(launchpadCreationType, [
      new Field(new BooleanValue(formData.kycEnforced === 1 ? true : false), "kyc_enforced"),
      new Field(new TokenIdentifierValue(formData.token), "token"),
      new Field(new TokenIdentifierValue(formData.paymentToken), "payment_token"),
      new Field(
        new BigUIntValue(BigNumber(formData.price).multipliedBy(10 ** paymentTokenDecimals)),
        "price"
      ),
      new Field(
        new BigUIntValue(BigNumber(formData.minBuy).multipliedBy(10 ** tokenDecimals)),
        "min_buy_amount"
      ),
      new Field(
        new BigUIntValue(BigNumber(formData.maxBuy).multipliedBy(10 ** tokenDecimals)),
        "max_buy_amount"
      ),
      new Field(new U64Value(BigNumber(formData.startDate)), "start_time"),
      new Field(new U64Value(BigNumber(formData.endDate)), "end_time"),
    ]);

    await callMethod({
      contract: contracts.DAO,
      method: "proposeNewLaunchpad",
      args: [
        new BytesValue(Buffer.from(formData.title)),
        new BytesValue(Buffer.from(formData.description)),
        struct2,
      ],
    });
    reset();
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger className="flex items-start justify-start">
            <Button
              variant="outline"
              className="w-full"
              disabled={!address}
              onClick={() => setShowModal(!showModal)}>
              <Plus className="text-emerald-500" />
              Launchpad
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add a new Launchpad Proposal</TooltipContent>
        </Tooltip>
      </DialogTrigger>

      <DialogContent
        className="max-w-[23rem] md:max-w-[40rem] bg-white p-4 md:p-6 max-h-[90vh] md:overflow-visible overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="p-3 border w-12 h-12 rounded-xl flex justify-center items-center shadow">
            <BadgeInfo className="!w-6 !h-6" />
          </div>
          <DialogTitle className="pt-6">Propose new Launchpad</DialogTitle>
          <DialogDescription>
            Complete all fields in order to have a clear understanding of your Proposal
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(submitProposal)}
          className="space-y-6 overflow-y-auto flex-1 px-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="title" className="pl-1 text-gray-700">
                Title
              </Label>
              <Input
                type="text"
                id="title"
                placeholder="What is your title?"
                className="shadow"
                {...register("title")}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="description" className="pl-1 text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="What is your description?"
                className="shadow min-h-[100px]"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description.message}</p>
              )}
            </div>
            <div className="flex flex-row w-full gap-4">
              <div className="flex flex-col w-full gap-2">
                <Label htmlFor="tokenid" className="pl-1 text-gray-700">
                  Token
                </Label>
                <Input
                  type="text"
                  id="tokenid"
                  className="shadow"
                  {...register("token", {
                    onBlur: async (event) => {
                      try {
                        if (event.target.value.includes(" ")) {
                          setError("token", {
                            type: "manual",
                            message: "Token identifier cannot contain spaces",
                          });
                        } else {
                          await getResponseGate(event.target.value);
                          clearErrors("token");
                          await trigger("token", { shouldFocus: true });
                        }
                      } catch (error) {
                        setError("token", {
                          type: "manual",
                          message: "Invalid token identifier",
                        });
                      }
                    },
                  })}
                />
                {errors.token && <p className="text-red-500 text-sm">{errors.token.message}</p>}
              </div>
              <div className="flex flex-col w-full gap-2">
                <Label htmlFor="paymenttoken" className="pl-1 text-gray-700">
                  Payment token
                </Label>
                <Input
                  type="text"
                  id="paymenttoken"
                  className="shadow"
                  {...register("paymentToken", {
                    onBlur: async (event) => {
                      try {
                        if (event.target.value.includes(" ")) {
                          setError("paymentToken", {
                            type: "manual",
                            message: "Token identifier cannot contain spaces",
                          });
                        } else {
                          await getResponseGate(event.target.value);
                          // clearErrors("token");
                          await trigger("paymentToken", { shouldFocus: true });
                        }
                      } catch (error) {
                        setError("paymentToken", {
                          type: "manual",
                          message: "Invalid token identifier",
                        });
                      }
                    },
                  })}
                />
                {errors.paymentToken && (
                  <p className="text-red-500 text-sm">{errors.paymentToken.message}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row w-full gap-4">
              <div className="flex flex-col w-full gap-2">
                <Label htmlFor="price" className="pl-1 text-gray-700">
                  Price
                </Label>
                <Input
                  type="text"
                  id="price"
                  className="shadow"
                  step="any"
                  {...register("price", {
                    onChange: (e) => {
                      // Replace any non-numeric or non-decimal characters
                      e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                    },
                  })}
                />
                {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
              </div>
              <div className="flex flex-row w-full gap-2 ">
                <div className="flex flex-col w-full gap-2">
                  <Label htmlFor="minbuy" className="pl-1 text-gray-700">
                    Min Buy
                  </Label>
                  <Input
                    type="text"
                    id="minbuy"
                    className="shadow"
                    step="any"
                    {...register("minBuy", {
                      onChange: (e) => {
                        // Replace any non-numeric or non-decimal characters
                        e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                      },
                    })}
                  />
                  {errors.minBuy && <p className="text-red-500 text-sm">{errors.minBuy.message}</p>}
                </div>
                <div className="flex flex-col w-full gap-2">
                  <Label htmlFor="maxbuy" className="pl-1 text-gray-700">
                    Max buy
                  </Label>
                  <Input
                    type="text"
                    id="maxbuy"
                    className="shadow"
                    step="any"
                    {...register("maxBuy", {
                      onChange: (e) => {
                        // Replace any non-numeric or non-decimal characters
                        e.target.value = e.target.value.replace(/[^0-9.]/g, "");

                        const maxValue = parseFloat(e.target.value);
                        const minValue = parseFloat(getValues("minBuy"));
                        if (minValue && maxValue && minValue >= maxValue) {
                          setError("minBuy", {
                            type: "manual",
                            message: "Min buy must be lower than max buy",
                          });
                        } else {
                          clearErrors("minBuy");
                        }
                      },
                    })}
                  />
                  {errors.maxBuy && <p className="text-red-500 text-sm">{errors.maxBuy.message}</p>}
                </div>
              </div>
            </div>
            <div className="flex flex-row w-full items-center gap-5 pt-2">
              <div className="flex flex-col w-full gap-2">
                <p className="text-sm font-medium text-gray-700">Select start and end time</p>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                    <div className="flex flex-col gap-1">
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-auto justify-start text-left font-light",
                            !startDate && "text-muted-foreground"
                          )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Select start</span>}
                        </Button>
                      </PopoverTrigger>
                      {errors.startDate && (
                        <p className="text-red-500 text-sm">{errors.startDate.message}</p>
                      )}
                    </div>
                    <PopoverContent
                      className="w-auto flex flex-col p-0 relative bg-white !z-[9999]"
                      align="start">
                      <div className="border border-gray-500 py-1 rounded-lg">
                        <label className="px-5 py-2">
                          Set the time:{" "}
                          <input
                            type="time"
                            value={startTimeValue}
                            onChange={handleStartTimeChange}
                          />
                        </label>
                      </div>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateSelect}
                        disabled={{
                          before: new Date(
                            new Date().setTime(
                              new Date().getTime() +
                                BigNumber(votingPeriod).multipliedBy(1000).plus(86400000).toNumber()
                            )
                          ),
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                    <div className="flex flex-col gap-1">
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-auto justify-start text-left font-light",
                            !endDate && "text-muted-foreground"
                          )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Select end</span>}
                        </Button>
                      </PopoverTrigger>
                      {errors.endDate && (
                        <p className="text-red-500 text-sm">{errors.endDate.message}</p>
                      )}
                    </div>
                    <PopoverContent className="w-auto flex flex-col p-0" align="start">
                      <div className="border border-gray-500 py-1 rounded-lg">
                        <label className="px-5 py-2">
                          Select time:{" "}
                          <input type="time" value={endTimeValue} onChange={handleEndTimeChange} />
                        </label>
                      </div>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateSelect}
                        disabled={{
                          before: startDate
                            ? new Date(startDate.getTime() + 86400000)
                            : new Date(
                                new Date().setTime(
                                  new Date().getTime() +
                                    BigNumber(votingPeriod)
                                      .multipliedBy(1000)
                                      .plus(86400000 * 2)
                                      .toNumber()
                                )
                              ),
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="kyc"
                      checked={watch("kycEnforced") === 1}
                      onCheckedChange={(checked) => {
                        setValue("kycEnforced", checked ? 1 : 0);
                      }}
                    />
                    <label
                      htmlFor="kyc"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      KYC Enforced
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="w-full pt-8 gap-1 md:gap-0 flex items-center !justify-center sticky bottom-0 bg-white mt-auto">
            <DialogPrimitive.Close asChild>
              <Button
                variant="outline"
                className="w-full md:w-3/6"
                type="button"
                onClick={() => {
                  reset();
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}>
                Cancel
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant="outline"
              disabled={!isValid || Object.keys(errors).length > 0}
              className="bg-[#00394F] hover:bg-[#00394F]/90 text-white hover:text-white w-full md:w-3/6 rounded-lg"
              type="submit">
              Propose
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
