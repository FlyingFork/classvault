import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/prisma";

import { username, admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Make the first user an admin by default
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            return {
              data: {
                ...user,
                role: "admin",
              },
            };
          }
          return { data: user };
        },
      },
    },
  },

  plugins: [username(), admin()],
});
