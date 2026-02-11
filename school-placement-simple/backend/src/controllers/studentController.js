import prisma from '../config/prisma.js'

export const loginStudent = async (req, res) => {
  const { indexNumber } = req.body

  try {
    if (!indexNumber) {
      return res.status(400).json({ success: false, message: 'Index number is required' })
    }

    const student = await prisma.student.findUnique({
      where: { indexNumber: indexNumber.trim() },
      include: {
        schoolPreferences: {
          include: { school: true }
        },
        placedSchool: true,
        placements: {
          include: { school: true }
        }
      }
    })

    if (!student) {
      console.log('[Student Controller] Login failed - student not found:', indexNumber)
      return res.status(401).json({ success: false, message: 'Invalid index number' })
    }

    // Create JWT-like token
    const token = Buffer.from(JSON.stringify({
      studentId: student.id,
      indexNumber: student.indexNumber,
      fullName: student.fullName,
      role: 'student',
      timestamp: Date.now()
    })).toString('base64')

    console.log('[Student Controller] ✅ Student login successful:', indexNumber)
    res.json({
      success: true,
      token,
      student: {
        id: student.id,
        indexNumber: student.indexNumber,
        fullName: student.fullName,
        email: student.email,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        photo: student.photo,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        maths: student.maths,
        english: student.english,
        science: student.science,
        status: student.status,
        placedSchool: student.placedSchool,
        schoolPreferences: student.schoolPreferences,
        placements: student.placements
      }
    })
  } catch (error) {
    console.error('[Student Controller] Login error:', error.message)
    res.status(500).json({ success: false, message: 'Login failed', error: error.message })
  }
}

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
  const { indexNumber, fullName, email, gender, dateOfBirth, photo, maths, english, science, guardianName, guardianPhone, status } = req.body
  
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
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        photo: photo || null,
        maths: maths ? parseInt(maths) : null,
        english: english ? parseInt(english) : null,
        science: science ? parseInt(science) : null,
        guardianName: guardianName ? guardianName.trim() : null,
        guardianPhone: guardianPhone ? guardianPhone.trim() : null,
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

export const updatePreferences = async (req, res) => {
  const studentId = req.params.id
  const { catA, catB = [], catC = [] } = req.body

  try {
    // Build ordered choices: 1 = catA, 2..3 = catB, 4..7 = catC
    const choices = []
    if (catA) choices.push({ schoolId: catA, choice: 1 })
    catB.forEach((s, i) => { if (s) choices.push({ schoolId: s, choice: 2 + i }) })
    catC.forEach((s, i) => { if (s) choices.push({ schoolId: s, choice: 4 + i }) })

    // Validate school IDs exist to avoid FK violations
    const schoolIds = choices.map(c => c.schoolId).filter(Boolean)
    const existingSchools = await prisma.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true } })
    const existingSet = new Set(existingSchools.map(s => s.id))
    const filtered = choices.filter(c => existingSet.has(c.schoolId))

    // Remove existing preferences and insert new ones in a transaction
    await prisma.$transaction([
      prisma.schoolPref.deleteMany({ where: { studentId } }),
      prisma.schoolPref.createMany({ data: filtered.map(c => ({ studentId, schoolId: c.schoolId, choice: c.choice })) })
    ])

    const prefs = await prisma.schoolPref.findMany({ where: { studentId }, include: { school: true }, orderBy: { choice: 'asc' } })
    res.json({ success: true, preferences: prefs })
  } catch (error) {
    console.error('[Student Controller] updatePreferences error:', error.message)
    res.status(500).json({ success: false, message: 'Failed to update preferences', error: error.message })
  }
}
