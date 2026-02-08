import Student from '../models/Student.js'

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('schoolPreferences.schoolId placedSchoolId')
    res.json(students)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('schoolPreferences.schoolId placedSchoolId')
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json(student)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createStudent = async (req, res) => {
  const { indexNumber, fullName, email, maths, english, science, schoolPreferences } = req.body
  
  try {
    const studentExists = await Student.findOne({ indexNumber })
    if (studentExists) return res.status(400).json({ message: 'Student already exists' })

    const student = new Student({
      indexNumber,
      fullName,
      email,
      maths,
      english,
      science,
      schoolPreferences
    })

    await student.save()
    res.status(201).json(student)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    )
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json(student)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json({ message: 'Student deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
