import { backupDatabase as backupDatabaseFn } from './backupDatabase.js'
import path from 'path'
import fs from 'fs'

export async function runBackupDatabase() {
  // call the function in backupDatabase.js and return the created filepath
  await backupDatabaseFn()
  const backupsDir = path.resolve('./backups')
  const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json')).sort()
  return path.join(backupsDir, files[files.length - 1])
}
