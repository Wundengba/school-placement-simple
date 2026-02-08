import Placement from '../models/Placement.js'
import Student from '../models/Student.js'
import School from '../models/School.js'

export const getPlacements = async (req, res) => {
  try {
    const placements = await Placement.find()
      .populate('studentId')
      .populate('schoolId')
    res.json(placements)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getPlacementById = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate('studentId')
      .populate('schoolId')
    if (!placement) return res.status(404).json({ message: 'Placement not found' })
    res.json(placement)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const runPlacementAlgorithm = async (req, res) => {
  try {
    // Simple placement algorithm
    const students = await Student.find({ status: 'pending' }).populate('schoolPreferences.schoolId')
    const schools = await School.find()
    
    let placementCount = 0

    for (const student of students) {
      for (const pref of student.schoolPreferences) {
        const school = schools.find(s => s._id.toString() === pref.schoolId._id.toString())
        
        if (school && school.enrolledCount < school.capacity) {
          student.placedSchoolId = school._id
          student.status = 'placed'
          school.enrolledCount += 1
          await school.save()
          await student.save()
          placementCount++
          break
        }
      }

      if (student.status === 'pending') {
        student.status = 'rejected'
        await student.save()
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
    const totalStudents = await Student.countDocuments()
    const placedStudents = await Student.countDocuments({ status: 'placed' })
    const rejectedStudents = await Student.countDocuments({ status: 'rejected' })
    const pendingStudents = await Student.countDocuments({ status: 'pending' })

    const schoolStats = await School.find().select('name capacity enrolledCount')

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
