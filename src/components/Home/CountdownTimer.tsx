import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { formatSeconds } from "@/utils/functions";

export const CountdownTimer = ({
  startDate,
  endDate,
  setCountdownPassed,
}: {
  startDate: number;
  endDate: number;
  setCountdownPassed: Dispatch<SetStateAction<boolean>>;
}) => {
  const [timeRemaining, setTimeRemaining] = useState(endDate - startDate);
  useEffect(() => {
    const totalDuration = endDate - startDate;
    setTimeRemaining(totalDuration);

    const intervalId = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(intervalId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    if (timeRemaining === 0) {
      setCountdownPassed(true);
    }
    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  return <div className="text-stone-500 font-normal text-base">{formatSeconds(timeRemaining)}</div>;
};
