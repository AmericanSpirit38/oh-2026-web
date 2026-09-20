import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../lib/clients/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const session = await getSession({ req })
    if (!session) return res.status(401).end();

    const curClass = session?.user?.class
      ? await prisma.class.findFirst({ where: { name: session.user.class } })
      : null

    const ciphers = await prisma.sifra.findMany({
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        name: true,
        startTime: true,
        fileName: true,
      }
    });

    const now = new Date()
    const out = ciphers.map((c: any) => ({
      id: c.id,
      name: c.name,
      startTime: c.startTime,
      fileName: c.fileName,
      hasFile: !!c.fileName,
      available: new Date(c.startTime) <= now,
      done: curClass ? curClass.ciphersDone.indexOf(c.id) !== -1 : false,
    }))

    return res.status(200).json(out);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )
  }
}
