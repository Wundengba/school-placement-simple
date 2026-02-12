import { restoreDatabase } from './restoreDatabase.js'

export async function restoreDatabaseRunner(backupFile) {
  // simple wrapper: call restoreDatabase with the file argument
  await restoreDatabase(backupFile)
}
