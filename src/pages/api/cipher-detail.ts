import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../lib/clients/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const session = await getSession({ req })
  if (!session) return res.status(401).end();

  const id = Number(req.query.id)
  if (!id) return res.status(400).end();

  const cipher = await prisma.sifra.findUnique({
    where: { id: id },
    select: { id: true, name: true, startTime: true, fileName: true }
  })
  if (!cipher) return res.status(404).end();

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'EDITOR'
  const curClass = session?.user?.class
    ? await prisma.class.findFirst({ where: { name: session.user.class } })
    : null

  let where: any = { sifraId: id }
  if (!isAdmin) {
    if (!curClass) where = { sifraId: -1 }
    else where = { sifraId: id, classId: curClass.id }
  }

  const submissions = await prisma.cipherSubmission.findMany({
    where: where,
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      answer: true,
      correct: true,
      createdAt: true,
      class: { select: { name: true } },
      user: { select: { name: true } },
    }
  })

  return res.status(200).json({
    cipher: {
      id: cipher.id,
      name: cipher.name,
      startTime: cipher.startTime,
      fileName: cipher.fileName,
      hasFile: !!cipher.fileName,
      available: new Date(cipher.startTime) <= new Date(),
      done: curClass ? curClass.ciphersDone.indexOf(cipher.id) !== -1 : false,
    },
    submissions: submissions,
  });
}
