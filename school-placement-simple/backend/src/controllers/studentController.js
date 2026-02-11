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
  const { indexNumber, fullName, email, maths, english, science, guardianName, guardianPhone, dateOfBirth, gender, status } = req.body
  
  try {
    if (!indexNumber || !fullName) {
      return res.status(400).json({ message: 'Index number and full name are required' })
    }

    const studentExists = await prisma.student.findUnique({ where: { indexNumber } })
    if (studentExists) {
      console.log('[Student Controller] Student already exists:', indexNumber)
      return res.status(400).json({ message: 'Student already exists' })
    }

    const student = await prisma.student.create({
      data: {
        indexNumber: indexNumber.trim(),
        fullName: fullName.trim(),
        email: email ? email.trim() : null,
        maths: maths ? parseInt(maths) : null,
        english: english ? parseInt(english) : null,
        science: science ? parseInt(science) : null,
        guardianName: guardianName ? guardianName.trim() : null,
        guardianPhone: guardianPhone ? guardianPhone.trim() : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        status: status || 'pending'
      }
    })

    console.log('[Student Controller] ✅ Student created:', indexNumber)
    res.status(201).json(student)
  } catch (error) {
    console.error('[Student Controller] Create error:', error.message)
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
