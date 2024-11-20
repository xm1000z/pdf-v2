"use client";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

export default function ActionButton({
  children,
  ...rest
}: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button {...rest} disabled={pending}>
      <Spinner loading={pending}>{children}</Spinner>
    </Button>
  );
}
