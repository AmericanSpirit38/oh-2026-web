import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../lib/clients/prisma'
import axios from 'axios'

const DRIVE_KEY = process.env.GOOGLE_API_KEY
const driveCache = new Map<string, { count: number, at: number }>()
const DRIVE_TTL = 30 * 60 * 1000

const folderId = (link: string) => {
  if (!link) return null
  const m = link.match(/\/folders\/([a-zA-Z0-9_-]+)/) || link.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

async function countFiles(link: string): Promise<number | null> {
  const id = folderId(link)
  if (!id || !DRIVE_KEY) return null
  const hit = driveCache.get(id)
  if (hit && Date.now() - hit.at < DRIVE_TTL) return hit.count
  try {
    let total = 0
    let pageToken: string | null = null
    do {
      const params: any = {
        q: "'" + id + "' in parents and trashed = false",
        key: DRIVE_KEY,
        fields: 'nextPageToken, files(id)',
        pageSize: 1000,
      }
      if (pageToken) params.pageToken = pageToken
      const r: any = await axios.get('https://www.googleapis.com/drive/v3/files', { params })
      total += (r.data.files || []).length
      pageToken = r.data.nextPageToken || null
    } while (pageToken)
    driveCache.set(id, { count: total, at: Date.now() })
    return total
  } catch (e: any) {
    console.error('[oh] drive: nepodarilo sa spocitat', id, e?.response?.status, e?.response?.data?.error?.message)
    return null
  }
}



export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { name, link, count, date } = req.body

      const session = await getSession({ req })
      if (!session) return res.status(401).end();
      if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();
      const album = await prisma.album.create({
        data: {
          name: name,
          link: link,
          count: count != null && count !== '' ? parseInt(count) : null,
          date: date ? new Date(date) : null,
        }
      })
      return res.status(201).json(album);
    } catch (error) {
      console.error(error)
      return res.status(422).end();
    }
  } else if (req.method === "GET") {
    try {
      const albums = await prisma.album.findMany();
      const enriched = await Promise.all(albums.map(async (a: any) => ({ ...a, count: a.count != null ? a.count : await countFiles(a.link) })));
      return res.status(200).json(enriched);
    } catch (error) {
      return res.status(422).end();
    }
  } else if (req.method === "DELETE") {
    try {
      const { id } = req.body
      const session = await getSession({ req })
      if (!session) return res.status(401).end();
      if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();
      const events = await prisma.album.delete({
        where: {
          id: id
        }
      })
      return res.status(200).json(events);
    } catch (error) {
      console.error(error)
      return res.status(422).end();
    }
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )
  }
}