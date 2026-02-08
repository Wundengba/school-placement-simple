import School from '../models/School.js'

export const getSchools = async (req, res) => {
  try {
    const schools = await School.find()
    res.json(schools)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
    if (!school) return res.status(404).json({ message: 'School not found' })
    res.json(school)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createSchool = async (req, res) => {
  const { name, type, location, capacity, streams, contact } = req.body

  try {
    const schoolExists = await School.findOne({ name })
    if (schoolExists) return res.status(400).json({ message: 'School already exists' })

    const school = new School({
      name,
      type,
      location,
      capacity,
      streams,
      contact
    })

    await school.save()
    res.status(201).json(school)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const updateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!school) return res.status(404).json({ message: 'School not found' })
    res.json(school)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id)
    if (!school) return res.status(404).json({ message: 'School not found' })
    res.json({ message: 'School deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
