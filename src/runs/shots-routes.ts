import { join } from "node:path";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { STORE_FOLDER } from "@/environment";
import { rejectInvalidRequest } from "@/hub/problem-reply";
import { readStoredBytes } from "@/hub/stored-files";

const NOT_FOUND_STATUS = 404;
const SHOTS_SUBFOLDER = "shots";
const SHOT_FILE_NAME_PATTERN = /^[A-Za-z0-9-]+\.png$/;
const SHOT_CONTENT_TYPE = "image/png";

const shotNameParamSchema = z.object({
  fileName: z.string().regex(SHOT_FILE_NAME_PATTERN),
});

export const createShotsRoutes = (rootFolder: string) =>
  new Hono().get(
    "/:fileName",
    zValidator("param", shotNameParamSchema, rejectInvalidRequest),
    async (c) => {
      const { fileName } = c.req.valid("param");
      const shotPath = join(
        rootFolder,
        STORE_FOLDER,
        SHOTS_SUBFOLDER,
        fileName,
      );
      const shotBytes = await readStoredBytes(shotPath);
      const isShotMissing = shotBytes === null;
      if (isShotMissing) {
        throw new HTTPException(NOT_FOUND_STATUS, {
          message: `No shot ${fileName}`,
        });
      }
      const shotImage = new Uint8Array(shotBytes);
      return c.body(shotImage, 200, { "Content-Type": SHOT_CONTENT_TYPE });
    },
  );
