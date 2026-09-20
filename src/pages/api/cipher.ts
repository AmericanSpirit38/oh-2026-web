import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../lib/clients/prisma';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}

const normalize = (s: any) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ')

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PUT") {
    try {
      const { id, name, answer } = req.body
      const session = await getSession({ req })
      if (!session) return res.status(401).end();

      const cipher = id
        ? await prisma.sifra.findUnique({ where: { id: Number(id) } })
        : await prisma.sifra.findFirst({ where: { name: name } })

      if (!cipher) return res.status(404).json({ valid: false, message: 'Šifra neexistuje' });

      if (new Date(cipher.startTime) > new Date()) {
        return res.status(403).json({ valid: false, message: 'Šifra ešte nezačala' });
      }

      const curClass = session?.user?.class
        ? await prisma.class.findFirst({ where: { name: session.user.class } })
        : null

      const correct = normalize(cipher.answer) === normalize(answer)
      const already = curClass ? curClass.ciphersDone.includes(cipher.id) : false

      await prisma.cipherSubmission.create({
        data: {
          sifraId: cipher.id,
          classId: curClass ? curClass.id : null,
          userId: session.user.id ? Number(session.user.id) : null,
          answer: String(answer == null ? '' : answer),
          correct: correct,
        }
      })

      if (curClass && !already) {
        if (correct) {
          const duration = moment.duration(moment(new Date()).diff(cipher.startTime));
          const hours = Math.ceil(duration.asHours());
          await prisma.class.update({
            where: { id: curClass.id },
            data: {
              ciphersDone: { push: cipher.id },
              ciphersTime: curClass.ciphersTime + hours,
            }
          })
        } else {
          await prisma.class.update({
            where: { id: curClass.id },
            data: { cipherIncorrect: curClass.cipherIncorrect + 1 }
          })
        }
      }

      return res.status(200).json({ valid: correct, already: already });
    } catch (error) {
      console.error('[oh] cipher PUT', error)
      return res.status(422).end();
    }
  } else if (req.method === "POST") {
    try {
      const { name, answer, start, file, fileName, mimeType } = req.body
      const session = await getSession({ req })
      if (!session) return res.status(401).end();
      if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();

      const sifra = await prisma.sifra.create({
        data: {
          name: name,
          answer: answer,
          startTime: start,
          file: file ? Buffer.from(String(file), 'base64') : null,
          fileName: fileName ? String(fileName) : null,
          mimeType: mimeType ? String(mimeType) : null,
        }
      })
      return res.status(201).json({ id: sifra.id, name: sifra.name });
    } catch (error) {
      console.error('[oh] cipher POST', error)
      return res.status(422).end();
    }
  } else if (req.method === "PATCH") {
    try {
      const { id, name, answer, start, file, fileName, mimeType } = req.body
      const session = await getSession({ req })
      if (!session) return res.status(401).end();
      if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();

      const data: any = {}
      if (name !== undefined && name !== null) data.name = name
      if (answer !== undefined && answer !== null) data.answer = answer
      if (start !== undefined && start !== null) data.startTime = new Date(start)
      if (file) {
        data.file = Buffer.from(String(file), 'base64')
        data.fileName = fileName ? String(fileName) : null
        data.mimeType = mimeType ? String(mimeType) : null
      }

      const sifra = await prisma.sifra.update({ where: { id: Number(id) }, data: data })
      return res.status(200).json({ id: sifra.id, name: sifra.name });
    } catch (error) {
      console.error('[oh] cipher PATCH', error)
      return res.status(422).end();
    }
  } else if (req.method === "DELETE") {
    try {
      const { id } = req.body
      const session = await getSession({ req })
      if (!session) return res.status(401).end();
      if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();
      await prisma.cipherSubmission.deleteMany({ where: { sifraId: Number(id) } })
      await prisma.sifra.delete({ where: { id: Number(id) } })
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('[oh] cipher DELETE', error)
      return res.status(422).end();
    }
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )
  }
}
