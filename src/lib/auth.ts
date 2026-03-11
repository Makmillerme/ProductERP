import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, admin } from "better-auth/plugins";
import { defaultAc, adminAc, userAc } from "better-auth/plugins/admin/access";
import { prisma } from "@/lib/prisma";

/**
 * Access-control для ролі owner: ті самі права, що у admin,
 * плюс дозвіл імперсоніфікувати адмінів.
 */
const ownerAc = defaultAc.newRole({
  user: ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"],
  session: ["list", "revoke", "delete"],
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-min-32-chars-long-placeholder",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: підключити поштовий сервіс (Resend, Nodemailer тощо).
        if (process.env.NODE_ENV === "development") {
          console.log("[Magic Link]", email, url);
        }
      },
      disableSignUp: true,
    }),
    admin({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- better-auth AccessControl type mismatch
      ac: defaultAc as any,
      roles: { admin: adminAc, user: userAc, owner: ownerAc },
      defaultRole: "user",
      adminRoles: ["admin", "owner"],
    }),
  ],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ].filter(Boolean),
});
