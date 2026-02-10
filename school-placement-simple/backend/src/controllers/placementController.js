import prisma from '../config/prisma.js'

export const getPlacements = async (req, res) => {
  try {
    const placements = await prisma.placement.findMany({
      include: {
        student: true,
        school: true
      }
    })
    res.json(placements)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getPlacementById = async (req, res) => {
  try {
    const placement = await prisma.placement.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        school: true
      }
    })
    if (!placement) return res.status(404).json({ message: 'Placement not found' })
    res.json(placement)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const runPlacementAlgorithm = async (req, res) => {
  try {
    // Simple placement algorithm
    const students = await prisma.student.findMany({
      where: { status: 'pending' },
      include: { schoolPreferences: { include: { school: true } } }
    })
    const schools = await prisma.school.findMany()
    
    let placementCount = 0

    for (const student of students) {
      for (const pref of student.schoolPreferences) {
        const school = schools.find(s => s.id === pref.schoolId)
        
        if (school) {
          // Count current enrollments for this school
          const enrollmentCount = await prisma.placement.count({
            where: { schoolId: school.id }
          })
          
          if (enrollmentCount < school.capacity) {
            await prisma.student.update({
              where: { id: student.id },
              data: { placedSchoolId: school.id, status: 'placed' }
            })
            placementCount++
            break
          }
        }
      }

      // If still pending after preferences, mark as rejected
      const updatedStudent = await prisma.student.findUnique({
        where: { id: student.id }
      })
      if (updatedStudent.status === 'pending') {
        await prisma.student.update({
          where: { id: student.id },
          data: { status: 'rejected' }
        })
      }
    }

    res.json({
      message: 'Placement algorithm completed',
      placedStudents: placementCount,
      totalStudents: students.length
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getPlacementStats = async (req, res) => {
  try {
    const totalStudents = await prisma.student.count()
    const placedStudents = await prisma.student.count({ where: { status: 'placed' } })
    const rejectedStudents = await prisma.student.count({ where: { status: 'rejected' } })
    const pendingStudents = await prisma.student.count({ where: { status: 'pending' } })

    const schoolStats = await prisma.school.findMany({
      select: { id: true, name: true, capacity: true }
    })

    res.json({
      totalStudents,
      placedStudents,
      rejectedStudents,
      pendingStudents,
      schoolStats
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
