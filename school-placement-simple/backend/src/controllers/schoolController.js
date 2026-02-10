import prisma from '../config/prisma.js'

export const getSchools = async (req, res) => {
  try {
    const schools = await prisma.school.findMany()
    res.json(schools)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getSchoolById = async (req, res) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.params.id }
    })
    if (!school) return res.status(404).json({ message: 'School not found' })
    res.json(school)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createSchool = async (req, res) => {
  const { name, type, location, capacity, streams, contact } = req.body

  try {
    const schoolExists = await prisma.school.findFirst({ where: { name } })
    if (schoolExists) return res.status(400).json({ message: 'School already exists' })

    const school = await prisma.school.create({
      data: {
        name,
        type,
        location,
        capacity,
        streams,
        contact
      }
    })

    res.status(201).json(school)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const updateSchool = async (req, res) => {
  try {
    const school = await prisma.school.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(school)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'School not found' })
    }
    res.status(400).json({ message: error.message })
  }
}

export const deleteSchool = async (req, res) => {
  try {
    const school = await prisma.school.delete({
      where: { id: req.params.id }
    })
    res.json({ message: 'School deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'School not found' })
    }
    res.status(500).json({ message: error.message })
  }
}
