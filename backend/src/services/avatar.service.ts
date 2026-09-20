import { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../config/cloudinary.js";

export const uploadAvatar = (
  buffer: Buffer,
): Promise<Pick<UploadApiResponse, "secure_url">> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "fittrack/avatars",
        resource_type: "image",
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
        ],
      },
      (error, result) => {
        if (error || !result)
          reject(error ?? new Error("Avatar upload failed"));
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
