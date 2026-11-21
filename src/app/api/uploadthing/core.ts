import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { verifyAdminSession } from "@/server/auth";

const f = createUploadthing();

/**
 * SSB Prep FileRouter (Admin-Only).
 * Both routes require admin authentication.
 */
export const ourFileRouter = {
  /**
   * TAT Practice: Up to 11 images, 8MB max per file.
   */
  tatImages: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 11,
    },
  })
    .middleware(async ({ req }) => {
      const isAdmin = await verifyAdminSession(req);
      if (!isAdmin) {
        throw new UploadThingError("Unauthorized: Admin access required");
      }
      return { isAdmin: true };
    })
    .onUploadComplete(async ({ file }) => {
      return {
        key: file.key,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),

  /**
   * Practice Document / Image: 1 PDF, Word doc, or image up to 16MB.
   * Used for WAT, SRT, Lecturette, or GD source material.
   */
  materialDocument: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    image: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    "application/msword": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const isAdmin = await verifyAdminSession(req);
      if (!isAdmin) {
        throw new UploadThingError("Unauthorized: Admin access required");
      }
      return { isAdmin: true };
    })
    .onUploadComplete(async ({ file }) => {
      return {
        key: file.key,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
