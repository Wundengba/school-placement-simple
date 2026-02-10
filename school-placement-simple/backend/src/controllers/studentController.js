import prisma from '../config/prisma.js'

export const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        schoolPreferences: {
          include: { school: true }
        },
        placedSchool: true
      }
    })
    res.json(students)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getStudentById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        schoolPreferences: {
          include: { school: true }
        },
        placedSchool: true
      }
    })
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json(student)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createStudent = async (req, res) => {
  const { indexNumber, fullName, email, maths, english, science, schoolPreferences } = req.body
  
  try {
    const studentExists = await prisma.student.findUnique({ where: { indexNumber } })
    if (studentExists) return res.status(400).json({ message: 'Student already exists' })

    const student = await prisma.student.create({
      data: {
        indexNumber,
        fullName,
        email,
        maths,
        english,
        science
      }
    })

    res.status(201).json(student)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const updateStudent = async (req, res) => {
  try {
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() },
      include: {
        schoolPreferences: {
          include: { school: true }
        },
        placedSchool: true
      }
    })
    res.json(student)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Student not found' })
    }
    res.status(400).json({ message: error.message })
  }
}

export const deleteStudent = async (req, res) => {
  try {
    const student = await prisma.student.delete({
      where: { id: req.params.id }
    })
    res.json({ message: 'Student deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Student not found' })
    }
    res.status(500).json({ message: error.message })
  }
}
