import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../lib/clients/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const session = await getSession({ req })
  if (!session) return res.status(401).end();

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'EDITOR'

  let where: any = {}
  if (!isAdmin) {
    if (!session.user.class) return res.status(200).json([]);
    where = { class: { name: session.user.class } }
  }

  const subs = await prisma.cipherSubmission.findMany({
    where: where,
    orderBy: { createdAt: 'desc' },
    take: 1000,
    select: {
      id: true,
      answer: true,
      correct: true,
      createdAt: true,
      sifra: { select: { id: true, name: true } },
      class: { select: { name: true } },
      user: { select: { name: true } },
    }
  })

  return res.status(200).json(subs);
}
