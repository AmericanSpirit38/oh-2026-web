import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../lib/clients/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const session = await getSession({ req })
  if (!session) return res.status(401).end();

  const id = Number(req.query.id)
  if (!id) return res.status(400).end();

  const sifra = await prisma.sifra.findUnique({ where: { id: id } })
  if (!sifra || !sifra.file) return res.status(404).end();

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'EDITOR'
  if (!isAdmin && new Date(sifra.startTime) > new Date()) return res.status(403).end();

  res.setHeader('Content-Type', sifra.mimeType || 'application/octet-stream')
  res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(sifra.fileName || 'sifra') + '"')
  res.setHeader('Cache-Control', 'private, max-age=300')
  return res.send(Buffer.from(sifra.file as any))
}
