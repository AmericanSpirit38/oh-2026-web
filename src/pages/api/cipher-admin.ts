import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../lib/clients/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const session = await getSession({ req })
  if (!session) return res.status(401).end();
  if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();

  const ciphers = await prisma.sifra.findMany({
    orderBy: { startTime: 'asc' },
    select: {
      id: true,
      name: true,
      answer: true,
      startTime: true,
      fileName: true,
      mimeType: true,
      submissions: { select: { id: true, correct: true, classId: true } },
    }
  });

  const out = ciphers.map((c: any) => {
    const pokusy = c.submissions.length
    const spravne = c.submissions.filter((s: any) => s.correct).length
    const triedy: any = {}
    for (const s of c.submissions) if (s.correct && s.classId != null) triedy[s.classId] = true
    return {
      id: c.id,
      name: c.name,
      answer: c.answer,
      startTime: c.startTime,
      fileName: c.fileName,
      hasFile: !!c.fileName,
      pokusy: pokusy,
      spravne: spravne,
      vyriesiloTried: Object.keys(triedy).length,
    }
  })

  return res.status(200).json(out);
}
