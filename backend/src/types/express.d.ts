import { User } from "@prisma/client";
import  { File } from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }

    namespace Multer {
        interface File{}
    }
  }
}

export {}