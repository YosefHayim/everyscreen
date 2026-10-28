import { zodResolver } from "@hookform/resolvers/zod";
import {
  type DefaultValues,
  type FieldValues,
  type Mode,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import type { z } from "zod";

interface ZodFormSetup<Fields extends FieldValues, Parsed extends FieldValues> {
  schema: z.ZodType<Parsed, Fields>;
  mode: Mode;
  defaultValues: DefaultValues<Fields>;
}

export const useZodForm = <
  Fields extends FieldValues,
  Parsed extends FieldValues,
>(
  zodFormSetup: ZodFormSetup<Fields, Parsed>,
): UseFormReturn<Fields, unknown, Parsed> =>
  useForm<Fields, unknown, Parsed>({
    resolver: zodResolver(zodFormSetup.schema),
    mode: zodFormSetup.mode,
    defaultValues: zodFormSetup.defaultValues,
  });
