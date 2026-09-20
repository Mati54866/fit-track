import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { env } from "./env.js";
import { UserModel } from "../models/user.model.js";
import { createUniqueUsername } from "../services/auth.service.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          done(new Error("Google did not provide an email address"));
          return;
        }

        const existingGoogleUser = await UserModel.findOne({ googleId });
        if (existingGoogleUser) {
          done(null, existingGoogleUser);
          return;
        }

        const existingEmailUser = await UserModel.findOne({ email });
        if (existingEmailUser) {
          existingEmailUser.googleId = googleId;
          if (!existingEmailUser.avatarUrl && profile.photos?.[0]?.value) {
            existingEmailUser.avatarUrl = profile.photos[0].value;
          }
          await existingEmailUser.save();
          done(null, existingEmailUser);
          return;
        }

        const user = await UserModel.create({
          name: profile.displayName || email.split("@")[0],
          username: await createUniqueUsername(
            profile.username || email.split("@")[0],
          ),
          email,
          googleId,
          avatarUrl: profile.photos?.[0]?.value ?? "",
        });
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    },
  ),
);

export { passport };
