import { useQueryClient } from "@tanstack/react-query";
import React, { use, useState } from "react";

const useRefetch = () => {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.refetchQueries({
      type: "active",
    });
  };
};

export default useRefetch;
