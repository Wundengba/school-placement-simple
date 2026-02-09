import { useState } from 'react'
import '../styles/Registration.css'
import { IoCamera, IoCheckmarkCircle } from 'react-icons/io5'
import syncService from '../services/syncService'

export default function Registration() {
  const [formData, setFormData] = useState({
    indexNumber: '',
    fullName: '',
    gender: '',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    photo: null
  })

  const [submitted, setSubmitted] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Validate index number - 12 digits only
    if (name === 'indexNumber') {
      if (!/^\d*$/.test(value) || value.length > 12) {
        return
      }
    }
    
    // Validate guardian phone - 10 digits only (Ghanaian phone)
    if (name === 'guardianPhone') {
      if (!/^\d*$/.test(value) || value.length > 10) {
        return
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
        setFormData(prev => ({
          ...prev,
          photo: file
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSchoolSelect = (choice, schoolId) => {
    const newPrefs = [...formData.schoolPreferences]
    newPrefs[choice] = schoolId
    setFormData(prev => ({
      ...prev,
      schoolPreferences: newPrefs
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate index number is exactly 12 digits
    if (formData.indexNumber.length !== 12) {
      alert('Index Number must be exactly 12 digits')
      return
    }
    
    // Validate guardian phone is exactly 10 digits
    if (formData.guardianPhone.length !== 10) {
      alert('Guardian Phone must be exactly 10 digits (Ghanaian phone number)')
      return
    }
    
    if (!formData.indexNumber || !formData.fullName) {
      alert('Please fill all required fields')
      return
    }
    
    // Save to localStorage
    const existingStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const newStudent = {
      id: Date.now(),
      indexNumber: formData.indexNumber,
      fullName: formData.fullName,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      guardianName: formData.guardianName,
      guardianPhone: formData.guardianPhone,
      status: 'registered',
      placedSchool: 'Not yet placed',
      registeredAt: new Date().toISOString()
    }
    existingStudents.push(newStudent)
    localStorage.setItem('registeredStudents', JSON.stringify(existingStudents))
    
    // Trigger real-time sync
    syncService.notifyDataChange('registeredStudents')
    
    setSubmitted(true)
    console.log('Registered:', formData)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        indexNumber: '',
        fullName: '',
        gender: '',
        dateOfBirth: '',
        guardianName: '',
        guardianPhone: '',
        photo: null
      })
      setPhotoPreview(null)
    }, 3000)
  }

  if (submitted) {
    return (
      <div className="registration-container">
        <div className="success-box">
          <h2><IoCheckmarkCircle className="app-icon" /> Registration Successful!</h2>
          <p>Your registration has been submitted successfully.</p>
          <p className="submission-id">Registration ID: {formData.indexNumber}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="registration-container">
      <h2>Student Registration</h2>
      
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-group">
              <label>Index Number * (12 digits)</label>
              <input
                type="text"
                name="indexNumber"
                value={formData.indexNumber}
                onChange={handleInputChange}
                placeholder="12 digits only"
                maxLength="12"
                required
              />
              {formData.indexNumber && formData.indexNumber.length !== 12 && (
                <small style={{color: 'red'}}>Must be exactly 12 digits</small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Gender --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

        <div className="photo-section">
          <h3>Photo</h3>
          <div className="photo-container">
            <div className="photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Student photo" />
              ) : (
                <div className="photo-placeholder">
                  <IoCamera className="app-icon" />
                  <p>No photo uploaded</p>
                </div>
              )}
            </div>
            <div className="photo-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                id="photo-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="photo-input" className="btn btn-secondary">
                Choose Photo
              </label>
              {photoPreview && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setPhotoPreview(null)
                    setFormData(prev => ({ ...prev, photo: null }))
                    document.getElementById('photo-input').value = ''
                  }}
                >
                  Remove Photo
                </button>
              )}
              <small style={{display: 'block', marginTop: '8px'}}>JPG, PNG (Passport size recommended)</small>
            </div>
          </div>
        </div>
        </div>

        <div className="form-section">
          <h3>Guardian Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Guardian Name</label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleInputChange}
                placeholder="Guardian's full name"
              />
            </div>
            <div className="form-group">
              <label>Guardian Phone * (10 digits)</label>
              <input
                type="tel"
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleInputChange}
                placeholder="10 digit Ghanaian number"
                maxLength="10"
                required
              />
              {formData.guardianPhone && formData.guardianPhone.length !== 10 && (
                <small style={{color: 'red'}}>Must be exactly 10 digits</small>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-submit">
          Submit Registration
        </button>
      </form>
    </div>
  )
}
