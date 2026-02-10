import { useState } from 'react'
import AdminLogin from './AdminLogin'
import StudentLoginOption from './StudentLoginOption'
import '../styles/LoginSelection.css'

export default function LoginSelection() {
  const [selected, setSelected] = useState(null)

  if (selected === 'admin') {
    return <AdminLogin onBack={() => setSelected(null)} />
  }

  if (selected === 'student') {
    return <StudentLoginOption onBack={() => setSelected(null)} />
  }

  return (
    <div className="login-selection-container">
      <div className="login-selection-card">
        <h1>School Placement System</h1>
        <p className="subtitle">Select login type</p>
        
        <div className="login-options">
          <button 
            className="login-option-btn admin-btn"
            onClick={() => setSelected('admin')}
          >
            <div className="btn-icon">👨‍💼</div>
            <div className="btn-text">
              <h3>Admin Login</h3>
              <p>Manage placements and system</p>
            </div>
          </button>
          
          <button 
            className="login-option-btn student-btn"
            onClick={() => setSelected('student')}
          >
            <div className="btn-icon">👨‍🎓</div>
            <div className="btn-text">
              <h3>Student Login</h3>
              <p>Check placement status</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
