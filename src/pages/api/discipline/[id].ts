import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/client'
import prisma from '../../../../lib/clients/prisma'

// GET /api/discipline/[id]
// Required fields in body:
// Optional fields in body:

// DELETE /api/discipline/[id]
// Required fields in body:
// Optional fields in body:

// TODO
// PUT /api/discipline/[id]
// Required fields in body:
// Optional fields in body: name, categoryId, icon, tags

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const disciplineId = req.query.id

      const discipline = await prisma.discipline.findFirst({
        where: { id: Number(disciplineId) },
        include: {
          posts: {
            include: {
              disciplines: true,
              categories: true,
              tags: true,
            },
            where: { published: true },
          },
          category: {
            select: {
              icon: true
            }
          },
          events: {
            include: {
              results: {
                select: {
                  class: {
                    select: {
                      name: true
                    }
                  },
                  place: true,
                }
              }
            },
            orderBy: [{
              startDate: 'asc'
            }]
          }
        }
      });
      return res.status(200).json(discipline);
    } catch (error) {
      return res.status(422).end();
    }
  } else if (req.method === "DELETE") {
    try {
      const disciplineId = req.query.id
      const session = await getSession({ req })
      if (!session) return res.status(401).end();
      if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();
      const discipline = await prisma.discipline.delete({
        where: { id: Number(disciplineId) },
      });
      return res.status(200).json(discipline);
    } catch (error) {
      return res.status(422).end();
    }
  } else if (req.method === "PUT"){
    try {
      const disciplineId = req.query.id
      const session = await getSession({ req })
      if (!session) return res.status(401).end();
      if (session?.user.role != 'ADMIN') if (session?.user.role != 'EDITOR') return res.status(401).end();

      const { name, icon, description, category, tags } = req.body

      const data: any = {}
      if (name !== undefined && name !== null) {
        data.name = name
        data.slug = String(name).replace(/ /g, '-').toLowerCase()
      }
      if (icon !== undefined) data.icon = icon
      if (description !== undefined) data.description = description
      if (category !== undefined && category !== null && category !== '') {
        data.category = { connect: { id: parseInt(category) } }
      }
      if (tags !== undefined && tags !== null) {
        data.tags = { set: tags.map((id: string) => ({ id: parseInt(id) })) }
      }

      const discipline = await prisma.discipline.update({
        where: { id: Number(disciplineId) },
        data: data,
      });
      return res.status(200).json(discipline);
    } catch (error) {
      console.error(error);
      return res.status(422).end();
    }
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    )
  }
}