import fs from 'fs'
import path from 'path'

/**
 * List Available Backups
 * Shows all backup files in the backups/ directory with details
 * 
 * Usage: npm run list-backups
 */

function listBackups() {
  const backupsDir = path.resolve('./backups')
  
  console.log(`\n📁 Backups Directory: ${backupsDir}\n`)
  
  // Check if backups directory exists
  if (!fs.existsSync(backupsDir)) {
    console.log('❌ No backups directory found. Run "npm run backup" to create one.')
    return
  }
  
  // Get all JSON files
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
  
  if (files.length === 0) {
    console.log('📭 No backup files found. Run "npm run backup" to create one.')
    return
  }
  
  console.log(`📋 Available Backups (${files.length}):`)
  console.log(`${'─'.repeat(80)}`)
  
  files.forEach((file, index) => {
    const filepath = path.join(backupsDir, file)
    const stats = fs.statSync(filepath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    const modified = stats.mtime.toLocaleString()
    
    // Try to read metadata
    try {
      const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      const meta = content.metadata
      
      console.log(`\n${index + 1}. ${file}`)
      console.log(`   Size: ${sizeKB} KB`)
      console.log(`   Created: ${modified}`)
      console.log(`   Records: ${meta.studentCount} students, ${meta.schoolCount} schools, ${meta.placementCount} placements`)
      console.log(`   Restore: npm run restore -- backups/${file}`)
    } catch (err) {
      console.log(`\n${index + 1}. ${file} ❌ (corrupted)`)
      console.log(`   Size: ${sizeKB} KB`)
      console.log(`   Modified: ${modified}`)
    }
  })
  
  console.log(`\n${'─'.repeat(80)}`)
}

listBackups()
