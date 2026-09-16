import NextAuth, { NextAuthOptions } from 'next-auth'
import Adapters from 'next-auth/adapters'
import { NextApiHandler } from 'next'
import prisma from '../../../../lib/clients/prisma'
import axios from 'axios'
import { JWT } from 'next-auth/jwt'

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;

// Prefix skupin v Entre, podla ktorych sa priraduje trieda (napr. Ziaci_terciaB)
const GROUP_PREFIX = "ziaci_";

const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

const options: NextAuthOptions = {
  session: {
    jwt: true, 
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    {
      id: "gamca",
      name: "GAMČA account",
      type: "oauth",
      version: "2.0",
      scope: "https://graph.microsoft.com/user.read https://graph.microsoft.com/GroupMember.Read.All",
      params: { grant_type: "authorization_code" },
      domain: 'https://login.microsoftonline.com',
      accessTokenUrl: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
      requestTokenUrl: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize`,
      authorizationUrl: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?response_type=code`,
      profileUrl: "https://graph.microsoft.com/oidc/userinfo",
      profile: (profile: any) => {
        return {
          id: profile.sub,
          name: profile.name,
          last_name: profile.family_name,
          first_name: profile.given_name,
          email: profile.email,
          picture: profile.picture,
          role: "",
          class: ""
        };
      },
      clientId: `${process.env.AZURE_CLIENT_ID}`,
      clientSecret: `${process.env.AZURE_CLIENT_SECRET}`,
    },
  ],
  callbacks: {
    async jwt(token, user: any, account, profile, isNewUser) {
      if (account?.accessToken)
      {
        token.accessToken = account?.accessToken

        // next-auth v3 Prisma adapter posiela id ako string, preto sa na
        // objekt "user" nedá spoľahnúť - používateľa hľadáme podľa e-mailu.
        try {
          const rawEmail = (profile as any)?.email || (user && user.email) || token.email
          const email = rawEmail ? String(rawEmail).toLowerCase() : null
          const dbUser = email
            ? await prisma.user.findUnique({ where: { email: email } })
            : null

          if (dbUser) {
            // Automaticky sa priraďuje IBA trieda, podľa názvu skupiny v Entre.
            // Rola (ADMIN / EDITOR) sa nastavuje výlučne ručne v databáze.
            if (dbUser.classId === null) {
              const res = await axios.get('https://graph.microsoft.com/v1.0/me/memberOf?$top=999',
              {
                headers: { 'Authorization': `Bearer ${account.accessToken}` }
              })

              const groups: any[] = (res.data && res.data.value) || []
              const memberNames = groups
                .map((g) => g && g.displayName)
                .filter((n) => typeof n === 'string' && n.toLowerCase().startsWith(GROUP_PREFIX))
                .map((n) => norm(String(n).substring(GROUP_PREFIX.length)))

              console.log('[oh] pocet objektov z memberOf:', groups.length)
              console.log('[oh] vsetky nazvy:', JSON.stringify(groups.map((g) => g && g.displayName)))
              console.log('[oh] triedne skupiny pouzivatela:', JSON.stringify(memberNames))

              if (memberNames.length > 0) {
                const classes = await prisma.class.findMany({ select: { id: true, name: true } })
                const target = classes.find((c) => memberNames.indexOf(norm(c.name)) !== -1)
                if (target) {
                  await prisma.user.update({ where: { id: dbUser.id }, data: { classId: target.id } })
                  console.log(`[oh] trieda priradena: ${email} -> ${target.name}`)
                } else {
                  console.log('[oh] ziadna zhoda v tabulke Class pre:', JSON.stringify(memberNames))
                }
              } else {
                console.log('[oh] pouzivatel nie je v ziadnej skupine s prefixom', GROUP_PREFIX)
              }
            }

            if (profile?.picture) {
              const userImage = await axios.get((profile.picture as string),
              {
                headers: {
                  'Authorization': `Bearer ${account.accessToken}`,
                  'Content-Type': 'image/jpg'
                },
                responseType: 'arraybuffer'
              })
              if (userImage.data) {
                await prisma.user.update({ where: { id: dbUser.id }, data: { imageData: Buffer.from(userImage.data) }});
              }
            }
          } else {
            console.error('[oh] pouzivatel sa nenasiel podla emailu:', email)
          }
        } catch (error: any) {
          console.error('[oh] chyba pri priradovani triedy/obrazka:', error?.response?.status, error?.response?.data || error?.message)
        }
      }
      return token
    },
    async session(session, token) {
      session.accessToken = token;
      if (!session?.user || !token) {
        return session
      }
      const user = await prisma.user.findUnique({select: { id: true, role: true, class: { select: { name: true } } }, where: { email: String(token.email!).toLowerCase() } })
      session.user.id = user?.id!
      session.user.role = user?.role!
      session.user.class = user?.class?.name!
      session.accessToken = (token as JWT);
      return session;
    },
  },
  adapter: Adapters.Prisma.Adapter({ prisma }),
  secret: `${process.env.JWT_SECRET}`,
}

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options)
export default authHandler
