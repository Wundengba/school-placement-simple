import { useState, useMemo, useEffect } from 'react'
import '../styles/Schools.css'
import { IoSearch, IoClose, IoSchool } from 'react-icons/io5'
import schools from '../data/schools'

export default function Schools() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')

  // Save schools to localStorage on component mount for sync
  useEffect(() => {
    try {
      localStorage.setItem('schools', JSON.stringify(schools))
      console.log('[SCHOOLS] Saved', schools.length, 'schools to localStorage')
    } catch (error) {
      console.error('[SCHOOLS] Failed to save schools to localStorage:', error)
    }
  }, [])

  // Extract unique regions
  const regions = useMemo(() => {
    const unique = [...new Set(schools.map(s => s.region))].sort()
    return unique
  }, [])

  // Filter schools based on search and filters
  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           school.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || school.category === selectedCategory
      const matchesRegion = selectedRegion === 'all' || school.region === selectedRegion
      
      return matchesSearch && matchesCategory && matchesRegion
    })
  }, [searchTerm, selectedCategory, selectedRegion])

  // Count schools by category
  const categoryCounts = useMemo(() => {
    return {
      A: schools.filter(s => s.category === 'A').length,
      B: schools.filter(s => s.category === 'B').length,
      C: schools.filter(s => s.category === 'C').length,
      total: schools.length
    }
  }, [])

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedRegion('all')
  }

  return (
    <div className="schools-container container">
      <div className="schools-header">
        <h2><IoSchool className="app-icon" /> Available Schools</h2>
        <p className="schools-summary">
          Total Schools: <strong>{categoryCounts.total}</strong> | 
          Category A: <strong>{categoryCounts.A}</strong> | 
          Category B: <strong>{categoryCounts.B}</strong> | 
          Category C: <strong>{categoryCounts.C}</strong>
        </p>
      </div>

      <div className="schools-filters">
        <div className="filter-group">
          <label>Search School</label>
          <div className="search-box">
            <IoSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <IoClose 
                className="clear-icon" 
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="A">Category A</option>
            <option value="B">Category B</option>
            <option value="C">Category C</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Region</label>
          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-secondary"
          onClick={handleClearFilters}
        >
          <IoClose className="icon" /> Clear Filters
        </button>
      </div>

      <div className="schools-info">
        Showing <strong>{filteredSchools.length}</strong> of <strong>{schools.length}</strong> schools
      </div>

      <div className="schools-table-container">
        <div className="table-responsive">
          <table className="schools-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>School Name</th>
              <th>Category</th>
              <th>Region/Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <tr key={school.id} className={`category-${school.category}`}>
                  <td className="school-id">{school.id}</td>
                  <td className="school-name">{school.name}</td>
                  <td className="school-category">
                    <span className={`category-badge category-badge-${school.category}`}>
                      Category {school.category}
                    </span>
                  </td>
                  <td className="school-region">{school.region}</td>
                </tr>
              ))
            ) : (
              <tr className="no-results">
                <td colSpan="4" className="empty-message">
                  No schools match your filters. Please try adjusting your search.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
