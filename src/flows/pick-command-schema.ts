import type { z } from "zod";
import { type CommandName, hubCommandSchema } from "@/commands/commands-schema";

type CommandSchema = (typeof hubCommandSchema.options)[number];
type CommandSchemaNamed<Name extends CommandName> = Extract<
  CommandSchema,
  { shape: { commandName: z.ZodLiteral<Name> } }
>;

export const pickCommandSchema = <Name extends CommandName>(
  commandName: Name,
): CommandSchemaNamed<Name> => {
  const commandSchema = hubCommandSchema.options.find(
    (candidate): candidate is CommandSchemaNamed<Name> =>
      candidate.shape.commandName.value === commandName,
  );
  if (commandSchema === undefined) {
    throw new Error(`No hub command schema is named ${commandName}`);
  }
  return commandSchema;
};
