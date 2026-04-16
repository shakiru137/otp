import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../services/postgres'

const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  relationship: z.string().optional(),
  fcm_token: z.string().optional(),
})

export const contactsRoutes = async (app: FastifyInstance) => {
  
  // JWT verification for all routes
  app.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // Get all contacts for logged-in user
  app.get('/contacts', async (req, reply) => {
    const { userId } = req.user as { userId: string }

    const result = await query(
      `SELECT id, name, phone, relationship, fcm_token, created_at 
       FROM family_contacts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    )

    return reply.send({ contacts: result.rows })
  })

  // Add new contact
  app.post('/contacts', async (req, reply) => {
    const parsed = contactSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }

    const { userId } = req.user as { userId: string }
    const { name, phone, relationship, fcm_token } = parsed.data

    // Check if contact with same phone already exists for this user
    const existing = await query(
      `SELECT id FROM family_contacts WHERE user_id = $1 AND phone = $2`,
      [userId, phone]
    )
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: 'Contact with this phone number already exists' })
    }

    const result = await query(
      `INSERT INTO family_contacts (user_id, name, phone, relationship, fcm_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone, relationship, fcm_token, created_at`,
      [userId, name, phone, relationship || null, fcm_token || null]
    )

    return reply.status(201).send({ contact: result.rows[0] })
  })

  // Update contact
  app.put('/contacts/:id', async (req, reply) => {
    const parsed = contactSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }

    const { userId } = req.user as { userId: string }
    const contactId = (req.params as { id: string }).id
    const updates = parsed.data

    // Build dynamic update query
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.name) {
      fields.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }
    if (updates.phone) {
      fields.push(`phone = $${paramIndex++}`)
      values.push(updates.phone)
    }
    if (updates.relationship !== undefined) {
      fields.push(`relationship = $${paramIndex++}`)
      values.push(updates.relationship)
    }
    if (updates.fcm_token !== undefined) {
      fields.push(`fcm_token = $${paramIndex++}`)
      values.push(updates.fcm_token)
    }

    if (fields.length === 0) {
      return reply.status(400).send({ error: 'No fields to update' })
    }

    values.push(contactId, userId)

    const result = await query(
      `UPDATE family_contacts 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING id, name, phone, relationship, fcm_token, created_at, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Contact not found' })
    }

    return reply.send({ contact: result.rows[0] })
  })

  // Delete contact
  app.delete('/contacts/:id', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const contactId = (req.params as { id: string }).id

    const result = await query(
      `DELETE FROM family_contacts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [contactId, userId]
    )

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Contact not found' })
    }

    return reply.send({ message: 'Contact deleted' })
  })
}